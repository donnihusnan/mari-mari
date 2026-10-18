# Design System

## Brand
Mari Mari Outdoor. The logo (`docs/assets/marimari-logo.png`) is white on black: a white circle with a black bird/wave mark, and "MARIMARI OUTDOOR" wordmark. The UI is **monochrome (black and white)** for now. Brand accent colors can be added later by editing `theme.css` only.

## Principle
All brand colors, radius and fonts are defined **once** in `src/styles/theme.css` as CSS variables. Components use only semantic Tailwind classes (`bg-primary`, `text-muted-foreground`, `border-border`). Changing the brand = editing that one file.

## Rules
- No hardcoded hex, `rgb()`, or palette classes (`bg-green-600`, `text-gray-500`) in components.
- No arbitrary color values (`bg-[#123456]`).
- shadcn components are added via the **shadcn MCP** and must keep using these tokens.
- Need a new color? Add a semantic token first (e.g. `--success`), then use it.

## Tokens (semantic)
| Token | Use |
|---|---|
| `background` / `foreground` | page background / default text |
| `card` / `card-foreground` | cards, panels |
| `popover` / `popover-foreground` | dropdowns, dialogs |
| `primary` / `primary-foreground` | main actions, brand |
| `secondary` / `secondary-foreground` | secondary actions |
| `muted` / `muted-foreground` | subtle backgrounds, helper text |
| `accent` / `accent-foreground` | hover/selected states |
| `destructive` / `destructive-foreground` | delete, errors |
| `success`, `warning`, `info` (+ `-foreground`) | status badges (paid, DP, unpaid, active, etc.) |
| `border`, `input`, `ring` | borders, inputs, focus ring |
| `radius` | base corner radius |
| `chart-1..5` | statistics charts |

## Status badge mapping
- Invoice: DRAFT = muted, BOOKED = info, ACTIVE = primary, RETURNED = success, CANCELLED = destructive
- Payment: UNPAID = destructive, DP = warning, PAID = success

## theme.css skeleton
Monochrome brand values. Confirm the exact Tailwind v4 + shadcn wiring with the shadcn MCP before finalizing.

```css
@import "tailwindcss";

:root {
  --radius: 0.5rem;

  --background: oklch(1 0 0);                  /* white */
  --foreground: oklch(0.145 0 0);              /* near black */

  --card: oklch(1 0 0);
  --card-foreground: var(--foreground);
  --popover: oklch(1 0 0);
  --popover-foreground: var(--foreground);

  /* BRAND: edit these first */
  --primary: oklch(0.145 0 0);                 /* black */
  --primary-foreground: oklch(1 0 0);          /* white */
  --secondary: oklch(0.96 0 0);                /* light gray */
  --secondary-foreground: oklch(0.145 0 0);

  --muted: oklch(0.97 0 0);
  --muted-foreground: oklch(0.5 0 0);
  --accent: oklch(0.94 0 0);
  --accent-foreground: var(--foreground);

  /* Status colors stay colored even in a monochrome brand, so statuses remain distinguishable */
  --destructive: oklch(0.55 0.2 27);
  --destructive-foreground: oklch(0.98 0 0);
  --success: oklch(0.6 0.15 150);
  --success-foreground: oklch(0.98 0 0);
  --warning: oklch(0.8 0.15 80);
  --warning-foreground: oklch(0.25 0.05 80);
  --info: oklch(0.6 0.14 240);
  --info-foreground: oklch(0.98 0 0);

  --border: oklch(0.9 0 0);
  --input: oklch(0.9 0 0);
  --ring: oklch(0.145 0 0);
}

.dark { /* optional, define later if dark mode is wanted */ }

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-destructive-foreground: var(--destructive-foreground);
  --color-success: var(--success);
  --color-success-foreground: var(--success-foreground);
  --color-warning: var(--warning);
  --color-warning-foreground: var(--warning-foreground);
  --color-info: var(--info);
  --color-info-foreground: var(--info-foreground);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --radius-lg: var(--radius);
  --radius-md: calc(var(--radius) - 2px);
  --radius-sm: calc(var(--radius) - 4px);
}
```

## UI conventions
- Logo is white-on-black. On a white UI, use the logo mark on a black container (e.g. black sidebar header or login panel).
- Mobile-friendly: the admin will likely use a phone at the rental counter. Tables collapse to cards on small screens.
- Currency displays as `Rp 150.000` via `formatIDR()`. Never format inline.
- Destructive actions use a confirm dialog.
- Every list has loading, empty and error states.
