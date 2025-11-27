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

// NOTE: please keep these lists in alphabetical order
const provinces = [
  { slug: "alberta", name: "Alberta" },
  { slug: "british-columbia", name: "British Columbia" },
  { slug: "ontario", name: "Ontario" },
];

const municipalities = [
  { slug: "montreal", name: "Montreal" },
  { slug: "toronto", name: "Toronto" },
  { slug: "vancouver", name: "Vancouver" },
];

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

export const MainLayout = ({ children }: { children: React.ReactNode }) => {
  const { i18n } = useLingui();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();
  const spendingActive =
    pathname.startsWith(`/${i18n.locale}/spending`) ||
    pathname.startsWith(`/${i18n.locale}/budget`) ||
    pathname.startsWith("/ontario") ||
    pathname.startsWith("/alberta") ||
    pathname.startsWith("/british-columbia") ||
    pathname.startsWith("/toronto") ||
    pathname.startsWith("/vancouver");

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
                        href={`/${i18n.locale}/spending`}
                        className="px-3 py-2 text-sm hover:bg-gray-100 rounded cursor-pointer"
                      >
                        <Trans>Federal</Trans>
                      </Link>
                    </DropdownMenu.Item>

                    <DropdownMenu.Item asChild>
                      <Link
                        href={`/${i18n.locale}/budget`}
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
                          {provinces.map((province) => (
                            <DropdownMenu.Item key={province.slug} asChild>
                              <Link
                                href={`/${province.slug}`}
                                className="px-3 py-2 text-sm hover:bg-gray-100 rounded cursor-pointer"
                              >
                                {province.name}
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
                          className="bg-white rounded-md shadow-lg p-1 flex flex-col min-w-[180px] z-[200]"
                          sideOffset={8}
                        >
                          {municipalities.map((municipality) => (
                            <DropdownMenu.Item key={municipality.slug} asChild>
                              <Link
                                href={`/${municipality.slug}`}
                                className="px-3 py-2 text-sm hover:bg-gray-100 rounded cursor-pointer"
                              >
                                {municipality.name}
                              </Link>
                            </DropdownMenu.Item>
                          ))}
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
              href={`/${i18n.locale}/spending`}
              active={pathname.startsWith(`/${i18n.locale}/spending`)}
              onClick={() => setIsMenuOpen(false)}
            >
              <span className="pl-4 inline-block">
                <Trans>Federal</Trans>
              </span>
            </MobileNavLink>

            <MobileNavLink
              href={`/${i18n.locale}/budget`}
              active={pathname.startsWith(`/${i18n.locale}/budget`)}
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
            {provinces.map((province) => (
              <MobileNavLink
                key={province.slug}
                href={`/${province.slug}`}
                active={pathname.startsWith(`/${province.slug}`)}
                onClick={() => setIsMenuOpen(false)}
              >
                <span className="pl-8 inline-block">{province.name}</span>
              </MobileNavLink>
            ))}

            {/* Municipal submenu */}
            <p className="px-3 pl-7 text-sm font-medium text-gray-500">
              <Trans>Municipal</Trans>
            </p>
            {municipalities.map((municipality) => (
              <MobileNavLink
                key={municipality.slug}
                href={`/${municipality.slug}`}
                active={pathname.startsWith(`/${municipality.slug}`)}
                onClick={() => setIsMenuOpen(false)}
              >
                <span className="pl-8 inline-block">{municipality.name}</span>
              </MobileNavLink>
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
