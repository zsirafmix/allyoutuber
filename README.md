# AllYouTuber — Social YouTube Jukebox & Synchronized Video Platform

AllYouTuber is a real-time, multi-room, community YouTube jukebox and synchronized video-watching web application designed for friends, parties, and online communities. It allows groups of users to join public or private rooms, occupy numbered slots, queue and vote on YouTube tracks, chat in real time, trigger floating emoji reactions, and listen together in perfect sync.

Repository: [https://github.com/zsirafmix/allyoutuber.git](https://github.com/zsirafmix/allyoutuber.git)  
Target Deployment: [Render.com](https://render.com) (Node.js Web Service + PostgreSQL)

---

## 📚 Complete Project Documentation

For exhaustive technical and architectural guides, see the documentation files:

- 🤖 **[AGENTS.md](AGENTS.md)** — **Comprehensive AI Agent & Developer Handoff Guide** (Read this first!).
- 🏗️ **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)** — Detailed system architecture, data models, Socket.IO protocols & Mermaid diagrams.
- 🚀 **[docs/SETUP.md](docs/SETUP.md)** — Local development setup, environment variables, and Render.com deployment.
- 📺 **[docs/TV_MODE.md](docs/TV_MODE.md)** — Smart TV display mode (`/tv`), pairing, remote management & OLED protections.
- 🔧 **[docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md)** — Root causes, failed attempts, and permanent solutions for past errors.
- ⚠️ **[docs/KNOWN_ISSUES.md](docs/KNOWN_ISSUES.md)** — Known edge cases, workarounds, and planned permanent fixes.
- 🗺️ **[docs/ROADMAP.md](docs/ROADMAP.md)** / **[TODO.md](TODO.md)** — Actionable roadmap, priorities, dependencies, and verification criteria.
- 📝 **[CHANGELOG.md](CHANGELOG.md)** — Complete chronological development and release history.
- 🤝 **[docs/HANDOFF.md](docs/HANDOFF.md)** — Session-by-session handoff logs and exact next steps.

---

## 🌟 Key Features

- **Synchronized Video Playback**: Authoritative server clock synchronizes YouTube playback across all connected clients with automatic drift correction.
- **Multiple Isolated Rooms**: Create public rooms listed in the lobby or invite-only private rooms with cryptographically secure invite codes (`K7X4-P9ZM`).
- **10-Slot Numbered Seat System**: Occupy numbered interactive slots (1–10) with custom nicknames and persistent browser sessions.
- **Dynamic Queue Management**: Submit YouTube links with automatic metadata extraction.
  - Limits enforced: Max 2 consecutive videos per user, max 5 pending per user, configurable video duration limit.
  - Queue modes: `FIFO`, `VOTE`, `HYBRID`.
- **Real-Time Voting**: Upvote / downvote tracks in the queue to alter play order.
- **Automated DJ Mode**: 10 distinct musical genres (Rock, Metal, EDM, Rap, Latin, Jazz, Chill/Lo-Fi, Classic, Country, Mixed Party) with 250+ curated tracks per genre and anti-repetition protection.
- **Live Chat & System Events**: Real-time room chat with system notifications (joins, skips, bans, DJ status), rate limiting, and XSS sanitization.
- **Floating Emoji Reactions**: Celebrate highlights with floating emoji particles (❤️, 🔥, 😂, 👏, 😍, 😮, 👎).
- **In-Room Moderation & Global Admin Panel**: Moderation tools (skip, mute, kick, ban, queue reorder) and a global `/admin` dashboard with IP geolocation and ISP lookup.
- **Smart TV Mode (`/tv`)**: Dedicated, lightweight display interface tailored for LG (webOS), Samsung (Tizen), Hisense (VIDAA), and Smart TV browsers with 6-character code / QR pairing, OLED burn-in protection, large typography, and real-time up-next queue preview.
- **5-Language Internationalization (i18n)**: English, German, Hungarian, Russian, and French.
- **Mobile-First Responsive Design**: Cyberpunk party aesthetic optimized for smartphones, tablets, TV displays, and desktops.

---

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 App Router, React 18, Tailwind CSS, Lucide Icons
- **Backend**: Node.js HTTP Server, Socket.IO
- **Database & ORM**: PostgreSQL 16, Prisma ORM
- **Testing**: Vitest automated test suite (13 test suites, 64 tests)
- **Deployment**: Render.com Blueprint (`render.yaml`)

---

## 🚀 Quick Start

### 1. Prerequisites
- Node.js >= 20.x
- PostgreSQL >= 14

### 2. Installation
```bash
git clone https://github.com/zsirafmix/allyoutuber.git
cd allyoutuber
npm install
```

### 3. Environment Variables
Copy `.env.example` to `.env` and configure your database string:
```bash
cp .env.example .env
```

### 4. Database Setup
```bash
npx prisma db push
npx prisma generate
```

### 5. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Testing
Run the comprehensive automated test suite:
```bash
npm test
```

---

## 📦 Production Build
```bash
npm run build
npm start
```
