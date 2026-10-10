"use client";

import { useState } from "react";
import {
  CreditCard,
  Copy,
  Check,
  ExternalLink,
  Smartphone,
  Zap,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export interface RechargeMeterOption {
  id: string;
  name: string;
  meterNumber: string;
  accountNumber: string;
  currentBalance?: number | null;
}

export function RechargeModal({
  meters = [],
  selectedMeterId,
  trigger,
}: {
  meters?: RechargeMeterOption[];
  selectedMeterId?: string;
  trigger?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [activeMeterId, setActiveMeterId] = useState<string>(
    selectedMeterId || meters[0]?.id || "",
  );
  const [copied, setCopied] = useState(false);

  const activeMeter =
    meters.find((m) => m.id === activeMeterId) || meters[0];

  function copyToClipboard(text: string) {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Account number copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="default" className="gap-2 bg-primary font-semibold shadow">
            <Zap className="size-4" />
            Quick Recharge
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <Zap className="size-5 text-primary" />
            DESCO Prepaid Recharge Guide
          </DialogTitle>
          <DialogDescription>
            Official instant recharge methods for DESCO prepaid electricity meters.
          </DialogDescription>
        </DialogHeader>

        {/* Meter Selector / Info banner */}
        {meters.length > 0 && activeMeter && (
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                  Selected Meter
                </p>
                <p className="text-base font-bold text-foreground">
                  {activeMeter.name}
                </p>
                <p className="text-xs text-muted-foreground tabular">
                  Meter No: {activeMeter.meterNumber}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-background px-3 py-1.5 border border-border">
                  <span className="text-[11px] text-muted-foreground block">
                    Account No
                  </span>
                  <span className="font-mono text-sm font-bold tracking-wider">
                    {activeMeter.accountNumber}
                  </span>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(activeMeter.accountNumber)}
                  className="h-9 gap-1.5 px-3"
                  title="Copy Account Number"
                >
                  {copied ? (
                    <Check className="size-4 text-primary" />
                  ) : (
                    <Copy className="size-4" />
                  )}
                  <span className="text-xs">{copied ? "Copied" : "Copy"}</span>
                </Button>
              </div>
            </div>

            {meters.length > 1 && (
              <div className="mt-3 flex flex-wrap gap-1.5 border-t border-primary/10 pt-2.5">
                <span className="text-xs text-muted-foreground self-center mr-1">
                  Switch meter:
                </span>
                {meters.map((m) => (
                  <Badge
                    key={m.id}
                    variant={m.id === activeMeter.id ? "healthy" : "outline"}
                    className="cursor-pointer text-xs"
                    onClick={() => setActiveMeterId(m.id)}
                  >
                    {m.name}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Payment Channels Tabs */}
        <Tabs defaultValue="bkash" className="mt-2 w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="bkash">bKash</TabsTrigger>
            <TabsTrigger value="nagad">Nagad</TabsTrigger>
            <TabsTrigger value="rocket">Rocket</TabsTrigger>
            <TabsTrigger value="portal">Web Portal</TabsTrigger>
          </TabsList>

          {/* bKash instructions */}
          <TabsContent value="bkash" className="space-y-3 pt-2">
            <Card>
              <CardContent className="space-y-3 p-4 text-sm">
                <div className="flex items-center gap-2 font-semibold text-primary">
                  <Smartphone className="size-4" />
                  bKash App / USSD (*247#) Recharge Steps:
                </div>
                <ol className="list-decimal space-y-2 pl-5 text-muted-foreground">
                  <li>
                    Open <strong>bKash App</strong> or dial{" "}
                    <code className="rounded bg-muted px-1.5 py-0.5 font-bold text-foreground">
                      *247#
                    </code>
                  </li>
                  <li>
                    Tap on <strong>Pay Bill</strong> ➔ Select{" "}
                    <strong>Electricity</strong>
                  </li>
                  <li>
                    Choose <strong>DESCO (Prepaid)</strong> from the biller list.
                  </li>
                  <li>
                    Enter your DESCO <strong>Account Number</strong>:{" "}
                    <strong className="text-foreground">
                      {activeMeter?.accountNumber || "(Your Account No)"}
                    </strong>
                  </li>
                  <li>Enter the recharge amount and confirm with your bKash PIN.</li>
                  <li>
                    You will receive an <strong>SMS with a 20-digit token</strong>.
                  </li>
                </ol>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Nagad instructions */}
          <TabsContent value="nagad" className="space-y-3 pt-2">
            <Card>
              <CardContent className="space-y-3 p-4 text-sm">
                <div className="flex items-center gap-2 font-semibold text-primary">
                  <Smartphone className="size-4" />
                  Nagad App / USSD (*167#) Recharge Steps:
                </div>
                <ol className="list-decimal space-y-2 pl-5 text-muted-foreground">
                  <li>
                    Open <strong>Nagad App</strong> or dial{" "}
                    <code className="rounded bg-muted px-1.5 py-0.5 font-bold text-foreground">
                      *167#
                    </code>
                  </li>
                  <li>
                    Select <strong>Bill Pay</strong> ➔ Electricity
                  </li>
                  <li>
                    Select <strong>DESCO Prepaid</strong>
                  </li>
                  <li>
                    Enter Account Number:{" "}
                    <strong className="text-foreground">
                      {activeMeter?.accountNumber || "(Your Account No)"}
                    </strong>
                  </li>
                  <li>Confirm payment to receive your 20-digit recharge token.</li>
                </ol>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Rocket instructions */}
          <TabsContent value="rocket" className="space-y-3 pt-2">
            <Card>
              <CardContent className="space-y-3 p-4 text-sm">
                <div className="flex items-center gap-2 font-semibold text-primary">
                  <Smartphone className="size-4" />
                  Rocket (DBBL) Recharge Steps:
                </div>
                <ol className="list-decimal space-y-2 pl-5 text-muted-foreground">
                  <li>
                    Dial{" "}
                    <code className="rounded bg-muted px-1.5 py-0.5 font-bold text-foreground">
                      *322#
                    </code>{" "}
                    or open the Rocket App.
                  </li>
                  <li>
                    Go to <strong>Bill Pay</strong> ➔ Enter Biller ID:{" "}
                    <strong className="font-mono text-foreground">202</strong> (DESCO
                    Prepaid).
                  </li>
                  <li>
                    Enter your Bill / Account Number and amount, then submit your PIN.
                  </li>
                </ol>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Web portal */}
          <TabsContent value="portal" className="space-y-3 pt-2">
            <Card>
              <CardContent className="space-y-3 p-4 text-sm">
                <div className="flex items-center gap-2 font-semibold text-primary">
                  <CreditCard className="size-4" />
                  Official DESCO Online Customer Portal:
                </div>
                <p className="text-muted-foreground">
                  You can pay directly using Cards (Visa, MasterCard), Internet
                  Banking, or MFS via DESCO&apos;s SSLCOMMERZ gateway.
                </p>
                <Button asChild className="w-full gap-2">
                  <a
                    href="https://prepaid.desco.org.bd"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Open prepaid.desco.org.bd
                    <ExternalLink className="size-4" />
                  </a>
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Token Keypad Instructions */}
        <div className="rounded-xl border border-border/80 bg-muted/40 p-3.5 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5 font-semibold text-foreground mb-1">
            <Info className="size-3.5 text-primary" />
            How to input the 20-digit token into your meter:
          </div>
          <p>
            1. Press the 20 digits carefully on the meter keypad.
            <br />
            2. Press the <strong>Enter key (↵ / blue or green button)</strong>.
            <br />
            3. The meter screen will display <strong>SUCCESS</strong> or{" "}
            <strong>GOOD</strong> with your newly credited balance.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
