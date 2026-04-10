import React, { useState, useEffect } from "react";
import { Menu, X, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "./ModeToggle";
import { LangToggle } from "./LangToggle";
import { useTranslations, getRelativeUrl } from "@/i18n/utils";

interface SidebarToggleProps {
  navigation: {
    label: string;
    href: string;
  }[];
  currentPath: string;
  lang: any;
}

const SidebarToggle: React.FC<SidebarToggleProps> = ({
  navigation,
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
              href={getRelativeUrl(lang, "/")}
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
              {navigation.map((item) => (
                <a
                  key={item.href}
                  href={getRelativeUrl(lang, item.href)}
                  className="block text-base py-3 px-3 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
                  onClick={closeSidebar}
                >
                  {t(item.label)}
                </a>
              ))}
            </nav>

            {/* Sidebar Controls */}
            <div className="border-t p-4">
              <div className="flex items-center justify-center space-x-3">
                <ModeToggle />
                <LangToggle currentPath={currentPath} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default SidebarToggle;
