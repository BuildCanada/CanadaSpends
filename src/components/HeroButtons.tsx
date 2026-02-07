"use client";

import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Trans, useLingui } from "@lingui/react/macro";
import { ChevronDown } from "lucide-react";
import Link from "next/link";
import { provinceNames } from "@/lib/provinceNames";

interface HeroButtonsProps {
  provinces: string[];
  municipalitiesByProvince: Array<{
    province: string;
    municipalities: Array<{ slug: string; name: string }>;
  }>;
}

export function HeroButtons({
  provinces,
  municipalitiesByProvince,
}: HeroButtonsProps) {
  const { i18n } = useLingui();

  const buttonBaseClass =
    "items-center font-medium justify-center py-3 px-4 relative flex w-full overflow-hidden";
  const primaryButtonClass = `${buttonBaseClass} text-card bg-lake-700 hover:bg-lake-800`;
  const secondaryButtonClass = `${buttonBaseClass} bg-accent text-accent-foreground border-border border-2 hover:bg-muted`;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl">
      {/* Federal Spending */}
      <Link
        className={primaryButtonClass}
        href={`/${i18n.locale}/federal/spending`}
      >
        <div className="items-center cursor-pointer justify-center relative flex overflow-hidden">
          <div className="items-center justify-center flex p-1">
            <Trans>Explore Federal Spending</Trans>
          </div>
        </div>
      </Link>

      {/* Provincial Spending Dropdown */}
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <button className={`${secondaryButtonClass} gap-1`}>
            <Trans>Explore Provincial Spending</Trans>
            <ChevronDown className="w-4 h-4" />
          </button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content
            className="bg-popover text-popover-foreground rounded-md shadow-lg p-1 flex flex-col min-w-45 z-200 max-h-80 overflow-y-auto"
            sideOffset={4}
          >
            {provinces.map((provinceSlug) => (
              <DropdownMenu.Item key={provinceSlug} asChild>
                <Link
                  href={`/${i18n.locale}/${provinceSlug}`}
                  className="px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground rounded cursor-pointer"
                >
                  {provinceNames[provinceSlug]}
                </Link>
              </DropdownMenu.Item>
            ))}
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>

      {/* Municipal Spending Dropdown */}
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <button className={`${secondaryButtonClass} gap-1`}>
            <Trans>Explore Municipal Spending</Trans>
            <ChevronDown className="w-4 h-4" />
          </button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content
            className="bg-popover text-popover-foreground rounded-md shadow-lg p-1 flex flex-col min-w-50 z-200 max-h-80 overflow-y-auto"
            sideOffset={4}
          >
            {municipalitiesByProvince.map(({ province, municipalities }) => (
              <div key={province}>
                <div className="px-3 py-2 text-xs font-semibold text-muted-foreground">
                  {provinceNames[province] || province}
                </div>
                {municipalities.map((municipality) => (
                  <DropdownMenu.Item key={municipality.slug} asChild>
                    <Link
                      href={`/${i18n.locale}/${municipality.slug}`}
                      className="px-3 py-2 pl-5 text-sm hover:bg-accent hover:text-accent-foreground rounded cursor-pointer"
                    >
                      {municipality.name}
                    </Link>
                  </DropdownMenu.Item>
                ))}
              </div>
            ))}
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>

      {/* First Nations Spending */}
      <Link
        className={secondaryButtonClass}
        href={`/${i18n.locale}/first-nations`}
      >
        <div className="items-center cursor-pointer justify-center relative flex overflow-hidden">
          <div className="items-center justify-center flex p-1">
            <Trans>Explore First Nations Spending</Trans>
          </div>
        </div>
      </Link>
    </div>
  );
}
