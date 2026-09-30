import React from 'react';

export const metadata = {
  title: 'AllYouTuber TV Mode | Smart TV Display',
  description: 'Smart TV YouTube Jukebox Client & Player for AllYouTuber',
};

export default function TvLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen w-screen bg-slate-950 text-slate-100 overflow-hidden select-none font-sans antialiased relative">
      {/* Global Wallpaper Layer matching main site */}
      <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url('/background.jpg')` }}
        />
        <div className="absolute inset-0 bg-slate-950/70" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-slate-950/80" />
      </div>

      {children}
    </div>
  );
}

