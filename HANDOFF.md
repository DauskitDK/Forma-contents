# Forma Content — Handoff Note
**Last updated:** 2026-07-14
**Project:** Centralized content repo for all Forma Group ventures
**Repo:** https://github.com/DauskitDK/Forma-Content.git
**Local path:** `C:\Users\firda\Forma-Content\`
**Stack:** Decap CMS (git-based) · Vercel serverless OAuth · served to sites via jsDelivr CDN

---

## What this is

A single shared content repo + single Decap CMS admin, so there's **one login, one dashboard** for editing content across every Forma venture — instead of a separate CMS per site.

This does not centralize the *code* or *design* of each venture (they stay independent, each in its own repo/deployment, per the earlier decision to let each venture develop its own design system). It only centralizes *content*: product catalogs and blog posts, stored as JSON here, fetched by each site's own frontend at runtime over a free CDN.

**How a site gets the content:**
```
<site>'s loader.js
  → fetch('https://cdn.jsdelivr.net/gh/DauskitDK/Forma-Content@main/<venture>/products.json')
  → same shape as before, site code barely changes
```
jsDelivr serves any file from any public GitHub repo, free, with caching — no API keys, no rate-limit concerns at this scale.

---

## Site map

```
Forma-Content/
├── syndicate/
│   ├── products.json      ← migrated from Forma-Syndicatewebsite's _data/products.json
│   └── blog.json          ← migrated from Forma-Syndicatewebsite's _data/blog.json
├── admin/
│   ├── index.html         ← Decap CMS entry point
│   └── config.yml         ← collections: syndicate-products, syndicate-blog (more to add later)
├── api/
│   ├── begin.js           ← Vercel serverless: starts GitHub OAuth for Decap login
│   ├── complete.js        ← Vercel serverless: completes OAuth, hands token back to Decap
│   └── package.json
└── vercel.json
```

**Proof of concept status:** `Forma-Syndicatewebsite`'s `_data/loader.js` has been updated to fetch from this repo via jsDelivr instead of its own local `_data/*.json`. Once both repos are pushed, this is the first live test of the centralized model.

---

## Known limitation: images are NOT centralized (yet)

`products.json` / `blog.json` image fields (`img`, `imgs`, `productFront`, etc.) still use paths like `assets/images/global/syndicate1.jpg` — these resolve against **the site that's rendering them** (e.g. Syndicate's own repo/deployment), not against this content repo. That's intentional for now: existing images keep working exactly as before with zero migration risk.

**The gap:** if someone uploads a *new* image through the Decap media picker here, it lands in `Forma-Content/syndicate/assets/` (per `admin/config.yml`'s `media_folder`) — but the Syndicate site won't automatically see it, because the site still only looks in its own `assets/images/global/`. Two ways to close this gap later, neither done yet:
1. Manually copy new images from `Forma-Content/syndicate/assets/` into `Forma-Syndicatewebsite/assets/images/global/` after each upload, or
2. Update the site's image-rendering code to resolve image paths through the jsDelivr CDN too (same pattern as the JSON fetch), so uploads "just work" without a manual copy step

Not urgent — existing content works fine either way. Worth deciding before relying on the CMS for new product photography.

---

## Adding Powercraft / Design & Build / Creative Studio

Those three sites are still static HTML with content hardcoded directly into the page (no JSON data source, unlike Syndicate). To bring one under this CMS:

1. Convert its content to the data-driven pattern first — extract hardcoded blog/product content into `<venture>/blog.json` (and `<venture>/products.json` if it sells products), add a small `loader.js` fetching those files, update the HTML to render from fetched data (mirror what Syndicate already does)
2. Add matching JSON files here in `Forma-Content/<venture>/`
3. Add a `<venture>-products` / `<venture>-blog` collection pair to `admin/config.yml`, copying the shape of the `syndicate-*` collections
4. Point that site's `loader.js` at the jsDelivr URL for its own venture folder here

---

## Next steps to launch

1. Create empty repo `DauskitDK/Forma-Content` on GitHub
2. ```
   cd C:\Users\firda\Forma-Content
   git remote add origin https://github.com/DauskitDK/Forma-Content.git
   git push -u origin main
   ```
3. Deploy to Vercel (needed for the OAuth serverless functions to run)
4. Create a GitHub OAuth App (Settings → Developer settings → OAuth Apps): homepage + callback URL both pointing at the Vercel deployment's `/api/complete`
5. Set Vercel env vars: `OAUTH_CLIENT_ID`, `OAUTH_CLIENT_SECRET`, `COMPLETE_URL`, `ORIGIN` — same pattern as `Forma-Syndicatewebsite`'s existing OAuth setup
6. Update `admin/config.yml`'s `base_url` to the real deployed URL once known
7. Visit `/admin`, sign in with GitHub, confirm you can edit Syndicate's products/posts and see the change reflected on the live Syndicate site after the jsDelivr cache refreshes (a few minutes — jsDelivr caches aggressively; use the `@main` alias for latest, or manually purge via `https://purge.jsdelivr.net/gh/DauskitDK/Forma-Content@main/<path>` after an edit if you need it instantly)
