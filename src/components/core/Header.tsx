import React from "react";
import { ModeToggle } from "./ModeToggle";
import { LangToggle } from "./LangToggle";
import SidebarToggle from "./SidebarToggle";
import { useTranslations, getRelativeUrl } from "@/i18n/utils";

interface HeaderProps {
  navigation: {
    label: string;
    href: string;
  }[];
  currentPath: string;
  lang: any;
}

const Header: React.FC<HeaderProps> = ({
  navigation,
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
              href={getRelativeUrl(lang, "")}
              className="text-xl font-bold flex items-center gap-3"
            >
              {t("nav.index")}
            </a>

            <nav className="hidden lg:flex items-center space-x-8">
              {navigation.map((item) => (
                <a
                  key={item.href}
                  href={getRelativeUrl(lang, item.href)}
                  className="text-base hover:text-primary transition-colors"
                >
                  {t(item.label)}
                </a>
              ))}
            </nav>
          </div>

          {/* Right side: Controls */}
          <div className="hidden lg:flex items-center space-x-3">
            <LangToggle currentPath={currentPath} />
            <ModeToggle />
          </div>

          <SidebarToggle
            navigation={navigation}
            currentPath={currentPath}
            lang={lang}
          />
        </div>
      </div>
    </header>
  );
};

export default Header;
