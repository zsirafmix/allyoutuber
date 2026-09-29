# AllYouTuber — Security Policy & Controls

## Security Controls Implemented

### 1. Authorization & Role Verification
- Role validation is enforced strictly server-side for every API endpoint and WebSocket event.
- Roles: `USER`, `MODERATOR`, `ADMIN`.
- Client role claims in payloads are rejected. The server validates the session token against database-stored `RoomMember` records.

### 2. XSS & Injection Prevention
- Nicknames and chat messages are sanitized to strip HTML tags, script tags, and malicious character entities.
- YouTube video IDs are strictly validated using regex `^[a-zA-Z0-9_-]{11}$`.
- Database access is handled entirely through Prisma ORM parameterized queries, preventing SQL injection.

### 3. Rate Limiting & Anti-Abuse
- **Chat**: Max 3 messages per 3 seconds per user. Excess messages are dropped with a warning.
- **Emoji Reactions**: Max 5 reactions per 10 seconds per user.
- **Video Submission**: Max 2 consecutive submissions per user; max 5 pending items per user.

### 4. Private Room Invitations
- Invite codes are 8-character cryptographically random strings (e.g. `K7X4-P9ZM`).
- Stored as SHA-256 hashes in the database.
- Regenerating a code immediately invalidates previous codes.

### 5. Audit Logging
- Every administrative action (kick, ban, mute, queue deletion, queue reordering, skip, settings modification, invite code regeneration) is recorded in the `AuditLog` table with user ID, action, timestamp, and metadata.
