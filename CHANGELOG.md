# Changelog

All notable changes to the AllYouTuber project will be documented in this file.

## [1.1.2] - 2026-09-30
### Changed & Optimized
- **Ultra-Lightweight TV Mode**: Streamlined the `/tv` and `/tv/:slug` client to run with zero lag on low-power Smart TV webviews (LG webOS, Samsung Tizen, Hisense VIDAA).
- **Focused TV UI**: The TV interface now exclusively displays the dominant 16:9 YouTube video and the next 3 songs (Következő dalok).
- **Eliminated TV Lag**: Removed 1-second Virtual DOM re-render timer loop and heavy CSS backdrop filters; switched to passive background drift synchronization without triggering React re-renders.
- **Simplified TV Sharing**: Replaced the 6-digit pairing code workflow with a direct room TV link display, 1-click clipboard copy button, and immediate QR code.
- **Unified TV Wallpaper**: Added the site's global `/background.jpg` background layer with dark contrast overlay to the TV layout.

## [1.1.1] - 2026-09-30
### Added
- **Comprehensive AI Agent & Developer Handoff Documentation**:
  - `AGENTS.md`: Full multi-agent handoff guide covering goals, status, architecture summary, build/test/run commands, cautionary areas, failed approaches, and exact next steps.
  - `docs/HANDOFF.md`: Detailed session-by-session handoff logs.
  - `docs/ARCHITECTURE.md`: Deep architecture document with Mermaid sequence and topology diagrams, data flows, and database schemas.
  - `docs/SETUP.md`: Complete reproduction and environment setup guide for local development and Render.com cloud deployment.
  - `docs/TROUBLESHOOTING.md`: Exhaustive issue catalog with root causes, failed attempts, and verified permanent fixes.
  - `docs/KNOWN_ISSUES.md`: Catalog of known edge cases, severity ratings, workarounds, and planned permanent solutions.
  - `docs/ROADMAP.md` & `TODO.md`: Structured, prioritized roadmap with dependencies, affected files, and acceptance criteria.
  - `docs/TV_MODE.md`: Complete Smart TV technical guide covering webOS, Tizen, VIDAA, and keybinding protocols.

## [1.1.0] - 2026-09-30
### Added
- **Smart TV Mode (`/tv` & `/tv/:roomId`)**: Dedicated Smart TV client for LG (webOS), Samsung (Tizen), Hisense (VIDAA), and other smart TV browsers.
- **TV Player & Remote Navigation**: 16:9 YouTube Iframe Player, "LEJÁTSZÁS INDÍTÁSA" autoplay-blockage override with TV remote Enter key listener.
- **Socket.IO TV Protocol**: Read-only `TV_CLIENT` role protection, real-time `tv:queue_preview` (top 3 next tracks).
- **Automated Test Suite**: Added TV tests covering code generation, forbidden character filtering, hashing, and rate limiting.

## [1.0.0] - 2026-09-29
### Added
- **Synchronized YouTube Playback**: Authoritative server master clock with automatic drift correction and autoplay unlock handling.
- **Multi-Room Engine**: Public rooms directory and private invite-code protected rooms.
- **Interactive Seat System**: 10 numbered interactive slots with nickname assignment.
- **Business Rule Enforced Queue**: Limits, voting, Auto-DJ with 10 genres.
- **5-Language Internationalization (i18n)**: English, German, Hungarian, Russian, French.
- **Render Production Ready**: Native `render.yaml` configuration with PostgreSQL.
