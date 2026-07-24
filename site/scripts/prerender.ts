/**
 * Pre-render the landing page at build time — one page per locale.
 *
 * Produces static HTML snapshots and writes them to:
 *   - `dist/index.html`      → English (the default locale, canonical `/`)
 *   - `dist/{locale}/index.html` → every other locale (e.g. `/fr/`)
 *
 * so that SEO crawlers see real, fully-translated content without
 * executing JavaScript.
 *
 * Run after `vite build`: `tsx scripts/prerender.ts`
 */

import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { APP_NAME, GITHUB_URL, SITE_URL as SITE_URL_DEFAULT } from "../src/brand";
import { DEFAULT_LOCALE, type Locale, messages } from "../src/i18n/messages";

// prerender.ts runs in Node.js; import.meta.env is undefined there so
// brand.ts falls back to the hardcoded default. Read process.env directly.
const SITE_URL = process.env.VITE_SITE_URL ?? SITE_URL_DEFAULT;

const root = resolve(import.meta.dirname, "..");
const locales = Object.keys(messages) as Locale[];

/** URL path for a locale — `/` for the default, `/{locale}/` otherwise. */
const localePath = (l: Locale) => (l === DEFAULT_LOCALE ? "/" : `/${l}/`);

// ---------------------------------------------------------------------------
// 1. Build the SSR entry into a Node-importable module
// ---------------------------------------------------------------------------

const { build } = await import("vite");

await build({
  configFile: resolve(root, "vite.config.ts"),
  logLevel: "warn",
  build: {
    ssr: resolve(root, "src/server.tsx"),
    outDir: resolve(root, "dist-ssr"),
    emptyOutDir: true,
  },
});

// ---------------------------------------------------------------------------
// 2. Set up a minimal browser environment (happy-dom) so that providers
//    using localStorage / window / matchMedia work during the render.
// ---------------------------------------------------------------------------

const { GlobalRegistrator } = await import("@happy-dom/global-registrator");
GlobalRegistrator.register({
  url: SITE_URL,
  // The parsed template references the built stylesheet — don't let
  // happy-dom actually fetch it (teardown noise, and useless here).
  settings: {
    disableJavaScriptFileLoading: true,
    disableCSSFileLoading: true,
  },
});

// ---------------------------------------------------------------------------
// 3. Render every locale and write its index.html
// ---------------------------------------------------------------------------

const { render, mcuCss } = await import(resolve(root, "dist-ssr/server.js"));

const templatePath = resolve(root, "dist/index.html");
// happy-dom tries to load (or loudly refuses) the built stylesheet the
// moment the <link> is parsed — neutralise the rel during DOM work and
// restore it at serialisation time.
const template = readFileSync(templatePath, "utf-8").replaceAll('rel="stylesheet"', 'rel="x-stylesheet"');

// hreflang <link> tags (identical for every locale page)
const hreflangTags = [
  ...locales.map((l) => ({ hreflang: l, href: `${SITE_URL}${localePath(l)}` })),
  { hreflang: "x-default", href: `${SITE_URL}${localePath(DEFAULT_LOCALE)}` },
];

/**
 * Set the `content` attribute of a meta element matching `selector`.
 *
 * @param doc - the parsed HTML document to mutate in place
 * @param selector - CSS selector identifying the target `<meta>` element
 * @param content - value to write into the element's `content` attribute
 */
function setMeta(doc: Document, selector: string, content: string) {
  doc.querySelector(selector)?.setAttribute("content", content);
}

for (const locale of locales) {
  const appHtml: string = render(locale);
  const msgs = messages[locale] as Record<string, string>;

  const title = `${APP_NAME} — ${msgs["meta.tagline"]}`;
  const description = msgs["hero.subtitle"];

  // Parse the template into a real DOM tree (happy-dom is registered)
  const doc = new DOMParser().parseFromString(template, "text/html");

  // Lang
  doc.documentElement.setAttribute("lang", locale);

  // Title
  doc.title = title;

  // Meta tags
  setMeta(doc, 'meta[name="description"]', description);
  setMeta(doc, 'meta[property="og:title"]', title);
  setMeta(doc, 'meta[property="og:description"]', description);
  setMeta(doc, 'meta[name="twitter:title"]', title);
  setMeta(doc, 'meta[name="twitter:description"]', description);
  setMeta(doc, 'meta[property="og:image"]', `${SITE_URL}/og-image.png`);
  setMeta(doc, 'meta[name="twitter:image"]', `${SITE_URL}/og-image.png`);

  // Canonical + OG URL
  const localeUrl = `${SITE_URL}${localePath(locale)}`;
  doc.querySelector('link[rel="canonical"]')?.setAttribute("href", localeUrl);
  setMeta(doc, 'meta[property="og:url"]', localeUrl);

  // Hreflang alternates
  for (const { hreflang, href } of hreflangTags) {
    const link = doc.createElement("link");
    link.setAttribute("rel", "alternate");
    link.setAttribute("hreflang", hreflang);
    link.setAttribute("href", href);
    doc.head.appendChild(link);
  }

  // Structured data — SoftwareApplication, per-locale description
  const jsonLd = doc.createElement("script");
  jsonLd.setAttribute("type", "application/ld+json");
  jsonLd.textContent = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: APP_NAME,
    url: SITE_URL,
    description: `${msgs["meta.tagline"]}. ${description}`,
    applicationCategory: "DeveloperApplication",
    operatingSystem: "macOS, Linux, Windows",
    offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" },
    license: `${GITHUB_URL}/blob/main/LICENSE`,
    author: {
      "@type": "Person",
      name: "Antoine Bernier",
      url: "https://github.com/abernier",
    },
  });
  doc.head.appendChild(jsonLd);

  // Material 3 colour tokens — inline so `--md-sys-color-*` resolve at first
  // paint. Without this, the SSR'd markup uses `bg-background` etc. before
  // <Mcu> mounts client-side, producing a white flash before the theme
  // applies. The id matches Mcu's `mcuStyleId` so its useInsertionEffect
  // updates this same tag instead of appending a duplicate.
  const mcuStyle = doc.createElement("style");
  mcuStyle.id = "mcu-styles";
  mcuStyle.textContent = mcuCss;
  doc.head.appendChild(mcuStyle);

  // Inject pre-rendered HTML into the app placeholder
  const appComment = doc.createTreeWalker(doc.body, NodeFilter.SHOW_COMMENT);
  while (appComment.nextNode()) {
    if (appComment.currentNode.textContent === "app-html") {
      const container = doc.createElement("div");
      container.innerHTML = appHtml;
      appComment.currentNode.parentNode!.replaceChild(container, appComment.currentNode);
      // Unwrap: move children out of the temporary container
      while (container.firstChild) {
        container.parentNode!.insertBefore(container.firstChild, container);
      }
      container.remove();
      break;
    }
  }

  const html = `<!doctype html>\n${doc.documentElement.outerHTML}`.replaceAll('rel="x-stylesheet"', 'rel="stylesheet"');

  const outDir = locale === DEFAULT_LOCALE ? resolve(root, "dist") : resolve(root, `dist/${locale}`);
  mkdirSync(outDir, { recursive: true });
  writeFileSync(resolve(outDir, "index.html"), html);

  console.log(`  ✓ ${localePath(locale)}`);
}

// ---------------------------------------------------------------------------
// 4. Clean up the SSR build artifacts
// ---------------------------------------------------------------------------

rmSync(resolve(root, "dist-ssr"), { recursive: true, force: true });

// Unregister happy-dom globals to release timers/observers, then exit
// explicitly — some libraries may leave async handles open.
await GlobalRegistrator.unregister();

console.log(`✓ Pre-rendered the landing in ${locales.length} locales`);

process.exit(0);
