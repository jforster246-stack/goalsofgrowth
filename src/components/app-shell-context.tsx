import { createContext, useContext } from "react";

export type CustomFocus = {
  title: string;
  subtitle?: string;
  onComplete?: () => void;
};

export const AppShellContext = createContext<{
  openFocus: (stepId?: string) => void;
  openTimer: (target: CustomFocus) => void;
  celebrate: () => void;
} | null>(null);

export function useAppShell() {
  const context = useContext(AppShellContext);
  if (!context) throw new Error("useAppShell must be used inside AppShell");
  return context;
}
