import { Languages } from "lucide-react";
import type { ComponentProps } from "react";
import { useIntl } from "react-intl";
import { Button } from "../components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "../components/ui/tooltip";
import { LOCALE_LABELS, type Locale, messages, useLocale } from "./LocaleContext";

const locales = Object.keys(messages) as Locale[];

/**
 * Dropdown to switch the app language.
 *
 * @param props
 * @param props.variant - Button variant forwarded to the trigger.
 * @param props.tooltip - Whether to show a tooltip on the trigger button.
 * @param props.onLocaleChange - Custom handler called instead of the default
 *   `setLocale`. Useful on locale-prefixed pages that navigate on change.
 */
export function LocaleToggle({
  variant = "outline",
  tooltip = true,
  onLocaleChange,
}: {
  /** Button style variant. */
  variant?: ComponentProps<typeof Button>["variant"];
  /** Show a tooltip around the trigger button. */
  tooltip?: boolean;
  /** When provided, called instead of `setLocale` when the user picks a locale. */
  onLocaleChange?: (locale: Locale) => void;
}) {
  const intl = useIntl();
  const { locale, setLocale } = useLocale();

  const handleChange = (l: Locale) => {
    setLocale(l);
    onLocaleChange?.(l);
  };

  const label = intl.formatMessage({ id: "locale.label" });

  const trigger = (
    <DropdownMenuTrigger asChild>
      <Button size="icon" variant={variant} aria-label={label}>
        <Languages className="size-4" />
      </Button>
    </DropdownMenuTrigger>
  );

  return (
    <DropdownMenu>
      {tooltip ? (
        <Tooltip>
          <TooltipTrigger asChild>{trigger}</TooltipTrigger>
          <TooltipContent>{label}</TooltipContent>
        </Tooltip>
      ) : (
        trigger
      )}
      <DropdownMenuContent align="end">
        <DropdownMenuRadioGroup value={locale} onValueChange={(v) => handleChange(v as Locale)}>
          {locales.map((l) => (
            <DropdownMenuRadioItem key={l} value={l}>
              {LOCALE_LABELS[l]}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
