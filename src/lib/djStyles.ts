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
      'PJ_VQEV1X7M', // Metallica - Nothing Else Matters
      'ii0-MUiPrBQ', // Foo Fighters - Best of You
      'jgnSoqPUlAk', // Green Day - Basket Case
      'mCHUeQlmTFs', // Red Hot Chili Peppers - Californication
      'EqQuihD0hoI', // Aerosmith - I Don't Want to Miss a Thing
      'HMniSNMhBls', // The Rolling Stones - Paint It Black
      '7lC1lRz5Z_s', // Chopin (rock placeholder - swap)
      'VdoE5TQDZ6I', // Led Zeppelin - Stairway to Heaven
      'H_WLbVvr8Fo', // AC/DC - Highway to Hell
      'f4Mc-NYPHaQ', // Nirvana - Come As You Are
      'v2AC41dglnM', // Green Day - American Idiot
      'N-b_f2Kc3vA', // The White Stripes - Seven Nation Army
      'EL-D9LrFJd4', // Rage Against the Machine - Killing In the Name
      'MV_3Dpw-BRY', // Soundgarden - Black Hole Sun
      'GBaHPND2QJg', // Pearl Jam - Alive
      'OFDYfSWTgSg', // Radiohead - Creep
      'a01QQZyl-_I', // Coldplay - The Scientist
      'fHI8X4OXPjk', // U2 - With or Without You
      'vx2u5uUu3DE', // Eagles - Hotel California
      'lp-EBKeXEnI', // Fleetwood Mac - Go Your Own Way
      'NUsoVlDFqZg', // Tom Petty - Free Fallin'
      'RiONHkgJ8zc', // Journey - Don't Stop Believin'
      '54W8kktFE_o', // Guns N' Roses - November Rain
      'YkADj0TPrJA', // Oasis - Wonderwall
      'PGRJt35xfnA', // Blur - Song 2
      'tBdpJvBMpFg', // Muse - Supermassive Black Hole
      'Oo9bCaB01Bk', // Placebo - Every You Every Me
      'Zq47rxiGFHU', // The Killers - Mr. Brightside
      'Q9DWpXI2prA', // Franz Ferdinand - Take Me Out
      'IQpNs0TNLV4', // Arctic Monkeys - R U Mine?
      'bpOSxM0mfr4', // Arctic Monkeys - Do I Wanna Know?
      '4mAhMajCWAo', // Black Sabbath - Paranoid
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
      'PJ_VQEV1X7M', // Metallica - Nothing Else Matters
      'qdTsVKzs8iQ', // Metallica - One
      'i4RqGSXRVeA', // Slipknot - Wait And Bleed
      'gof1gKO5haw', // System of a Down - B.Y.O.B.
      'LkPDv4_JN2A', // Pantera - Walk
      'kZj7_9PvFLk', // Iron Maiden - Run to the Hills
      'g9JKxS1mXkA', // Rammstein - Feuer Frei
      'AzcvDSW8bEk', // Slipknot - Before I Forget
      'hwZNL32ni7g', // Disturbed - Down With the Sickness
      'u9Dg-g7t2l4', // Disturbed - The Sound of Silence
      'vkZ7HYY9J0Q', // Drowning Pool - Bodies
      'ByTM-NLvkjI', // Korn - Freak on a Leash
      'g1qJnbghCBs', // Linkin Park - Crawling
      'fX43W5Nb_Qk', // Linkin Park - Breaking the Habit
      'JMXGn_8XqzI', // Five Finger Death Punch - Bad Company
      'W_2yQYEg3w4', // Volbeat - Seal the Deal
      'FbMCRKJ5-Fw', // Trivium - In Waves
      'JGlN97JoPx4', // Nightwish - Ghost Love Score
      'piAmSYSCOBo', // Sabaton - Primo Victoria
      'lBaFpnUcYEI', // Amon Amarth - Twilight of the Thunder God
      'P9CzEBLSjFk', // Gojira - Flying Whales
      'IM5mMRhxGJc', // Mastodon - The Motherload
      'dT8bJO9VPRs', // Behemoth - Blow Your Trumpets Gabriel
      'RzAKmJVUECQ', // Tool - Schism
      'DJh5LwbwzGs', // Tool - Stinkfist
      'hFRWsT8KRUY', // Rage Against the Machine - Bulls on Parade
      'EL-D9LrFJd4', // Rage Against the Machine - Killing In the Name
      'XBbi-Q7PJRY', // Pantera - Cemetery Gates
      'dUJBuWJPPpU', // Sepultura - Roots Bloody Roots
      '0jgrCKhxE1s', // Slayer - Raining Blood
      'ZkQM5aCHbFo', // Megadeth - Symphony of Destruction
      'rFuT3_DFPEM', // Megadeth - Peace Sells
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
      'IKZnGWUBBVc', // Avicii - Levels
      'TIjzLDhfIr4', // Avicii - The Nights
      '1i6sHFXhvDU', // Martin Garrix - Scared to Be Lonely
      'xOFBGYh5hP8', // Kygo - Firestone
      'e-ywvmDBFMY', // Kygo ft. Selena Gomez - It Ain't Me
      'R7yfISlGLNU', // David Guetta - Titanium ft. Sia
      'tFEJPJQFqeQ', // Calvin Harris - How Deep Is Your Love
      'v9-mYQO0s1Y', // Marshmello - Alone
      'uc2rjuJNgY0', // Tiësto ft. Kes - Wasted
      'Gkk0-e2_ZP8', // Daft Punk - Get Lucky
      '5NV6Rdv1h3Q', // Daft Punk - Harder Better Faster Stronger
      'yKNxeF4KMsY', // Daft Punk - Around the World
      'cPAbx5fgros', // Skrillex - Bangarang
      'WSeNSzJ2-Jw', // Skrillex - First of the Year
      'wOgIkxAfDdc', // Knife Party - Bonfire
      'V2PtqBKgFZg', // Deadmau5 - Ghosts N Stuff
      'yRYFKcMa_Ek', // Deadmau5 - I Remember
      'xTl5XhGMiHY', // Flume - Never Be Like You
      'BRIdFp1HRQQ', // Seven Lions - Isis
      'KMzHbZ3SMLQ', // Illenium - Crawl Outta Love
      'JpMPsEBpQnA', // Above & Beyond - Sun & Moon
      'LJ73Kf-7KQA', // Zedd ft. Miriam Bryant - Beautiful Now
      'OL3OOKOW6vI', // Zedd - Clarity ft. Foxes
      'kv1JjXb5y0I', // Marshmello & Anne-Marie - FRIENDS
      'zy_WdO-K8CQ', // Diplo & Sleepy Tom - Be Right There
      'MXzMGaVJpBs', // Galantis - Runaway (U & I)
      'HtFf0h6th8Y', // Galantis - No Money
      'U0taq3oDKtk', // G-Eazy ft. Halsey - Him & I
      '1A0FeGXFT_s', // Hardwell - Apollo
      'CG0v8XTFL9I', // Vicetone & Tony Igy - Astronomia
      '9bZkp7q19f0', // PSY - Gangnam Style
      'ooYSgDFiM_s', // Dua Lipa - Levitating (Remix)
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
      'eQWG5-Kh2-A', // Eminem - Without Me
      'cHkcRMfX7N4', // Eminem - Stan
      'nfWlot6h_JM', // Taylor Swift - Shake It Off (rap remix placeholder)
      'w4F9Kf-cN9Y', // Kendrick Lamar - DNA
      '7hZ5_rvO6RM', // Cardi B & Bad Bunny - I Like It
      'I4DjHFVaxls', // J. Cole - No Role Modelz
      'YJVmu6yttiw', // Drake - Hotline Bling
      '2LaqLGPfCos', // Eminem & Rihanna - The Monster
      '5qap5aO4i9A', // Lofi placeholder
      'dHpqMFHbJl8', // 21 Savage - Rockstar ft. Post Malone
      'H7eFRuWP_m4', // Jay-Z & Kanye West - Ni**as in Paris
      '1y6smkh6c-0', // Kanye West - Stronger
      'WrsFXgQk5UI', // Kanye West - Gold Digger
      'A_mkNF7YcKI', // Nicki Minaj - Super Bass
      'g7KgXVCVqHU', // Lil Uzi Vert - XO TOUR Llif3
      'dncmPJDa7tw', // Lil Nas X - Industry Baby
      'vtFDHgzPMeg', // Future - Mask Off
      'UcZdPOQl7YE', // A$AP Rocky - Praise the Lord
      'hG7QL_ZP37c', // Juice WRLD - Lucid Dreams
      'QgaAQE5E1n4', // XXXTentacion - SAD!
      'X48LSZ0Vlcc', // Tyler the Creator - See You Again
      '0Arn_E0Sk78', // Snoop Dogg & Dr. Dre - Next Episode
      'Cf7r99VPJhU', // Dr. Dre - Still D.R.E.
      'wH0b0ertiNA', // Jay-Z - Empire State of Mind
      'DEg_FgZiCGM', // Biggie - Hypnotize
      '-lCYHfPqxlE', // 2Pac - California Love
      '6Ejga4kJUts', // Biggie - Mo Money Mo Problems
      'LL-GJ_2kGXI', // Wiz Khalifa - Black and Yellow
      'NTUKNrPG7rk', // Kendrick Lamar - Money Trees
      'FxQjfIqkfNs', // Drake & Future - Life Is Good
      'QgaAQE5E1n4', // Placeholder
      'C3qlPJOHPEM', // Lil Baby - Drip Too Hard
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
      'QlkHQvVQzH8', // J Balvin - Lean On (remix)
      'TUmpkNnfQXI', // Bad Bunny - Dakiti
      'Kbah2bJnVDQ', // Maluma - Hawái
      'F4EyxdPmEoQ', // J Balvin & Willy William - Mi Gente (remaster)
      'JCKDPBt_rU4', // Rosalía - Malamente
      'XCzBIKrZYgU', // Bad Bunny - Callaíta
      'oD7r01MCJQU', // Karol G & Nicki Minaj - Tusa
      'mgH1PF1WPHQ', // Ozuna - Taki Taki
      '72UO0yGnFjY', // Daddy Yankee - Gasolina
      'ub82Xb1C5RU', // Daddy Yankee - Rompe
      '0EiC-2ovlbE', // Don Omar - Danza Kuduro
      'i1JNxFnPvqI', // Pitbull - International Love
      'AwJoMpnS1s4', // Enrique Iglesias - I Like It
      'ZZOP3LDKVXQ', // Ricky Martin - Livin La Vida Loca
      '5npaMHBqxFg', // Marc Anthony - Vivir Mi Vida
      'A1JUJq0E_hk', // Carlos Vives & Shakira - La Bicicleta
      'pRpeEdMmmQ0', // Shakira & Carlos Vives - Bicicleta
      'Q2LzP5PD4tQ', // Jennifer Lopez - On the Floor
      'H5f_2hbFMqA', // Camila Cabello - Havana
      'h7_bL7-DLBM', // CNCO - Reggaeton Lento
      'kOkIhMKoPsc', // Luis Fonsi - Échame La Culpa
      'W9SfVH2Xl1I', // Becky G - Mayores
      'pJSoMN7JRog', // Anitta - Envolver
      'RQJkq3F9fJk', // Bad Bunny - La Corriente
      'VF6GH1SoQPk', // Farruko - Pepas
      'C5VCcC0wXTI', // Rauw Alejandro - Todo de Ti
      'e3J3Ln5LO_4', // Myke Towers - La Playa
      'eTz-WDDS5aE', // Rauw Alejandro - Relación
      '_OJWHlT1_7k', // Sech - Otro Trago
      'V2J8oHrGnZA', // Jhay Cortez - Cántalo
      'CYi4SoU8Hck', // Ozuna & Romeo Santos - El Farsante
      'UiVlIkFmOOo', // Bad Bunny - Yonaguni
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
      'RJQMUfHpH2Y', // Duke Ellington - Take the A Train
      'QPjDCkq7A8w', // Thelonious Monk - Round Midnight
      'GvGGmUj3HAE', // Charles Mingus - Goodbye Pork Pie Hat
      'g_I4Xf4rqXQ', // Art Blakey - Moanin'
      'tNEkc0JN4Kw', // Oscar Peterson - Night Train
      'E2ljDiijIV4', // Wes Montgomery - California Dreamin'
      'aIcAqOsMGSI', // John Coltrane - My Favorite Things
      'zCBzpSHUNvo', // Miles Davis - All Blues
      'VcVKE0GXGVE', // Gerry Mulligan - Bernie's Tune
      'Q-pbf8G3Gjc', // Modern Jazz Quartet - Django
      'MZjSEBSoP18', // Cannonball Adderley - Mercy, Mercy, Mercy
      'sV5d8H8fCnY', // Stan Getz - The Girl from Ipanema
      '_R8xNyTOaOg', // Bossa Nova Classics Mix
      'gE6VKxLELFE', // Antonio Carlos Jobim - Garota De Ipanema
      'FY5oicLv6gU', // Vince Guaraldi - Linus and Lucy
      'DRMlHqFbJCU', // Nina Simone - Feeling Good
      'Y5TBPm7X43Q', // Norah Jones - Don't Know Why
      'kxRNuXCBBFo', // Amy Winehouse - Valerie
      'gMVxz1RCuvo', // Diana Krall - Fly Me to the Moon
      'TEjOdqZFvhY', // Michael Bublé - Haven't Met You Yet
      'jmJimECjz3w', // Tony Bennett - The Best Is Yet to Come
      'qHh5L8OfPW0', // Billie Holiday - Summertime
      'GHkGJyGJPSQ', // Chet Baker - Almost Blue
      'z11MMtK1UAo', // Cassandra Wilson - Tupelo Honey
      'LMjLhKAyEKg', // Bill Evans - Peace Piece
      'OHuGKPnLncc', // Dexter Gordon - Body and Soul
      'RnKBRuGE-K0', // Art Tatum - Tea for Two
      'E1Wn0Vxjb3w', // Sonny Rollins - St. Thomas
      'k_yMqDR0TRg', // John Coltrane - A Love Supreme
      'wHU2IB7Qb7g', // Herbie Hancock - Watermelon Man
      'T1OO-6ADYaI', // Miles Davis - Summertime
      '4aCzFkUfriA', // Pat Metheny - Last Train Home
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
      'jfKfPfyJRdk', // lofi hip hop radio - beats to relax/study to
      '5qap5aO4i9A', // Lofi hip hop beats
      'DWcJFNfaw9c', // Chillhop Essentials
      '7NOSDKb0HlU', // ChilledCow nostalgic lofi
      'n61ULEU7SU0', // Lofi rain vibes
      'hHW1oY26kxQ', // Warm Lofi Beats
      'lTRiuFIWV54', // Sunset Lo-Fi Chill
      'tfB6A8q8U3E', // Late Night Jazz Lo-Fi
      'Na0w3Mz46GA', // Cozy lo-fi beats
      'b2rYbLIwPh0', // Study Lo-fi Mix
      'MVPTGNGiI-4', // Chillhop Radio
      'kgx4WGK0oNU', // ChillHop Lofi Beats
      'PKSJLELsj_k', // lo-fi hip hop mix
      'TlWBMNEVEb0', // Late Night Lo-Fi
      'c3a2t-ZYdT8', // Lofi jazz cafe
      'A9GnhWFxPkc', // lo-fi hip hop 24/7
      'wWULiX44kEQ', // ambient chill
      'nWZRQPWOGJg', // Chilled Cow Radio
      'GboTMkLfnUM', // Lofi City Pop
      'tNkZsRW7h2c', // Japanese Lofi Chill
      'r23GiGnYBVo', // Ghibli Piano Lofi
      'kMmabFiLUkk', // Lofi Hip Hop Mix Night
      'DV0pHi0IrDQ', // GHIBLI Lofi Beats
      'pEiJ4hQo0m4', // Tokyo Nights Lofi
      '8GeWFB1hNjM', // Foggy Day Lofi
      'aHKRb0UMdg8', // Warm Coffee Shop Lofi
      '_UkZo4Dkekc', // Soft Study Beats
      'HMnrl6xIHmk', // Calm Piano Lo-Fi
      'yLsHQBjSmbc', // Midnight Lo-fi Sessions
      'VGCfNUOqMbk', // Weekend Lo-Fi
      'I2Z1oVAUHhc', // Bedroom Pop Lofi
      'dDFLLwVJzxc', // Relaxing Lofi Study Music
      'M5QY2_8704o', // Pixel Dreams Lofi
      'PCd5tBfMZ1Y', // Aesthetic Lofi Beats
      'wQqhKeFhXDY', // Rainy Cafe Lofi
      'FGBhQbmPwH8', // Night Drive Lofi
      'VBBzFERHQpI', // Cloudy Day Lofi
      'tqlpuVUMTKo', // Lonely Lofi Nights
      '2bMCqCShEAc', // Anime Lofi Mix
      'jEZUfHnzTaE', // Sky Lofi Beats
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
      'Rb0UmrCVRBY', // Beethoven - Moonlight Sonata
      'c1REVAGAVh4', // Mozart - Symphony No. 40
      '_tWGdZL6lFc', // Chopin - Ballade No. 1 in G minor
      '15ezpMNv5sU', // Brahms - Symphony No. 1
      'N_E93MqsGoE', // Bach - Brandenburg Concerto No. 3
      '8rTQdJhklFI', // Beethoven - Für Elise
      '6ldIIFiuFBE', // Schubert - Ave Maria
      'gM7RiGEP-Mo', // Vivaldi - Four Seasons: Winter
      '5X6PqnpGmGQ', // Tchaikovsky - 1812 Overture
      'GqiB0vXNZ3s', // Handel - Messiah - Hallelujah
      'lrbCIQAkc0E', // Debussy - La Mer
      'aBLT_KqP1Tg', // Ravel - Bolero
      'yI_ESUBt5b8', // Chopin - Piano Concerto No. 1
      'GNH_GvAmKMg', // Liszt - Hungarian Rhapsody No. 2
      'VGsBBmk2bQA', // Mendelssohn - Wedding March
      'ZBd2nGBG3dM', // Strauss - The Blue Danube
      'FeGKgY1iRDw', // Dvorak - New World Symphony
      'Gg16TunBgHU', // Grieg - In the Hall of the Mountain King
      'aKNvnAP-1no', // Mussorgsky - Night on Bald Mountain
      'yUQsNbKaB0I', // Sibelius - Finlandia
      '_d5F3bBFLW4', // Beethoven - Symphony No. 9 - Ode to Joy
      'bFJ0HiNOmAQ', // Saint-Saens - Danse Macabre
      'QAJnqfJnEiY', // Chopin - Etude Op. 10 No. 3
      '3N6-oJ4xXcU', // Satie - Gymnopédie No. 1
      '-hHLGObhNiI', // Debussy - Reverie
      'pUYaJJH0hJA', // Mozart - Piano Concerto No. 21
      'rYV3rP4yIzs', // Vivaldi - Four Seasons: Autumn
      'CnLSJKyJCrY', // Bach - Cello Suite No. 1
      'x0wQkU4B74s', // Chopin - Waltz in C# minor
      'kzAFYVU_4Y8', // Mozart - Requiem
      'gvPsNGMSNLQ', // Beethoven - Symphony No. 7
      'q5RVWKuaX5s', // Schumann - Träumerei
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
      'S-p0oWMaCmY', // Garth Brooks - Friends in Low Places
      '0wr_8dOzGME', // Blake Shelton - God's Country
      'ExYmF0bBQGY', // Luke Bryan - Country Girl (Shake It for Me)
      'vJO4H4IVdPc', // Rascal Flatts - Life is a Highway
      'b_0C-WlP5bU', // Shania Twain - Man! I Feel Like a Woman!
      'QFmfW73V1nY', // Taylor Swift - Love Story
      'GkZjOed6lFE', // Taylor Swift - You Belong With Me
      '8i-DzFHNPnc', // Kenny Rogers - The Gambler
      'XyPkQ_S5Ulc', // Waylon Jennings - Mammas Don't Let Your Babies
      'iZdE0l4t-hI', // Willie Nelson - Always On My Mind
      'sEAMRKhLJx4', // Alan Jackson - Chattahoochee
      'ppKO4SJzCbo', // Toby Keith - Should've Been a Cowboy
      'dFDEZEeGOAI', // Brad Paisley - Whiskey Lullaby
      '5ZiEOBEHjsI', // Miranda Lambert - The House That Built Me
      'w1RbSmpXeQ8', // Zac Brown Band - Chicken Fried
      'qMlpf83dSz4', // Lady Antebellum - Need You Now
      'T5Ae7mPZe-I', // Tim McGraw - Live Like You Were Dying
      'VeCoGApWQkY', // Faith Hill - Breathe
      'PMxm3UM8Z4M', // George Strait - Troubadour
      'xPX3oMRDRh4', // Hank Williams Jr - Country Boys
      'WdcVA14hJd4', // Kacey Musgraves - Rainbow
      'yvYi3tlGnWg', // Kacey Musgraves - Follow Your Arrow
      'X9mEpxf7-bY', // Carrie Underwood - Before He Cheats
      '0bGOhEhHGbw', // Chris Stapleton - Starting Over
      'w4ogOuRp87A', // Luke Combs - Beautiful Crazy
      'H2USqEDCv-E', // Zac Brown Band - Colder Weather
      'b1FHQCM7TrA', // Sam Hunt - Body Like a Back Road
      '_Gkqrk4ykmY', // Jason Aldean - Big Green Tractor
      'MN7P6GQHIIU', // Sugarland - Stay
      'O7wqHnPZ_P4', // Keith Urban - Blue Ain't Your Color
      'HdTRW-84vXc', // Glen Campbell - Rhinestone Cowboy
      '8amHWbdaTUI', // Kenny Chesney - There Goes My Life
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
      'YQHsXMglC9A', // Adele - Hello
      'RgKAFK5djSk', // Wiz Khalifa - See You Again
      'IcrbM1l_BoI', // Avicii - Wake Me Up
      '7PCkvCPvDXk', // Maroon 5 - Animals
      'nfWlot6h_JM', // Taylor Swift - Shake It Off
      'QjA5faZF1A8', // Billie Eilish - bad guy
      '450p7goxZqg', // Ed Sheeran - Perfect
      'lWA2pjMjpBs', // Coldplay - A Sky Full of Stars
      'CvBfHwUxHIk', // Imagine Dragons - Believer
      'mWRsgZuwf_8', // Imagine Dragons - Thunder
      'fKopy74weus', // Twenty One Pilots - Stressed Out
      'c_pCm4a8WZg', // Twenty One Pilots - Heathens
      '60ItHLz5WEA', // Alan Walker - Faded
      '4NJlUribp3c', // Post Malone - Sunflower
      'DKEeyzK5g7s', // The Chainsmokers - Closer
      'H7eFRuWP_m4', // Jay-Z & Kanye - Ni**as in Paris
      'uelHwf8o7_U', // Eminem - Love The Way You Lie
      'ebXbLfLAC34', // Calvin Harris - Summer
      'ALZHF5UqnU4', // Marshmello - Happier
      'kJQP7kiw5Fk', // Despacito (popular)
      '7C2z4GqqS5E', // Shakira - Waka Waka
      'tvTRZJ-4EyI', // Kendrick - HUMBLE
      'jfFP5nQoR_A', // Drake - God's Plan
      'bpOSxM0mfr4', // Arctic Monkeys - Do I Wanna Know
      'YkADj0TPrJA', // Oasis - Wonderwall
      '5NV6Rdv1h3Q', // Daft Punk - Harder Better Faster
      'Gkk0-e2_ZP8', // Daft Punk - Get Lucky
      'VdoE5TQDZ6I', // Led Zeppelin - Stairway to Heaven
      'hTWKbfoikeg', // Nirvana - Smells Like Teen Spirit
      'H2USqEDCv-E', // Keith Urban - Blue Ain't Your Color
      '2kotK9FNEYU', // Dave Brubeck - Take Five
      '3N6-oJ4xXcU', // Satie - Gymnopédie No. 1
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
