# AllYouTuber — Project Tracker & TODO

## Phase 1: Repository & Project Initialization
- [x] Repository cloned and Git configured (`https://github.com/zsirafmix/allyoutuber.git`)
- [x] Project dependencies installed (Next.js 14, React 18, Socket.IO, Prisma, Tailwind CSS, Lucide, Vitest)
- [x] Base configurations created (`tsconfig.json`, `tailwind.config.js`, `next.config.js`, `render.yaml`)
- [x] Project tracking documents initialized (`TODO.md`, `CHANGELOG.md`, `README.md`, `ARCHITECTURE.md`, `DEPLOYMENT.md`, `SECURITY.md`)

## Phase 2: PostgreSQL & Prisma Database Layer
- [x] Define comprehensive Prisma schema with all 16 required models & enums
- [x] Run Prisma migration / push to local PostgreSQL
- [x] Create seed script with default DJ track list and initial settings
- [x] Verify Prisma client queries and database relationships

## Phase 3: Session & User Slot System
- [ ] Implement cookie & token based session authentication (no password required for MVP)
- [ ] Implement 10 numbered slots per room with nickname registration (2-24 chars, sanitized)
- [ ] Add 5-minute disconnect grace period for slot reservations
- [ ] Support session recovery on browser refresh

## Phase 4: Multi-Room System
- [ ] Create room creation endpoint and page (`/room/[slug]`)
- [ ] Implement PUBLIC rooms with public lobby browsing
- [ ] Implement room settings, slot count customization, and room locking

## Phase 5: Private Rooms with Invite Codes
- [ ] Generate cryptographically secure invite codes (e.g. `K7X4-P9ZM`)
- [ ] Store SHA-256 hashed invite codes
- [ ] Implement invite link validation (`/room/:slug?invite=CODE`)
- [ ] Allow admin to regenerate invite codes (invalidating previous codes) and lock room

## Phase 6: YouTube Parsing & Resilient Metadata
- [ ] Universal YouTube URL parser (standard, short youtu.be, shorts, embeds)
- [ ] YouTube Data API v3 metadata extraction
- [ ] Resilient fallback via YouTube oEmbed + duration scraping
- [ ] Database caching (`VideoMetadata`) to eliminate redundant API quota usage

## Phase 7: Video Queue Engine
- [ ] Queue storage and management per room
- [ ] Business rule: Maximum 2 consecutive videos per user limit
- [ ] Business rule: Maximum queued videos per user quota (default 5)
- [ ] Business rule: Maximum video duration limit (default 15 mins, toggleable)
- [ ] Multiple queue ordering modes: FIFO, VOTE, HYBRID

## Phase 8 & 9: Real-Time Synchronization Engine (Socket.IO + Player)
- [ ] Custom unified Node.js server (`src/server/index.ts`) with Socket.IO
- [ ] Room-isolated Socket channels (`room:${roomId}`)
- [ ] Authoritative server clock for playback state (`startedAt`, `currentPosition`, `paused`)
- [ ] YouTube IFrame API client integration with drift correction (> 2.5s auto-seek)
- [ ] Autoplay restriction barrier / sound unlock button

## Phase 10: Real-Time Voting System
- [ ] Upvote and downvote actions
- [ ] 1 vote per user per video with toggle and retraction
- [ ] Real-time vote score calculation and broadcast
- [ ] Automated queue reordering based on room queue mode

## Phase 11 & 12: Real-Time Chat & Floating Emoji Reactions
- [ ] Socket.IO powered room chat with XSS protection and rate limiting
- [ ] Moderation tools: delete message, mute user
- [ ] System messages (joins, leaves, skips, video added, DJ toggled)
- [ ] Floating animated emoji reactions (❤️, 🔥, 😂, 👏, 😍, 😮, 👎) with rate limiter (5 / 10s)

## Phase 13 & 14: Moderation, Permissions & Automated DJ Engine
- [ ] Role hierarchy: USER, MODERATOR, ADMIN
- [ ] In-room moderation controls (skip, kick, mute, ban, delete from queue, reorder)
- [ ] Comprehensive AuditLog for all administrative actions
- [ ] Automated DJ modes (OFF, AUTO, ALWAYS)
- [ ] DJ fallback selection when queue drops below `djMinimumQueueLength`
- [ ] DJ repeat protection (last 20 tracks from history)
- [ ] User submission priority over DJ tracks

## Phase 15 & 16: Admin Dashboard, 5-Language i18n & Mobile UX
- [ ] Global `/admin` dashboard with room manager, active users, audit logs, and settings
- [ ] Secure admin bootstrap mechanism via `ADMIN_BOOTSTRAP_TOKEN`
- [ ] 5 languages support (English, German, Hungarian, Russian, French) across all UI elements and messages
- [ ] Mobile-first responsive layout (dark party theme, 16:9 player, mobile component ordering)

## Phase 17: Security Hardening & Automated Tests
- [ ] Automated unit and integration test suite (URL parsing, queue limits, voting, invite codes, rate limiters, permissions, DJ logic, sync math)
- [ ] Security validation: XSS, rate limiting, invite code protection, authorization guards

## Phase 18: Render Deployment & Final Handover
- [ ] Production build verification (`npm run build`)
- [ ] Render configuration check (`render.yaml`)
- [ ] Final documentation update (`README.md`, `FINAL_REPORT.md`, `CHANGELOG.md`)
- [ ] Final Git commit and push to remote repository
