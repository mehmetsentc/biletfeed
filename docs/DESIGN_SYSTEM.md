# BiletFeed Design System

Tek referans: **BiletFeed logosu** (Siyah · Beyaz · Turuncu `#FF8A00`).

## Mimari

```
app/theme.css          ← CSS token kaynağı (renk, spacing, radius, shadow)
app/globals.css        ← Tailwind v4 @theme, base styles, utilities
lib/config/design-tokens.ts  ← TypeScript referans
lib/config/brand-theme.ts    ← Marka sabitleri (email, OG, PDF, inline style)
components/ui/*        ← shadcn primitives (token tüketir)
```

**Varsayılan tema:** Light (`ThemeProvider defaultTheme="light"`)

**Font:** Inter (`next/font/google` → `--font-inter`)

## Renk sistemi

| Token | Light | Dark |
|-------|-------|------|
| `--bf-orange` | #FF8A00 | #FF8A00 |
| `--bf-orange-hover` | #F57C00 | #F57C00 |
| `--bf-orange-soft` | #FFF4E8 | rgba(255,138,0,0.12) |
| `--bf-bg` | #FFFFFF | #0A0A0A |
| `--bf-surface` | #FAFAFA | #101010 |
| `--bf-card` | #FFFFFF | #151515 |
| `--bf-border` | #E9E9E9 | #2B2B2B |
| `--bf-text` | #111111 | #FFFFFF |
| `--bf-text-secondary` | #5A5A5A | rgba(255,255,255,0.72) |
| `--bf-text-muted` | #777777 | rgba(255,255,255,0.55) |

**Status:** `--bf-success`, `--bf-warning`, `--bf-danger`, `--bf-info` (+ `--bf-*-soft` varyantları)

**Özel yüzeyler:**
- `--ticket-page-bg` / `--ticket-card-bg` — bilet & davetiye sayfaları (OLED koyu)
- `--organizer-*` — organizatör paneli chrome (header, sidebar, shell)

## Spacing

`4 · 8 · 12 · 16 · 20 · 24 · 32 · 48 · 64` px (`--space-*`)

## Radius

| Bileşen | Token | Değer |
|---------|-------|-------|
| Button | `--radius-button` | 14px |
| Input | `--radius-input` | 14px |
| Card | `--radius-card` | 20px |
| Dialog | `--radius-dialog` | 24px |
| Image | `--radius-image` | 18px |

## Bileşen kuralları

- **Primary button:** Turuncu, hover `#F57C00`, shadow, h-11
- **Input:** border-2, focus turuncu glow (`--shadow-focus`)
- **Card:** rounded-20, hafif shadow, hover elevation
- **Admin sidebar:** Her zaman `#0A0A0A`, aktif menü turuncu
- **Organizer chrome:** Header `#0A0A0A`, sidebar `#101010`, içerik `organizer-surface` (açık)
- **Focus ring:** Turuncu, WCAG AA+

## Utility sınıfları

```css
.bg-ticket-page, .bg-ticket-card
.bg-organizer-shell, .bg-organizer-header, .bg-organizer-sidebar
.text-brand-orange, .text-organizer-chrome, .text-organizer-chrome-muted
.organizer-surface  /* organizatör içerik alanı — light token override */
```

## Kullanım

```tsx
// ✅ Doğru — semantic token
className="bg-primary text-foreground border-border"

// ✅ PDF / inline style — brandTheme import
import { brandTheme } from '@/lib/config/brand-theme';

// ❌ Yanlış — hardcoded
className="bg-[#FF9900] text-zinc-600"
```

## Kalan işler (opsiyonel)

- [ ] Etkinlik kartı hover scale (Framer Motion 1.02)
- [ ] Storybook / component gallery
- [ ] Select / Tabs shadcn primitive ekleme (henüz projede yok)
