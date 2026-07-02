# TapFix public site deployment

The public site is static HTML/CSS/JS. Keep the repository static: no backend
functions, API proxy code, OpenAI keys, or app secrets belong here.

## Preferred hosting: Cloudflare Pages

Cloudflare already manages `tapfixai.app`, so the clean setup is:

```text
GitHub repository -> Cloudflare Pages -> tapfixai.app
```

Cloudflare Pages project settings:

- Project name: `tapfixai-site`
- Production branch: `main`
- Framework preset: `None`
- Root directory: `/`
- Build command: `./scripts/prepare-cloudflare-pages.sh`
- Build output directory: `_site`
- Environment variables: none required

The build script creates a public `_site` artifact from the committed files and
removes internal/deployment-only paths such as `.github`, `_src`, `scripts`,
`CNAME`, `.nojekyll`, local docs, and old macOS DMG files.

After the first successful Cloudflare Pages deploy, attach the custom domain
`tapfixai.app` in Cloudflare Pages and make that Pages project the origin for
the domain. Then GitHub Pages can be disabled.

## Generated static pages

Localized pages are generated locally from `_src/` by:

```sh
python3 build.py
```

`build.py` is intentionally gitignored, but the generated HTML, language
directories, `sitemap.xml`, icons, CSS and JS are committed and deployed.

## Backend

TapFix AI app requests are handled outside this static site.
