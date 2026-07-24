import castUrl from "../../demo/recordings/claudia-demo.cast?url";
import {
  Brain,
  Check,
  Copy,
  HandHeart,
  History,
  Languages,
  MessagesSquare,
  Monitor,
  Moon,
  NotebookPen,
  ShieldCheck,
  Stethoscope,
  Sun,
  Waypoints,
} from "lucide-react";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { APP_NAME, GITHUB_URL, INSTALL_COMMANDS, LEGAL_CONTACT_EMAIL } from "./brand";
import { useTheme } from "./components/theme-provider";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "./components/ui/accordion";
import { Badge } from "./components/ui/badge";
import { Button } from "./components/ui/button";
import { Card, CardContent } from "./components/ui/card";
import { useLocale } from "./i18n/LocaleContext";
import { LocaleToggle } from "./i18n/LocaleToggle";

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

/**
 * The most distinctive commands — a curated taste, not the full list
 * (the README carries all ten; `commands.more` links there).
 */
const COMMANDS = [
  { cmd: "/menu", id: "commands.menu" },
  { cmd: "/keep", id: "commands.keep" },
  { cmd: "/dashboard", id: "commands.dashboard" },
  { cmd: "/thread", id: "commands.thread" },
] as const;

/**
 * Deeplinks: `#faq-qN` lazy-inits the open accordion item, `#legal`
 * pre-expands the native <details> block in the footer. Both scroll into
 * view once on mount.
 */
function useDeeplinks() {
  const [openFaq, setOpenFaq] = useState<string | undefined>(() => {
    if (typeof window === "undefined") return undefined;
    const hash = window.location.hash.slice(1);
    return hash.startsWith("faq-") ? hash.slice(4) : undefined;
  });
  const legalRef = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (hash === "legal" && legalRef.current) {
      legalRef.current.open = true;
    }
    if (!hash.startsWith("faq-") && hash !== "legal") return;
    requestAnimationFrame(() => {
      document.getElementById(hash)?.scrollIntoView({ block: "start", behavior: "instant" });
    });
  }, []);
  return { openFaq, setOpenFaq, legalRef };
}

/**
 * Landing page presenting Claudia.
 *
 * Pre-rendered per locale at build time (`scripts/prerender.ts`) so the
 * content is crawlable without JavaScript, then hydrated client-side.
 */
export function Page() {
  const { locale } = useLocale();
  const { openFaq, setOpenFaq, legalRef } = useDeeplinks();
  const homeHref = locale === "en" ? "/" : `/${locale}/`;

  return (
    <div className="bg-background text-foreground min-h-screen">
      {/* Above-the-fold band — header + hero share a viewport-height flex
          column so the hero (flex-1) fills exactly the space the header
          doesn't, sizematters-style. */}
      <div className="flex min-h-dvh flex-col">
        <header className="border-b">
          <nav className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
            <a href={homeHref} className="text-lg font-semibold tracking-tight">
              {APP_NAME}
            </a>
            <Button asChild variant="outline">
              <a href={GITHUB_URL}>
                <GitHubIcon />
                <span className="hidden sm:inline">
                  <FormattedMessage id="nav.github" />
                </span>
              </a>
            </Button>
          </nav>
        </header>

        {/* Hero — centered copy, the session playing where a screenshot
            would go */}
        <section className="flex flex-1 items-center py-10">
          <div className="mx-auto w-full max-w-3xl px-6 text-center">
            <Badge variant="outline" className="text-tertiary font-normal">
              <FormattedMessage id="hero.badge" />
            </Badge>
            <h1 className="mt-6 text-4xl font-bold tracking-tight text-balance sm:text-5xl">
              <FormattedMessage id="hero.title" />
            </h1>
            <p className="text-muted-foreground mt-6 text-lg text-pretty sm:text-xl">
              <FormattedMessage id="hero.subtitle" />
            </p>
            <div className="mt-8 overflow-hidden rounded-lg border text-left shadow-lg">
              <AsciinemaDemo />
            </div>
          </div>
        </section>
      </div>

      <main>
        {/* Install — the two commands, in their own section right after
            the hero (the bottom CTA's #install anchor lands here) */}
        <section id="install" className="bg-muted/50 scroll-mt-8 py-16 sm:py-24">
          <div className="mx-auto max-w-2xl px-6">
            <h2 className="text-center text-3xl font-bold tracking-tight text-balance">
              <FormattedMessage id="install.title" />
            </h2>
            <InstallBlock />
          </div>
        </section>

        {/* Privacy — the vault, documented as it really is. The tree
            mirrors docs/memory-layout.md; example file names come from the
            demo fixture (Nora, a fictional person) — never a real vault. */}
        <section className="py-16 sm:py-24">
          <div className="mx-auto max-w-5xl px-6">
            <h2 className="text-center text-3xl font-bold tracking-tight text-balance">
              <FormattedMessage id="privacy.title" />
            </h2>
            <p className="text-muted-foreground mx-auto mt-4 max-w-2xl text-center text-lg text-pretty">
              <FormattedMessage id="privacy.body" />
            </p>
            <Card className="mx-auto mt-12 max-w-3xl">
              <CardContent className="overflow-x-auto font-mono text-sm leading-7 whitespace-pre">
                {/* <c>…</c> spans in the catalog string are the # comments —
                    tinted tertiary, like syntax highlighting */}
                <FormattedMessage
                  id="privacy.tree"
                  values={{ c: (chunks) => <span className="text-tertiary">{chunks}</span> }}
                />
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Skills — what actually ships in the plugin */}
        <section className="bg-muted/50 py-16 sm:py-24">
          <div className="mx-auto max-w-5xl px-6">
            <h2 className="text-center text-3xl font-bold tracking-tight text-balance">
              <FormattedMessage id="skills.title" />
            </h2>
            <p className="text-muted-foreground mx-auto mt-4 max-w-2xl text-center text-lg text-pretty">
              <FormattedMessage id="skills.subtitle" />
            </p>
            <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              <Feature icon={<HandHeart />} titleId="skills.claudia.title" descriptionId="skills.claudia.description" />
              <Feature icon={<History />} titleId="skills.memory.title" descriptionId="skills.memory.description" />
              <Feature
                icon={<Stethoscope />}
                titleId="skills.consult.title"
                descriptionId="skills.consult.description"
              />
              <Feature
                icon={<NotebookPen />}
                titleId="skills.exercise.title"
                descriptionId="skills.exercise.description"
              />
              <Feature icon={<Waypoints />} titleId="skills.maps.title" descriptionId="skills.maps.description" />
              <Feature icon={<Brain />} titleId="skills.reasoning.title" descriptionId="skills.reasoning.description" />
            </div>
          </div>
        </section>

        {/* Commands — a taste of the ten */}
        <section className="py-16 sm:py-24">
          <div className="mx-auto max-w-5xl px-6">
            <h2 className="text-center text-3xl font-bold tracking-tight text-balance">
              <FormattedMessage id="commands.title" />
            </h2>
            <p className="text-muted-foreground mx-auto mt-4 max-w-2xl text-center text-lg text-pretty">
              <FormattedMessage id="commands.subtitle" />
            </p>
            <dl className="mt-12 grid gap-x-12 gap-y-6 sm:grid-cols-2">
              {COMMANDS.map(({ cmd, id }) => (
                <div key={cmd} className="flex items-start gap-3">
                  <dt className="shrink-0">
                    <code className="bg-tertiary-container text-tertiary-container-foreground rounded px-1.5 py-0.5 font-mono text-sm">
                      {cmd}
                    </code>
                  </dt>
                  <dd className="text-muted-foreground text-pretty">
                    <FormattedMessage id={id} />
                  </dd>
                </div>
              ))}
            </dl>
            <p className="mt-10 text-center text-sm">
              <a
                href={`${GITHUB_URL}#commands`}
                className="text-muted-foreground hover:text-foreground underline underline-offset-4"
              >
                <FormattedMessage id="commands.more" />
              </a>
            </p>
          </div>
        </section>

        {/* Design — the deliberate choices behind the persona, each an ADR */}
        <section className="bg-muted/50 py-16 sm:py-24">
          <div className="mx-auto max-w-5xl px-6">
            <h2 className="text-center text-3xl font-bold tracking-tight text-balance">
              <FormattedMessage id="design.title" />
            </h2>
            <p className="text-muted-foreground mx-auto mt-4 max-w-2xl text-center text-lg text-pretty">
              <FormattedMessage id="design.subtitle" />
            </p>
            <div className="mt-16 grid gap-12 sm:grid-cols-2">
              <DesignPoint
                icon={<HandHeart />}
                titleId="design.relationship.title"
                descriptionId="design.relationship.description"
              />
              <DesignPoint
                icon={<ShieldCheck />}
                titleId="design.immersion.title"
                descriptionId="design.immersion.description"
              />
              <DesignPoint
                icon={<MessagesSquare />}
                titleId="design.natural.title"
                descriptionId="design.natural.description"
              />
              <DesignPoint
                icon={<Languages />}
                titleId="design.language.title"
                descriptionId="design.language.description"
              />
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-16 sm:py-24">
          <div className="mx-auto max-w-3xl px-6">
            <h2 className="text-center text-3xl font-bold tracking-tight text-balance">
              <FormattedMessage id="faq.title" />
            </h2>
            <Accordion
              type="single"
              collapsible
              className="mt-12 w-full"
              value={openFaq}
              onValueChange={(v) => {
                setOpenFaq(v || undefined);
                // Reflect the open question in the URL so users can copy a
                // shareable link to a specific answer. `replaceState` keeps
                // the back button useful.
                history.replaceState(null, "", v ? `#faq-${v}` : " ");
              }}
            >
              {(["q1", "q2", "q3", "q4", "q5"] as const).map((q) => (
                <FaqItem key={q} value={q} questionId={`faq.${q}.question`} answerId={`faq.${q}.answer`} />
              ))}
            </Accordion>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-primary text-primary-foreground py-16 sm:py-24">
          <div className="mx-auto max-w-3xl px-6 text-center">
            <h2 className="text-3xl font-bold tracking-tight text-balance">
              <FormattedMessage id="cta.ready" />
            </h2>
            <p className="mt-4 text-lg opacity-90">
              <FormattedMessage id="cta.readySubtitle" />
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Button asChild size="lg" variant="secondary">
                <a href="#install">
                  <FormattedMessage id="cta.install" />
                </a>
              </Button>
              <Button asChild size="lg" variant="ghost" className="hover:bg-primary-foreground/10">
                <a href={GITHUB_URL}>
                  <GitHubIcon />
                  <FormattedMessage id="nav.github" />
                </a>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t py-8">
        <div className="text-muted-foreground mx-auto max-w-5xl px-6 text-sm">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <span>
              © {new Date().getFullYear()} {APP_NAME}
            </span>
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <LocaleToggle
                variant="ghost"
                tooltip={false}
                onLocaleChange={(l) => {
                  history.replaceState(null, "", l === "en" ? "/" : `/${l}/`);
                }}
              />
              <Button asChild size="icon" variant="ghost">
                <a href={GITHUB_URL} aria-label="GitHub">
                  <GitHubIcon />
                </a>
              </Button>
            </div>
          </div>
          {/* Legal — always rendered at the bottom, line-clamped to the
              summary's first block by default, sizematters-style. The
              `#legal` anchor deep-links here and pre-expands the block.
              Mono + text-xs + muted give it a "fine print" aesthetic that
              steps out of the marketing voice of the rest of the page. */}
          <details
            ref={legalRef}
            id="legal"
            className="text-muted-foreground scroll-mt-8 mt-8 border-t pt-8 font-mono text-xs"
          >
            <summary className="hover:text-foreground cursor-pointer whitespace-pre-line">
              <FormattedMessage id="legal.summary" />
            </summary>
            <div className="mt-4 whitespace-pre-line">
              <FormattedMessage id="legal.body" values={{ contactEmail: LEGAL_CONTACT_EMAIL }} />
            </div>
          </details>
        </div>
      </footer>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/**
 * The two-command install block with a copy button — the page's primary CTA.
 */
function InstallBlock() {
  const intl = useIntl();
  const [copied, setCopied] = useState(false);
  const copy = () => {
    void navigator.clipboard.writeText(INSTALL_COMMANDS.join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="mt-8 text-left">
      <div className="bg-card relative rounded-lg border shadow-sm">
        <pre className="overflow-x-auto p-4 pr-14 font-mono text-sm leading-7">
          {INSTALL_COMMANDS.map((cmd) => (
            <code key={cmd} className="block">
              <span className="text-muted-foreground select-none">$ </span>
              {cmd}
            </code>
          ))}
        </pre>
        <Button
          size="icon"
          variant="ghost"
          className="absolute top-2.5 right-2.5"
          aria-label={intl.formatMessage({ id: copied ? "hero.copied" : "hero.copy" })}
          onClick={copy}
        >
          {copied ? <Check className="text-primary" /> : <Copy />}
        </Button>
      </div>
    </div>
  );
}

/**
 * Resolve the effective page theme — `system` follows the OS preference
 * live, so the player can counter-shade (see {@link AsciinemaDemo}).
 */
function useResolvedTheme(): "light" | "dark" {
  const { theme } = useTheme();
  const [system, setSystem] = useState<"light" | "dark">(() =>
    typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light",
  );
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => setSystem(mq.matches ? "dark" : "light");
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return theme === "system" ? system : theme;
}

/**
 * The two-minute session with Nora, played by asciinema-player from the
 * cast file in the repo's demo kit — autoplaying and looping in the
 * hero, where a product screenshot would go. Client-only: the player
 * mounts in an effect, so the prerendered HTML ships an empty
 * (aspect-reserved) box.
 *
 * The terminal follows the page theme — dark player on a dark page,
 * light player on a light page. Switching theme recreates the player
 * (the loop restarts; fine for ambience).
 */
function AsciinemaDemo() {
  const ref = useRef<HTMLDivElement>(null);
  const resolvedTheme = useResolvedTheme();
  useEffect(() => {
    let player: { dispose(): void } | undefined;
    let cancelled = false;
    void import("asciinema-player").then(({ create }) => {
      if (cancelled || !ref.current) return;
      player = create(castUrl, ref.current, {
        fit: "width",
        autoPlay: true,
        loop: true,
        theme: resolvedTheme === "dark" ? "asciinema" : "solarized-light",
      });
    });
    return () => {
      cancelled = true;
      player?.dispose();
    };
  }, [resolvedTheme]);
  // The element handed to the player must be a block — inside a flex
  // container, `.ap-wrapper` shrinks to its (initially 0-wide) content
  // and the fit-width math latches onto 0.
  return <div ref={ref} className="aspect-video [&_.ap-player]:rounded-none" />;
}

function Feature({ icon, titleId, descriptionId }: { icon: ReactNode; titleId: string; descriptionId: string }) {
  return (
    <Card>
      <CardContent>
        <div className="text-tertiary mb-4">{icon}</div>
        {/* Skill names are tokens — mono, like the code they point to */}
        <h3 className="font-mono text-base font-semibold tracking-tight">
          <FormattedMessage id={titleId} />
        </h3>
        <p className="text-muted-foreground mt-3 text-pretty">
          <FormattedMessage id={descriptionId} />
        </p>
      </CardContent>
    </Card>
  );
}

function DesignPoint({ icon, titleId, descriptionId }: { icon: ReactNode; titleId: string; descriptionId: string }) {
  return (
    <div className="text-center">
      <div className="bg-primary text-primary-foreground mx-auto mb-4 flex size-12 items-center justify-center rounded-full">
        {icon}
      </div>
      <h3 className="text-lg font-semibold tracking-tight">
        <FormattedMessage id={titleId} />
      </h3>
      <p className="text-muted-foreground mt-3 text-pretty">
        <FormattedMessage id={descriptionId} />
      </p>
    </div>
  );
}

function FaqItem({ value, questionId, answerId }: { value: string; questionId: string; answerId: string }) {
  const intl = useIntl();
  return (
    <AccordionItem value={value} id={`faq-${value}`} className="group scroll-mt-8">
      <AccordionTrigger className="text-base">
        <span className="flex-1 text-left">
          <FormattedMessage id={questionId} />
        </span>
        <a
          href={`#faq-${value}`}
          aria-label={intl.formatMessage({ id: "faq.deeplinkLabel" })}
          className="text-muted-foreground/60 hover:text-foreground rounded text-sm opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
          onClick={(e) => {
            // Left-click: let the accordion toggle (the click bubbles to the
            // trigger button). The URL hash gets updated via onValueChange.
            // Right-click still opens the standard "Copy link" context menu.
            e.preventDefault();
          }}
        >
          #
        </a>
      </AccordionTrigger>
      <AccordionContent className="text-muted-foreground text-base text-pretty">
        <FormattedMessage id={answerId} />
      </AccordionContent>
    </AccordionItem>
  );
}

const themes = ["system", "light", "dark"] as const;

function ThemeToggle() {
  const intl = useIntl();
  const { theme, setTheme } = useTheme();

  const cycle = () => {
    const i = themes.indexOf(theme);
    setTheme(themes[(i + 1) % themes.length]);
  };

  return (
    <Button variant="ghost" size="icon" aria-label={intl.formatMessage({ id: "theme.label" })} onClick={cycle}>
      {theme === "light" && <Sun className="size-4" />}
      {theme === "dark" && <Moon className="size-4" />}
      {theme === "system" && <Monitor className="size-4" />}
    </Button>
  );
}

function GitHubIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4 fill-current" aria-hidden>
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  );
}
