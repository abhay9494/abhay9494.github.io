# Abhay Prasad · Portfolio

Personal portfolio: plain HTML, CSS and JavaScript, with no build step and no framework. Any static host can serve it as is.

**Live:** https://abhay9494.github.io (after you deploy, see below)

## Files

```
index.html                 all the content (sections are marked with comments)
assets/css/style.css       design: colour tokens at the top (light lavender + dark theme)
assets/js/main.js          settings, scroll animations (GSAP + Lenis), cursor, contact form, chart
assets/js/fx.js            liquid WebGL hero, "made of code" portrait, pixel-focus image
assets/img/                photos, IIIT Lucknow images + logo, favicon, social-share image
assets/Abhay_Prasad_Resume.pdf   the "Download resume" file
404.html, robots.txt, sitemap.xml
```

## Common edits

| What | Where |
|---|---|
| Replace the resume | Overwrite `assets/Abhay_Prasad_Resume.pdf` (keep the name) |
| Email / phone | `EMAIL` and `PHONE` at the top of `assets/js/main.js` (email links open Gmail compose) |
| A project went public | In `index.html`, replace its `pill private` "ask for a demo" link with a `View code` link like the Amazon ML one |
| Add a project | Copy one `<li class="row">` in **More projects** (and a `preview-item` if you want a hover preview) |
| Colours | The `--accent*` and `--gl-*` tokens at the top of `style.css` (both themes) |
| Certificates / letters | Buttons with `data-view="drive:<Google Drive file id>"` open the file inside the page. The Drive file must be shared as "Anyone with the link" |
| Codeforces chart | Draws from the snapshot in `#cf-data` (bottom of `index.html`) and refreshes itself from the Codeforces API when it scrolls into view |

Preview locally with a small server (the code portrait needs one; opening the file directly skips it):
`python -m http.server 8000` in this folder, then open http://localhost:8000. VS Code's Live Server works too.

**Animations:** the site follows the visitor's "reduce motion" setting. If Windows *Settings → Accessibility → Visual effects → Animation effects* is off, the page starts calm; the **Settings → Animations** switch on the page turns everything on (remembered per browser).

## Deploy for free

### GitHub Pages (recommended): https://abhay9494.github.io

1. On GitHub, create a new **public** repository named exactly `abhay9494.github.io`.
2. Push this folder to it:
   ```bash
   git init
   git add .
   git commit -m "Portfolio"
   git branch -M main
   git remote add origin https://github.com/abhay9494/abhay9494.github.io.git
   git push -u origin main
   ```
3. Repository → **Settings → Pages** → Source: **Deploy from a branch**, Branch: `main`, folder `/ (root)` → Save.
4. The site is live at https://abhay9494.github.io about a minute later. Every push redeploys it.

### Vercel or Netlify (alternatives)

- **Vercel:** vercel.com → Add New → Project → import the GitHub repo → Framework preset **Other** → Deploy. You get `your-name.vercel.app`.
- **Netlify:** app.netlify.com/drop → drag this folder onto the page. Live in seconds, no Git needed.

If you use a URL other than `abhay9494.github.io`, replace it in `index.html` (`canonical`, `og:url`, `og:image`, JSON-LD), `robots.txt` and `sitemap.xml`.
