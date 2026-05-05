---
name: BioMine Intelligence
colors:
  surface: '#0c1321'
  surface-dim: '#0c1321'
  surface-bright: '#323949'
  surface-container-lowest: '#070e1c'
  surface-container-low: '#151b2a'
  surface-container: '#19202e'
  surface-container-high: '#232a39'
  surface-container-highest: '#2e3544'
  on-surface: '#dce2f6'
  on-surface-variant: '#c2c6d6'
  inverse-surface: '#dce2f6'
  inverse-on-surface: '#2a3040'
  outline: '#8c909f'
  outline-variant: '#424754'
  surface-tint: '#adc6ff'
  primary: '#adc6ff'
  on-primary: '#002e6a'
  primary-container: '#4d8eff'
  on-primary-container: '#00285d'
  inverse-primary: '#005ac2'
  secondary: '#ddb7ff'
  on-secondary: '#490080'
  secondary-container: '#6f00be'
  on-secondary-container: '#d6a9ff'
  tertiary: '#4cd7f6'
  on-tertiary: '#003640'
  tertiary-container: '#009eb9'
  on-tertiary-container: '#002f38'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#d8e2ff'
  primary-fixed-dim: '#adc6ff'
  on-primary-fixed: '#001a42'
  on-primary-fixed-variant: '#004395'
  secondary-fixed: '#f0dbff'
  secondary-fixed-dim: '#ddb7ff'
  on-secondary-fixed: '#2c0051'
  on-secondary-fixed-variant: '#6900b3'
  tertiary-fixed: '#acedff'
  tertiary-fixed-dim: '#4cd7f6'
  on-tertiary-fixed: '#001f26'
  on-tertiary-fixed-variant: '#004e5c'
  background: '#0c1321'
  on-background: '#dce2f6'
  surface-variant: '#2e3544'
typography:
  display-xl:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  display-lg:
    fontFamily: Inter
    fontSize: 36px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
    letterSpacing: '0'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
    letterSpacing: '0'
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
    letterSpacing: '0'
  label-caps:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1'
    letterSpacing: 0.08em
  mono-data:
    fontFamily: monospace
    fontSize: 14px
    fontWeight: '500'
    lineHeight: '1'
    letterSpacing: -0.01em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 8px
  container-padding: 32px
  gutter: 24px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 32px
---

## Brand & Style

This design system is engineered to project a sense of sovereign control over complex environmental data. It targets an audience of institutional investors and logistics executives who require high-density information delivered with the polish of a luxury automotive interface. 

The aesthetic is a sophisticated hybrid of **Minimalism** and **Glassmorphism**. It utilizes depth and transparency to organize data hierarchies without relying on heavy physical borders. The "Control Room" atmosphere is achieved through a dark, immersive canvas punctuated by precise neon accents, suggesting a platform that is always-on, intelligent, and operating at scale. The emotional response should be one of absolute clarity and high-tech reliability.

## Colors

The palette is anchored by a deep navy-charcoal base (#0B1220) which provides the necessary "bottomless" depth for glassmorphic elements to sit upon. 

- **Primary (Neon Blue):** Used for critical action states and primary data paths.
- **Secondary/Tertiary (Purple/Cyan):** Reserved for data visualization gradients and secondary status indicators, creating a "spectrum of intelligence."
- **Neutrals:** A scale of desaturated blue-grays is used for text and UI housing to maintain a cohesive atmospheric temperature.

Gradients should be used sparingly but impactfully—primarily on active states and high-level metric summaries—to simulate light emission within the interface.

## Typography

This design system utilizes **Inter** for its systematic, utilitarian precision. It mirrors the aesthetic of modern engineering tools while remaining highly legible at the small scales required for dense dashboards.

- **Headlines:** Use tight tracking and semi-bold weights to create a "blocky," authoritative feel.
- **Data Points:** For telemetry and numerical values, consider a monospaced alternative or Inter with tabular lining enabled to ensure alignment in high-frequency updates.
- **Labels:** Small, uppercase labels with increased letter spacing are used for metadata and utility navigation to differentiate from actionable content.

## Layout & Spacing

The layout philosophy follows a **Fluid Grid** model with a maximum content width of 1600px. A 12-column system is utilized for dashboard widgets, allowing for modular "masonry" style arrangements.

Spacing follows a strict 8px linear scale. Large-scale intelligence dashboards require breathing room to prevent cognitive overload; therefore, container padding is generous (32px), while internal component spacing remains tight (8px-16px) to maintain a technical, "instrument-panel" feel.

## Elevation & Depth

Depth is the primary navigator in this design system. Rather than traditional shadows, we use:

1.  **Backdrop Blurs:** All primary containers use a `20px` background blur with a `10%` white or `15%` primary-color tint.
2.  **Inner Glows:** Instead of drop shadows, use a 1px internal stroke (border) that transitions from a light-tinted top edge to a transparent bottom edge, simulating a top-down light source.
3.  **Layered Opacity:** Interactive elements sit on "Level 1" (opaque navy), while static background elements sit on "Level 0" (the background hex). 
4.  **Neon Bloom:** For active elements, a subtle outer glow using the primary color at 20% opacity creates a "bloom" effect, signifying importance or "live" status.

## Shapes

The shape language is characterized by "Soft Precision." Cards and major containers utilize a **16px to 20px** corner radius. This softens the technical nature of the data and gives the dashboard a premium, modern-app feel. 

Buttons and smaller interactive tokens (chips, inputs) follow a 12px radius to maintain a consistent visual family without appearing overly "bubbly." The goal is to avoid sharp 90-degree angles to maintain the fluid, glass-like theme.

## Components

### Cards & Widgets
The foundational unit of this design system. Cards must have a `1px` border with `rgba(255,255,255,0.1)` opacity. On hover, the border should transition to a gradient of Primary-to-Tertiary colors.

### Buttons
- **Primary:** Solid neon gradient background with white text.
- **Ghost:** Transparent background with a `1px` primary-colored border and subtle hover glow.
- **Micro-interactions:** Buttons should slightly scale (0.98) on click and feature a smooth transition (200ms ease-out) on hover.

### Inputs
Search and filter fields should be dark-filled with a subtle "glass" sheen. The focus state is indicated by a glowing primary-color border and a 4px outer bloom.

### Status Indicators (Glow-dots)
Critical for waste management status (e.g., bin capacity, fleet location). These use a pulsing animation for "active" or "warning" states, utilizing the neon palette to draw immediate visual attention.

### Progress & Gauges
Radial gauges and linear bars should use gradients rather than flat colors to denote progress, reinforcing the "intelligence and scale" vibe.