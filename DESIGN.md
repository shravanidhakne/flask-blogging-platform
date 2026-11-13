# Design Brief

## Direction

Ink & Ember — a warm-paper editorial blog with literary serif headlines and a single ember accent.

## Tone

Refined editorial/magazine — calm, readable and literary, so long-form writing feels considered rather than corporate.

## Differentiation

Warm paper canvas with an ember underline signature on section labels and serif display type throughout headings.

## Color Palette

| Token      | OKLCH          | Role                          |
| ---------- | -------------- | ----------------------------- |
| background | 0.965 0.012 78 | warm paper canvas             |
| foreground | 0.21 0.02 55   | ink-charcoal body text        |
| card       | 0.985 0.006 78 | post card / form surfaces     |
| primary    | 0.52 0.15 38   | ember CTA, links, active nav  |
| accent     | 0.5 0.08 175   | muted sage-teal secondary tag |
| muted      | 0.92 0.016 78  | alt section bands, chips      |

## Typography

- Display: Fraunces — hero, post titles, section headings, wordmark.
- Body: Satoshi — paragraphs, nav, labels, metadata, buttons.
- Mono: JetBrains Mono — dates and small code/URL accents only.
- Scale: hero `text-4xl md:text-6xl font-bold tracking-tight`, h2 `text-3xl md:text-4xl font-bold`, label `label-ember`, body `text-base md:text-lg leading-relaxed`.

## Elevation & Depth

Layered warm surfaces: page on `bg-background`, cards lifted with `shadow-subtle` rising to `shadow-elevated` on hover; no glow.

## Structural Zones

| Zone    | Background       | Border     | Notes                                    |
| ------- | ---------------- | ---------- | ---------------------------------------- |
| Header  | `bg-card`        | `border-b` | sticky, shadow-subtle, wordmark + auth   |
| Content | `bg-background`  | —          | alternate `bg-muted/40` bands for rhythm |
| Footer  | `bg-muted/50`    | `border-t` | link columns + social icons              |

## Spacing & Rhythm

Sections `py-16 md:py-24`, container `mx-auto max-w-6xl px-4 sm:px-6 lg:px-8`, card grid `gap-6 md:gap-8`, micro-spacing `space-y-2` in metadata.

## Component Patterns

- Buttons: `rounded-md`, ember `bg-primary` solid for primary, `border-border` ghost for secondary, hover darkens + `shadow-subtle`.
- Cards: `rounded-lg bg-card border border-border shadow-subtle`, hover `shadow-elevated` + `-translate-y-0.5`.
- Badges: pill `rounded-full`, ember `bg-primary/10 text-primary`, sage accent for secondary tags.

## Motion

- Entrance: `animate-fade-up` staggered on hero and grid cards, 0.5s.
- Hover: `transition-smooth` lift + shadow shift on cards/buttons, 0.3s.
- Decorative: subtle `animate-fade-in` on section reveals only.

## Constraints

- Semantic tokens only — no raw hex, `rgb()`, or arbitrary `bg-[#...]` classes.
- Light mode primary; dark mode is a tuned warm-charcoal variant, not an inversion.
- Restrained palette: one ember accent plus one sage accent; generous whitespace.

## Signature Detail

An ember underline stroke beneath uppercase section labels and the hero subhead, echoing a hand-drawn editorial mark.

## Screens

- Home: nav + hero + card grid (title, excerpt, author, date) + footer.
- Post detail: title, author, date, formatted rich text, owner edit/delete.
- Create/edit: title field + rich-text toolbar (bold, italic, headings, lists, links) + publish/update.
- Dashboard: user's posts with edit/delete + create-new entry point.
- Profile: display name, username, bio, edit affordance, published posts.
- Sign-in: Internet Identity entry + profile setup form (display name, username, bio).
- All screens responsive: 1 column mobile, 2 tablet, 3 desktop.
