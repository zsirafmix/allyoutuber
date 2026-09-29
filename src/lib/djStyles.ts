export interface DJStyleDefinition {
  id: string;
  name: string;
  emoji: string;
  description: string;
  accentColor: string;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
  tracks: string[]; // YouTube Video IDs
}

export const DJ_STYLES: Record<string, DJStyleDefinition> = {
  ROCK_NIGHT: {
    id: 'ROCK_NIGHT',
    name: 'Rock Night',
    emoji: '🎸',
    description: 'Klasszikus és modern rock himnuszok (Queen, AC/DC, Guns N\' Roses...)',
    accentColor: '#e11d48',
    badgeBg: 'bg-rose-500/15',
    badgeBorder: 'border-rose-500/30',
    badgeText: 'text-rose-300',
    tracks: [
      'fJ9rUzIMcZQ', // Queen - Bohemian Rhapsody
      'kXYiU_JCYtU', // Linkin Park - Numb
      '1w7OgIMMRc4', // Guns N' Roses - Sweet Child O' Mine
      'eVTXPUF4Oz4', // Linkin Park - In The End
      'hTWKbfoikeg', // Nirvana - Smells Like Teen Spirit
      'BcL---4xQYA', // AC/DC - Thunderstruck
      'lDK9QqIzhwk', // Bon Jovi - Livin' On A Prayer
      'r00ikilDxW4', // AC/DC - Back In Black
    ],
  },
  METAL_ZONE: {
    id: 'METAL_ZONE',
    name: 'Metal Zone',
    emoji: '🔥',
    description: 'Zúzós metál és heavy riffek (Metallica, Rammstein, Slipknot...)',
    accentColor: '#ea580c',
    badgeBg: 'bg-orange-500/15',
    badgeBorder: 'border-orange-500/30',
    badgeText: 'text-orange-300',
    tracks: [
      'CD-E-LDc384', // Metallica - Enter Sandman
      'WM8bTdBs-cw', // Metallica - Master of Puppets
      'CSvFpBOe8eY', // System Of A Down - Chop Suey!
      'L-iepu3EtyE', // Rammstein - Du Hast
      '5abamRO41fE', // Slipknot - Psychosocial
      'W3q8Od5qJio', // Avenged Sevenfold - Hail to the King
      'k-ARuoSFflM', // Iron Maiden - The Trooper
      '01I4KAj4XdU', // Judas Priest - Breaking the Law
    ],
  },
  EDM_PARTY: {
    id: 'EDM_PARTY',
    name: 'EDM Party',
    emoji: '🎧',
    description: 'Pörgős elektronikus tánczene és fesztiválütemek (Avicii, Martin Garrix...)',
    accentColor: '#06b6d4',
    badgeBg: 'bg-cyan-500/15',
    badgeBorder: 'border-cyan-500/30',
    badgeText: 'text-cyan-300',
    tracks: [
      'IcrbM1l_BoI', // Avicii - Wake Me Up
      'ALZHF5UqnU4', // Marshmello ft. Bastille - Happier
      'YykjpeuMNEk', // Martin Garrix - Animals
      'DKEeyzK5g7s', // The Chainsmokers - Closer ft. Halsey
      'ebXbLfLAC34', // Calvin Harris - Summer
      'gCYcHz2167o', // DJ Snake, Lil Jon - Turn Down for What
      'kOkQ4T5WO9E', // Calvin Harris - This Is What You Came For
      '60ItHLz5WEA', // Alan Walker - Faded
    ],
  },
  RAP_ARENA: {
    id: 'RAP_ARENA',
    name: 'Rap Arena',
    emoji: '🎤',
    description: 'Old-school és modern hip-hop és rap (Eminem, Drake, Kendrick...)',
    accentColor: '#8b5cf6',
    badgeBg: 'bg-purple-500/15',
    badgeBorder: 'border-purple-500/30',
    badgeText: 'text-purple-300',
    tracks: [
      '_Yhyp-_hX2s', // Eminem - Lose Yourself
      'RgKAFK5djSk', // Wiz Khalifa - See You Again
      'tvTRZJ-4EyI', // Kendrick Lamar - HUMBLE.
      'jfFP5nQoR_A', // Drake - God's Plan
      'uelHwf8o7_U', // Eminem - Love The Way You Lie
      '4NJlUribp3c', // Post Malone, Swae Lee - Sunflower
      'pmU_3ZJbU5E', // Travis Scott - SICKO MODE
      'LHCob76kigA', // Coolio - Gangsta's Paradise
    ],
  },
  LATIN_FIESTA: {
    id: 'LATIN_FIESTA',
    name: 'Latin Fiesta',
    emoji: '💃',
    description: 'Forró reggaeton, salsa és latin pop (Despacito, Shakira, J Balvin...)',
    accentColor: '#ec4899',
    badgeBg: 'bg-pink-500/15',
    badgeBorder: 'border-pink-500/30',
    badgeText: 'text-pink-300',
    tracks: [
      'kJQP7kiw5Fk', // Luis Fonsi - Despacito ft. Daddy Yankee
      'p7bfOZek9t4', // Enrique Iglesias - Bailando
      'wnJ6LuUFpMo', // J Balvin - Mi Gente
      '7C2z4GqqS5E', // Shakira - Waka Waka
      'b8I-7Wk_VBc', // Daddy Yankee - Dura
      'p3QvDkHnFvA', // Rosalía - Con Altura
      'glzG7gYVqGk', // Shakira - Hips Don't Lie
      'DRDqI1b82jA', // Maluma - Felices los 4
    ],
  },
  JAZZ_LOUNGE: {
    id: 'JAZZ_LOUNGE',
    name: 'Jazz Lounge',
    emoji: '🎷',
    description: 'Kifinomult jazz klasszikusok és lounge ritmusok (Miles Davis, Coltrane...)',
    accentColor: '#d97706',
    badgeBg: 'bg-amber-500/15',
    badgeBorder: 'border-amber-500/30',
    badgeText: 'text-amber-300',
    tracks: [
      'vmDDOFXSg24', // Miles Davis - So What
      '2kotK9FNEYU', // Dave Brubeck - Take Five
      'CWzrABouyeE', // John Coltrane - Giant Steps
      'rP14e9f7aek', // Louis Armstrong - What A Wonderful World
      '4FK3fl58iWw', // Bill Evans - Autumn Leaves
      'q4f74G6rXqA', // Chet Baker - My Funny Valentine
      'r1wZ4_C0y2k', // Ella Fitzgerald & Louis Armstrong - Cheek to Cheek
      '8b0pE8nZ9k0', // Herbie Hancock - Cantaloupe Island
    ],
  },
  CHILL_LOFI: {
    id: 'CHILL_LOFI',
    name: 'Chill / Lo-Fi',
    emoji: '🌙',
    description: 'Nyugtató Lo-Fi ütemek tanuláshoz és pihenéshez',
    accentColor: '#10b981',
    badgeBg: 'bg-emerald-500/15',
    badgeBorder: 'border-emerald-500/30',
    badgeText: 'text-emerald-300',
    tracks: [
      'jfKfPfyJRdk', // lofi hip hop radio
      '5qap5aO4i9A', // Lofi hip hop beats
      'DWcJFNfaw9c', // Chillhop Essentials
      '7NOSDKb0HlU', // ChilledCow nostalgic lofi
      'n61ULEU7SU0', // Lofi rain vibes
      'hHW1oY26kxQ', // Warm Lofi Beats
      'lTRiuFIWV54', // Sunset Lo-Fi Chill
      'tfB6A8q8U3E', // Late Night Jazz Lo-Fi
    ],
  },
  CLASSIC_ROOM: {
    id: 'CLASSIC_ROOM',
    name: 'Classic Room',
    emoji: '🎼',
    description: 'Komolyzenei mesterművek (Mozart, Beethoven, Vivaldi, Chopin...)',
    accentColor: '#6366f1',
    badgeBg: 'bg-indigo-500/15',
    badgeBorder: 'border-indigo-500/30',
    badgeText: 'text-indigo-300',
    tracks: [
      'GRxofEmo3HA', // Vivaldi - Four Seasons: Spring
      '4Tr0otuiQuU', // Beethoven - Symphony No. 5
      'W-fFHeTX70Q', // Mozart - Eine kleine Nachtmusik
      'rbTozGoj9OQ', // Tchaikovsky - Swan Lake
      '7lC1lRz5Z_s', // Chopin - Nocturne Op. 9 No. 2
      'sPlhKP0nZII', // Bach - Air on the G String
      'GnP58w6665s', // Debussy - Clair de Lune
      'P6h1kGj_6bU', // Pachelbel - Canon in D
    ],
  },
  COUNTRY_BAR: {
    id: 'COUNTRY_BAR',
    name: 'Country Bar',
    emoji: '🤠',
    description: 'Hangulatos country balladák és nashville-i slágerek (Johnny Cash, Dolly Parton...)',
    accentColor: '#b45309',
    badgeBg: 'bg-amber-600/15',
    badgeBorder: 'border-amber-600/30',
    badgeText: 'text-amber-200',
    tracks: [
      '1VRZq3J0uw4', // Lil Nas X - Old Town Road
      'v78-ftc9U9U', // Luke Combs - Fast Car
      '7qH4qyi1-Ys', // Morgan Wallen - Last Night
      'bkKGXQRZp3U', // Chris Stapleton - Tennessee Whiskey
      'zXdayL49ktU', // Darius Rucker - Wagon Wheel
      'e4dA8sZ_Y68', // John Denver - Take Me Home, Country Roads
      'Fh1a2VXiZaU', // Johnny Cash - Hurt
      'p_b4b3w8rGk', // Dolly Parton - Jolene
    ],
  },
  MIXED_PARTY: {
    id: 'MIXED_PARTY',
    name: 'Mixed Party',
    emoji: '⭐',
    description: 'Vegyes házibuli slágerek minden korszakból és műfajból',
    accentColor: '#a855f7',
    badgeBg: 'bg-violet-500/15',
    badgeBorder: 'border-violet-500/30',
    badgeText: 'text-violet-300',
    tracks: [
      'fJ9rUzIMcZQ', // Queen - Bohemian Rhapsody
      'OPf0YbXqDm0', // Mark Ronson - Uptown Funk
      'JGwWNGJdvx8', // Ed Sheeran - Shape of You
      'kJQP7kiw5Fk', // Luis Fonsi - Despacito
      '09R8_2nJtjg', // Maroon 5 - Sugar
      'kXYiU_JCYtU', // Linkin Park - Numb
      'hT_nvWreIhg', // OneRepublic - Counting Stars
      'CevxZvSJLk8', // Katy Perry - Roar
    ],
  },
};

export const DJ_STYLE_LIST = Object.values(DJ_STYLES);

export function getDJStyle(styleId?: string | null): DJStyleDefinition {
  if (!styleId) return DJ_STYLES.MIXED_PARTY;
  return DJ_STYLES[styleId] || DJ_STYLES.MIXED_PARTY;
}

export function formatDJStyleLabel(styleId?: string | null): string {
  const style = getDJStyle(styleId);
  return `${style.emoji} ${style.name}`;
}
