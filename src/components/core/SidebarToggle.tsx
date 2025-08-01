import React, { useState, useEffect } from "react";
import { Github, Menu, X, ExternalLink, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "./ModeToggle";
import { LangToggle } from "./LangToggle";
import { useTranslations } from "@/i18n/utils";
import { getRelativeLocaleUrl } from "astro:i18n";

interface SidebarToggleProps {
  navigation: {
    label: string;
    href: string;
  }[];
  externalLinks?: {
    label: string;
    href: string;
  }[];
  github: string;
  currentPath: string;
  lang: any;
}

const SidebarToggle: React.FC<SidebarToggleProps> = ({
  navigation,
  externalLinks = [],
  github,
  currentPath,
  lang,
}) => {
  const t = useTranslations(lang);

  const [isOpen, setIsOpen] = useState(false);

  const openSidebar = () => {
    setIsOpen(true);
    document.body.style.overflow = "hidden";
  };

  const closeSidebar = () => {
    setIsOpen(false);
    document.body.style.overflow = "auto";
  };

  // Close sidebar on escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        closeSidebar();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  // Cleanup overflow on unmount
  useEffect(() => {
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  return (
    <>
      {/* Mobile Menu Button */}
      <div className="lg:hidden">
        <Button
          variant="ghost"
          size="icon"
          onClick={openSidebar}
          aria-label="Open menu"
        >
          <Menu className="h-6 w-6" />
        </Button>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Mobile Sidebar */}
      <div
        className={`fixed top-0 right-0 h-full w-64 max-w-[80vw] bg-background border-l z-50 transform transition-transform duration-300 ease-in-out lg:hidden ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <a
              href={getRelativeLocaleUrl(lang, "/", {
                normalizeLocale: false,
              })}
              className="text-lg font-semibold hover:text-primary transition-colors flex items-center gap-3"
              onClick={closeSidebar}
            >
              <Home className="h-5 w-5" />
              {t("nav.index")}
            </a>
            <Button
              variant="ghost"
              size="icon"
              onClick={closeSidebar}
              aria-label="Close menu"
              className="h-10 w-10"
            >
              <X className="h-6 w-6" />
            </Button>
          </div>

          {/* Sidebar Content */}
          <div className="flex-1 overflow-y-auto">
            {/* Internal Navigation Links */}
            <nav className="p-4 space-y-1">
              <div className="text-sm font-medium text-muted-foreground mb-3 px-3">
                {t("navigation")}
              </div>
              {navigation.map((item) => (
                <a
                  key={item.href}
                  href={getRelativeLocaleUrl(lang, item.href, {
                    normalizeLocale: false,
                  })}
                  className="block text-base py-3 px-3 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
                  onClick={closeSidebar}
                >
                  {t(item.label)}
                </a>
              ))}
            </nav>

            {/* External Links */}
            {externalLinks.length > 0 && (
              <nav className="px-4 pb-4 space-y-1 border-t">
                <div className="text-sm font-medium text-muted-foreground mb-3 mt-4 px-3">
                  {t("external_links")}
                </div>
                {externalLinks.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-base py-3 px-3 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors flex items-center gap-2"
                    onClick={closeSidebar}
                  >
                    {t(link.label)}
                    <ExternalLink className="h-4 w-4 flex-shrink-0" />
                  </a>
                ))}
              </nav>
            )}

            {/* Sidebar Controls */}
            <div className="border-t p-4">
              <div className="flex items-center justify-center space-x-3">
                <ModeToggle />
                <LangToggle currentPath={currentPath} />
                <a
                  href={github}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ textDecoration: "none" }}
                >
                  <Button variant="ghost" size="icon" className="h-10 w-10">
                    <Github className="h-5 w-5" />
                  </Button>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default SidebarToggle;
