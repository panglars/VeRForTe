import React, { useState, useEffect } from "react";
import { Github, Menu, X, ExternalLink } from "lucide-react";
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
  github: string;
  currentPath: string;
  lang: any;
}

const SidebarToggle: React.FC<SidebarToggleProps> = ({
  navigation,
  github,
  currentPath,
  lang,
}) => {
  const t = useTranslations(lang);

  const [isOpen, setIsOpen] = useState(false);

  // Helper function to check if URL is absolute
  const isAbsoluteUrl = (url: string) => {
    return /^https?:\/\//.test(url);
  };

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
          <div className="flex items-center justify-between p-3 border-b">
            <span className="text-lg font-semibold">Menu</span>
            <Button
              variant="ghost"
              size="icon"
              onClick={closeSidebar}
              aria-label="Close menu"
            >
              <X className="h-6 w-6" />
            </Button>
          </div>

          {/* Sidebar Content */}
          <div className="flex-1 overflow-y-auto">
            {/* Navigation Links */}
            <nav className="p-3 space-y-3">
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
                    className="block text-base py-2 px-3 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors flex items-center gap-1"
                    onClick={closeSidebar}
                    {...(isExternal && { 
                      target: "_blank", 
                      rel: "noopener noreferrer" 
                    })}
                  >
                    {t(item.label)}
                    {isExternal && <ExternalLink className="h-4 w-4 flex-shrink-0" />}
                  </a>
                );
              })}
            </nav>

            {/* Sidebar Controls */}
            <div className="border-t p-3">
              <div className="flex items-center justify-center space-x-2">
                <ModeToggle />
                <LangToggle currentPath={currentPath} />
                <a
                  href={github}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ textDecoration: "none" }}
                >
                  <Button variant="ghost" size="icon">
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
