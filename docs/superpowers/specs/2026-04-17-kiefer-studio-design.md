# kiefer.studio - Design Spec

## Overview

Personal portfolio website for Kevin Kiefer at `kiefer.studio`. A scroll-driven, GSAP-animated single-page site inspired by robhemus.co.uk, tuned to Kevin as a solo creative technologist. The site showcases iOS apps, web experiences, 3D printing, game dev, and AI research in a single flat stream. Tagline: "Look what one person can build."

**Primary job:** Showcase the full creative range (personal projects lead), with client work as proof of execution capability. Audience is everyone equally: potential clients, peers, and the general creative community.

## Stack

- Vanilla HTML / CSS / JS (no framework)
- GSAP + ScrollTrigger (scroll animations, color shifts, text reveals)
- Lenis (smooth scrolling)
- SplitType (text character/line splitting for GSAP reveals)
- Three.js + GLTFLoader (3D bust with pixelation post-processing)
- Hosted statically (Vercel, Netlify, or similar)

## Typography

- **Display (hero, section titles, project names, nav logo, marquee pills):** OffBit by Gravual (pixelated/bitmap font). Fallback: Silkscreen from Google Fonts during dev.
- **Labels/metadata:** JetBrains Mono (monospace)
- **Body text:** Space Grotesk (clean sans)

## Color System

Chameleon approach with bold saturated section backgrounds that shift on scroll. Colors in CSS variables.

```css
:root {
  --bg-base: #D9D9D9;       /* light grey, default/hero */
  --bg-blue: #012FFF;        /* electric blue */
  --bg-pink: #FFBDFF;        /* hot pink */
  --bg-yellow: #FFFF62;      /* electric yellow */
  --bg-cyan: #7DFFFF;        /* cyan */
  --bg-dark: #202020;        /* dark sections */
  --text-dark: #202020;      /* text on light bgs */
  --text-light: #F0ECE4;     /* text on dark bgs */
  --border-light: rgba(32, 32, 32, 0.12);
  --border-dark: rgba(255, 255, 255, 0.1);
}
```

Background transitions use GSAP scroll-triggered color shifts (via the `variables-color-scroll` pattern Rob uses, or custom ScrollTrigger callbacks). Each section has its own bg color. Transitions are smooth (0.6-0.8s ease).

## Page Structure (6 sections)

### 1. Navigation (fixed)

- Position: fixed, `mix-blend-mode: difference` (auto-inverts on any bg)
- Left: "Kiefer" logo in OffBit
- Center: "Work" | "About" links in JetBrains Mono
- Right: "Contact" pill button in OffBit
- Mobile: hamburger menu

### 2. Hero (full viewport, bg: --bg-base)

- **Diagonal text bands behind the bust:**
  - Band 1 (top, slight angle -4deg): "design and code and build and" in OffBit ~28px, blue bg, white text, marquee scroll
  - Band 2 (middle, steeper -6deg): "KIEFER STUDIO" in OffBit ~72px, blue bg, white text, marquee scroll
  - Band 3 (bottom, horizontal): "self-taught . developer . designer . builder" in OffBit ~18px, yellow bg, dark text, reverse marquee
- Bust sits ON TOP of all bands (z-index layering)
- Nav: Rob-style layout (links left, stacked pixel logo center, contact strip right)
- **Center: Three.js 3D bust (large, overlapping diagonal text bands)**
  - Model: `/assets/models/kiefer-bust.glb` (original Meshy textured model)
  - Position: centered in viewport, large (fills ~70% height), z-indexed above text bands
  - **Rendering pipeline:**
    - GLTFLoader imports the original smooth textured model (NOT voxelized)
    - WebGLRenderer with `alpha: true`, `setClearColor(0x000000, 0)` - fully transparent canvas, NO background box
    - Canvas covers hero section, floats seamlessly over page content
    - Grayscale: custom shader material or EffectComposer LuminosityEffect (black and white like Rob's)
    - RenderPixelatedPass: renders at reduced resolution, nearest-neighbor upscale for sprite/pixel edges while preserving model detail
    - The result should match Rob Hemus exactly: high-detail grayscale model with crispy pixelated edges, no frame, no background
  - **Mouse interaction:** mousemove listener, model rotation lerps toward cursor (+/-10 degrees on X/Y)
  - **Scroll behavior (GSAP ScrollTrigger scrub):**
    - Y-axis rotation increases as user scrolls down
    - Camera dollies closer + shifts down (full figure > torso > head only)
    - Opacity fades to 0 at scroll threshold
    - All reverses when scrolling back up
  - Hidden on mobile (< 768px), replaced with static pixelated image fallback
- GSAP: Character-split reveal animation on "KIEFER" on page load

### 3. Discipline Marquee (bg: inherits, border top/bottom)

- Infinite horizontal scroll marquee
- Pill-shaped tags in OffBit: "iOS Apps", "Immersive Web", "3D Printing", "Game Dev", "AI Research", "Branding", "Motion", "Typography"
- Mix of outlined pills and filled pills (filled = --bg-blue with white text)
- Duplicated content for seamless loop
- CSS animation: `translateX(0) to translateX(-50%)`, 30s linear infinite

### 4. Statement Section (bg: --bg-blue, text: white)

- Label: "01 // What I Do" in JetBrains Mono
- Title: "One Person. Full Stack. Every Pixel." in OffBit, `clamp(40px, 7vw, 100px)`
- GSAP: Line-by-line reveal on scroll entry

### 5. Projects - Horizontal Drag Scroll (bg: --bg-dark, text: white)

- Header: "Selected Work" label + "Drag >" hint in JetBrains Mono
- Horizontal scrolling track, drag-enabled (GSAP Draggable or native scroll-snap)
- GSAP ScrollTrigger pins this section while user drags/scrolls horizontally
- Each project card:
  - Min-width: 400px, aspect-ratio: 4/3
  - Background: project-specific color gradient (chameleon per project)
  - Project name watermark in OffBit at low opacity center
  - Hover: scale 1.05, overlay fades in with project name + tags
  - Click: navigates to `/work/[project-slug]` case study page
- Ghost text: current/hovered project name in OffBit at ~6% opacity, bottom-right

**Projects list (initial):**

| Project | Color | Tags |
|---------|-------|------|
| Cymatics Lab | Deep blue (#0a1050 > #1a2a8e) | iOS, Metal, Audio Visualization |
| Imago | Deep green (#0a3a15 > #1a6e2a) | iOS, AI, ADHD Companion |
| Border Child | Amber (#3a2a0a > #6e4e1a) | Web, R3F, Film |
| NovaTrade | Teal (#0a2a3a > #1a4e6e) | macOS, SwiftUI, Trading |
| Resonance | Purple (#2a0a3a > #4e1a6e) | iOS, Metal, Consciousness |
| ClearMind | Red (#3a0a0a > #6e1a1a) | iOS, Canvas, Neural Map |
| Chrysalis | Gold (#3a3a0a > #6e6e1a) | Unity, 3D, Game |
| ShalaMakes | Teal-green (#0a3a3a > #1a6e6e) | Web, 3D Printing, Store |

### 6. Services (bg: --bg-pink, text: --text-dark)

- Label: "02 // Services" in JetBrains Mono
- Title: "What I Build" in OffBit
- Grid: `auto-fit, minmax(250px, 1fr)`, 2px gap
- Each service card:
  - Service name in OffBit
  - Tech stack in JetBrains Mono (dimmed)
  - Hover: reveals a tagline (Rob-style personality text like "with hot irons")
  - Background: `rgba(0,0,0,0.06)`, hover `rgba(0,0,0,0.12)`

**Services:**
- iOS & macOS (SwiftUI, Metal, Core ML)
- Immersive Web (React, Three.js, GSAP)
- 3D & Game Dev (Unity, Blender, Meshy)
- Branding (Identity, Typography, Direction)
- 3D Printing (Product Design, Prototyping)
- AI & Research (Agents, ML, Consciousness)

### 7. About (bg: --bg-cyan, text: --text-dark)

- Label: "03 // About" in JetBrains Mono
- Body text in Space Grotesk, 26px, weight 300, max-width 720px
- Content: "Self-taught developer and designer. I build across iOS, macOS, web, and physical objects. From Metal shaders to 3D printing to consciousness research. Based in Laredo, Texas. Everything on this site was designed, coded, and shipped by one person."
- GSAP: SplitType line-by-line reveal on scroll

### 8. CTA Bridge (bg: --bg-yellow, text: --text-dark)

- Center-aligned "Got An Idea?" in OffBit, `clamp(48px, 10vw, 140px)`
- Below: "Let's make it real" in JetBrains Mono
- Pure typographic moment, no other content

### 9. Footer (bg: --bg-dark, text: white)

- Big CTA: "Let's Build Something" in OffBit, `clamp(40px, 8vw, 120px)`
  - Hover: color shifts to --bg-yellow
- Closing marquee (reversed direction): "ShalaWorks", "ShalaMakes", "Available for Projects", "Laredo TX"
- Social links: GitHub, Twitter, Instagram, Email (JetBrains Mono, dimmed, hover white)
- Copyright: "2026 Kiefer" in JetBrains Mono

## Animation Inventory

| Animation | Trigger | Library |
|-----------|---------|---------|
| Hero text character reveal | Page load | GSAP + SplitType |
| Marquee infinite scroll | Always | CSS @keyframes |
| Section background color shifts | Scroll position | GSAP ScrollTrigger |
| Three.js bust scroll (rotate, zoom, fade) | Scroll position | GSAP ScrollTrigger + Three.js |
| Three.js bust mouse follow | Mouse move | Three.js lerp |
| Statement text line reveal | Scroll into view | GSAP + SplitType |
| Projects horizontal pin + drag | Scroll into section | GSAP ScrollTrigger + Draggable |
| Project card hover scale + overlay | Mouse hover | CSS transitions |
| Service card hover tagline reveal | Mouse hover | CSS transitions |
| About text line-by-line reveal | Scroll into view | GSAP + SplitType |
| Footer CTA color change | Mouse hover | CSS transition |
| Smooth scrolling | Always | Lenis |

## Case Study Pages (future, not in v1)

Each project links to `/work/[slug]` but case study pages are a v2 concern. For v1, project cards can link to external URLs (App Store, GitHub, live sites) or be non-linking with a "Coming Soon" state.

## Responsive Behavior

- **Desktop (1200px+):** Full experience, Spline bust visible, horizontal project scroll
- **Tablet (768-1199px):** Spline bust hidden, projects may stack or use swipe, nav collapses to hamburger
- **Mobile (< 768px):** Spline bust hidden, single-column layout, marquee still runs, services stack to single column, text sizes scale down via clamp()

## Assets Required

- OffBit font files (commercial license from Gravual)
- 3D bust model: `~/Downloads/Meshy_AI_Sunlit_Fountain_Portr_0417060650_texture.glb` (copy to `/assets/models/kiefer-bust.glb`)
- Blender source (voxel variant, optional): `~/Documents/Projects/kiefer-studio/kiefer-bust-voxel.blend`
- Project screenshots/hero images for each project card (can use gradients as placeholders initially)
- Favicon: pixel-style "K" to match OffBit aesthetic

## Performance Targets

- First Contentful Paint: < 1.5s
- Spline scene: lazy-loaded after hero is visible
- Total page weight target: < 3MB (excluding Spline runtime)
- Lighthouse score target: 90+ on desktop
