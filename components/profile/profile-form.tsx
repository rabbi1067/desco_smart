"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { FormField } from "@/components/auth/form-field";
import { updateProfileAction } from "@/app/actions/settings";
import { uploadAvatarAction } from "@/app/actions/upload";
import { ALLOWED_IMAGE_MIME_TYPES, MAX_AVATAR_BYTES } from "@/lib/constants";
import { updateProfileSchema, type UpdateProfileInput } from "@/lib/validations";
import { getInitials } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";
import type { TranslationKey } from "@/lib/i18n/dictionaries";
import type { Profile } from "@/types";

/**
 * Account-details form. The email is intentionally not editable here (changing
 * it is an auth-level operation), so it is shown read-only and never submitted.
 */
export function ProfileForm({
  profile,
  uploadEnabled,
}: {
  profile: Profile;
  uploadEnabled: boolean;
}) {
  const { t } = useTranslation();
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    watch,
    setError,
    setValue,
    formState: { errors },
  } = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      fullName: profile.full_name ?? "",
      phone: profile.phone ?? "",
      address: profile.address ?? "",
      designation: profile.designation ?? "",
      avatarUrl: profile.avatar_url ?? "",
    },
  });

  const tk = (msg?: string) => (msg ? t(msg as TranslationKey) : undefined);
  const avatarUrl = watch("avatarUrl");
  const fullName = watch("fullName");

  async function onSubmit(values: UpdateProfileInput) {
    setPending(true);
    const result = await updateProfileAction(values);
    setPending(false);

    if (result.success) {
      toast.success(t("profile.updated"));
      router.refresh();
      return;
    }
    if (result.fieldErrors) {
      for (const [field, messages] of Object.entries(result.fieldErrors)) {
        if (messages[0]) {
          setError(field as keyof UpdateProfileInput, {
            message: t(messages[0] as TranslationKey),
          });
        }
      }
    } else {
      toast.error(t(result.error as TranslationKey));
    }
  }

  async function onFileSelected(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    // Reset so selecting the same file again still fires `change`.
    event.target.value = "";
    if (!file) return;

    // Validate client-side for instant feedback; the Server Action re-checks
    // both of these — the client limits are a courtesy, not the control.
    if (!ALLOWED_IMAGE_MIME_TYPES.includes(file.type)) {
      toast.error(t("profile.uploadTypeError"));
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      toast.error(t("profile.uploadSizeError"));
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    const result = await uploadAvatarAction(formData);
    setUploading(false);

    if (result.success) {
      // Write the Cloudinary URL into the form; it is persisted when the user
      // saves, exactly like a pasted URL.
      setValue("avatarUrl", result.data.url, {
        shouldDirty: true,
        shouldValidate: true,
      });
      toast.success(t((result.message ?? "profile.uploadSuccess") as TranslationKey));
    } else {
      toast.error(t(result.error as TranslationKey));
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      {/* Avatar preview + URL + upload */}
      <div className="flex items-start gap-4">
        <Avatar className="size-16 shrink-0">
          {avatarUrl ? <AvatarImage src={avatarUrl} alt="" /> : null}
          <AvatarFallback className="text-lg">
            {getInitials(fullName || profile.email)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1 space-y-2">
          <FormField
            id="avatarUrl"
            label={t("profile.avatar")}
            hint={t("profile.avatarHint")}
            optional={t("common.optional")}
            error={tk(errors.avatarUrl?.message)}
          >
            <Input
              id="avatarUrl"
              type="url"
              inputMode="url"
              placeholder="https://…"
              aria-invalid={!!errors.avatarUrl}
              {...register("avatarUrl")}
            />
          </FormField>
          {uploadEnabled || avatarUrl ? (
            <div className="flex flex-wrap items-center gap-2">
              {uploadEnabled ? (
                <>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="sr-only"
                    onChange={onFileSelected}
                    aria-hidden="true"
                    tabIndex={-1}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    loading={uploading}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {!uploading ? <Upload aria-hidden="true" /> : null}
                    {uploading
                      ? t("profile.uploading")
                      : t("profile.uploadPhoto")}
                  </Button>
                </>
              ) : null}
              {avatarUrl ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setValue("avatarUrl", "", {
                      shouldDirty: true,
                      shouldValidate: true,
                    })
                  }
                >
                  {t("profile.removePhoto")}
                </Button>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

      <FormField
        id="fullName"
        label={t("profile.fullName")}
        error={tk(errors.fullName?.message)}
      >
        <Input
          id="fullName"
          autoComplete="name"
          aria-invalid={!!errors.fullName}
          {...register("fullName")}
        />
      </FormField>

      {/* Email — read only */}
      <FormField
        id="email"
        label={t("profile.email")}
        hint={t("profile.emailLocked")}
      >
        <Input id="email" type="email" value={profile.email} disabled readOnly />
      </FormField>

      <div className="grid gap-5 sm:grid-cols-2">
        <FormField
          id="phone"
          label={t("profile.phone")}
          optional={t("common.optional")}
          error={tk(errors.phone?.message)}
        >
          <Input
            id="phone"
            type="tel"
            autoComplete="tel"
            aria-invalid={!!errors.phone}
            {...register("phone")}
          />
        </FormField>

        <FormField
          id="designation"
          label={t("profile.designation")}
          optional={t("common.optional")}
          error={tk(errors.designation?.message)}
        >
          <Input
            id="designation"
            aria-invalid={!!errors.designation}
            {...register("designation")}
          />
        </FormField>
      </div>

      <FormField
        id="address"
        label={t("profile.address")}
        optional={t("common.optional")}
        error={tk(errors.address?.message)}
      >
        <Textarea
          id="address"
          rows={2}
          aria-invalid={!!errors.address}
          {...register("address")}
        />
      </FormField>

      <div className="flex justify-end">
        <Button type="submit" loading={pending}>
          {t("profile.saveChanges")}
        </Button>
      </div>
    </form>
  );
}
