# Prince Alex Digital — Website

Static rebuild positioned as **"We Design, Build & Automate Digital Businesses"** — web, software, AI & digital growth solutions.

## Structure

```
index.html, index.css                                  → Home
assets/css/pad.css                                     → Shared design system (tokens, nav, footer, buttons, cards, CTA band, page hero…)
assets/js/pad.js                                       → Shared behaviour (dark/light theme, sticky header, dropdown nav, mobile nav,
                                                         scroll-reveal, count-up numbers, year)
solutions/  (index.html, solutions.css, solutions.js)  → Solutions hub: websites, business systems, e-commerce, POS, ShuleSmart, AI & automation
services/   (index.html, services.css, services.js)    → Services by category: Strategy & Design / Development / Automation & AI / Growth
portfolio/  (index.html, portfolio.css, portfolio.js)  → Firestore-driven portfolio grid (admin-published work, cached on-device)
about/      (index.html, about.css, about.js)          → Story, mission, vision, how we work (Discover → Design → Build → Launch → Support)
careers/    (index.html, careers.css, careers.js)      → Perks, open roles, open application via the contact form
contact/    (index.html, contact.css, contact.js)      → Project intake form (need / budget / timeline / details)
sitemap.xml, robots.txt, site.webmanifest
assets/images/logo/logo.png                           → Brand logo (nav, footer, favicon, manifest icon)
assets/images/logo/prince-alex-digital-mark.svg       → Original SVG mark (kept as maskable manifest fallback)
```

## What's implemented
- **Shared design system** in `pad.css` + behaviour in `pad.js`; each page adds a small page-specific CSS/JS file only.
- **Dark/light theme** with persisted preference, **smooth scroll-reveal**, **dropdown Solutions menu**, **mobile-first navigation**.
- **Contact page is a project-intake system**: chip groups for *what do you need / budget / timeline*, contact + project-details fields, honeypot spam trap, client-side validation, and a success panel with a pre-filled `mailto:` fallback. It honours deep links used across the site:
  `?type=website | ecommerce | software | pos | schools | automation | uiux | branding | marketing | careers | newsletter | quote` (also `?service=`).
- **SEO**: unique title, meta description, canonical, Open Graph and Twitter tags per page; JSON-LD for ProfessionalService, WebSite, BreadcrumbList, ItemList (services), ContactPage.
- **Progressive enhancement**: all content lives in the HTML; JS only enhances. `prefers-reduced-motion` is respected and JS is `defer`-loaded.

## Before going live
- Replace placeholder `og:image` URLs (`/assets/images/og/*-og.jpg`) with real 1200×630 images.
- Swap gradient project thumbnails (Home/Portfolio) for real screenshots with descriptive `alt` text, explicit `width`/`height` and `loading="lazy"`.
- Wire the contact form to a real backend or form service — it currently validates client-side and falls back to a pre-filled email.
- Add real social profile URLs to the footer and the Organization JSON-LD `sameAs` array.
- Add portfolio case-study sub-pages as they're produced, then list them in `sitemap.xml`.
- Keep Careers roles current; add posting text per role as hiring formalises.
