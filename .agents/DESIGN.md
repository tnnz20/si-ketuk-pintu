---
name: Civic Gateway
colors:
  surface: '#fafaf0'
  surface-dim: '#dadbd1'
  surface-bright: '#fafaf0'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f4f4ea'
  surface-container: '#eeeee5'
  surface-container-high: '#e9e9df'
  surface-container-highest: '#e3e3d9'
  on-surface: '#1a1c16'
  on-surface-variant: '#484740'
  inverse-surface: '#2f312b'
  inverse-on-surface: '#f1f1e7'
  outline: '#78776f'
  outline-variant: '#c9c6bd'
  surface-tint: '#5f5e58'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#1c1c17'
  on-primary-container: '#85847c'
  inverse-primary: '#c9c6be'
  secondary: '#466800'
  on-secondary: '#ffffff'
  secondary-container: '#b3f345'
  on-secondary-container: '#496d00'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#1e1b1e'
  on-tertiary-container: '#888286'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e5e2da'
  primary-fixed-dim: '#c9c6be'
  on-primary-fixed: '#1c1c17'
  on-primary-fixed-variant: '#484741'
  secondary-fixed: '#b6f648'
  secondary-fixed-dim: '#9bd92a'
  on-secondary-fixed: '#121f00'
  on-secondary-fixed-variant: '#344e00'
  tertiary-fixed: '#e8e0e5'
  tertiary-fixed-dim: '#ccc4c9'
  on-tertiary-fixed: '#1e1b1e'
  on-tertiary-fixed-variant: '#4a4549'
  background: '#fafaf0'
  on-background: '#1a1c16'
  surface-variant: '#e3e3d9'
  surface-alt: '#D2D2C8'
  status-success: '#14140F'
  status-info: '#D2D2C8'
typography:
  display:
    fontFamily: Plus Jakarta Sans
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Public Sans
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Public Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-md:
    fontFamily: Public Sans
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Public Sans
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 8px
  container-max: 1200px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 40px
---

## Brand & Style

The design system for this platform is built on the pillars of **institutional trust, radical clarity, and effortless accessibility**. It serves a diverse citizenry, requiring a UI that feels official yet welcoming—removing the friction typically associated with bureaucratic processes.

The aesthetic follows a **Modern Corporate** movement with a touch of **Minimalism**. It prioritizes high-legibility typography and a spacious, structured layout. The visual language avoids decorative clutter, ensuring that the user's path to completing a visitor request is unobstructed and intuitive. The result is a professional environment that communicates efficiency and government transparency.

## Colors

The palette is derived from a sophisticated, high-contrast base. 

- **Primary (#14140F):** Used for core branding, primary actions, and critical text. It provides a grounded, authoritative foundation.
- **Secondary (#BEFF50):** This high-visibility "electric lime" is used sparingly as a functional accent for progress indicators, success states, or subtle highlights that draw the eye without compromising the professional tone.
- **Neutral (#F5F5EB):** A "warm paper" white that reduces eye strain compared to pure white, serving as the primary background color.
- **Surface-Alt (#D2D2C8):** A muted stone grey used for secondary containers, borders, and disabled states, creating subtle separation between interface layers.

## Typography

The system utilizes **Plus Jakarta Sans** for headlines to provide a modern, approachable, and geometric feel that maintains authority. For body copy and data-dense labels, **Public Sans** is used due to its roots in government accessibility standards, offering exceptional legibility across all screen sizes.

Hierarchy is established through clear weight shifts rather than excessive size variations. All body text must maintain a minimum size of 16px to comply with accessibility guidelines for official platforms.

## Layout & Spacing

The layout employs a **fixed grid** system on desktop to maintain a structured, professional appearance, transitioning to a fluid model on mobile devices.

- **Grid:** A 12-column grid for desktop (1200px max width) and a 4-column grid for mobile.
- **Rhythm:** An 8px linear scale governs all padding and margins, ensuring vertical rhythm and consistent alignment.
- **White Space:** Generous padding (at least 64px between major sections) is used to prevent the interface from feeling "crowded," which reduces cognitive load for users filling out complex forms.

## Elevation & Depth

This design system avoids heavy shadows in favor of **Tonal Layers** and **Low-Contrast Outlines**.

- **Level 0 (Background):** Neutral (#F5F5EB).
- **Level 1 (Cards/Containers):** White (#FFFFFF) with a thin 1px border in Surface-Alt (#D2D2C8). This creates a crisp, architectural look.
- **Interactive States:** On hover, elements may gain a subtle "soft" shadow (0px 4px 12px rgba(20, 20, 15, 0.05)) to indicate interactivity without breaking the flat, modern aesthetic.
- **Depth:** Use layering only when necessary for overlays or modals, using a backdrop blur (8px) and a semi-transparent primary-color scrim (10% opacity).

## Shapes

The shape language is **Soft (0.25rem)**. This provides a balance between the precision of a government institution and the approachability of a modern service. 

- **Small Components:** Checkboxes and small buttons use a 4px (0.25rem) radius.
- **Large Components:** Cards and main input fields use an 8px (0.5rem) radius.
- **Special Elements:** Selection chips and tags may use a fully rounded (pill) shape to distinguish them from actionable buttons.

## Components

- **Buttons:** Primary buttons are Solid Primary (#14140F) with Neutral text. Secondary buttons are outlined. The "Success" or "Proceed" action can optionally use a Secondary (#BEFF50) background with Primary text for high emphasis.
- **Input Fields:** Fields use a white background with a 1px Surface-Alt border. Focused states utilize a 2px Primary border. Labels are always positioned above the field for maximum accessibility.
- **Cards:** Used to group form sections. They should be white with a 1px border. No heavy shadows.
- **Chips/Status:** Used for visitor request statuses (e.g., "Pending," "Approved"). Use high-contrast combinations—Primary background with Secondary text for "Approved" states to ensure they stand out.
- **Progress Steppers:** Essential for multi-page requests. Use a clean horizontal line with numbered circles, using the Secondary color to highlight the active step.
- **Lists:** Clean rows separated by 1px Surface-Alt dividers, with generous vertical padding (16px) to ensure touch targets are sufficient on mobile.