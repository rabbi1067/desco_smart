"use client";

import { useMemo, useState } from "react";
import { ScrollText, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/shared/empty-state";
import { formatDateTime } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";
import type { AuditLog } from "@/types";

/**
 * Immutable audit trail with client-side search.
 *
 * Rows are read-only security records fetched by the admin service. The `action`
 * is a stable system enum (a data value, like an email or meter number), shown
 * verbatim rather than translated. `result` maps to a healthy/critical badge so
 * failures never rely on colour alone — the text label carries the meaning too.
 */
export function AdminAuditTable({ logs }: { logs: AuditLog[] }) {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return logs;
    return logs.filter((log) =>
      [log.actor_email ?? "", log.action, log.entity_type ?? "", log.entity_id ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [logs, query]);

  return (
    <div className="space-y-4">
      <div className="relative max-w-md">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("common.search")}
          aria-label={t("common.search")}
          className="pl-9"
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={ScrollText}
          title={t("admin.audit.empty")}
          description={t("admin.audit.emptyDesc")}
        />
      ) : (
        <div className="rounded-xl border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("admin.audit.timestamp")}</TableHead>
                <TableHead>{t("admin.audit.user")}</TableHead>
                <TableHead>{t("admin.audit.action")}</TableHead>
                <TableHead>{t("admin.audit.entity")}</TableHead>
                <TableHead>{t("admin.audit.result")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="whitespace-nowrap text-muted-foreground">
                    {formatDateTime(log.created_at)}
                  </TableCell>
                  <TableCell className="text-sm">
                    {log.actor_email || "—"}
                  </TableCell>
                  <TableCell>
                    <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-medium">
                      {log.action}
                    </code>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {log.entity_type ? (
                      <span>
                        {log.entity_type}
                        {log.entity_id && (
                          <span className="ml-1 text-xs opacity-70">
                            #{log.entity_id.slice(0, 8)}
                          </span>
                        )}
                      </span>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={log.result === "success" ? "healthy" : "critical"}
                    >
                      {log.result === "success"
                        ? t("status.success")
                        : t("status.failed")}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
