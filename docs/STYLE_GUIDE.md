# StudioNXT — Design System & Style Guide
**Version:** 1.0 — March 2026

---

## Brand Identity

StudioNXT is a living digital archive for artists. The visual language should feel like a museum catalogue — warm, considered, never clinical. Every design decision must pass the **Carol test**: if a 94-year-old artist can use it without help, it passes.

---

## Colour Tokens

Defined in `src/app/globals.css` as CSS custom properties.

### Dark Mode (default)
| Token | Value | Usage |
|-------|-------|-------|
| `--bg-primary` | `#0D0B09` | Page background — warm near-black |
| `--bg-card` | `#171410` | Card backgrounds |
| `--bg-card-hover` | `#1E1A16` | Card hover state |
| `--border` | `#2E2820` | All borders and dividers |
| `--border-light` | `#221E18` | Subtle borders |
| `--text-primary` | `#F0EBE3` | Main text — warm white |
| `--text-secondary` | `#8A8480` | Supporting text |
| `--text-muted` | `#504840` | Placeholder, hints |
| `--purple` | `#7e22ce` | Primary interactive — buttons, active states |
| `--purple-light` | `#a855f7` | Labels, section headers |
| `--purple-bg` | `rgba(126,34,206,0.12)` | Purple tinted backgrounds |
| `--gold` | `#C4A35A` | Legacy sections only |
| `--gold-light` | `#D4B870` | Gold hover |
| `--gold-bg` | `rgba(196,163,90,0.10)` | Gold tinted backgrounds |
| `--gold-border` | `rgba(196,163,90,0.25)` | Gold borders |

### Light Mode
| Token | Value |
|-------|-------|
| `--bg-primary` | `#F7F4F0` |
| `--bg-card` | `#FFFFFF` |
| `--bg-card-hover` | `#F0EBE3` |
| `--border` | `#E0D8D0` |
| `--text-primary` | `#1A1612` |
| `--text-secondary` | `#6B6460` |
| `--text-muted` | `#9A9490` |

---

## Typography

### Fonts
| Font | Variable | Usage |
|------|----------|-------|
| Playfair Display | `--font-playfair` | All headings, artist names, section titles |
| Inter | `--font-inter` | All body text, labels, UI elements |

### Scale
| Element | Size | Weight | Font |
|---------|------|--------|------|
| Page heading h1 | `2rem` (32px) | 600 | Playfair |
| Section heading h2 | `1.375rem` (22px) | 600 | Playfair |
| Sub heading h3 | `1.125rem` (18px) | 500 | Playfair |
| Body text | `0.875rem` (14px) | 400 | Inter |
| Section label | `0.6875rem` (11px) | 500 uppercase | Inter |
| Metadata | `0.75rem` (12px) | 400 | Inter |

### Section labels
All section labels use: `text-xs text-purple-400 uppercase tracking-widest`  
Example: `ARCHIVE`, `STEP 1 OF 4`, `YOUR FOLIO`

---

## Spacing

| Usage | Value |
|-------|-------|
| Page horizontal padding (desktop) | `px-6` (24px) |
| Card padding | `p-5` (20px) |
| Section gap | `space-y-5` or `gap-5` |
| Input height | `py-3 px-4` |
| Button height (primary) | `py-4` |
| Border radius (card) | `rounded-2xl` (16px) |
| Border radius (button) | `rounded-2xl` (16px) |
| Border radius (input) | `rounded-xl` (12px) |
| Border radius (chip/badge) | `rounded-full` |

---

## Components

### Primary Button
```
bg-purple-700 hover:bg-purple-600 text-white
py-4 px-6 rounded-2xl text-sm font-medium
transition-all
```

### Secondary Button
```
bg-card border border-default hover:border-purple-700
text-secondary hover:text-primary
py-4 px-6 rounded-2xl text-sm
transition-all
```

### Input / Select
```
w-full bg-background border border-default text-primary
rounded-xl px-4 py-3 text-sm
focus:outline-none focus:border-purple-500
transition-colors
```

### Section Label
```
text-xs text-purple-400 uppercase tracking-widest mb-1.5 block
```

### Card
```
bg-card border border-default rounded-2xl
hover:border-purple-700 transition-all
```

### Status Badges
| Status | Style |
|--------|-------|
| Available | `border-purple-800 text-purple-400` |
| Sold | `border-green-800 text-green-400` |
| Consigned | `border-yellow-800 text-yellow-400` |
| Not for sale | `border-default text-secondary` |

### Gold / Legacy Sections
```
background: var(--gold-bg)
border: 1px solid var(--gold-border)
border-radius: 1rem
color: var(--gold) for labels
```

---

## Icons

All icons are SVG inline — no emoji anywhere in the UI. This is Design Principle #3.  
Stroke width: `1.5`  
Stroke linecap/linejoin: `round`  
Size: `22px` (nav), `20px` (action icons), `16px` (inline), `28px` (empty states)

---

## Design Principles

1. **One thing at a time** — never show two competing actions
2. **Warm, not clinical** — this is a relationship with the artist's life work
3. **No emoji** — replaced with SVG icons throughout
4. **Gallery quality** — typography and spacing should feel like a museum catalogue
5. **Mobile first** — artists photograph work on their phones
6. **Never say "valuation"** — say "what this is worth"
7. **Never say "commission"** — say "gallery split"
8. **Carol test** — if a 94-year-old can use it without help, it passes

---

## Public Artist Page (Folio)

The public page uses a separate design system inspired by FAMM collection online.

| Token | Value |
|-------|-------|
| Primary text | `rgb(54, 40, 91)` — deep purple-blue |
| Background | `#ffffff` |
| Page bg | `#f5f4f2` — warm off-white |
| Borders | `rgb(229, 231, 235)` |
| Heading font | `Avenir Next Condensed, Arial Narrow, ui-serif` |
| Body font | `ui-sans-serif, system-ui, sans-serif` |
| Heading size | `clamp(52px, 6vw, 84px)` — bold, uppercase |
| Body size | `16px`, weight 500, line-height 24px |

---

## Navigation

### Desktop (≥768px)
```
Logo + StudioNXT | Wall  Archive  Folio | [Avatar] | + Add
```

### Mobile (<768px)
```
Bottom bar: Wall | Archive | [+ FAB] | Voices | Profile
```

---

## Tailwind Class Aliases

Defined in `tailwind.config.ts` and `globals.css`:

| Alias | Maps to |
|-------|---------|
| `bg-background` | `var(--bg-primary)` |
| `bg-card` | `var(--bg-card)` |
| `bg-card-hover` | `var(--bg-card-hover)` |
| `text-primary` | `var(--text-primary)` |
| `text-secondary` | `var(--text-secondary)` |
| `text-muted` | `var(--text-muted)` |
| `border-default` | `var(--border)` |
| `font-display` | Playfair Display |
| `font-sans` | Inter |
