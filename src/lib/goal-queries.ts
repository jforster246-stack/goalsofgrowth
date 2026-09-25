import { queryOptions } from "@tanstack/react-query";
import { getGoal, getProfile, listGoals } from "@/lib/goals.functions";
import {
  getHabitHistory,
  getHabitStampBonus,
  listHabits,
  listHabitStreaks,
} from "@/lib/habits.functions";
import { listWins } from "@/lib/wins.functions";
import { listBrainDump } from "@/lib/braindump.functions";
import { listChecklists } from "@/lib/checklists.functions";
import { listStamps } from "@/lib/stamps.functions";
import {
  getShowcase,
  getStampBalance,
  listPurchases,
} from "@/lib/artworks.functions";

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

export const habitHistoryQueryOptions = (habitId: string) =>
  queryOptions({
    queryKey: ["habit-history", habitId],
    queryFn: () => getHabitHistory({ data: { habitId } }),
  });

export const winsQueryOptions = queryOptions({
  queryKey: ["wins"],
  queryFn: () => listWins(),
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

// Legacy habit "crystals" (2 per completion), now counted toward the stamp balance.
export const habitStampBonusQueryOptions = queryOptions({
  queryKey: ["habit-stamp-bonus"],
  queryFn: () => getHabitStampBonus(),
});

export const stampBalanceQueryOptions = queryOptions({
  queryKey: ["stamp-balance"],
  queryFn: () => getStampBalance(),
});

export const purchasesQueryOptions = queryOptions({
  queryKey: ["artwork-purchases"],
  queryFn: () => listPurchases(),
});

export const showcaseQueryOptions = queryOptions({
  queryKey: ["gallery-showcase"],
  queryFn: () => getShowcase(),
});
