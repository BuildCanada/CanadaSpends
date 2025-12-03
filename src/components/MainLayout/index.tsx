"use client";
import { Footer } from "@/components/MainLayout/Footer";
import { RecruitmentBanner } from "@/components/RecruitmentBanner";
import BuildCanadaBanner from "@/components/BuildCanadaBanner";
import { Trans, useLingui } from "@lingui/react/macro";
import Image from "next/image";
import Link from "next/link";
import logoFull from "./logo-full.svg";
import logoGlyph from "./logo-glyph.svg";
import { useState, memo } from "react";
import { X, Menu, ChevronDown, ChevronRight } from "lucide-react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { usePathname } from "next/navigation";
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
            ? "text-black after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-black"
            : "text-gray-600 hover:text-black"
        }`}
      >
        {children}
      </Link>
    );
  },
);
NavLink.displayName = "NavLink"; // Add display name for better debugging

export const MainLayout = ({
  children,
  provinces,
  municipalitiesByProvince,
}: {
  children: React.ReactNode;
  provinces: string[];
  municipalitiesByProvince: Array<{
    province: string;
    municipalities: Array<{ slug: string; name: string }>;
  }>;
}) => {
  const { i18n } = useLingui();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();

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
    pathname.startsWith(`/${i18n.locale}/federal/spending`) ||
    pathname.startsWith(`/${i18n.locale}/federal/budget`) ||
    pathname.startsWith(`/${i18n.locale}/provincial/`) ||
    pathname.startsWith(`/${i18n.locale}/municipal/`) ||
    (firstSegment ? jurisdictionSlugsSet.has(firstSegment) : false);

  return (
    <>
      <RecruitmentBanner />
      <div className="sticky z-[100] border-b-gray-200 border-b-2 w-full border-solid px-4 sm:px-12 py-0">
        <div className="w-full max-w-6xl mx-auto">
          <div className="items-stretch auto-cols-fr justify-between flex min-h-16 gap-2 sm:gap-8 m-auto">
            <Link
              className="items-center float-left justify-center flex pl-0"
              href={`/${i18n.locale}`}
            >
              <Image
                className="cursor-pointer align-middle w-40 h-12 max-w-full hidden sm:block"
                alt="Canada Spends Logo"
                src={logoFull}
              />
              <Image
                className="cursor-pointer align-middle inline-block w-40 h-12 max-w-full sm:hidden min-w-[75px]"
                alt="Canada Spends Logo"
                src={logoGlyph}
              />
            </Link>
            {/* Desktop Navigation */}
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
                    className="bg-white rounded-md shadow-lg p-1 flex flex-col min-w-[150px] z-[200]"
                    sideOffset={4}
                  >
                    <DropdownMenu.Item asChild>
                      <Link
                        href={`/${i18n.locale}/federal/spending`}
                        className="px-3 py-2 text-sm hover:bg-gray-100 rounded cursor-pointer"
                      >
                        <Trans>Federal</Trans>
                      </Link>
                    </DropdownMenu.Item>

                    <DropdownMenu.Item asChild>
                      <Link
                        href={`/${i18n.locale}/federal/budget`}
                        className="px-3 py-2 text-sm hover:bg-gray-100 rounded cursor-pointer"
                      >
                        <Trans>Budget</Trans>
                      </Link>
                    </DropdownMenu.Item>

                    <DropdownMenu.Sub>
                      <DropdownMenu.SubTrigger className="px-3 py-2 text-sm hover:bg-gray-100 rounded cursor-pointer flex items-center justify-between data-[highlighted]:bg-gray-100">
                        <Trans>Provincial</Trans>
                        <ChevronRight className="w-4 h-4" />
                      </DropdownMenu.SubTrigger>
                      <DropdownMenu.Portal>
                        <DropdownMenu.SubContent
                          className="bg-white rounded-md shadow-lg p-1 flex flex-col min-w-[180px] z-[200]"
                          sideOffset={8}
                        >
                          {provinces.map((provinceSlug) => (
                            <DropdownMenu.Item key={provinceSlug} asChild>
                              <Link
                                href={`/${i18n.locale}/provincial/${provinceSlug}`}
                                className="px-3 py-2 text-sm hover:bg-gray-100 rounded cursor-pointer"
                              >
                                {provinceNames[provinceSlug]}
                              </Link>
                            </DropdownMenu.Item>
                          ))}
                        </DropdownMenu.SubContent>
                      </DropdownMenu.Portal>
                    </DropdownMenu.Sub>

                    <DropdownMenu.Sub>
                      <DropdownMenu.SubTrigger className="px-3 py-2 text-sm hover:bg-gray-100 rounded cursor-pointer flex items-center justify-between data-[state=open]:bg-transparent data-[highlighted]:bg-gray-100">
                        <Trans>Municipal</Trans>
                        <ChevronRight className="w-4 h-4" />
                      </DropdownMenu.SubTrigger>
                      <DropdownMenu.Portal>
                        <DropdownMenu.SubContent
                          className="bg-white rounded-md shadow-lg p-1 flex flex-col min-w-[200px] z-[200]"
                          sideOffset={8}
                        >
                          {municipalitiesByProvince.map(
                            ({ province, municipalities }) => (
                              <DropdownMenu.Sub key={province}>
                                <DropdownMenu.SubTrigger className="px-3 py-2 text-sm hover:bg-gray-100 rounded cursor-pointer flex items-center justify-between data-[highlighted]:bg-gray-100">
                                  {provinceNames[province] || province}
                                  <ChevronRight className="w-4 h-4" />
                                </DropdownMenu.SubTrigger>
                                <DropdownMenu.Portal>
                                  <DropdownMenu.SubContent
                                    className="bg-white rounded-md shadow-lg p-1 flex flex-col min-w-[200px] z-[200] max-h-[400px] overflow-y-auto"
                                    sideOffset={8}
                                  >
                                    {municipalities.map((municipality) => (
                                      <DropdownMenu.Item
                                        key={municipality.slug}
                                        asChild
                                      >
                                        <Link
                                          href={`/${i18n.locale}/municipal/${province}/${municipality.slug}`}
                                          className="px-3 py-2 text-sm hover:bg-gray-100 rounded cursor-pointer"
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
                    className="bg-white rounded-md shadow-lg p-1 flex flex-col min-w-[150px] z-[200]"
                    sideOffset={4}
                  >
                    <DropdownMenu.Item asChild>
                      <Link
                        href={`/${i18n.locale}/about`}
                        className="px-3 py-2 text-sm hover:bg-gray-100 rounded cursor-pointer"
                      >
                        <Trans>About Us</Trans>
                      </Link>
                    </DropdownMenu.Item>
                    <DropdownMenu.Item asChild>
                      <Link
                        href="https://buildcanada.com/get-involved"
                        className="px-3 py-2 text-sm hover:bg-gray-100 rounded cursor-pointer"
                        target="_blank"
                      >
                        <Trans>Get Involved</Trans>
                      </Link>
                    </DropdownMenu.Item>
                    <DropdownMenu.Item asChild>
                      <Link
                        href={`/${i18n.locale}/contact`}
                        className="px-3 py-2 text-sm hover:bg-gray-100 rounded cursor-pointer"
                      >
                        <Trans>Contact</Trans>
                      </Link>
                    </DropdownMenu.Item>
                  </DropdownMenu.Content>
                </DropdownMenu.Portal>
              </DropdownMenu.Root>
            </nav>
            {/* Mobile menu button */}
            <div className="flex md:hidden">
              <button
                type="button"
                className="p-2 text-gray-700"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                <span className="sr-only">
                  {isMenuOpen ? "Close menu" : "Open menu"}
                </span>
                {isMenuOpen ? (
                  <X className="h-6 w-6" aria-hidden="true" />
                ) : (
                  <Menu className="h-6 w-6" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
      <BuildCanadaBanner />
      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden border-t border-gray-200">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {/* Government Spending Submenu */}
            <p className="px-3 pt-3 text-base font-medium text-gray-500">
              <Trans>Government Spending</Trans>
            </p>
            <MobileNavLink
              href={`/${i18n.locale}/federal/spending`}
              active={pathname.startsWith(`/${i18n.locale}/federal/spending`)}
              onClick={() => setIsMenuOpen(false)}
            >
              <span className="pl-4 inline-block">
                <Trans>Federal</Trans>
              </span>
            </MobileNavLink>

            <MobileNavLink
              href={`/${i18n.locale}/federal/budget`}
              active={pathname.startsWith(`/${i18n.locale}/federal/budget`)}
              onClick={() => setIsMenuOpen(false)}
            >
              <span className="pl-4 inline-block">
                <Trans>Budget</Trans>
              </span>
            </MobileNavLink>

            {/* Provincial submenu */}
            <p className="px-3 pl-7 pt-2 text-sm font-medium text-gray-500">
              <Trans>Provincial</Trans>
            </p>
            {provinces.map((provinceSlug) => (
              <MobileNavLink
                key={provinceSlug}
                href={`/${i18n.locale}/provincial/${provinceSlug}`}
                active={pathname.startsWith(
                  `/${i18n.locale}/provincial/${provinceSlug}`,
                )}
                onClick={() => setIsMenuOpen(false)}
              >
                <span className="pl-8 inline-block">
                  {provinceNames[provinceSlug]}
                </span>
              </MobileNavLink>
            ))}

            {/* Municipal submenu */}
            <p className="px-3 pl-7 text-sm font-medium text-gray-500">
              <Trans>Municipal</Trans>
            </p>
            {municipalitiesByProvince.map(({ province, municipalities }) => (
              <div key={province}>
                <p className="px-3 pl-11 pt-2 text-xs font-medium text-gray-400">
                  {provinceNames[province] || province}
                </p>
                {municipalities.map((municipality) => (
                  <MobileNavLink
                    key={municipality.slug}
                    href={`/${i18n.locale}/municipal/${province}/${municipality.slug}`}
                    active={pathname.startsWith(
                      `/${i18n.locale}/municipal/${province}/${municipality.slug}`,
                    )}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <span className="pl-12 inline-block">
                      {municipality.name}
                    </span>
                  </MobileNavLink>
                ))}
              </div>
            ))}
            <MobileNavLink
              href={`/${i18n.locale}/tax-visualizer`}
              active={pathname === `/${i18n.locale}/tax-visualizer`}
              onClick={() => setIsMenuOpen(false)}
            >
              <Trans>Tax Calculator</Trans>
            </MobileNavLink>
            <MobileNavLink
              href={`/${i18n.locale}/search`}
              active={pathname === `/${i18n.locale}/search`}
              onClick={() => setIsMenuOpen(false)}
            >
              <Trans>Spending Database</Trans>
            </MobileNavLink>
            <MobileNavLink
              href={`/${i18n.locale}/about`}
              active={pathname === `/${i18n.locale}/about`}
              onClick={() => setIsMenuOpen(false)}
            >
              <Trans>About</Trans>
            </MobileNavLink>
            <MobileNavLink
              href={`/${i18n.locale}/contact`}
              active={pathname === `/${i18n.locale}/contact`}
              onClick={() => setIsMenuOpen(false)}
            >
              <Trans>Contact</Trans>
            </MobileNavLink>
          </div>
        </div>
      )}
      <div>
        <div className="min-h-full items-center flex-col justify-between overflow-clip">
          <div className="w-full max-w-[120.00rem] m-auto">
            <main>{children}</main>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

interface NavLinkProps {
  href: string;
  children: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
}

// Memoize MobileNavLink
const MobileNavLink = memo(
  ({ href, children, active = false, onClick }: NavLinkProps) => {
    return (
      <Link
        href={href}
        className={`block px-3 py-2 text-base font-medium ${active ? "text-black" : "text-gray-600 hover:text-black"}`}
        onClick={onClick}
      >
        {children}
      </Link>
    );
  },
);
MobileNavLink.displayName = "MobileNavLink"; // Add display name
