import { type SetStateAction, type Dispatch } from "react";
import { X, Menu } from "lucide-react";
import { Trans, useLingui } from "@lingui/react/macro";
import { memo } from "react";
import Link from "next/link";
import { provinceNames } from "@/lib/provinceNames";

interface MobileMenuButtonProps {
  isMenuOpen: boolean;
  setIsMenuOpen: Dispatch<SetStateAction<boolean>>;
}
export function MobileMenuButton(props: MobileMenuButtonProps) {
  const { isMenuOpen, setIsMenuOpen } = props;
  return (
    <div className="flex min-[900px]:hidden items-center gap-2">
      <a
        href="https://buildcanada.com/get-involved?utm_source=canadaspends&utm_medium=header_mobile&utm_campaign=transparency"
        target="_blank"
        rel="noopener noreferrer"
        className="bg-primary text-primary-foreground px-3 py-1.5 rounded-md text-sm font-semibold hover:bg-primary/90 transition-colors whitespace-nowrap"
      >
        <Trans>Join Build Canada</Trans>
      </a>
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
  );
}

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

interface MobileMenuProps {
  pathname: string;
  setIsMenuOpen: Dispatch<SetStateAction<boolean>>;
  provinces: string[];
  municipalitiesByProvince: Array<{
    province: string;
    municipalities: Array<{ slug: string; name: string }>;
  }>;
}
export function MobileMenu(props: MobileMenuProps) {
  const { i18n } = useLingui();
  const { pathname, setIsMenuOpen, provinces, municipalitiesByProvince } =
    props;
  return (
    <div className="min-[900px]:hidden border-t border-border">
      <div className="px-2 pt-2 pb-3 space-y-1">
        {/* Government Spending Submenu */}
        <p className="px-3 pt-3 text-base font-medium text-muted-foreground">
          <Trans>Spending</Trans>
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
        <p className="px-3 pl-7 pt-2 text-sm font-medium text-muted-foreground">
          <Trans>Provincial</Trans>
        </p>
        {provinces.map((provinceSlug) => (
          <MobileNavLink
            key={provinceSlug}
            href={`/${i18n.locale}/${provinceSlug}`}
            active={pathname.startsWith(`/${i18n.locale}/${provinceSlug}`)}
            onClick={() => setIsMenuOpen(false)}
          >
            <span className="pl-8 inline-block">
              {provinceNames[provinceSlug]}
            </span>
          </MobileNavLink>
        ))}

        {/* Municipal submenu */}
        <p className="px-3 pl-7 text-sm font-medium text-muted-foreground">
          <Trans>Municipal</Trans>
        </p>
        {municipalitiesByProvince.map(({ province, municipalities }) => (
          <div key={province}>
            <p className="px-3 pl-11 pt-2 text-xs font-medium text-muted-foreground">
              {provinceNames[province] || province}
            </p>
            {municipalities.map((municipality) => (
              <MobileNavLink
                key={municipality.slug}
                href={`/${i18n.locale}/${municipality.slug}`}
                active={pathname.startsWith(
                  `/${i18n.locale}/${municipality.slug}`,
                )}
                onClick={() => setIsMenuOpen(false)}
              >
                <span className="pl-12 inline-block">{municipality.name}</span>
              </MobileNavLink>
            ))}
          </div>
        ))}

        <p className="px-3 pt-3 text-base font-medium text-muted-foreground">
          <Trans>First Nations</Trans>
        </p>
        <MobileNavLink
          href={`/${i18n.locale}/first-nations`}
          active={pathname === `/${i18n.locale}/first-nations`}
          onClick={() => setIsMenuOpen(false)}
        >
          <span className="pl-4 inline-block">
            <Trans>Overview</Trans>
          </span>
        </MobileNavLink>
        <MobileNavLink
          href={`/${i18n.locale}/first-nations/remuneration`}
          active={pathname.startsWith(
            `/${i18n.locale}/first-nations/remuneration`,
          )}
          onClick={() => setIsMenuOpen(false)}
        >
          <span className="pl-4 inline-block">
            <Trans>Remuneration</Trans>
          </span>
        </MobileNavLink>
        <MobileNavLink
          href={`/${i18n.locale}/tax-visualizer`}
          active={pathname === `/${i18n.locale}/tax-visualizer`}
          onClick={() => setIsMenuOpen(false)}
        >
          <Trans>Taxes</Trans>
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
        <MobileNavLink
          href={`/${i18n.locale}/whistleblowers`}
          active={pathname === `/${i18n.locale}/whistleblowers`}
          onClick={() => setIsMenuOpen(false)}
        >
          <Trans>Whistleblowers</Trans>
        </MobileNavLink>
        <a
          href="https://buildcanada.com/get-involved?utm_source=canadaspends&utm_medium=header_mobile_menu&utm_campaign=transparency"
          target="_blank"
          rel="noopener noreferrer"
          className="block mx-3 mt-4 bg-primary text-primary-foreground px-4 py-2 rounded-md text-base font-semibold text-center hover:bg-primary/90 transition-colors"
          onClick={() => setIsMenuOpen(false)}
        >
          <Trans>Join Build Canada</Trans>
        </a>
      </div>
    </div>
  );
}
