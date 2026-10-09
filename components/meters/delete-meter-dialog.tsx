"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
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
import { deleteMeterAction } from "@/app/actions/meters";
import { useTranslation } from "@/lib/i18n";
import type { TranslationKey } from "@/lib/i18n/dictionaries";
import type { Meter } from "@/types";

/**
 * Confirmation dialog for deleting a meter.
 *
 * Controlled by the parent (the card's dropdown opens it) rather than wrapping
 * its own trigger — nesting a trigger inside a dropdown menu item unmounts the
 * dialog when the menu closes. Deletion is destructive and irreversible, so it
 * always requires this explicit confirmation step.
 */
export function DeleteMeterDialog({
  open,
  onOpenChange,
  meter,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  meter: Meter;
}) {
  const { t } = useTranslation();
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleDelete() {
    setPending(true);
    const result = await deleteMeterAction({ id: meter.id });
    setPending(false);

    if (result.success) {
      toast.success(t(result.message as TranslationKey));
      onOpenChange(false);
      router.refresh();
    } else {
      toast.error(t(result.error as TranslationKey));
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("meterToast.deleteTitle")}</AlertDialogTitle>
          <AlertDialogDescription>
            <span className="block font-medium text-foreground">
              {meter.name}
            </span>
            {t("meterToast.deleteDesc")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>
            {t("meterForm.cancel")}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              // Keep the dialog open while the action runs; close on success.
              e.preventDefault();
              void handleDelete();
            }}
            disabled={pending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {pending ? t("meterForm.saving") : t("meterToast.deleteConfirm")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
