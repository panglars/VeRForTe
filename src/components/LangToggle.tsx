import * as React from "react";
import { Languages } from "lucide-react";
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
  const [mounted, setMounted] = React.useState(false);
  const [theme] = useAtom(themeAtom);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" aria-label="Switch language">
        <Languages className="h-5 w-5" />
      </Button>
    );
  }

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
        <DropdownMenuItem onClick={() => switchToLanguage("en")}>
          English
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => switchToLanguage("zh-CN")}>
          中文
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LangToggle;
