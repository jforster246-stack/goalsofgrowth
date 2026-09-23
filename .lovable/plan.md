# "Goal complete?" prompt when all steps are ticked

## What you'll see

When you tick the **last remaining step** of a goal (from the swipeable card deck, the grid view, or the goal detail page), a gentle prompt appears:

> **"Every step is done — have you completed this goal?"**
> `[ Yes, I did it! ]` `[ Not yet ]`

- **Yes** → the goal's title is added to your **Wins** page as an achievement, with a small celebration. The win saves to your account and appears on the Wins page and counts toward your completed goals on the Overview.
- **Not yet** → you're taken straight to that goal's detail page with the "Add a step…" box ready for you to type the next step.

The prompt only appears at the moment a goal flips from "some steps left" to "all steps done" — not every time you view a finished goal, and not for goals with no steps.

## Technical details

- New shared component `src/components/goal-complete-prompt.tsx`: a centered modal (framer-motion, app styling — cream card, plum heading, lilac/plum buttons) with the two actions.
- A small helper hook `useGoalCompletion()` tracks each goal's `complete` state; when it transitions false → true after a tick, it opens the prompt for that goal.
- Wired into:
  - `src/components/GoalCardDeck.tsx` (deck + grid completion buttons)
  - `src/routes/_authenticated/goals.$goalId.tsx` (step toggles on the detail page)
- **Yes** calls the existing `createWin` server fn (`kind: "achievement"`, title = goal title) and invalidates the `wins`/`goals` queries.
- **Not yet** navigates to `/goals/$goalId` and auto-focuses the add-step input.
- No database changes needed — the `wins` table already exists.

## Verification

- Build passes; Playwright mobile check: tick all steps of a test goal → prompt appears → "Yes" creates a win visible on the Wins page → repeat with "Not yet" lands on the detail page with add-step focused.
