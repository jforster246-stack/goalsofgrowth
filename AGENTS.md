<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Goal-stamp awards use a unique user/goal database key and conflict-ignoring writes; views and balance deduplicate by goal ID as a safeguard against repeat requests.

- Menus: the pages live under /awa/menus, opened from the A While Away page (no nav entry). Every menu activity is linked to an A While Away hobby via hobby_id (unique per user) and is reused across menus via menu_items; standalone or goal-step-linked activities are not supported. Why: menus are only ever built from the user's hobbies.

- Appearance: colour themes (`data-theme`, src/lib/theme.ts) and fonts (`data-font`, src/lib/font.ts) are independent; theme blocks in styles.css must never set `--font-*`. Why: users mix and match any colours with any font.

- Routine editor text fields auto-size to their content and container width, with fixed grid tracks for actions; this keeps long steps readable and touch controls stable across screen sizes.

- Keep the retired Observatory URL as a redirect to the wins page so old bookmarks remain usable; retain historical collectible data without loading it in the active UI.

- AppShell owns shared page gutters and uses the available content width; the planner uses seven equal min-width-zero columns on desktop so the whole week fits without horizontal scrolling.
