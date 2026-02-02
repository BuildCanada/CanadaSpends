import { memo } from "react";
import Link from "next/link";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Trans, useLingui } from "@lingui/react/macro";
import { ChevronDown, ChevronRight } from "lucide-react";
import { provinceNames } from "@/lib/provinceNames";

// Memoize NavLink
const NavLink = memo(
  ({
    href,
    children,
    active = false,
  }: {
    href: string;
    children: React.ReactNode;
    active?: boolean;
  }) => {
    return (
      <Link
        href={href}
        className={`relative py-2 text-sm font-medium ${
          active
            ? "text-foreground after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-foreground"
            : "text-muted-foreground/80 hover:text-foreground"
        }`}
      >
        {children}
      </Link>
    );
  },
);
NavLink.displayName = "NavLink"; // Add display name for better debugging

interface DesktopNavProps {
  pathname: string;
  provinces: string[];
  municipalitiesByProvince: Array<{
    province: string;
    municipalities: Array<{ slug: string; name: string }>;
  }>;
}
export default function DesktopNav(props: DesktopNavProps) {
  const { i18n } = useLingui();
  const { pathname, provinces, municipalitiesByProvince } = props;

  const jurisdictionSlugsSet = new Set<string>();
  for (const province of provinces) {
    jurisdictionSlugsSet.add(province);
  }
  for (const { municipalities } of municipalitiesByProvince) {
    for (const municipality of municipalities) {
      jurisdictionSlugsSet.add(municipality.slug);
    }
  }

  // Extract first path segment (after locale if present) and check if it's a jurisdiction
  const pathSegments = pathname.split("/").filter(Boolean);
  const firstSegment =
    pathSegments[0] === i18n.locale ? pathSegments[1] : pathSegments[0];

  const spendingActive =
    pathname.startsWith(`/${i18n.locale}/spending`) ||
    pathname.startsWith(`/${i18n.locale}/budget`) ||
    pathname.startsWith(`/${i18n.locale}/first-nations`) ||
    (firstSegment ? jurisdictionSlugsSet.has(firstSegment) : false);

  return (
    <nav className="hidden md:flex items-center space-x-8">
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <button
            className={`relative py-2 text-sm font-medium flex items-center gap-1 ${
              spendingActive
                ? "text-black after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-black"
                : "text-gray-600 hover:text-black"
            }`}
          >
            <Trans>Government Spending</Trans>
            <ChevronDown className="w-4 h-4" />
          </button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content
            className="bg-popover text-popover-foreground rounded-md shadow-lg p-1 flex flex-col min-w-37.5 z-200"
            sideOffset={4}
          >
            <DropdownMenu.Item asChild>
              <Link
                href={`/${i18n.locale}/spending`}
                className="px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground rounded cursor-pointer"
              >
                <Trans>Federal</Trans>
              </Link>
            </DropdownMenu.Item>

            <DropdownMenu.Item asChild>
              <Link
                href={`/${i18n.locale}/budget`}
                className="px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground rounded cursor-pointer"
              >
                <Trans>Budget</Trans>
              </Link>
            </DropdownMenu.Item>

            <DropdownMenu.Sub>
              <DropdownMenu.SubTrigger className="px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground rounded cursor-pointer flex items-center justify-between data-highlighted:bg-muted">
                <Trans>Provincial</Trans>
                <ChevronRight className="w-4 h-4" />
              </DropdownMenu.SubTrigger>
              <DropdownMenu.Portal>
                <DropdownMenu.SubContent
                  className="bg-popover rounded-md shadow-lg p-1 flex flex-col min-w-45 z-200"
                  sideOffset={8}
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
                </DropdownMenu.SubContent>
              </DropdownMenu.Portal>
            </DropdownMenu.Sub>

            <DropdownMenu.Sub>
              <DropdownMenu.SubTrigger className="px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground rounded cursor-pointer flex items-center justify-between data-[state=open]:bg-transparent data-highlighted:bg-muted">
                <Trans>Municipal</Trans>
                <ChevronRight className="w-4 h-4" />
              </DropdownMenu.SubTrigger>
              <DropdownMenu.Portal>
                <DropdownMenu.SubContent
                  className="bg-popover rounded-md shadow-lg p-1 flex flex-col min-w-50 z-200"
                  sideOffset={8}
                >
                  {municipalitiesByProvince.map(
                    ({ province, municipalities }) => (
                      <DropdownMenu.Sub key={province}>
                        <DropdownMenu.SubTrigger className="px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground rounded cursor-pointer flex items-center justify-between data-highlighted:bg-muted">
                          {provinceNames[province] || province}
                          <ChevronRight className="w-4 h-4" />
                        </DropdownMenu.SubTrigger>
                        <DropdownMenu.Portal>
                          <DropdownMenu.SubContent
                            className="bg-popover rounded-md shadow-lg p-1 flex flex-col min-w-50 z-200 max-h-100 overflow-y-auto"
                            sideOffset={8}
                          >
                            {municipalities.map((municipality) => (
                              <DropdownMenu.Item
                                key={municipality.slug}
                                asChild
                              >
                                <Link
                                  href={`/${i18n.locale}/${municipality.slug}`}
                                  className="px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground rounded cursor-pointer"
                                >
                                  {municipality.name}
                                </Link>
                              </DropdownMenu.Item>
                            ))}
                          </DropdownMenu.SubContent>
                        </DropdownMenu.Portal>
                      </DropdownMenu.Sub>
                    ),
                  )}
                </DropdownMenu.SubContent>
              </DropdownMenu.Portal>
            </DropdownMenu.Sub>

            <DropdownMenu.Item asChild>
              <Link
                href={`/${i18n.locale}/first-nations`}
                className="px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground rounded cursor-pointer"
              >
                <Trans>First Nations</Trans>
              </Link>
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
      <NavLink
        href={`/${i18n.locale}/tax-visualizer`}
        active={pathname === `/${i18n.locale}/tax-visualizer`}
      >
        <Trans>Tax Visualizer</Trans>
      </NavLink>
      <NavLink
        href={`/${i18n.locale}/search`}
        active={pathname === `/${i18n.locale}/search`}
      >
        <Trans>Spending Database</Trans>
      </NavLink>
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <button
            className={`relative py-2 text-sm font-medium flex items-center gap-1 ${
              spendingActive
                ? "text-black after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-black"
                : "text-gray-600 hover:text-black"
            }`}
          >
            <Trans>About</Trans>
            <ChevronDown className="w-4 h-4" />
          </button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content
            className="bg-popover rounded-md shadow-lg p-1 flex flex-col min-w-37.5 z-200"
            sideOffset={4}
          >
            <DropdownMenu.Item asChild>
              <Link
                href={`/${i18n.locale}/about`}
                className="px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground rounded cursor-pointer"
              >
                <Trans>About Us</Trans>
              </Link>
            </DropdownMenu.Item>
            <DropdownMenu.Item asChild>
              <Link
                href="https://buildcanada.com/get-involved"
                className="px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground rounded cursor-pointer"
                target="_blank"
              >
                <Trans>Get Involved</Trans>
              </Link>
            </DropdownMenu.Item>
            <DropdownMenu.Item asChild>
              <Link
                href={`/${i18n.locale}/contact`}
                className="px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground rounded cursor-pointer"
              >
                <Trans>Contact</Trans>
              </Link>
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
      <NavLink
        href={`/${i18n.locale}/whistleblowers`}
        active={pathname === `/${i18n.locale}/whistleblowers`}
      >
        <Trans>Whistleblowers</Trans>
      </NavLink>
    </nav>
  );
}
