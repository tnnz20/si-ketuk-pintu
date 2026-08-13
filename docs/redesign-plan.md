# Redesign Landing Page: Si Ketuk Pintu

## Design Read

> **Reading this as:** Public-sector government visitor portal landing page for Indonesian citizens, with a **trust-first + modern accessibility** language, leaning toward **refined neutral palette + purposeful motion + asymmetric layout** — not generic AI-purple gradient slop.

**Current problem:** The existing landing page is too static, symmetric, and "template-y". Hero is basic split-screen with placeholder image, status check is buried below the fold, and the "How It Works" section uses generic equal cards. No visual hierarchy, no motion, no personality.

**Constraints:** Public-sector means accessibility-first, readable, and professional. But "public-sector" doesn't mean "boring". We can be modern, dynamic, and engaging while remaining trustworthy.

---

## Design Direction

### Palette (Locked)
- **Background:** Warm neutral `#fafaf0` (existing, keep)
- **Primary:** Deep charcoal `#1a1c16` (existing, keep for text)
- **Accent:** **Emerald green** `#0d9488` (new, single accent, locked)
- **Surface hierarchy:** Existing M3 tokens, refined
- **No purple/blue AI gradients. No warm beige/brass.**

### Typography
- **Display:** Plus Jakarta Sans (existing, keep)
- **Body:** Public Sans (existing, keep)
- **Emphasis:** Bold/italic of same family only

### Three Dials
| Dial | Value | Rationale |
|------|-------|-----------|
| `DESIGN_VARIANCE` | **7** | Asymmetric, editorial, anti-center bias |
| `MOTION_INTENSITY` | **6** | Scroll reveals, hover physics, purposeful animation |
| `VISUAL_DENSITY` | **4** | Balanced, not too airy not too cramped |

---

## Redesign Plan

### 1. Install Dependencies

Add animation libraries:
```bash
npm install motion gsap
```

**Files to modify:** `apps/frontend/package.json`

---

### 2. Hero Section — Complete Overhaul

**Current:** Static 50/50 split, boring dot pattern, generic image, no motion.

**New Design:**
- **Layout:** Asymmetric 60/40 split (content left, visual right) with staggered entry
- **Background:** Animated grain texture + subtle floating geometric shapes (CSS-only, no heavy canvas)
- **Content:** Eyebrow badge (animated pulse), headline with staggered word reveal, subtext fade-in
- **Visual:** Replace static image with **interactive token preview card** — a floating, tilted card showing a sample visit token with shine effect on hover
- **Motion:**
  - Words in headline animate in with `staggerChildren` (Motion)
  - Floating card has gentle `y` oscillation + mouse-tracked tilt
  - CTA buttons have magnetic hover + scale feedback
  - Scroll indicator at bottom with bounce animation

**Files to create:** `apps/frontend/src/components/landing/HeroSection.tsx`

---

### 3. Status Check Section — Elevated to Hero-Level

**Current:** Boring white box, buried below fold, no visual weight.

**New Design:**
- **Layout:** Full-width section with asymmetric split — left side has contextual copy, right side has elevated status card
- **Card:** Glassmorphism-inspired (subtle, not slop) with layered borders, inner shadow, and backdrop blur
- **Input:** Animated focus ring, token character counter (12-digit), real-time validation feedback
- **Motion:**
  - Section reveals on scroll with `whileInView` stagger
  - Input has `layout` animation on focus
  - Submit button has loading state with skeleton + spinner

**Files to create:** `apps/frontend/src/components/landing/StatusSection.tsx`

---

### 4. How It Works — Bento Grid with Visual Rhythm

**Current:** 3 equal white cards, same layout, no visual variety.

**New Design:**
- **Layout:** Asymmetric bento grid — 1 large cell + 2 smaller cells
- **Cell 1 (Large):** "Submit Request" — includes mini form preview illustration (CSS-built, not fake divs)
- **Cell 2:** "Review & Approval" — includes timeline/flow visual with connecting line
- **Cell 3:** "Visit" — includes QR/token visual
- **Motion:**
  - Scroll-triggered stagger reveal
  - Hover: cell scales up slightly, icon rotates
  - Number watermark has parallax drift on scroll

**Files to create:** `apps/frontend/src/components/landing/ProcessSection.tsx`

---

### 5. Trust & Social Proof Section (NEW)

**Current:** Missing entirely.

**New Design:**
- **Layout:** Horizontal strip below hero with institutional logos + stats
- **Content:** 3 key metrics (e.g., "2,400+ visits processed", "98% approval rate", "24h avg response")
- **Visual:** Logos as SVG marks (Simple Icons style), stats as large display numbers
- **Motion:** Counter animation on scroll (numbers tick up), logo marquee (single, subtle)

**Files to create:** `apps/frontend/src/components/landing/TrustSection.tsx`

---

### 6. Final CTA Section (NEW)

**Current:** Missing — page just ends after How It Works.

**New Design:**
- **Layout:** Full-width, centered but with asymmetric background shape
- **Content:** Bold headline, single CTA button
- **Visual:** Animated gradient mesh (subtle, emerald tint, not AI-purple)
- **Motion:** Text scales in on scroll, button has pulse glow

**Files to create:** `apps/frontend/src/components/landing/CTASection.tsx`

---

### 7. Global Animation Utilities

**Files to create:**
- `apps/frontend/src/components/landing/animations.ts` — Motion variants, easing curves, shared transitions
- `apps/frontend/src/hooks/useMousePosition.ts` — For magnetic/tilt effects (uses `useMotionValue`, not `useState`)

---

### 8. Update LandingPage.tsx

Replace monolithic file with composition of new section components.

**Files to modify:** `apps/frontend/src/pages/public/LandingPage.tsx`

---

### 9. CSS Enhancements

Add to `index.css`:
- Grain texture overlay
- Custom scrollbar (subtle, matches theme)
- Selection color (emerald tint)
- Reduced-motion media query fallbacks

**Files to modify:** `apps/frontend/src/index.css`

---

## File Structure After Redesign

```
apps/frontend/src/
├── components/
│   └── landing/
│       ├── HeroSection.tsx
│       ├── StatusSection.tsx
│       ├── ProcessSection.tsx
│       ├── TrustSection.tsx
│       ├── CTASection.tsx
│       └── animations.ts
├── hooks/
│   └── useMousePosition.ts
├── pages/
│   └── public/
│       └── LandingPage.tsx (simplified)
└── index.css (enhanced)
```

---

## Pre-Flight Checklist (design-taste-frontend)

- [ ] No AI-purple gradients
- [ ] Single accent color locked (emerald)
- [ ] Max 1 eyebrow per 3 sections
- [ ] Hero fits in viewport, max 4 text elements
- [ ] No fake div-based screenshots
- [ ] All buttons pass contrast check
- [ ] No duplicate CTA intent
- [ ] Motion honors `prefers-reduced-motion`
- [ ] No `window.addEventListener("scroll")` — use Motion/GSAP
- [ ] No `useState` for continuous values — use `useMotionValue`
- [ ] Bento grid has visual variety (not all white cards)
- [ ] Section layouts don't repeat

---

## Open Questions for User

1. **Logo/Brand assets:** Do you have institutional logos (government, partner agencies) for the Trust Section, or should I use placeholder marks?
2. **Real content:** Should I keep the current English copy or switch to Bahasa Indonesia for a more local feel?
3. **Image assets:** The current hero uses `/assets/logo.webp` — do you have a real government building photo, or should I generate one with the image tool?
