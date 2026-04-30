# Shader x Kiefer Experiment - Handoff

## What This Is
A mashup experiment: kiefer.studio's visual identity (pixelated Silkscreen font, blue/pink/yellow/cyan color system, 3D voxel bust) applied to shader.se's layout choreography (dark atmospheric base, CRT effects, cinematic scroll pacing, film strip carousel).

## Reference Sites
- **shader.se** (https://www.shader.se) - The layout/feel we're borrowing. Dark, atmospheric, CRT boot loader, curved 3D film strip for projects, chromatic aberration, cinematic scroll.
- **kiefer.studio** - The original portfolio. Source for the 3D bust, color tokens, Silkscreen typography, Borderlands cel-shading.

## Current State (working, builds clean)
- CRT boot loader with progress bar ✅
- Dark atmospheric base with CRT scan line + vignette overlay ✅
- 3D pixelated bust with Borderlands cel-shading, floating shapes, 3D marquee bands ✅
- Split hero (headline left, bust right), bust rotates on scroll ✅
- Marquee skill pills ✅
- Blue statement section with atmospheric glow ✅
- Film strip work carousel with 3D perspective ✅ (but needs rework - see below)
- Cyan about section, pink description section ✅
- Angled scrolling color bands (neon glow) ✅
- Dashed-border contact card ✅
- Dark footer with CTA ✅
- Chromatic aberration on all display headings ✅
- Lenis smooth scroll + GSAP ScrollTrigger text reveals ✅

## What Needs Work

### Film Strip - Make It Flowy
The Selected Work section currently has cards that rotate individually like a card carousel. It should feel like shader.se's film strip - one continuous ribbon curving through 3D space, like a physical film reel draped over a curved surface.

shader.se's strip:
- Curves like a gentle arc/S-curve in 3D
- All frames sit on the same curved surface (not rotating independently)
- The sprocket holes follow the curve continuously
- It feels like one physical object bending, not separate cards
- Smooth flowing motion when navigating between projects
- Use sin/cos positioning along a circular arc with rotateY tangent to the curve

Files to modify:
- `js/film-strip.js` - carousel logic, per-frame transform calculation
- `css/styles.css` - work section styles (search for `.work__` classes)

### Tech Stack
- Vite (port 3006), vanilla JS (ES modules), Three.js, GSAP + ScrollTrigger, Lenis
- No React, no frameworks
- CSS variables for all design tokens (see `:root` in styles.css)

### Design Tokens
```
--bg-base: #080810 (dark base)
--bg-blue: #012FFF
--bg-pink: #FFBDFF  
--bg-yellow: #FFFF62
--bg-cyan: #7DFFFF
--font-display: 'Silkscreen' (pixelated)
--font-mono: 'JetBrains Mono'
--font-body: 'Space Grotesk'
```

### Don't Touch
- `js/bust.js`, `js/floating-objects.js`, `js/bands-3d.js`, `js/borderlands-material.js`, `js/element-trails.js` - 3D pipeline, working fine
- `js/boot.js` - boot loader, done
- `js/scroll-animations.js` - scroll choreography, done
- The original kiefer.studio at ~/Documents/Projects/kiefer-studio/ - never modify
