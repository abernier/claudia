import castUrl from "../../demo/recordings/claudia-demo.cast?url";
import {
  Check,
  Copy,
  FolderLock,
  HandHeart,
  Languages,
  LifeBuoy,
  MessagesSquare,
  Monitor,
  Moon,
  ShieldCheck,
  Siren,
  Sun,
} from "lucide-react";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { APP_NAME, GITHUB_URL, INSTALL_COMMANDS } from "./brand";
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

/** The ten commands, in README order — the ids point into `lang/*.json`. */
const COMMANDS = [
  { cmd: "/help-now", id: "commands.helpNow" },
  { cmd: "/forget", id: "commands.forget" },
  { cmd: "/export", id: "commands.export" },
  { cmd: "/save", id: "commands.save" },
  { cmd: "/migrate", id: "commands.migrate" },
  { cmd: "/config", id: "commands.config" },
  { cmd: "/thread", id: "commands.thread" },
  { cmd: "/dashboard", id: "commands.dashboard" },
  { cmd: "/keep", id: "commands.keep" },
  { cmd: "/menu", id: "commands.menu" },
] as const;

/**
 * FAQ deeplinks (`#faq-qN`): lazy-init the open accordion item from the
 * URL hash, plus a one-shot scroll into view on mount.
 */
function useFaqDeeplinks() {
  const [openFaq, setOpenFaq] = useState<string | undefined>(() => {
    if (typeof window === "undefined") return undefined;
    const hash = window.location.hash.slice(1);
    return hash.startsWith("faq-") ? hash.slice(4) : undefined;
  });
  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (!hash.startsWith("faq-")) return;
    requestAnimationFrame(() => {
      document.getElementById(hash)?.scrollIntoView({ block: "start", behavior: "instant" });
    });
  }, []);
  return { openFaq, setOpenFaq };
}

/**
 * Landing page presenting Claudia.
 *
 * Pre-rendered per locale at build time (`scripts/prerender.ts`) so the
 * content is crawlable without JavaScript, then hydrated client-side.
 */
export function Page() {
  const { locale } = useLocale();
  const { openFaq, setOpenFaq } = useFaqDeeplinks();
  const homeHref = locale === "en" ? "/" : `/${locale}/`;

  return (
    <div className="bg-background text-foreground min-h-screen">
      <header className="border-b">
        <nav className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <a href={homeHref} className="text-lg font-semibold tracking-tight">
            {APP_NAME}
          </a>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <LocaleToggle
              variant="ghost"
              tooltip={false}
              onLocaleChange={(l) => {
                history.replaceState(null, "", l === "en" ? "/" : `/${l}/`);
              }}
            />
            <Button asChild variant="outline">
              <a href={GITHUB_URL}>
                <GitHubIcon />
                <span className="hidden sm:inline">
                  <FormattedMessage id="nav.github" />
                </span>
              </a>
            </Button>
          </div>
        </nav>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-3xl px-6 py-16 text-center sm:py-24">
        <Badge variant="outline" className="font-normal">
          <FormattedMessage id="hero.badge" />
        </Badge>
        <h1 className="mt-6 text-4xl font-bold tracking-tight text-balance sm:text-5xl">
          <FormattedMessage id="hero.title" />
        </h1>
        <p className="text-muted-foreground mt-6 text-lg text-pretty sm:text-xl">
          <FormattedMessage id="hero.subtitle" />
        </p>
        <InstallBlock />
        <p className="text-muted-foreground mt-4 text-sm">
          <FormattedMessage id="hero.install.note" />
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Button asChild variant="outline" size="lg">
            <a href="#demo">
              <FormattedMessage id="hero.cta.demo" />
            </a>
          </Button>
        </div>
        <p className="text-muted-foreground mt-10 text-sm text-pretty">
          <FormattedMessage id="hero.disclaimer" />
        </p>
      </section>

      <main>
        {/* Demo */}
        <section id="demo" className="bg-muted/50 scroll-mt-8 py-16 sm:py-24">
          <div className="mx-auto max-w-4xl px-6">
            <h2 className="text-center text-3xl font-bold tracking-tight text-balance">
              <FormattedMessage id="demo.title" />
            </h2>
            <p className="text-muted-foreground mx-auto mt-4 max-w-2xl text-center text-lg text-pretty">
              <FormattedMessage id="demo.subtitle" />
            </p>
            <div className="mt-12 overflow-hidden rounded-lg border shadow-lg">
              <AsciinemaDemo />
            </div>
          </div>
        </section>

        {/* What makes Claudia different */}
        <section className="py-16 sm:py-24">
          <div className="mx-auto max-w-5xl px-6">
            <h2 className="text-center text-3xl font-bold tracking-tight text-balance">
              <FormattedMessage id="different.title" />
            </h2>
            <p className="text-muted-foreground mx-auto mt-4 max-w-2xl text-center text-lg text-pretty">
              <FormattedMessage id="different.subtitle" />
            </p>
            <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              <Feature
                icon={<HandHeart />}
                titleId="different.relationship.title"
                descriptionId="different.relationship.description"
              />
              <Feature
                icon={<ShieldCheck />}
                titleId="different.immersion.title"
                descriptionId="different.immersion.description"
              />
              <Feature
                icon={<MessagesSquare />}
                titleId="different.natural.title"
                descriptionId="different.natural.description"
              />
              <Feature
                icon={<FolderLock />}
                titleId="different.local.title"
                descriptionId="different.local.description"
              />
              <Feature
                icon={<Languages />}
                titleId="different.language.title"
                descriptionId="different.language.description"
              />
            </div>
          </div>
        </section>

        {/* Safety — first-class, not fine print */}
        <section className="bg-muted/50 py-16 sm:py-24">
          <div className="mx-auto max-w-5xl px-6">
            <h2 className="text-center text-3xl font-bold tracking-tight text-balance">
              <FormattedMessage id="safety.title" />
            </h2>
            <p className="text-muted-foreground mx-auto mt-4 max-w-2xl text-center text-lg text-pretty">
              <FormattedMessage id="safety.body" />
            </p>
            <div className="mt-16 grid gap-12 sm:grid-cols-3">
              <SafetyPoint
                icon={<ShieldCheck />}
                titleId="safety.point1.title"
                descriptionId="safety.point1.description"
              />
              <SafetyPoint
                icon={<LifeBuoy />}
                titleId="safety.point2.title"
                descriptionId="safety.point2.description"
              />
              <SafetyPoint icon={<Siren />} titleId="safety.point3.title" descriptionId="safety.point3.description" />
            </div>
          </div>
        </section>

        {/* Privacy — the vault, shown as it really is */}
        <section className="py-16 sm:py-24">
          <div className="mx-auto grid max-w-5xl items-center gap-12 px-6 md:grid-cols-2">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-balance">
                <FormattedMessage id="privacy.title" />
              </h2>
              <p className="text-muted-foreground mt-4 text-lg text-pretty">
                <FormattedMessage id="privacy.body" />
              </p>
              <ul className="mt-8 space-y-3">
                {(["privacy.point1", "privacy.point2", "privacy.point3", "privacy.point4"] as const).map((id) => (
                  <li key={id} className="flex items-start gap-3">
                    <Check className="text-primary mt-1 size-4 shrink-0" />
                    <span>
                      <FormattedMessage id={id} />
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            {/* File names mirror the demo fixture (Nora, a fictional
                person) — never a real vault. */}
            <Card>
              <CardContent className="overflow-x-auto font-mono text-sm leading-7 whitespace-pre">
                {`~/.claudia/
├── person.md
├── goals.md
├── themes/
│   └── what steadies me.md
├── keepsakes.md
├── sessions/
│   └── …
└── todo.md`}
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Commands */}
        <section className="bg-muted/50 py-16 sm:py-24">
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
                    <code className="bg-muted rounded px-1.5 py-0.5 font-mono text-sm">{cmd}</code>
                  </dt>
                  <dd className="text-muted-foreground text-pretty">
                    <FormattedMessage id={id} />
                  </dd>
                </div>
              ))}
            </dl>
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
              © {new Date().getFullYear()} {APP_NAME} ·{" "}
              <a
                href={`${GITHUB_URL}/blob/main/LICENSE`}
                className="hover:text-foreground underline-offset-4 hover:underline"
              >
                <FormattedMessage id="footer.license" />
              </a>
            </span>
            <div className="flex items-center gap-2">
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
          <p className="mt-8 border-t pt-8 text-center text-xs text-pretty">
            <FormattedMessage id="footer.disclaimer" />
          </p>
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
    <div id="install" className="mt-10 scroll-mt-8 text-left">
      <div className="bg-card relative mx-auto max-w-2xl rounded-lg border shadow-sm">
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
          aria-label={intl.formatMessage({
            id: copied ? "hero.copied" : "hero.copy",
          })}
          onClick={copy}
        >
          {copied ? <Check className="text-primary" /> : <Copy />}
        </Button>
      </div>
    </div>
  );
}

/**
 * The two-minute session with Nora, played by asciinema-player from the
 * cast file in the repo's demo kit. Client-only: the player mounts in an
 * effect, so the prerendered HTML ships an empty (aspect-reserved) box.
 */
function AsciinemaDemo() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let player: { dispose(): void } | undefined;
    let cancelled = false;
    void import("asciinema-player").then(({ create }) => {
      if (cancelled || !ref.current) return;
      player = create(castUrl, ref.current, {
        fit: "width",
        poster: "npt:0:10",
      });
    });
    return () => {
      cancelled = true;
      player?.dispose();
    };
  }, []);
  return <div ref={ref} className="aspect-video [&_.ap-player]:rounded-none" />;
}

function Feature({ icon, titleId, descriptionId }: { icon: ReactNode; titleId: string; descriptionId: string }) {
  return (
    <Card>
      <CardContent>
        <div className="text-primary mb-4">{icon}</div>
        <h3 className="text-lg font-semibold tracking-tight">
          <FormattedMessage id={titleId} />
        </h3>
        <p className="text-muted-foreground mt-3 text-pretty">
          <FormattedMessage id={descriptionId} />
        </p>
      </CardContent>
    </Card>
  );
}

function SafetyPoint({ icon, titleId, descriptionId }: { icon: ReactNode; titleId: string; descriptionId: string }) {
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
