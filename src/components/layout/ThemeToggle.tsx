"use client";

import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ThemeToggle() {
  const toggle = () => {
    const isDark = document.documentElement.classList.toggle("dark");
    try {
      localStorage.setItem("theme", isDark ? "dark" : "light");
    } catch {}
  };

  // Both icons render; CSS picks the right one so there is no hydration mismatch.
  return (
    <Button variant="ghost" size="icon" onClick={toggle} aria-label="Toggle dark mode">
      <Sun className="hidden h-5 w-5 dark:block" />
      <Moon className="h-5 w-5 dark:hidden" />
    </Button>
  );
}
