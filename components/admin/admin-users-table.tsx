"use client";

import { useMemo, useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSearchParams } from "next/navigation";
import {
  Ban,
  CheckCircle2,
  Edit,
  MoreHorizontal,
  Plus,
  Search,
  Shield,
  Trash2,
  UserCheck,
  UserCog,
  UserPlus,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { FormField } from "@/components/auth/form-field";
import { EmptyState } from "@/components/shared/empty-state";
import { updateUserRoleAction } from "@/app/actions/settings";
import {
  adminCreateUserAction,
  adminDeleteUserAction,
  adminToggleBlockAction,
  adminUpdateUserAction,
} from "@/app/actions/admin-users";
import {
  adminCreateUserSchema,
  adminUpdateUserSchema,
  type AdminCreateUserInput,
  type AdminUpdateUserInput,
} from "@/lib/validations";
import { formatDate, formatNumber } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";
import type { TranslationKey } from "@/lib/i18n/dictionaries";
import type { ProfileWithStats, UserRole } from "@/types";

export function AdminUsersTable({
  users,
  currentUserId,
  currentUserRole = "admin",
}: {
  users: ProfileWithStats[];
  currentUserId: string;
  currentUserRole?: UserRole;
}) {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams?.get("q") || "");
  const [, startTransition] = useTransition();

  useEffect(() => {
    const q = searchParams?.get("q");
    if (q !== null && q !== undefined) {
      setQuery(q);
    }
  }, [searchParams]);

  const isSuperAdmin = currentUserRole === "super_admin";

  // Modals state
  const [createOpen, setCreateOpen] = useState(false);
  const [editUser, setEditUser] = useState<ProfileWithStats | null>(null);
  const [deleteUser, setDeleteUser] = useState<ProfileWithStats | null>(null);
  const [blockUser, setBlockUser] = useState<ProfileWithStats | null>(null);
  const [roleUser, setRoleUser] = useState<{
    user: ProfileWithStats;
    targetRole: UserRole;
  } | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        (u.full_name ?? "").toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.designation ?? "").toLowerCase().includes(q),
    );
  }, [users, query]);

  function handleRoleChange(userId: string, nextRole: UserRole) {
    startTransition(async () => {
      const result = await updateUserRoleAction({ userId, role: nextRole });
      setRoleUser(null);
      if (result.success) {
        toast.success(t("admin.users.roleUpdated"));
        router.refresh();
      } else {
        toast.error(t((result.error as TranslationKey) || "error.generic"));
      }
    });
  }

  function handleToggleBlock(userId: string, isActive: boolean) {
    startTransition(async () => {
      const result = await adminToggleBlockAction({ userId, isActive });
      setBlockUser(null);
      if (result.success) {
        toast.success(t((result.message as TranslationKey) || "admin.users.updatedSuccess"));
        router.refresh();
      } else {
        toast.error(t((result.error as TranslationKey) || "error.generic"));
      }
    });
  }

  function handleDeleteUser(userId: string) {
    startTransition(async () => {
      const result = await adminDeleteUserAction(userId);
      setDeleteUser(null);
      if (result.success) {
        toast.success(t((result.message as TranslationKey) || "admin.users.deletedSuccess"));
        router.refresh();
      } else {
        toast.error(t((result.error as TranslationKey) || "error.generic"));
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1 max-w-lg">
          <div className="relative flex-1">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("admin.users.search")}
              aria-label={t("admin.users.search")}
              className="pl-9 pr-9 h-10 rounded-xl bg-card border-border/80 focus:border-emerald-500/70"
            />
            {query.length > 0 && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 rounded"
              >
                <X className="size-4" />
              </button>
            )}
          </div>

          {query.trim().length > 0 && (
            <div className="text-xs text-muted-foreground flex items-center gap-1.5 whitespace-nowrap">
              <span className="inline-block size-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>
                Found <strong className="text-foreground">{filtered.length}</strong> of {users.length} consumers
              </span>
            </div>
          )}
        </div>

        <Button onClick={() => setCreateOpen(true)} className="gap-2">
          <Plus className="size-4" />
          <span>{t("admin.users.addUser")}</span>
        </Button>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={UserCog}
          title={t("admin.users.empty")}
          description={t("admin.users.emptyDesc")}
        />
      ) : (
        <div className="rounded-xl border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("admin.users.name")}</TableHead>
                <TableHead>{t("admin.users.email")}</TableHead>
                <TableHead>{t("admin.users.status")}</TableHead>
                <TableHead>{t("admin.users.role")}</TableHead>
                <TableHead className="text-right">
                  {t("admin.users.meters")}
                </TableHead>
                <TableHead>{t("admin.users.created")}</TableHead>
                <TableHead className="text-right">
                  {t("admin.users.actions")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((user) => {
                const isSuper = user.role === "super_admin";
                const isAdmin = user.role === "admin";
                const isSelf = user.id === currentUserId;
                const isActive = user.is_active !== false;

                // Sub-admins cannot modify admins or super admins
                const canManageThisUser = isSuperAdmin || (!isSuper && !isAdmin);

                return (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      <div>
                        <span>{user.full_name || "—"}</span>
                        {isSelf && (
                          <span className="ml-2 text-xs font-normal text-muted-foreground">
                            ({t("admin.users.you")})
                          </span>
                        )}
                        {user.designation && (
                          <p className="text-xs text-muted-foreground font-normal">
                            {user.designation}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {user.email}
                    </TableCell>
                    <TableCell>
                      {isActive ? (
                        <Badge variant="healthy" className="gap-1">
                          <CheckCircle2 className="size-3" />
                          <span>{t("admin.users.active")}</span>
                        </Badge>
                      ) : (
                        <Badge variant="destructive" className="gap-1">
                          <Ban className="size-3" />
                          <span>{t("admin.users.blocked")}</span>
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {isSuper ? (
                        <Badge variant="info">
                          {t("admin.superAdmin")}
                        </Badge>
                      ) : isAdmin ? (
                        <Badge variant="secondary">
                          {t("admin.users.admin")}
                        </Badge>
                      ) : (
                        <Badge variant="outline">
                          {t("admin.audit.user")}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right tabular">
                      {formatNumber(user.meter_count)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {formatDate(user.created_at)}
                    </TableCell>
                    <TableCell className="text-right">
                      {canManageThisUser ? (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="size-4" />
                              <span className="sr-only">Actions</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>
                              {user.full_name || user.email}
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />

                            {/* Edit Profile */}
                            <DropdownMenuItem onClick={() => setEditUser(user)}>
                              <Edit className="mr-2 size-4 text-muted-foreground" />
                              <span>{t("admin.users.editUser")}</span>
                            </DropdownMenuItem>

                            {/* Block / Unblock (not self) */}
                            {!isSelf && (
                              <DropdownMenuItem
                                onClick={() => setBlockUser(user)}
                                className={isActive ? "text-destructive" : "text-healthy"}
                              >
                                {isActive ? (
                                  <>
                                    <Ban className="mr-2 size-4" />
                                    <span>{t("admin.users.blockUser")}</span>
                                  </>
                                ) : (
                                  <>
                                    <UserCheck className="mr-2 size-4" />
                                    <span>{t("admin.users.unblockUser")}</span>
                                  </>
                                )}
                              </DropdownMenuItem>
                            )}

                            {/* Role Changes (Super Admin only, not self) */}
                            {isSuperAdmin && !isSelf && (
                              <>
                                <DropdownMenuSeparator />
                                {user.role !== "admin" && (
                                  <DropdownMenuItem
                                    onClick={() =>
                                      setRoleUser({ user, targetRole: "admin" })
                                    }
                                  >
                                    <Shield className="mr-2 size-4 text-muted-foreground" />
                                    <span>Set as Admin</span>
                                  </DropdownMenuItem>
                                )}
                                {user.role !== "super_admin" && (
                                  <DropdownMenuItem
                                    onClick={() =>
                                      setRoleUser({
                                        user,
                                        targetRole: "super_admin",
                                      })
                                    }
                                  >
                                    <Shield className="mr-2 size-4 text-info" />
                                    <span>Set as Super Admin</span>
                                  </DropdownMenuItem>
                                )}
                                {user.role !== "user" && (
                                  <DropdownMenuItem
                                    onClick={() =>
                                      setRoleUser({ user, targetRole: "user" })
                                    }
                                  >
                                    <UserCog className="mr-2 size-4 text-muted-foreground" />
                                    <span>Demote to Regular User</span>
                                  </DropdownMenuItem>
                                )}
                              </>
                            )}

                            {/* Delete User (not self) */}
                            {!isSelf && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => setDeleteUser(user)}
                                  className="text-destructive"
                                >
                                  <Trash2 className="mr-2 size-4" />
                                  <span>{t("admin.users.deleteUser")}</span>
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Create User Dialog */}
      <CreateUserDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        isSuperAdmin={isSuperAdmin}
      />

      {/* Edit User Dialog */}
      {editUser && (
        <EditUserDialog
          user={editUser}
          open={Boolean(editUser)}
          onOpenChange={(open) => !open && setEditUser(null)}
        />
      )}

      {/* Block/Unblock Confirmation */}
      {blockUser && (
        <AlertDialog
          open={Boolean(blockUser)}
          onOpenChange={(open) => !open && setBlockUser(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {blockUser.is_active !== false
                  ? t("admin.users.blockUser")
                  : t("admin.users.unblockUser")}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {blockUser.is_active !== false
                  ? `Are you sure you want to block ${blockUser.full_name || blockUser.email}? They will immediately lose access to their dashboard and meters.`
                  : `Are you sure you want to unblock ${blockUser.full_name || blockUser.email}? Their access will be restored.`}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
              <AlertDialogAction
                onClick={() =>
                  handleToggleBlock(
                    blockUser.id,
                    blockUser.is_active === false,
                  )
                }
              >
                {blockUser.is_active !== false ? "Block User" : "Unblock User"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {/* Role Change Confirmation */}
      {roleUser && (
        <AlertDialog
          open={Boolean(roleUser)}
          onOpenChange={(open) => !open && setRoleUser(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Change User Role</AlertDialogTitle>
              <AlertDialogDescription>
                Change {roleUser.user.full_name || roleUser.user.email} to{" "}
                <strong>{roleUser.targetRole}</strong>?
                {roleUser.targetRole === "super_admin" &&
                  " Warning: Super Admins have full access to all settings and SMTP credentials."}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
              <AlertDialogAction
                onClick={() =>
                  handleRoleChange(roleUser.user.id, roleUser.targetRole)
                }
              >
                Confirm Role Change
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {/* Delete User Confirmation */}
      {deleteUser && (
        <AlertDialog
          open={Boolean(deleteUser)}
          onOpenChange={(open) => !open && setDeleteUser(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t("admin.users.deleteUser")}</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to permanently delete{" "}
                <strong>{deleteUser.full_name || deleteUser.email}</strong>? All
                associated meters and history will be permanently deleted. This
                action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => handleDeleteUser(deleteUser.id)}
                className="bg-destructive hover:bg-destructive/90"
              >
                {t("admin.users.deleteUser")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}

function CreateUserDialog({
  open,
  onOpenChange,
  isSuperAdmin,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isSuperAdmin: boolean;
}) {
  const { t } = useTranslation();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<AdminCreateUserInput>({
    resolver: zodResolver(adminCreateUserSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      role: "user",
    },
  });

  const tk = (msg?: string) => (msg ? t(msg as TranslationKey) : undefined);

  function onSubmit(values: AdminCreateUserInput) {
    startTransition(async () => {
      const result = await adminCreateUserAction(values);
      if (result.success) {
        toast.success(t("admin.users.createdSuccess"));
        reset();
        onOpenChange(false);
        router.refresh();
      } else {
        if (result.fieldErrors) {
          for (const [field, msgs] of Object.entries(result.fieldErrors)) {
            if (msgs[0]) {
              setError(field as keyof AdminCreateUserInput, { message: msgs[0] });
            }
          }
        }
        toast.error(t((result.error as TranslationKey) || "error.generic"));
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="size-5 text-primary" />
            <span>{t("admin.users.addUser")}</span>
          </DialogTitle>
          <DialogDescription>
            Create a new verified user account with direct credentials.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <FormField
            id="createFullName"
            label={t("auth.fullName")}
            error={tk(errors.fullName?.message)}
          >
            <Input
              id="createFullName"
              placeholder="e.g. John Doe"
              {...register("fullName")}
            />
          </FormField>

          <FormField
            id="createEmail"
            label={t("auth.email")}
            error={tk(errors.email?.message)}
          >
            <Input
              id="createEmail"
              type="email"
              placeholder="user@example.com"
              {...register("email")}
            />
          </FormField>

          <FormField
            id="createPassword"
            label={t("auth.password")}
            error={tk(errors.password?.message)}
          >
            <Input
              id="createPassword"
              type="password"
              placeholder="Min 8 characters"
              {...register("password")}
            />
          </FormField>

          {isSuperAdmin && (
            <div className="space-y-1.5">
              <label htmlFor="createRole" className="text-sm font-medium">
                {t("admin.users.role")}
              </label>
              <select
                id="createRole"
                {...register("role")}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="user">Regular User</option>
                <option value="admin">Admin</option>
                <option value="super_admin">Super Admin</option>
              </select>
            </div>
          )}

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={pending}
            >
              {t("common.cancel")}
            </Button>
            <Button type="submit" loading={pending}>
              {t("common.save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EditUserDialog({
  user,
  open,
  onOpenChange,
}: {
  user: ProfileWithStats;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useTranslation();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<AdminUpdateUserInput>({
    resolver: zodResolver(adminUpdateUserSchema),
    defaultValues: {
      userId: user.id,
      fullName: user.full_name || "",
      phone: user.phone || "",
      address: user.address || "",
      designation: user.designation || "",
    },
  });

  const tk = (msg?: string) => (msg ? t(msg as TranslationKey) : undefined);

  function onSubmit(values: AdminUpdateUserInput) {
    startTransition(async () => {
      const result = await adminUpdateUserAction(values);
      if (result.success) {
        toast.success(t("admin.users.updatedSuccess"));
        onOpenChange(false);
        router.refresh();
      } else {
        if (result.fieldErrors) {
          for (const [field, msgs] of Object.entries(result.fieldErrors)) {
            if (msgs[0]) {
              setError(field as keyof AdminUpdateUserInput, { message: msgs[0] });
            }
          }
        }
        toast.error(t((result.error as TranslationKey) || "error.generic"));
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("admin.users.editUser")}</DialogTitle>
          <DialogDescription>{user.email}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <input type="hidden" {...register("userId")} />

          <FormField
            id="editFullName"
            label={t("auth.fullName")}
            error={tk(errors.fullName?.message)}
          >
            <Input id="editFullName" {...register("fullName")} />
          </FormField>

          <FormField
            id="editPhone"
            label={t("profile.phone")}
            error={tk(errors.phone?.message)}
          >
            <Input id="editPhone" {...register("phone")} />
          </FormField>

          <FormField
            id="editDesignation"
            label={t("profile.designation")}
            error={tk(errors.designation?.message)}
          >
            <Input id="editDesignation" {...register("designation")} />
          </FormField>

          <FormField
            id="editAddress"
            label={t("profile.address")}
            error={tk(errors.address?.message)}
          >
            <Input id="editAddress" {...register("address")} />
          </FormField>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={pending}
            >
              {t("common.cancel")}
            </Button>
            <Button type="submit" loading={pending}>
              {t("common.save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
