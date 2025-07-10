import React from "react";
import { Github, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "./ModeToggle";
import { LangToggle } from "./LangToggle";
import SidebarToggle from "./SidebarToggle";
import { useTranslations, getLangFromUrl } from "@/i18n/utils";
import { getRelativeLocaleUrl } from "astro:i18n";

interface HeaderProps {
  siteConfig: {
    links: {
      ruyisdk: string;
      github: string;
    };
  };
  navigation: {
    label: string;
    href: string;
  }[];
  externalLinks?: {
    label: string;
    href: string;
  }[];
  currentPath: string;
  lang: any;
}

const Header: React.FC<HeaderProps> = ({
  siteConfig,
  navigation,
  externalLinks = [],
  currentPath,
  lang,
}) => {
  const t = useTranslations(lang);

  return (
    <header className="border-b py-4 relative">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center">
          {/* Left side: Logo and Internal Navigation */}
          <div className="flex items-center space-x-8">
            <a
              href={getRelativeLocaleUrl(lang, "", {
                normalizeLocale: false,
              })}
              className="text-xl font-bold flex items-center gap-3"
            >
              <img src="/favicon.svg" alt="Logo" className="h-8 w-8" />
              {t("nav.index")}
            </a>

            <nav className="hidden lg:flex items-center space-x-8">
              {navigation.map((item) => (
                <a
                  key={item.href}
                  href={getRelativeLocaleUrl(lang, item.href, {
                    normalizeLocale: false,
                  })}
                  className="text-base hover:text-primary transition-colors"
                >
                  {t(item.label)}
                </a>
              ))}
            </nav>
          </div>

          {/* Right side: External Links and Controls */}
          <div className="hidden lg:flex items-center space-x-3">
            {externalLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-base hover:text-primary transition-colors flex items-center gap-1.5 px-2"
              >
                {t(link.label)}
                <ExternalLink className="h-4 w-4" />
              </a>
            ))}

            {/* Separator */}
            {externalLinks.length > 0 && (
              <div className="h-5 w-px bg-border" />
            )}

            <a
              href={siteConfig.links.github}
              target="_blank"
              rel="noopener noreferrer"
              style={{ textDecoration: "none" }}
            >
              <Button variant="ghost" size="icon" className="h-10 w-10">
                <Github className="h-5 w-5" />
              </Button>
            </a>

            <LangToggle currentPath={currentPath} />
            <ModeToggle />
          </div>

          <SidebarToggle
            navigation={navigation}
            externalLinks={externalLinks}
            github={siteConfig.links.github}
            currentPath={currentPath}
            lang={lang}
          />
        </div>
      </div>
    </header>
  );
};

export default Header;
