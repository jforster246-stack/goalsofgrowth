import { Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Settings } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { localToday } from "@/components/goal-ui";
import { FocusMode } from "@/components/focus-mode";
import { goalsQueryOptions, profileQueryOptions } from "@/lib/goal-queries";
import {
  toggleStep,
  touchStreak,
  updateDisplayName,
} from "@/lib/goals.functions";

const AppShellContext = createContext<{ openFocus: (stepId?: string) => void } | null>(null);

export function useAppShell() {
  const context = useContext(AppShellContext);
  if (!context) throw new Error("useAppShell must be used inside AppShell");
  return context;
}

export function AppShell({
  right,
  backTo,
  title,
  children,
}: {
  right?: ReactNode;
  backTo?: "/overview" | "/goals";
  title?: string;
  children: ReactNode;
}) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { data: profile } = useQuery(profileQueryOptions);
  const { data: goals } = useQuery(goalsQueryOptions);

  const [profileOpen, setProfileOpen] = useState(false);
  const [focusOpen, setFocusOpen] = useState(false);
  const [focusStepId, setFocusStepId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth
      .getUser()
      .then(({ data }) => setEmail(data.user?.email ?? null))
      .catch(() => {});
  }, []);

  const touched = useRef(false);
  useEffect(() => {
    if (touched.current) return;
    touched.current = true;
    touchStreak({ data: { today: localToday() } })
      .then(() => queryClient.invalidateQueries({ queryKey: ["profile"] }))
      .catch(() => {});
  }, [queryClient]);

  const nameMutation = useMutation({
    mutationFn: (input: { displayName: string }) =>
      updateDisplayName({ data: input }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["profile"] }),
  });

  const toggleStepMutation = useMutation({
    mutationFn: (input: { id: string; done: boolean }) =>
      toggleStep({ data: input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      queryClient.invalidateQueries({ queryKey: ["goal"] });
    },
  });

  const saveName = () => {
    const next = nameDraft.trim();
    if (next && next !== profile?.display_name)
      nameMutation.mutate({ displayName: next });
    setEditingName(false);
  };

  const handleSignOut = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  return (
    <div className="relative min-h-dvh bg-background font-body text-foreground antialiased">
      <div className="relative z-[1] mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 pb-28 pt-6">
        <header className="flex items-center justify-between gap-2">
          {backTo ? (
            <Link
              to={backTo}
              aria-label="Back"
              className="grid size-10 shrink-0 place-items-center rounded-full bg-focus text-white shadow-md
