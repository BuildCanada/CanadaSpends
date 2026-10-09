"use client";

import { useLingui, Trans } from "@lingui/react/macro";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/Accordion";
import { DetailedTaxCalculation, TaxLineItem } from "@/lib/tax";
import { formatPercentage, formatWholeDollars } from "@/lib/format";

interface TaxBreakdownAccordionProps {
  calculation: DetailedTaxCalculation;
}

interface LineItemRowProps {
  item: TaxLineItem;
}

function LineItemRow({ item }: LineItemRowProps) {
  return (
    <div className="flex justify-between items-center py-1.5 text-sm">
      <span className="text-foreground/80">{item.name}</span>
      <span className="flex items-center gap-3">
        <span className="text-foreground font-medium">
          {formatWholeDollars(item.amount)}
        </span>
        <span className="text-foreground/50 w-14 text-right">
          ({formatPercentage(item.effectiveRate)})
        </span>
      </span>
    </div>
  );
}

interface TaxSectionProps {
  title: string;
  items: TaxLineItem[];
  total: number;
  totalLabel: string;
}

function TaxSection({ title, items, total, totalLabel }: TaxSectionProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <div className="mb-4 last:mb-0">
      <h4 className="text-sm font-semibold text-foreground mb-2">{title}</h4>
      <div className="space-y-0.5 pl-2 border-l-2 border-border">
        {items.map((item) => (
          <LineItemRow key={item.id} item={item} />
        ))}
        <div className="flex justify-between items-center py-1.5 text-sm border-t border-border/50 mt-2 pt-2">
          <span className="text-foreground font-medium">{totalLabel}</span>
          <span className="text-foreground font-semibold">
            {formatWholeDollars(total)}
          </span>
        </div>
      </div>
    </div>
  );
}

export function TaxBreakdownAccordion({
  calculation,
}: TaxBreakdownAccordionProps) {
  const { t } = useLingui();

  const federalItems = calculation.lineItems.filter(
    (item) => item.level === "federal",
  );
  const provincialItems = calculation.lineItems.filter(
    (item) => item.level === "provincial",
  );

  const provinceName =
    calculation.province.charAt(0).toUpperCase() +
    calculation.province.slice(1);

  return (
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem value="tax-breakdown" className="border rounded-lg px-4">
        <AccordionTrigger className="text-base">
          <Trans>View detailed tax breakdown</Trans>
        </AccordionTrigger>
        <AccordionContent>
          <div className="space-y-4">
            <TaxSection
              title={t`Federal Taxes`}
              items={federalItems}
              total={calculation.federalTax}
              totalLabel={t`Federal Total`}
            />

            <TaxSection
              title={t`${provinceName} Taxes`}
              items={provincialItems}
              total={calculation.provincialTax}
              totalLabel={t`${provinceName} Total`}
            />

            <div className="flex justify-between items-center py-2 text-base border-t-2 border-border mt-4 pt-4">
              <span className="text-foreground font-bold">
                <Trans>Total Tax</Trans>
              </span>
              <span className="text-foreground font-bold">
                {formatWholeDollars(calculation.totalTax)}
              </span>
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
