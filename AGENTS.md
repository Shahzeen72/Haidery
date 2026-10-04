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
- Auth-only pages live under src/routes/_authenticated/ (client-side gate) so the server never renders private data.
- The Haidery chat streams through the src/routes/api/chat.ts server route so the AI key and model stay server-side and swappable.
- Talent rows are blind (no names/photos/age/gender) and publicly readable; identity data must live in a separate, consent-gated table.
- Demo rows carry is_demo; visibility is enforced in RLS via public.demo_visible() (app_settings.show_demo), and public stats come from public_stats() which excludes demo.
- The first account to sign up becomes admin (bootstrap in handle_new_user); later admins are granted via user_roles.
