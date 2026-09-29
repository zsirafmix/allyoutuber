# Changelog

All notable changes to the AllYouTuber project will be documented in this file.

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
- **Automated DJ Mode**: Auto-refill with OFF, AUTO, ALWAYS modes, 20-track repeat protection, and curated library.
- **Role-Based Moderation & Global Admin**:
  - Roles: USER, MODERATOR, ADMIN.
  - In-room moderation drawer (skip, mute, kick, ban, queue reorder).
  - Global `/admin` dashboard with secure bootstrap token.
  - Comprehensive `AuditLog` for administrative traceability.
- **5-Language Internationalization (i18n)**: English, German, Hungarian, Russian, French.
- **Mobile-First Responsive UX**: Cyberpunk dark party theme with exact specified mobile component hierarchy.
- **Render Production Ready**: Native `render.yaml` configuration with single-service Node.js + Socket.IO and PostgreSQL integration.
- **Comprehensive Automated Test Suite**: 27 unit & integration tests covering all critical business rules.
