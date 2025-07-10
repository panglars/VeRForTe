import React from "react";
import { Github } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "./ModeToggle";
import { LangToggle } from "./LangToggle";
import SidebarToggle from "./SidebarToggle";
import { useTranslations, getLangFromUrl } from "@/i18n/utils";

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

  return (
    <header className="border-b py-4 relative">
      <div className="container mx-auto lg:max-w-5xl">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <a
            href={siteConfig.links.ruyisdk}
            className="text-xl font-bold flex items-center gap-2"
          >
            <img src="/favicon.svg" alt="Logo" className="h-8 w-8" />
            {siteConfig.name}
          </a>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-6">
            {navigation.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="text-xl hover:text-primary transition-colors"
              >
                {t(item.label)}
              </a>
            ))}
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
