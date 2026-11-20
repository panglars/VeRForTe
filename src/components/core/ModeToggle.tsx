import * as React from "react";
import { Check, Moon, Sun } from "lucide-react";
import { useAtom, useSetAtom } from "jotai";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { themeAtom, setThemeAtom } from "@/lib/atom";
import { useTranslations, type LocaleCode } from "@/i18n/utils";

interface ModeToggleProps {
  lang?: LocaleCode;
}

export function ModeToggle({ lang = "en" }: ModeToggleProps) {
  const [theme] = useAtom(themeAtom);
  const setTheme = useSetAtom(setThemeAtom);
  const t = useTranslations(lang);

  // Apply hydrated theme and react to OS color-scheme changes in system mode.
  React.useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const syncDarkClass = () => {
      const isDark =
        theme === "dark" || (theme === "system" && mediaQuery.matches);
      document.documentElement.classList.toggle("dark", isDark);
    };

    syncDarkClass();

    if (theme === "system") {
      mediaQuery.addEventListener("change", syncDarkClass);
      return () => mediaQuery.removeEventListener("change", syncDarkClass);
    }
  }, [theme]);

  const options = [
    { value: "theme-light" as const, label: t("theme.light") },
    { value: "dark" as const, label: t("theme.dark") },
    { value: "system" as const, label: t("theme.system") },
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {options.map((option) => (
          <DropdownMenuItem
            key={option.value}
            onClick={() => setTheme(option.value)}
            className="flex items-center justify-between gap-3 cursor-pointer"
          >
            <span>{option.label}</span>
            {theme === option.value && (
              <Check className="h-4 w-4 text-primary" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
