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
    name: string;
    links: {
      ruyisdk: string;
      github: string;
    };
  };
  navigation: {
    label: string;
    href: string;
  }[];
  currentPath: string;
  lang: any;
}

const Header: React.FC<HeaderProps> = ({
  siteConfig,
  navigation,
  currentPath,
  lang,
}) => {
  const t = useTranslations(lang);

  // Helper function to check if URL is absolute
  const isAbsoluteUrl = (url: string) => {
    return /^https?:\/\//.test(url);
  };

  return (
    <header className="border-b py-4 relative">
      <div className="container mx-auto lg:max-w-5xl">
        <div className="flex justify-between items-center">
          <a href="/" className="text-xl font-bold flex items-center gap-2">
            <img src="/favicon.svg" alt="Logo" className="h-8 w-8" />
            {siteConfig.name}
          </a>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-6">
            {navigation.map((item) => {
              const isExternal = isAbsoluteUrl(item.href);
              const href = isExternal 
                ? item.href 
                : getRelativeLocaleUrl(lang, item.href, {
                    normalizeLocale: false,
                  });
              
              return (
                <a
                  key={item.href}
                  href={href}
                  className="text-xl hover:text-primary transition-colors flex items-center gap-1"
                  {...(isExternal && { 
                    target: "_blank", 
                    rel: "noopener noreferrer" 
                  })}
                >
                  {t(item.label)}
                  {isExternal && <ExternalLink className="h-4 w-4" />}
                </a>
              );
            })}
          </nav>

          {/* Desktop Controls */}
          <div className="hidden lg:flex items-center space-x-2">
            <a
              href={siteConfig.links.github}
              target="_blank"
              rel="noopener noreferrer"
              style={{ textDecoration: "none" }}
            >
              <Button variant="ghost" size="icon">
                <Github className="h-5 w-5" />
              </Button>
            </a>

            <LangToggle currentPath={currentPath} />
            <ModeToggle />
          </div>

          {/* Mobile Sidebar Toggle */}
          <SidebarToggle
            navigation={navigation}
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
