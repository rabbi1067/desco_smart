"use client";

import { useState } from "react";
import { Zap, Check, Copy } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RechargeModal } from "@/components/shared/recharge-modal";
import { toast } from "sonner";

interface RechargeMeterOption {
  id: string;
  name: string;
  meterNumber: string;
  accountNumber: string;
  currentBalance: number | null;
}

const GATEWAYS = [
  {
    name: "bKash",
    color: "from-pink-500/10 to-rose-500/10 border-pink-500/30 text-pink-600 dark:text-pink-400",
    badge: "bKash Pay Bill",
    ussd: "*247#",
    steps: "Dial *247# > 5 (Pay Bill) > 1 (Electricity) > 2 (DESCO Prepaid) > Enter Account No",
  },
  {
    name: "Nagad",
    color: "from-amber-500/10 to-orange-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400",
    badge: "Nagad Bill Pay",
    ussd: "*167#",
    steps: "Dial *167# > 5 (Bill Pay) > 1 (Electricity) > DESCO Prepaid > Enter Account No",
  },
  {
    name: "Rocket",
    color: "from-purple-500/10 to-indigo-500/10 border-purple-500/30 text-purple-600 dark:text-purple-400",
    badge: "DBBL Rocket",
    ussd: "*322#",
    steps: "Dial *322# > 1 (Bill Pay) > Biller ID: 234 (DESCO) > Enter Bill/Account No",
  },
  {
    name: "Upay",
    color: "from-blue-500/10 to-cyan-500/10 border-blue-500/30 text-blue-600 dark:text-blue-400",
    badge: "UCB Upay",
    ussd: "*268#",
    steps: "Dial *268# > 4 (Bill Pay) > 1 (Electricity) > DESCO > Enter Account No",
  },
];

export function RechargeHub({
  meters = [],
}: {
  meters: RechargeMeterOption[];
}) {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const copyUssd = (ussd: string) => {
    navigator.clipboard.writeText(ussd);
    setCopiedCode(ussd);
    toast.success(`Copied USSD ${ussd} to clipboard`);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <Card className="border-border/80 shadow-sm overflow-hidden">
      <CardHeader className="pb-3 border-b border-border/40 bg-muted/20">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-lg bg-emerald-500/10 grid place-items-center text-emerald-600 dark:text-emerald-400">
              <Zap className="size-4" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold">
                Quick Recharge Gateway Hub
              </CardTitle>
              <CardDescription className="text-xs">
                Official Bangladesh MFS instant recharge gateways for DESCO Prepaid meters
              </CardDescription>
            </div>
          </div>
          <Badge variant="healthy" className="w-fit text-[11px] font-semibold">
            0% Gateway Fee
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-5 sm:p-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {GATEWAYS.map((gw) => (
            <div
              key={gw.name}
              className={`rounded-xl border bg-gradient-to-br p-4 flex flex-col justify-between space-y-3 transition-all hover:shadow-md ${gw.color}`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm text-foreground">{gw.name}</h4>
                  <Badge variant="outline" className="text-[10px] font-mono px-1.5 py-0">
                    {gw.badge}
                  </Badge>
                </div>
                <p className="text-[11px] text-muted-foreground mt-2 leading-relaxed">
                  {gw.steps}
                </p>
              </div>

              <div className="pt-2 border-t border-border/40 flex items-center justify-between gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyUssd(gw.ussd)}
                  className="h-7 text-xs font-mono gap-1 px-2.5 bg-background/80"
                >
                  {copiedCode === gw.ussd ? (
                    <Check className="size-3 text-emerald-500" />
                  ) : (
                    <Copy className="size-3" />
                  )}
                  {gw.ussd}
                </Button>

                {meters.length > 0 ? (
                  <RechargeModal
                    meters={meters}
                    trigger={
                      <Button size="sm" variant="default" className="h-7 text-xs gap-1 font-semibold px-2.5">
                        <Zap className="size-3" />
                        Recharge
                      </Button>
                    }
                  />
                ) : (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => toast.info("Add your DESCO meter first to auto-fill recharge vouchers.")}
                    className="h-7 text-xs gap-1"
                  >
                    Guide
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
