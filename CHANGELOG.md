# Changelog

All notable changes to the AllYouTuber project will be documented in this file.

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
- **Smart TV Mode (`/tv` & `/tv/:roomId`)**: Dedicated, lightweight Smart TV client designed for LG (webOS), Samsung (Tizen), Hisense (VIDAA), and other smart TV browsers.
- **TV Pairing Code & QR Engine**: One-time 6-character pairing code generation (`A7K4Q2`), SHA-256 hash storage, 10-minute expiration, and QR code integration.
- **TV Session Management & Rate Limiting**: `TvSession` database model with brute-force prevention (10 attempts/min/IP).
- **Socket.IO TV Protocol**: Read-only `TV_CLIENT` role protection, real-time `tv:queue_preview` (top 3 next tracks), 30s heartbeat tracking, and sub-2.5s drift playback sync.
- **TV Player & Remote Navigation**: 16:9 YouTube Iframe Player, "LEJÁTSZÁS INDÍTÁSA" autoplay-blockage override with TV remote Enter key listener, large high-contrast typography (32-48px), and OLED screen burn-in protection via periodic pixel shifting.
- **Mobile/Desktop TV Manager Modal**: In-room "TV Kijelző" button and modal to pair, list, rename, and disconnect smart TVs in real time.
- **Automated Test Suite**: Added TV pairing tests covering code generation, forbidden character filtering, hashing, and rate limiting.

## [1.0.0] - 2026-09-29
### Added
- **Synchronized YouTube Playback**: Authoritative server master clock with automatic drift correction and autoplay unlock handling.
- **Multi-Room Engine**: Public rooms directory and private invite-code protected rooms (`/room/[slug]?invite=XXXX-XXXX`).
- **Interactive Seat System**: 10 numbered interactive slots with nickname assignment and 5-minute disconnect grace period.
- **Business Rule Enforced Queue**:
  - Maximum 2 consecutive videos per user limit.
  - Maximum 5 pending videos per user limit.
  - Maximum video duration limit (configurable, default 15 min).
  - User submission priority over unplayed DJ tracks.
  - Multiple ordering modes: FIFO, VOTE, HYBRID.
- **Real-Time Voting**: Upvote / downvote mechanism with toggle, retraction, and instant score broadcast.
- **Real-Time Chat & System Events**: Room-scoped chat with rate limiting (3 msgs / 3s), XSS sanitization, moderator deletion, and system events.
- **Floating Emoji Reactions**: Live floating particle reaction overlay (❤️, 🔥, 😂, 👏, 😍, 😮, 👎) with rate limiting.
- **Automated DJ Mode**: Auto-refill with OFF, AUTO, ALWAYS modes, 20-track repeat protection, and curated library across 10 musical genres.
- **Role-Based Moderation & Global Admin**:
  - Roles: USER, MODERATOR, ADMIN.
  - In-room moderation drawer (skip, mute, kick, ban, queue reorder).
  - Global `/admin` dashboard with secure bootstrap token.
  - Comprehensive `AuditLog` for administrative traceability.
- **5-Language Internationalization (i18n)**: English, German, Hungarian, Russian, French.
- **Mobile-First Responsive UX**: Cyberpunk dark party theme with exact specified mobile component hierarchy.
- **Render Production Ready**: Native `render.yaml` configuration with single-service Node.js + Socket.IO and PostgreSQL integration.
- **Comprehensive Automated Test Suite**: 27 unit & integration tests covering all critical business rules.
