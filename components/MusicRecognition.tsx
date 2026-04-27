"use client";

interface MusicRecognitionProps {
  song: {
    title: string;
    artist: string;
    album: string | null;
  } | null;
  isListening: boolean;
}

export default function MusicRecognition({ song, isListening }: MusicRecognitionProps) {
  if (!song && !isListening) return null;

  return (
    <div className="p-4 rounded-lg" style={{ background: 'linear-gradient(135deg, #fef3c7 0%, #d4a84b 100%)', boxShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>
      {isListening && !song && (
        <div className="flex items-center justify-center gap-2">
          <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: '#b8860b' }} />
          <div className="w-2 h-2 rounded-full animate-pulse delay-75" style={{ backgroundColor: '#b8860b' }} />
          <div className="w-2 h-2 rounded-full animate-pulse delay-150" style={{ backgroundColor: '#b8860b' }} />
          <span className="text-sm text-amber-900 ml-2">Identificando música...</span>
        </div>
      )}
      
      {song && (
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-2 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#8b6914' }}>
            <svg viewBox="0 0 24 24" className="w-6 h-6 text-amber-100" fill="currentColor">
              <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
            </svg>
          </div>
          <h3 className="font-bold text-amber-900 text-lg">{song.title}</h3>
          <p className="text-amber-800">{song.artist}</p>
          {song.album && <p className="text-sm text-amber-700 mt-1">{song.album}</p>}
        </div>
      )}
    </div>
  );
}