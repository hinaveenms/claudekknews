# 晨光報 Dawn Post

A Traditional Chinese news portal in the style of daily headline sites: category nav bar, article feed with excerpts, trending sidebar, article pages with share buttons, related reading, search and pagination. All articles are original sample content.

No dependencies; needs Node 22+.

```sh
node build.mjs     # writes the site to dist/
node check.mjs     # checks for broken internal links
npx serve dist     # preview locally
```

## Editing
- `data/site.json` — site name, tagline, categories, articles per page
- `data/articles.json` — articles (`id`, `cat`, `date`, `title`, `summary`, `body` paragraphs)
- `src/style.css` — look and feel (light and dark mode)

## Deploying
Pushing to `main` builds and publishes to GitHub Pages via `.github/workflows/pages.yml`. Set **Settings → Pages → Source** to **GitHub Actions** if it isn't already.
