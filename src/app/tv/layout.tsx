import React from 'react';

export const metadata = {
  title: 'AllYouTuber TV Mode | Smart TV Display',
  description: 'Smart TV YouTube Jukebox Client & Player for AllYouTuber',
};

export default function TvLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen w-screen bg-black text-white overflow-hidden select-none font-sans antialiased">
      {children}
    </div>
  );
}
