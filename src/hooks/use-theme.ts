import { useEffect } from "react";
import { useApp } from "@/store/app";

export function useTheme() {
  const theme = useApp((s) => s.settings.theme);
  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
    root.style.colorScheme = theme;
  }, [theme]);
  return theme;
}
