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

- Menus: reusable activities live in menu_activities and join menus via menu_items; goal steps/hobbies link by step_id/hobby_id (unique per user) so they are never duplicated, and standalone activities are pruned when no menu holds them. Why: one activity can sit in many menus without copying tasks.
