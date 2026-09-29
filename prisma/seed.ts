import { PrismaClient, RoomType, QueueMode, DJMode, VideoSource, Role } from '@prisma/client';

const prisma = new PrismaClient();

const DEFAULT_DJ_TRACKS = [
  {
    id: 'fJ9rUzIMcZQ',
    title: 'Queen – Bohemian Rhapsody (Official Video Remastered)',
    duration: 360,
    thumbnailUrl: 'https://i.ytimg.com/vi/fJ9rUzIMcZQ/hqdefault.jpg',
    channelTitle: 'Queen Official',
  },
  {
    id: 'kJQP7kiw5Fk',
    title: 'Luis Fonsi - Despacito ft. Daddy Yankee',
    duration: 282,
    thumbnailUrl: 'https://i.ytimg.com/vi/kJQP7kiw5Fk/hqdefault.jpg',
    channelTitle: 'Luis Fonsi',
  },
  {
    id: 'kXYiU_JCYtU',
    title: 'Linkin Park - Numb (Official Music Video)',
    duration: 187,
    thumbnailUrl: 'https://i.ytimg.com/vi/kXYiU_JCYtU/hqdefault.jpg',
    channelTitle: 'Linkin Park',
  },
  {
    id: 'hT_nvWreIhg',
    title: 'OneRepublic - Counting Stars (Official Music Video)',
    duration: 284,
    thumbnailUrl: 'https://i.ytimg.com/vi/hT_nvWreIhg/hqdefault.jpg',
    channelTitle: 'OneRepublic',
  },
  {
    id: 'OPf0YbXqDm0',
    title: 'Mark Ronson - Uptown Funk (Official Video) ft. Bruno Mars',
    duration: 270,
    thumbnailUrl: 'https://i.ytimg.com/vi/OPf0YbXqDm0/hqdefault.jpg',
    channelTitle: 'Mark Ronson',
  },
  {
    id: 'JGwWNGJdvx8',
    title: 'Ed Sheeran - Shape of You (Official Music Video)',
    duration: 263,
    thumbnailUrl: 'https://i.ytimg.com/vi/JGwWNGJdvx8/hqdefault.jpg',
    channelTitle: 'Ed Sheeran',
  },
  {
    id: 'YQHsXMglC9A',
    title: 'Adele - Hello (Official Music Video)',
    duration: 367,
    thumbnailUrl: 'https://i.ytimg.com/vi/YQHsXMglC9A/hqdefault.jpg',
    channelTitle: 'Adele',
  },
  {
    id: '09R8_2nJtjg',
    title: 'Maroon 5 - Sugar (Official Music Video)',
    duration: 301,
    thumbnailUrl: 'https://i.ytimg.com/vi/09R8_2nJtjg/hqdefault.jpg',
    channelTitle: 'Maroon 5',
  },
  {
    id: 'CevxZvSJLk8',
    title: 'Katy Perry - Roar (Official)',
    duration: 270,
    thumbnailUrl: 'https://i.ytimg.com/vi/CevxZvSJLk8/hqdefault.jpg',
    channelTitle: 'Katy Perry',
  },
  {
    id: 'RgKAFK5djSk',
    title: 'Wiz Khalifa - See You Again ft. Charlie Puth',
    duration: 238,
    thumbnailUrl: 'https://i.ytimg.com/vi/RgKAFK5djSk/hqdefault.jpg',
    channelTitle: 'Wiz Khalifa',
  }
];

async function main() {
  console.log('Seeding initial AllYouTuber database...');

  // 1. Seed VideoMetadata
  for (const track of DEFAULT_DJ_TRACKS) {
    await prisma.videoMetadata.upsert({
      where: { id: track.id },
      update: track,
      create: track,
    });
  }
  console.log(`Seeded ${DEFAULT_DJ_TRACKS.length} default video metadata records.`);

  // 2. Global settings
  await prisma.appSettings.upsert({
    where: { key: 'app_config' },
    update: {},
    create: {
      key: 'app_config',
      value: JSON.stringify({
        appName: 'AllYouTuber',
        version: '1.0.0',
        defaultSlotCount: 10,
        maxRooms: 100,
        registrationRequired: false,
      }),
    },
  });

  // 3. Create default rooms
  const defaultRooms = [
    {
      slug: 'rock-night',
      name: 'Rock & Metal Night',
      type: RoomType.PUBLIC,
      djTracks: ['kXYiU_JCYtU', 'fJ9rUzIMcZQ'],
    },
    {
      slug: 'party',
      name: 'Party Hits & Dance',
      type: RoomType.PUBLIC,
      djTracks: ['OPf0YbXqDm0', 'kJQP7kiw5Fk', 'JGwWNGJdvx8'],
    },
    {
      slug: 'chill',
      name: 'Chill & Acoustic Vibes',
      type: RoomType.PUBLIC,
      djTracks: ['hT_nvWreIhg', 'YQHsXMglC9A', '09R8_2nJtjg'],
    },
  ];

  for (const r of defaultRooms) {
    const room = await prisma.room.upsert({
      where: { slug: r.slug },
      update: { name: r.name, type: r.type },
      create: {
        slug: r.slug,
        name: r.name,
        type: r.type,
      },
    });

    await prisma.roomSettings.upsert({
      where: { roomId: room.id },
      update: {},
      create: {
        roomId: room.id,
        slotCount: 10,
        maxConsecutiveVideosPerUser: 2,
        maxQueuedVideosPerUser: 5,
        maxVideoDurationMinutes: 15,
        allowShorts: true,
        allowLive: false,
        allowDuplicateVideos: false,
        queueMode: QueueMode.FIFO,
        chatEnabled: true,
        reactionsEnabled: true,
        votingEnabled: true,
        djMode: DJMode.AUTO,
        djMinimumQueueLength: 2,
        djRepeatProtectionCount: 20,
        djPlaylist: JSON.stringify(r.djTracks),
      },
    });

    // Create initial playback state if not existing
    const firstTrack = DEFAULT_DJ_TRACKS.find((t) => t.id === r.djTracks[0]) || DEFAULT_DJ_TRACKS[0];
    await prisma.playbackState.upsert({
      where: { roomId: room.id },
      update: {},
      create: {
        roomId: room.id,
        currentVideoId: firstTrack.id,
        currentTitle: firstTrack.title,
        currentDuration: firstTrack.duration,
        currentThumbnail: firstTrack.thumbnailUrl,
        currentSubmittedBy: 'System DJ',
        currentSource: VideoSource.DJ,
        startedAt: new Date(),
        paused: false,
        currentPosition: 0,
      },
    });

    console.log(`Seeded room: ${room.name} (${room.slug})`);
  }

  console.log('Database seeding completed successfully.');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
