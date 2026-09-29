# Changelog

All notable changes to the AllYouTuber project will be documented in this file.

## [Unreleased]
### Added
- PostgreSQL Prisma schema with 16 core models (User, UserSession, Room, RoomMember, RoomInvite, QueueItem, VideoMetadata, PlaybackState, PlaybackHistory, Vote, ChatMessage, Ban, Mute, AuditLog, AppSettings, RoomSettings).
- Database seed script with curated default DJ track library and starter rooms (rock-night, party, chill).
- Singleton Prisma client instance (`src/lib/prisma.ts`).
- Initial project scaffolding with Next.js 14, React 18, Socket.IO, Prisma ORM, and Tailwind CSS.
- Production Render deployment configuration (`render.yaml`).
- Architecture, deployment, security, and project tracking specifications.
