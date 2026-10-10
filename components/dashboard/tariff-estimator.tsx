"use client";

import { useState, useId } from "react";
import {
  Calculator,
  Zap,
  Info,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

// BERC / DESCO Domestic LT-A Residential Tariff Slabs
const DOMESTIC_SLABS = [
  { min: 1, max: 75, rate: 4.85, label: "Step 1 (1 – 75 units)" },
  { min: 76, max: 200, rate: 6.63, label: "Step 2 (76 – 200 units)" },
  { min: 201, max: 300, rate: 6.95, label: "Step 3 (201 – 300 units)" },
  { min: 301, max: 400, rate: 7.34, label: "Step 4 (301 – 400 units)" },
  { min: 401, max: 600, rate: 11.51, label: "Step 5 (401 – 600 units)" },
  { min: 601, max: Infinity, rate: 13.26, label: "Step 6 (600+ units)" },
];

const DEMAND_CHARGE_PER_KW = 42; // BDT/month
const METER_RENT = 40; // BDT/month
const VAT_RATE = 0.05; // 5%

export function TariffEstimator() {
  const [units, setUnits] = useState<number>(180);
  const sanctionedLoad = 2; // 2 kW standard domestic load
  const inputId = useId();

  // Tiered slab calculation
  function calculateBill(totalUnits: number, kw: number) {
    if (totalUnits <= 0) {
      const fixed = (kw * DEMAND_CHARGE_PER_KW) + METER_RENT;
      const vat = fixed * VAT_RATE;
      return { energyCost: 0, demandCharge: kw * DEMAND_CHARGE_PER_KW, meterRent: METER_RENT, vat, total: fixed + vat, slabBreakdown: [] };
    }

    let remaining = totalUnits;
    let energyCost = 0;
    const slabBreakdown: { label: string; units: number; rate: number; cost: number }[] = [];

    // Lifeline special check: 1-50 units is lifeline @ 4.35 if total consumption <= 50
    // Standard LT-A slabs:
    for (const slab of DOMESTIC_SLABS) {
      if (remaining <= 0) break;
      const slabSpan = slab.max === Infinity ? remaining : (slab.max - slab.min + 1);
      const unitsInSlab = Math.min(remaining, slabSpan);
      const cost = unitsInSlab * slab.rate;
      energyCost += cost;
      slabBreakdown.push({
        label: slab.label,
        units: unitsInSlab,
        rate: slab.rate,
        cost,
      });
      remaining -= unitsInSlab;
    }

    const demandCharge = kw * DEMAND_CHARGE_PER_KW;
    const subtotal = energyCost + demandCharge + METER_RENT;
    const vat = subtotal * VAT_RATE;
    const total = subtotal + vat;

    return {
      energyCost,
      demandCharge,
      meterRent: METER_RENT,
      vat,
      total,
      slabBreakdown,
    };
  }

  const { energyCost, demandCharge, meterRent, vat, total, slabBreakdown } = calculateBill(units, sanctionedLoad);

  return (
    <Card className="border-border/80 shadow-sm overflow-hidden">
      <CardHeader className="pb-3 border-b border-border/40 bg-muted/20">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-lg bg-primary/10 grid place-items-center text-primary">
              <Calculator className="size-4" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                DESCO Domestic Tariff & Bill Estimator
                <Badge variant="secondary" className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5">
                  LT-A Official
                </Badge>
              </CardTitle>
              <CardDescription className="text-xs">
                Calculate energy cost & see tiered slab breakdowns under official BERC rates
              </CardDescription>
            </div>
          </div>
          <div className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Sparkles className="size-3 text-amber-500" />
            <span>Interactive Simulator</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-5 sm:p-6 space-y-6">
        {/* Controls row */}
        <div className="grid gap-6 md:grid-cols-12 items-center">
          <div className="md:col-span-8 space-y-3">
            <div className="flex items-center justify-between">
              <label htmlFor={inputId} className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Zap className="size-3.5 text-primary" />
                Monthly Consumption (Units / kWh)
              </label>
              <div className="flex items-center gap-1.5">
                <Input
                  id={inputId}
                  type="number"
                  min="0"
                  max="1000"
                  value={units}
                  onChange={(e) => setUnits(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-20 h-7 text-xs font-bold text-center tabular-nums"
                />
                <span className="text-xs text-muted-foreground">kWh</span>
              </div>
            </div>

            <input
              type="range"
              min={0}
              max={650}
              step={5}
              value={units}
              onChange={(e) => setUnits(Number(e.target.value))}
              aria-label="Monthly consumption in kWh"
              className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
            />

            <div className="flex justify-between text-[11px] text-muted-foreground font-mono">
              <span>0 kWh</span>
              <span>100 kWh</span>
              <span>200 kWh</span>
              <span>300 kWh</span>
              <span>500 kWh</span>
              <span>650+ kWh</span>
            </div>
          </div>

          <div className="md:col-span-4 bg-muted/40 p-4 rounded-xl border border-border/60 space-y-2">
            <span className="text-[11px] font-medium text-muted-foreground block">
              Estimated Total Bill (Incl. VAT)
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-black text-foreground tabular-nums">
                ৳{Math.round(total).toLocaleString()}
              </span>
              <span className="text-xs text-muted-foreground">BDT</span>
            </div>
            <div className="text-[11px] text-muted-foreground flex items-center justify-between pt-1 border-t border-border/50">
              <span>Avg Unit Cost:</span>
              <span className="font-semibold text-foreground tabular-nums">
                ৳{units > 0 ? (total / units).toFixed(2) : "0.00"}/kWh
              </span>
            </div>
          </div>
        </div>

        {/* Detailed Breakdown Table */}
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Slabs breakdown */}
          <div className="rounded-lg border border-border/60 bg-background/50 p-3.5 space-y-2">
            <h4 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <ChevronRight className="size-3 text-primary" />
              Active Tiered Slabs
            </h4>
            <div className="space-y-1.5 text-xs">
              {slabBreakdown.map((s, idx) => (
                <div key={idx} className="flex items-center justify-between text-muted-foreground py-0.5">
                  <span className="truncate pr-2">{s.label} ({s.units}u @ ৳{s.rate})</span>
                  <span className="font-medium text-foreground tabular-nums shrink-0">
                    ৳{s.cost.toFixed(2)}
                  </span>
                </div>
              ))}
              <div className="flex items-center justify-between font-semibold text-foreground pt-1.5 border-t border-border/50">
                <span>Net Energy Charge</span>
                <span className="tabular-nums">৳{energyCost.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Fixed Charges & Taxes */}
          <div className="rounded-lg border border-border/60 bg-background/50 p-3.5 space-y-2">
            <h4 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Info className="size-3 text-primary" />
              Fixed Charges & Government Taxes
            </h4>
            <div className="space-y-1.5 text-xs">
              <div className="flex items-center justify-between text-muted-foreground py-0.5">
                <span>Demand Charge ({sanctionedLoad} kW @ ৳42/kW)</span>
                <span className="font-medium text-foreground tabular-nums">৳{demandCharge.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-muted-foreground py-0.5">
                <span>Monthly Meter Rent</span>
                <span className="font-medium text-foreground tabular-nums">৳{meterRent.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-muted-foreground py-0.5">
                <span>Government VAT (5%)</span>
                <span className="font-medium text-foreground tabular-nums">৳{vat.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between font-semibold text-primary pt-1.5 border-t border-border/50">
                <span>Grand Total Payable</span>
                <span className="tabular-nums">৳{total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
