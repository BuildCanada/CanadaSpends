import { cn } from "@/lib/utils";
import Link from "next/link";

export type YearSelectorItem = {
  year: number;
  href: string;
  current?: boolean;
  // Department does not exist in this year (machinery-of-government change);
  // the link points to that year's overview instead of the department page.
  unavailable?: boolean;
};

/**
 * Link-based fiscal-year toggle (spec §10). Each year is its own static page,
 * so this is navigation, not client state. Works for both the overview and
 * department contexts — the caller builds hrefs and marks the current year.
 */
export function YearSelector({
  items,
  label,
}: {
  items: YearSelectorItem[];
  label?: React.ReactNode;
}) {
  if (items.length <= 1) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {label && (
        <span className="text-sm font-medium text-foreground/60 mr-1">
          {label}
        </span>
      )}
      {items.map((item) => (
        <Link
          key={item.year}
          href={item.href}
          aria-current={item.current ? "page" : undefined}
          title={
            item.unavailable ? "Not reported separately this year" : undefined
          }
          className={cn(
            "rounded-md px-3 py-1 text-sm font-medium transition-colors",
            item.current
              ? "bg-auburn-800 text-white"
              : item.unavailable
                ? "text-foreground/30 hover:text-foreground/60 border border-dashed border-gray-300"
                : "text-foreground/70 hover:bg-gray-100 border border-gray-200",
          )}
        >
          {item.year}
        </Link>
      ))}
    </div>
  );
}
