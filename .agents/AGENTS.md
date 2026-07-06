# tether.arena — Project Rules for All Agents

> These rules are NON-NEGOTIABLE. Every agent working on this project MUST follow them without deviation.
> Do not override, soften, or "improve" any of these rules. If you are unsure, do less, not more.

---

## 1. Identity

**Product name:** `tether.arena`

**Wordmark rendering rule (typography):**
- `tether.` — font-weight 800 (bold), color `#F2F1EF`
- `arena` — font-weight 400 (regular/thin), same size, same baseline, color `#F2F1EF`
- The dot between them (`.`) — color `#A5A5A3` (silver), NOT bold weight
- This mirrors Tether's own lockup: brand name carries the visual weight, product name is the quieter label
- This treatment must be used **everywhere** the wordmark appears — page tops, emails, social copy, docs

**Tagline (below wordmark):** "The Conditional Payment Engine" — `#A5A5A3`, 15px, bold

---

## 2. Color System — STRICT

These are the ONLY colors permitted in the UI. Do not introduce any others.

| Token | Hex | Usage |
|---|---|---|
| `--bg-center` | `#050505` | Background center / top-left |
| `--bg-edge` | `#181818` | Background edge (radial gradient) |
| `--surface` | `#0D0D0D` | Cards, inputs, expanded panels |
| `--border` | `#2A2A2A` | All borders, input outlines |
| `--border-emphasis` | `#3A3A3A` | Highlighted/selected row border |
| `--divider` | `#1A1A1A` | Horizontal divider lines between rows |
| `--text-primary` | `#F2F1EF` | Headings, values, bold labels |
| `--text-secondary` | `#A5A5A3` | Small labels, field names, nav hints |
| `--text-muted` | `#797977` | Descriptions, placeholders, fine print |
| `--accent` | `#D53131` | **PRIMARY BUTTONS ONLY** — RGB(213, 49, 49) |
| `--accent-text` | `#000000` | Text inside accent-colored buttons |

**The accent color `#D53131` is ONLY permitted on:**
- Primary CTA buttons (solid fill)
- The "Claim" action button on the dashboard row

**The accent color is FORBIDDEN on:**
- Nav elements or wordmark
- Status labels, badges, tags, or dots
- Icons or decorative elements
- Input borders (even on focus — use `#3A3A3A` at most)
- Secondary / ghost buttons
- Any text anywhere

**Background rule:**
- Always a CSS radial gradient: `radial-gradient(ellipse at top left, #050505 0%, #181818 100%)`
- Never a flat solid color
- Never a linear gradient
- Never a texture or image background

---

## 3. Typography

**Primary font:** Sharp Grotesk (Bold for headings/amounts, Book for body)
**Fallback / body font:** Schibsted Grotesk (available on Google Fonts)
**Monospace (amounts/addresses):** system monospace stack — `'SF Mono', 'Roboto Mono', monospace`

**Type scale:**

| Use | Size | Weight | Color |
|---|---|---|---|
| Page heading | 32–48px | 800 | `#F2F1EF` |
| Hero headline | 52–60px | 800 | `#F2F1EF` |
| Body / row text | 15–16px | 500–600 | `#F2F1EF` |
| Field labels | 12–13px | 400 | `#A5A5A3` |
| Description / fine print | 13px | 400 | `#797977` |
| Step indicators | 11px | 400 | `#797977`, uppercase, letter-spacing 0.1em |
| Amounts (monospace) | 14–15px | 400 | `#F2F1EF`, tabular-nums |

**Typography prohibitions:**
- No em dashes (`—`) anywhere in UI copy. Use "and", commas, or full stops instead
- No Inter, Outfit, or Roboto for headings
- No gradient text
- No colored text (only the three text token values above)

---

## 4. Layout Principles

- **No navbar.** The `tether.arena` wordmark sits at the top of each page, centered or left-aligned, as the sole persistent element. No navigation links beside it.
- **Centered columns.** Content is in a centered column: max-width `440px` for single-task pages, `640px` for list pages.
- **Generous vertical breathing room.** Sections are separated by large gaps (48–80px). Do not pack elements.
- **Procedural, not dashboard-like.** Each page has ONE primary job. Do not add secondary widgets, stats, charts, or sidebar panels.
- **One primary CTA per screen.** One red button per page. It sits at the bottom of the content column.
- **Ghost/outline secondary buttons** use: `border: 1px solid #2A2A2A`, `background: transparent`, `color: #F2F1EF`. Never colored.

---

## 5. Components

### Buttons
```css
/* Primary CTA */
background: #D53131;
color: #000000;
font-weight: 700;
height: 52px;
border-radius: 10px;
width: 100%;
border: none;

/* Ghost / Secondary */
background: transparent;
color: #F2F1EF;
border: 1px solid #2A2A2A;
height: 52px;
border-radius: 10px;
width: 100%;

/* Small action button (e.g. dashboard Claim) */
background: #D53131;
color: #000000;
height: 32px;
border-radius: 6px;
padding: 0 18px;
font-weight: 700;
```

### Input Fields
```css
background: #0D0D0D;
border: 1px solid #2A2A2A;
border-radius: 10px;
height: 52px;
padding: 0 16px;
color: #F2F1EF;
font-size: 15px;
/* focus: */
border-color: #3A3A3A; /* never accent color on focus */
```

### Selection Rows (connect wallet, deposit options)
```css
background: #0D0D0D;
border: 1px solid #2A2A2A;
border-radius: 10px;
height: 72px;
padding: 0 20px;
display: flex;
align-items: center;
justify-content: space-between;
/* emphasized/recommended row: */
border-color: #3A3A3A; /* only — never accent color */
```

### List Rows (dashboard bets)
```css
/* No border, no background on rows themselves */
border-top: 1px solid #1A1A1A;
height: 72px;
display: flex;
align-items: center;
justify-content: space-between;
padding: 0;
```

### Dividers
```css
border: none;
border-top: 1px solid #1A1A1A;
```

---

## 6. Hero Copy — Landing Page (Final, Do Not Change)

```
tether.arena                               <- wordmark, weight treatment as above
The Conditional Payment Engine             <- tagline, #A5A5A3

BANTER, BACKED BY ESCROW.                 <- pre-headline, bold silver, spaced caps

Put your money                             <- main headline, #F2F1EF 56px bold
where your mouth is.

AI powered conditional tipping engine.    <- subhead, #797977
Tweet a tip at any username based on
match outcomes. Talk in plain language,
and the money moves automatically when
the match settles. Available on Discord
and Telegram.

[  Place a Bet  ]                          <- primary, #D53131
[  How it works  ]                         <- ghost, white border only
```

---

## 7. What Is Explicitly Forbidden

The following must NEVER appear in this project's UI:

- No glassmorphism, blur effects, or frosted panels
- No gradients on text or buttons
- No neon glows or colored drop shadows
- No color outside the palette above (10 tokens, that is all)
- No orange (#F7931A or any variant) — accent is #D53131 red only
- No green for success states — use #F2F1EF white text instead
- No colored status badges or dots — pending = #797977 plain text only
- No page-load animations — hover transitions only, max 150ms ease
- No top navigation bar with links
- No cards inside cards — one surface depth only
- No emoji in UI copy
- No em dashes in any copy
- No centered text on dashboard/list pages — left-align content, only hero is centered
- No multiple primary buttons on one page
- No Inter, Outfit, or Nunito fonts

---

## 8. Reference Screens

The approved design is documented in the agent artifacts directory. When in doubt, refer to the v3 screens generated in conversation `75bf5fe4-5fdb-416d-946d-85008a1874a4`:

- `v3_hero_landing` — Landing hero
- `v3_screen2_place_bet` — Place bet form
- `v3_screen3_connect` — Connect / create wallet
- `v3_screen4_dashboard` — My Bets dashboard
- `v3_screen5_deposit` — Deposit (QR + bridge)
- `v3_screen6_claim` — Claim / MagicPay

The visual reference for this design system is **wallet.tether.io** and the **Tether wallet app**. When unsure about a design decision, ask: "Does this look like it belongs on wallet.tether.io?" If no, strip it back further.

- NEVER commit Supabase Personal Access Tokens (e.g. sbp_v0_...) or API keys to the repository.
