"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentProfile, isAdmin, isSuperAdmin } from "@/lib/auth";
import { recordAudit } from "@/lib/services/audit";
import {
  adminCreateUserSchema,
  adminToggleBlockSchema,
  adminUpdateUserSchema,
  toFieldErrors,
} from "@/lib/validations";
import type { ActionResult } from "@/types";

/**
 * Super Admin & Admin User Management Actions.
 *
 * Hierarchy & Security Rules:
 *   1. Super Admin: full authority over all users and admins (cannot self-delete/block).
 *   2. Admin: can ONLY manage regular users (cannot view, edit, block, or delete Admins or Super Admins).
 *   3. Regular user: strictly rejected.
 */

export async function adminCreateUserAction(
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  if (!(await isAdmin())) {
    return { success: false, error: "error.unauthorized" };
  }

  const parsed = adminCreateUserSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: "validation.required",
      fieldErrors: toFieldErrors(parsed.error),
    };
  }
  const data = parsed.data;

  const actor = await getCurrentProfile();
  if (!actor) return { success: false, error: "error.sessionExpired" };

  // Sub-admins cannot create other admins or super admins
  const isSuper = await isSuperAdmin();
  if (!isSuper && data.role !== "user") {
    return { success: false, error: "error.unauthorized" };
  }

  const supabase = createAdminClient();

  // Create user via Supabase Auth Admin API
  const { data: authData, error: authError } =
    await supabase.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: {
        full_name: data.fullName,
      },
    });

  if (authError || !authData.user) {
    console.error("[adminCreateUserAction] auth error:", authError?.message);
    if (authError?.message.includes("already registered")) {
      return {
        success: false,
        error: "validation.emailInUse",
        fieldErrors: { email: ["validation.emailInUse"] },
      };
    }
    return { success: false, error: "error.generic" };
  }

  const newUserId = authData.user.id;

  // Insert/Upsert profile with the selected role
  const { error: profileError } = await supabase.from("profiles").upsert(
    {
      id: newUserId,
      email: data.email,
      full_name: data.fullName,
      role: data.role,
      is_active: true,
    },
    { onConflict: "id" },
  );

  if (profileError) {
    console.error("[adminCreateUserAction] profile error:", profileError.message);
  }

  // Ensure default notification preferences exist
  await supabase
    .from("notification_preferences")
    .insert({ user_id: newUserId })
    .maybeSingle();

  await recordAudit({
    userId: actor.id,
    actorEmail: actor.email,
    action: "USER_CREATED",
    entityType: "profile",
    entityId: newUserId,
    metadata: { email: data.email, role: data.role },
  });

  revalidatePath("/admin/users");
  return {
    success: true,
    data: { id: newUserId },
    message: "admin.users.createdSuccess",
  };
}

export async function adminUpdateUserAction(
  input: unknown,
): Promise<ActionResult> {
  if (!(await isAdmin())) {
    return { success: false, error: "error.unauthorized" };
  }

  const parsed = adminUpdateUserSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: "validation.required",
      fieldErrors: toFieldErrors(parsed.error),
    };
  }
  const data = parsed.data;

  const actor = await getCurrentProfile();
  if (!actor) return { success: false, error: "error.sessionExpired" };

  const isSuper = await isSuperAdmin();
  const supabase = createAdminClient();

  // Check target user's current role
  const { data: targetUser } = await supabase
    .from("profiles")
    .select("id, role, email")
    .eq("id", data.userId)
    .maybeSingle();

  if (!targetUser) return { success: false, error: "admin.users.notFound" };

  // Sub-admins cannot edit Admins or Super Admins
  if (!isSuper && targetUser.role !== "user") {
    return { success: false, error: "error.unauthorized" };
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: data.fullName,
      phone: data.phone || null,
      address: data.address || null,
      designation: data.designation || null,
    })
    .eq("id", data.userId);

  if (error) return { success: false, error: "error.generic" };

  await recordAudit({
    userId: actor.id,
    actorEmail: actor.email,
    action: "USER_UPDATED",
    entityType: "profile",
    entityId: data.userId,
    metadata: { fullName: data.fullName },
  });

  revalidatePath("/admin/users");
  return { success: true, data: undefined, message: "admin.users.updatedSuccess" };
}

export async function adminToggleBlockAction(
  input: unknown,
): Promise<ActionResult> {
  if (!(await isAdmin())) {
    return { success: false, error: "error.unauthorized" };
  }

  const parsed = adminToggleBlockSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "error.generic" };
  const { userId, isActive } = parsed.data;

  const actor = await getCurrentProfile();
  if (!actor) return { success: false, error: "error.sessionExpired" };

  if (userId === actor.id) {
    return { success: false, error: "admin.users.cannotBlockSelf" };
  }

  const isSuper = await isSuperAdmin();
  const supabase = createAdminClient();

  const { data: targetUser } = await supabase
    .from("profiles")
    .select("id, role, email")
    .eq("id", userId)
    .maybeSingle();

  if (!targetUser) return { success: false, error: "admin.users.notFound" };

  // Sub-admins cannot block Admins or Super Admins
  if (!isSuper && targetUser.role !== "user") {
    return { success: false, error: "error.unauthorized" };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ is_active: isActive })
    .eq("id", userId);

  if (error) return { success: false, error: "error.generic" };

  // If blocking user, also ban/revoke user session in Supabase auth
  if (!isActive) {
    try {
      await supabase.auth.admin.updateUserById(userId, {
        ban_duration: "876000h", // ~100 years
      });
    } catch (e) {
      console.error("[adminToggleBlockAction] ban error:", e);
    }
  } else {
    try {
      await supabase.auth.admin.updateUserById(userId, {
        ban_duration: "none",
      });
    } catch (e) {
      console.error("[adminToggleBlockAction] unban error:", e);
    }
  }

  await recordAudit({
    userId: actor.id,
    actorEmail: actor.email,
    action: "USER_UPDATED",
    entityType: "profile",
    entityId: userId,
    metadata: { is_active: isActive },
  });

  revalidatePath("/admin/users");
  return {
    success: true,
    data: undefined,
    message: isActive ? "admin.users.unblockUser" : "admin.users.blockUser",
  };
}

export async function adminDeleteUserAction(
  userId: string,
): Promise<ActionResult> {
  if (!(await isAdmin())) {
    return { success: false, error: "error.unauthorized" };
  }

  const actor = await getCurrentProfile();
  if (!actor) return { success: false, error: "error.sessionExpired" };

  if (userId === actor.id) {
    return { success: false, error: "admin.users.cannotDeleteSelf" };
  }

  const isSuper = await isSuperAdmin();
  const supabase = createAdminClient();

  const { data: targetUser } = await supabase
    .from("profiles")
    .select("id, role, email")
    .eq("id", userId)
    .maybeSingle();

  if (!targetUser) return { success: false, error: "admin.users.notFound" };

  // Sub-admins cannot delete Admins or Super Admins
  if (!isSuper && targetUser.role !== "user") {
    return { success: false, error: "error.unauthorized" };
  }

  // Delete from Auth (cascades or deletes profile and meters)
  const { error: authError } = await supabase.auth.admin.deleteUser(userId);
  if (authError) {
    console.error("[adminDeleteUserAction] delete user error:", authError.message);
    // Fallback: manually delete from profiles if auth fails
    await supabase.from("profiles").delete().eq("id", userId);
  }

  await recordAudit({
    userId: actor.id,
    actorEmail: actor.email,
    action: "USER_DELETED",
    entityType: "profile",
    entityId: userId,
    metadata: { email: targetUser.email, role: targetUser.role },
  });

  revalidatePath("/admin/users");
  revalidatePath("/admin/meters");
  return { success: true, data: undefined, message: "admin.users.deletedSuccess" };
}
