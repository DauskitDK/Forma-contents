# Forma Content — Handoff Note
**Last updated:** 2026-07-14 (all 4 ventures converted)
**Project:** Centralized content repo for all Forma Group ventures
**Repo:** https://github.com/DauskitDK/Forma-contents.git
**Local path:** `C:\Users\firda\Forma-contents\`
**Stack:** Decap CMS (git-based) · Vercel serverless OAuth · served to sites via jsDelivr CDN

---

## What this is

A single shared content repo + single Decap CMS admin, so there's **one login, one dashboard** for editing content across every Forma venture — instead of a separate CMS per site.

This does not centralize the *code* or *design* of each venture (they stay independent, each in its own repo/deployment, per the earlier decision to let each venture develop its own design system). It only centralizes *content*: product catalogs and blog posts, stored as JSON here, fetched by each site's own frontend at runtime over a free CDN.

**How a site gets the content:**
```
<site>'s loader.js
  → fetch('https://cdn.jsdelivr.net/gh/DauskitDK/Forma-contents@main/<venture>/products.json')
  → same shape as before, site code barely changes
```
jsDelivr serves any file from any public GitHub repo, free, with caching — no API keys, no rate-limit concerns at this scale.

---

## Site map

```
Forma-contents/
├── syndicate/
│   ├── products.json      ← migrated from Forma-Syndicatewebsite's _data/products.json
│   └── blog.json          ← migrated from Forma-Syndicatewebsite's _data/blog.json
├── powercraft/
│   ├── products.json
│   └── blog.json
├── design-build/
│   └── blog.json          ← no product catalog for this venture
├── creative-studio/
│   └── blog.json          ← no product catalog for this venture
├── admin/
│   ├── index.html         ← Decap CMS entry point
│   └── config.yml         ← collections: syndicate-{products,blog}, powercraft-{products,blog}, design-build-blog, creative-studio-blog
├── api/
│   ├── begin.js           ← Vercel serverless: starts GitHub OAuth for Decap login
│   ├── complete.js        ← Vercel serverless: completes OAuth, hands token back to Decap
│   └── package.json
└── vercel.json
```

**Status:** all 4 venture sites (Syndicate, Powercraft, Design & Build, Creative Studio) are converted to the data-driven pattern and fetch their content from this repo via jsDelivr, falling back to a local JSON copy if the CDN is unreachable. Each site's own repo/deployment is otherwise still fully independent.

---

## Known limitation: images are NOT centralized (yet)

`products.json` / `blog.json` image fields (`img`, `imgs`, `productFront`, etc.) still use paths like `assets/images/global/syndicate1.jpg` — these resolve against **the site that's rendering them** (e.g. Syndicate's own repo/deployment), not against this content repo. That's intentional for now: existing images keep working exactly as before with zero migration risk.

**The gap:** if someone uploads a *new* image through the Decap media picker here, it lands in `Forma-contents/syndicate/assets/` (per `admin/config.yml`'s `media_folder`) — but the Syndicate site won't automatically see it, because the site still only looks in its own `assets/images/global/`. Two ways to close this gap later, neither done yet:
1. Manually copy new images from `Forma-contents/syndicate/assets/` into `Forma-Syndicatewebsite/assets/images/global/` after each upload, or
2. Update the site's image-rendering code to resolve image paths through the jsDelivr CDN too (same pattern as the JSON fetch), so uploads "just work" without a manual copy step

Not urgent — existing content works fine either way. Worth deciding before relying on the CMS for new product photography.

---

## Powercraft / Design & Build / Creative Studio — conversion complete

All three were converted to the same data-driven pattern Syndicate already used:

1. Hardcoded blog/product HTML extracted into `<venture>/blog.json` (+ `products.json` for Powercraft only — Design & Build and Creative Studio don't sell products)
2. Each site got its own `assets/js/loader.js` (CDN fetch + local-fallback pattern) and a matching local copy of the JSON under `assets/data/`
3. Product/blog listing + homepage preview sections rewritten to render from fetched data instead of static markup
4. Matching JSON added here in `Forma-contents/<venture>/`, and a `<venture>-products` / `<venture>-blog` collection pair added to `admin/config.yml`
5. All four venture repos and this repo have been committed and pushed to their respective branches

Note: Creative Studio's "UI/UX" category needed an explicit slug map (`{'UI/UX': 'ux', ...}`) since naive `.toLowerCase()` would produce the invalid CSS-selector-unsafe slug `ui/ux`.

---

## Next steps to launch

1. Create empty repo `DauskitDK/Forma-contents` on GitHub
2. ```
   cd C:\Users\firda\Forma-contents
   git remote add origin https://github.com/DauskitDK/Forma-contents.git
   git push -u origin main
   ```
3. Deploy to Vercel (needed for the OAuth serverless functions to run)
4. Create a GitHub OAuth App (Settings → Developer settings → OAuth Apps): homepage + callback URL both pointing at the Vercel deployment's `/api/complete`
5. Set Vercel env vars: `OAUTH_CLIENT_ID`, `OAUTH_CLIENT_SECRET`, `COMPLETE_URL`, `ORIGIN` — same pattern as `Forma-Syndicatewebsite`'s existing OAuth setup
6. Update `admin/config.yml`'s `base_url` to the real deployed URL once known
7. Visit `/admin`, sign in with GitHub, confirm you can edit Syndicate's products/posts and see the change reflected on the live Syndicate site after the jsDelivr cache refreshes (a few minutes — jsDelivr caches aggressively; use the `@main` alias for latest, or manually purge via `https://purge.jsdelivr.net/gh/DauskitDK/Forma-contents@main/<path>` after an edit if you need it instantly)

---

## Session Handoff — Forma-contents — CMS repair + sitewide image-resolution fix — 2026-07-17

### Completed
- Diagnosed and fixed `https://forma-contents.vercel.app` returning `404` on the bare root — added a `redirects` rule in `vercel.json` (`/` → `/admin/`), since the deployment only ships `admin/index.html`, no root page.
- Diagnosed and fixed a `FUNCTION_INVOCATION_FAILED` crash on GitHub login — root cause was zero environment variables configured on the Vercel project (`OAUTH_CLIENT_ID`, `OAUTH_CLIENT_SECRET`, `COMPLETE_URL`, `ORIGIN` — step 5 above had never actually been done). Registered a new GitHub OAuth App, set all five vars, redeployed. Verified `/api/begin` returns a clean `302` to GitHub's authorize endpoint.
- Ran a full end-to-end CMS test: edited a product through `/admin`, confirmed the editorial-workflow draft branch (`cms/syndicate-products/products`), published it, confirmed the merge to `main`, purged the jsDelivr cache, confirmed the change live on the Syndicate site. Reverted the test edit afterward.
- That test surfaced a real, sitewide bug: `admin/config.yml`'s `media_folder`/`public_folder` is set **globally** (`syndicate/assets`), not per-collection — every CMS image upload lands there regardless of which venture's collection is being edited, but each venture site's frontend only ever resolved images against its own local `assets/` folder. New CMS uploads 404'd on every site.
- Fixed it in all four venture repos' data loaders (`Forma-Syndicatewebsite/_data/loader.js`, `Forma-Powercraftwebsite`, `Forma-DesignBuildwebsite`, `Forma-CreativeStudiowebsite` — all under `assets/js/loader.js` except Syndicate) — added a `resolveImg()` helper that rewrites `/syndicate/assets/...` paths through the jsDelivr CDN, leaves existing local image paths untouched.
- Also fixed a stale-dev-server bug unrelated to this repo but discovered while starting this work: the local Claude Code `SessionStart` hook (`~/.claude/neo-brain-session-start.sh`) declared a port "already running" based on TCP occupancy alone with no content check — now verifies the response against `package.json`'s name / page `<title>` before reusing a port.

### Key Decisions
- Never entered the OAuth client secret directly, even when offered — credentials are handled by the account owner only, in their own terminal, regardless of convenience.
- Fixed the image-resolution gap by patching each site's loader rather than reorganizing `config.yml`'s `media_folder` — smaller, safer change. Per-collection media folders (so each venture's uploads land in its own folder) is still open, not done.
- Left images embedded inside blog post body markdown (via the media picker, not the dedicated `image` field) unresolved — out of scope for a field-level fix.

### Remaining Tasks
1. **Per-venture `media_folder` in `admin/config.yml`** — would route each venture's CMS uploads into its own folder (`powercraft/assets/`, etc.) instead of everything landing under `syndicate/assets/`. Offered, not requested yet.
2. **Markdown-embedded blog images** — only the dedicated hero `image` field resolves through the CDN fix; an image dropped directly into a post body via the media picker still 404s.
3. Site owner has since resumed normal CMS use (new product photo uploads + a real product edit visible in commit history as of this handoff) — working as intended, no action needed, just confirms the fix holds under real use.

### Notes for Next Session
- Local working clone for admin/CLI work on this repo: `C:\Users\firda\AppData\Local\Temp\fc-clone\Forma-contents` — already `vercel link`-ed to the `forma-contents` Vercel project, so `vercel env` / `vercel deploy` work directly from there.
- The four venture repos and their actual branch names (none of them are plain `main`): Powercraft → `forma/powercraft-main`, Design & Build → `forma/DB-main`, Creative Studio → `forma/CIT-main`. `Forma-Syndicatewebsite`'s fix went out via PR: https://github.com/DauskitDK/Forma-Syndicatewebsite/pull/1 (branch `claude/forma-contents-preview-2fc2a4` → `main`, not yet merged as of this handoff).
- `Forma-contents` itself is the only one of the five repos touched this session that uses plain `main`.

### Branch
main

### Repo
https://github.com/DauskitDK/Forma-contents
