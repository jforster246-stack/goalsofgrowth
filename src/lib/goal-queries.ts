import { queryOptions } from "@tanstack/react-query";
import { getGoal, getProfile, listGoals } from "@/lib/goals.functions";

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
