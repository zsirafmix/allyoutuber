# AllYouTuber — System Architecture

## Overview
AllYouTuber is a real-time, synchronized YouTube jukebox and community watching platform designed for production deployment on Render.com.

## Component Architecture

+-------------------------------------------------------------+
|                 Clients (Mobile / Desktop / TV)             |
|   - Mobile/Desktop Web: Full controls, Queue, Chat, Admin    |
|   - Smart TV Client (/tv): Large 16:9 Display, Up Next, OLED |
|     burn protection, Read-Only TV_CLIENT socket connection   |
+------------------------------+------------------------------+
                               |
                        HTTPS & WSS
                               |
+------------------------------v------------------------------+
|                 Unified Node.js Server                      |
|                     (src/server/index.ts)                   |
|  +---------------------------+  +------------------------+  |
|  |       Next.js Handler     |  |    Socket.IO Server    |  |
|  |   - Server-side routes    |  |  - Room namespaces     |  |
|  |   - Static assets         |  |  - Playback sync clock |  |
|  |   - API endpoints         |  |  - Chat & reactions    |  |
|  +---------------------------+  +------------------------+  |
|                              |                              |
|  +---------------------------v---------------------------+  |
|  |                 Core Business Services                |  |
|  |   - RoomManager (Rooms, Slots, Sessions, Invites)     |  |
|  |   - QueueEngine (FIFO/VOTE/HYBRID, Limits, Priorities) |  |
|  |   - DJEngine (Auto fill, Repeat protection, Fallback) |  |
|  |   - YouTubeService (Parser, Data API v3, oEmbed Cache)|  |
|  |   - ModerationService & AuditLogger                   |  |
|  +-------------------------------------------------------+  |
+------------------------------+------------------------------+
                               |
                     Prisma ORM Client
                               |
+------------------------------v------------------------------+
|                PostgreSQL 16 Database                       |
|   - Users, Sessions, Rooms, Invites, Slots, Members         |
|   - QueueItems, VideoMetadata, PlaybackHistory, Votes        |
|   - ChatMessages, Mutes, Bans, AuditLogs, Settings          |
+-------------------------------------------------------------+
```

## Key Architectural Principles
1. **Single Source of Truth**: The server maintains the master clock for playback (`startedAt`, `paused`, `currentPosition`). Clients sync drift automatically.
2. **Room Isolation**: All socket broadcasts and database entities are strictly scoped by `roomId`.
3. **Quota-Resilient Metadata**: YouTube metadata is persistently cached in `VideoMetadata`. When the YouTube API key is missing or quota is depleted, the oEmbed scraper provides title, duration, and thumbnail fallback.
4. **Horizontal Scalability Ready**: Single instance works standalone in-memory + PostgreSQL. By setting `REDIS_URL`, the Socket.IO Redis Adapter can be enabled for multiple instances.
