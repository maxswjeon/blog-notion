import { useEffect } from "react";

export function useShortcuts() {
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.key === "k") {
        event.preventDefault();
        event.stopPropagation();

        document.getElementById("default-search")?.focus();
      }
    };

    document.addEventListener("keydown", handler);
    return () => {
      document.removeEventListener("keydown", handler);
    };
  }, []);
}
