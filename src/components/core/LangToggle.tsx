import * as React from "react";
import { Check, Languages } from "lucide-react";
import { useAtom } from "jotai";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { themeAtom } from "@/lib/atom";

interface LangToggleProps {
  currentPath: string;
}

export const LangToggle: React.FC<LangToggleProps> = ({ currentPath }) => {
  const [theme] = useAtom(themeAtom);

  const isZhCN = currentPath.startsWith("/zh-CN/") || currentPath === "/zh-CN";

  const switchToLanguage = (lang: "en" | "zh-CN") => {
    // Preserve theme state in URL hash
    const themeParam = `#theme=${theme}`;

    if (lang === "en" && isZhCN) {
      // zh_CN to en
      const newPath = currentPath.replace(/^\/zh-CN/, "");
      window.location.href = (newPath || "/") + themeParam;
    } else if (lang === "zh-CN" && !isZhCN) {
      // en to zh_CN
      window.location.href = `/zh-CN${currentPath}${themeParam}`;
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <Languages className="h-5 w-5" />
          <span className="sr-only">Switch language</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => switchToLanguage("en")}
          className="flex items-center justify-between gap-3 cursor-pointer"
        >
          <span>English</span>
          {!isZhCN && <Check className="h-4 w-4 text-primary" />}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => switchToLanguage("zh-CN")}
          className="flex items-center justify-between gap-3 cursor-pointer"
        >
          <span>中文</span>
          {isZhCN && <Check className="h-4 w-4 text-primary" />}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LangToggle;
