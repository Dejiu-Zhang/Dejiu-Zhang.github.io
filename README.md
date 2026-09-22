# Yueshan Zhang — Personal archive

The live homepage is https://dejiu-zhang.github.io/.

## Current homepage

The five-disc homepage lives in `site/`. It includes the opening animation, About, Research, Publications & Projects, Memory, and Contact. The page is static and needs no runtime service.

- Edit chapter content in `site/profile.js`.
- Edit publications and projects in `site/works.js`.
- Edit the Memory timeline in `site/timeline.js` and its notes in `site/memory-notes.js`.
- Keep photographs in `site/assets/`.

Build the exact GitHub Pages output with Node 20 or later:

```sh
node scripts/build-pages.mjs
python3 -m http.server 4173 --directory dist
```

GitHub Actions builds and publishes `dist/` on pushes to `main`. Only `site/`, `public/cv.pdf`, and `public/resources/` enter the live output. Existing document URLs stay valid; old chapter routes redirect into the new homepage. The “Browse all undergraduate notes” link opens the complete notes folder on GitHub.

## Previous homepage — retained, not deployed

The former Astro website is deliberately preserved in `src/`, alongside its original `public/` assets, package files, and Astro configuration. The current Pages workflow does **not** build or upload those pages, and there is no link to the old homepage in the live navigation.

The complete pre-migration repository is also retained on the branch [`archive/pre-disc-homepage-2026-09-22`](https://github.com/Dejiu-Zhang/Dejiu-Zhang.github.io/tree/archive/pre-disc-homepage-2026-09-22), starting at commit `fea9612960c98ab76666153fd36190cdcd6002d4`.

To preview the previous website locally, use `npm ci` and `npm run dev`. The existing `npm run build` command still builds the old Astro site for recovery or comparison; it is intentionally not used for deployment.

To restore the previous production homepage, restore `.github/workflows/deploy.yml` from the archive branch and commit that change to `main`. Its original source and assets remain present, so the restored workflow can build them again without deleting the new `site/` directory.
