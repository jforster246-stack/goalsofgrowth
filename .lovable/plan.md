# Swipeable goal card deck

## Build
- Add `GoalCardDeck.tsx` with a Framer Motion horizontal swipe deck, stacked-card depth, page indicators, and an accessible previous/next fallback.
- Give each card an earthy goal accent, title, live percentage progress, next-step summary, direct Focus action, and animated completion control.
- Include a bottom view toggle between the default deck and the existing all-goals grid.
- Update the goals page to render the new deck by default while preserving goal creation and card-to-detail navigation.
- Extend Focus mode so a card can open its specific next step directly in the timer.

## Technical details
- Install `framer-motion` and use semantic app color tokens rather than hardcoded page colors.
- Keep completion optimistic so progress updates immediately, then synchronize and refresh stored goal data.
- Preserve reduced-motion behavior, touch targets, keyboard access, and mobile sizing.
- Verify the deck, swipe/toggle controls, completion animation, direct Focus flow, mobile layout, and current build status.
