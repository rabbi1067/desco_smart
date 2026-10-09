"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Search, Shield, ShieldOff, UserCog } from "lucide-react";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { updateUserRoleAction } from "@/app/actions/settings";
import { formatDate, formatNumber } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";
import type { TranslationKey } from "@/lib/i18n/dictionaries";
import type { ProfileWithStats, UserRole } from "@/types";

/**
 * Users directory with client-side search and role management.
 *
 * The data arrives already scoped by the admin service (service-role read behind
 * an `isAdmin()` gate). Role changes go through `updateUserRoleAction`, which
 * re-checks admin status AND blocks self-demotion server-side — the disabled
 * self-row here is only a UX hint, never the enforcement.
 */
export function AdminUsersTable({
  users,
  currentUserId,
}: {
  users: ProfileWithStats[];
  currentUserId: string;
}) {
  const { t } = useTranslation();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [pending, startTransition] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        (u.full_name ?? "").toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q),
    );
  }, [users, query]);

  function handleRoleChange(userId: string, nextRole: UserRole) {
    setBusyId(userId);
    startTransition(async () => {
      const result = await updateUserRoleAction({ userId, role: nextRole });
      setBusyId(null);
      if (result.success) {
        toast.success(t("admin.users.roleUpdated"));
        router.refresh();
      } else {
        toast.error(t(result.error as TranslationKey));
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
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
          className="pl-9"
        />
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
                <TableHead>{t("admin.users.role")}</TableHead>
                <TableHead className="text-right">
                  {t("admin.users.meters")}
                </TableHead>
                <TableHead>{t("admin.users.created")}</TableHead>
                <TableHead className="text-right">
                  {t("admin.users.role")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((user) => {
                const isAdmin = user.role === "super_admin";
                const isSelf = user.id === currentUserId;
                return (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      {user.full_name || "—"}
                      {isSelf && (
                        <span className="ml-2 text-xs text-muted-foreground">
                          ({t("admin.users.you")})
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {user.email}
                    </TableCell>
                    <TableCell>
                      <Badge variant={isAdmin ? "info" : "secondary"}>
                        {isAdmin
                          ? t("admin.superAdmin")
                          : t("admin.audit.user")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right tabular">
                      {formatNumber(user.meter_count)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {formatDate(user.created_at)}
                    </TableCell>
                    <TableCell className="text-right">
                      <RoleToggle
                        disabled={isSelf || pending}
                        busy={busyId === user.id && pending}
                        isAdmin={isAdmin}
                        userName={user.full_name || user.email}
                        onConfirm={() =>
                          handleRoleChange(
                            user.id,
                            isAdmin ? "user" : "super_admin",
                          )
                        }
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

function RoleToggle({
  isAdmin,
  disabled,
  busy,
  userName,
  onConfirm,
}: {
  isAdmin: boolean;
  disabled: boolean;
  busy: boolean;
  userName: string;
  onConfirm: () => void;
}) {
  const { t } = useTranslation();
  const label = isAdmin ? t("admin.users.demote") : t("admin.users.promote");
  const Icon = isAdmin ? ShieldOff : Shield;

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant={isAdmin ? "outline" : "secondary"}
          size="sm"
          disabled={disabled}
          loading={busy}
        >
          {!busy && <Icon className="size-4" aria-hidden="true" />}
          <span className="hidden sm:inline">{label}</span>
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{label}</AlertDialogTitle>
          <AlertDialogDescription>
            {userName} — {t("admin.governance.warning")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>{label}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
