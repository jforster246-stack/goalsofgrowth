import { queryOptions } from "@tanstack/react-query";
import { getGoal, getProfile, listGoals } from "@/lib/goals.functions";
import { getCrystals, listHabits, listHabitStreaks } from "@/lib/habits.functions";
import { listWins } from "@/lib/wins.functions";
import { listBrainDump } from "@/lib/braindump.functions";
import { listChecklists } from "@/lib/checklists.functions";
import { listStamps } from "@/lib/stamps.functions";

export const goalsQueryOptions = queryOptions({
  queryKey: ["goals"],
  queryFn: () => listGoals(),
});

export const profileQueryOptions = queryOptions({
  queryKey: ["profile"],
  queryFn: () => getProfile(),
});

export const goalQueryOptions = (id: string) =>
  queryOptions({
    queryKey: ["goal", id],
    queryFn: () => getGoal({ data: { id } }),
  });

export const habitsQueryOptions = (today: string) =>
  queryOptions({
    queryKey: ["habits", today],
    queryFn: () => listHabits({ data: { today } }),
  });

export const habitStreaksQueryOptions = (today: string) =>
  queryOptions({
    queryKey: ["habit-streaks", today],
    queryFn: () => listHabitStreaks({ data: { today } }),
  });

export const winsQueryOptions = queryOptions({
  queryKey: ["wins"],
  queryFn: () => listWins(),
});

export const crystalsQueryOptions = queryOptions({
  queryKey: ["crystals"],
  queryFn: () => getCrystals(),
});

export const brainDumpQueryOptions = queryOptions({
  queryKey: ["brain-dump"],
  queryFn: () => listBrainDump(),
});

export const checklistsQueryOptions = queryOptions({
  queryKey: ["checklists"],
  queryFn: () => listChecklists(),
});

export const stampsQueryOptions = queryOptions({
  queryKey: ["stamps"],
  queryFn: () => listStamps(),
});
