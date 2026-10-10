"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Zap, Sparkles, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { createMeterAction } from "@/app/actions/meters";

export function QuickConnectMeter() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [meterNumber, setMeterNumber] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !accountNumber.trim() || !meterNumber.trim()) {
      toast.error("Please fill in Meter Name, Account Number, and Meter Number");
      return;
    }

    startTransition(async () => {
      const result = await createMeterAction({
        name: name.trim(),
        accountNumber: accountNumber.trim(),
        meterNumber: meterNumber.trim(),
        threshold: 300,
        criticalThreshold: 100,
        monitoringEnabled: true,
        emailAlertEnabled: true,
      });

      if (result.success) {
        toast.success("Meter connected successfully! Syncing live balance...");
        setName("");
        setAccountNumber("");
        setMeterNumber("");
        router.refresh();
      } else {
        toast.error(result.error || "Failed to verify or connect meter");
      }
    });
  };

  return (
    <Card className="border-primary/30 bg-gradient-to-br from-primary/5 via-background to-background shadow-md overflow-hidden">
      <div className="h-1 bg-gradient-to-r from-primary via-emerald-500 to-amber-500" />
      <CardHeader className="p-5 sm:p-6 pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-primary/10 grid place-items-center text-primary shrink-0 shadow-sm">
              <Zap className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg font-bold text-foreground">
                  Connect Your DESCO Prepaid Meter
                </CardTitle>
                <Badge variant="healthy" className="gap-1 px-2 py-0.5 text-[10px] font-semibold">
                  <Sparkles className="size-3" />
                  Instant Sync
                </Badge>
              </div>
              <CardDescription className="text-xs mt-0.5">
                Enter your 8-digit Account Number and Meter Number to activate 24/7 automated balance tracking
              </CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-5 sm:p-6 pt-2">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className="text-xs font-semibold text-foreground block mb-1">
                Meter Label / Name
              </label>
              <Input
                placeholder="e.g. Home Master Meter"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="h-9 text-xs"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground block mb-1">
                Account Number (8 Digits)
              </label>
              <Input
                placeholder="e.g. 17001234"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                required
                className="h-9 text-xs font-mono"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground block mb-1">
                Meter Number (11-12 Digits)
              </label>
              <Input
                placeholder="e.g. 01010123456"
                value={meterNumber}
                onChange={(e) => setMeterNumber(e.target.value)}
                required
                className="h-9 text-xs font-mono"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-1">
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="size-3.5 text-emerald-500 shrink-0" />
                Live DESCO Server Validation
              </span>
              <span className="flex items-center gap-1.5 hidden sm:flex">
                <CheckCircle2 className="size-3.5 text-emerald-500 shrink-0" />
                Zero Setup Fees
              </span>
            </div>

            <Button
              type="submit"
              disabled={isPending}
              className="gap-2 font-semibold shadow-sm w-full sm:w-auto"
            >
              {isPending ? (
                <>Verifying with DESCO…</>
              ) : (
                <>
                  <Plus className="size-4" />
                  Connect & Sync Balance
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
