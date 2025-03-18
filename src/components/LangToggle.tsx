import * as React from "react";
import { Languages } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LangToggleProps {
  currentPath: string;
}

export const LangToggle: React.FC<LangToggleProps> = ({ currentPath }) => {
  const [mounted, setMounted] = React.useState(false);

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

  const isZhCN = currentPath.startsWith("/zh_CN/") || currentPath === "/zh_CN";

  const toggleLanguage = () => {
    if (isZhCN) {
      // zh_CN to en
      const newPath = currentPath.replace(/^\/zh_CN/, "");
      window.location.href = newPath || "/";
    } else {
      // en to zh_CN
      window.location.href = `/zh_CN${currentPath}`;
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleLanguage}
      aria-label={`${isZhCN ? "Switch to English" : "切换到中文"}`}
      title={`${isZhCN ? "Switch to English" : "切换到中文"}`}
    >
      <Languages className="h-5 w-5" />
      <span className="sr-only">{isZhCN ? "English" : "中文"}</span>
    </Button>
  );
};

export default LangToggle;
