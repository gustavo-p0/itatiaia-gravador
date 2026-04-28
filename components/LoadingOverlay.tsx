"use client";

export default function LoadingOverlay() {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center z-10" style={{ background: 'rgba(26, 21, 16, 0.9)' }}>
      <div className="relative w-24 h-24 mb-4">
        <div className="absolute inset-0 rounded-full" style={{ 
          background: 'repeating-radial-gradient(circle at center, #1a1510 0px, #1a1510 2px, #2d251b 2px, #2d251b 4px)' 
        }} />
        <div className="absolute inset-0 rounded-full border-4 border-amber-800/30" />
        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-amber-600 animate-spin" style={{ animationDuration: '3s' }} />
        <div className="absolute inset-[28%] rounded-full" style={{ background: 'linear-gradient(135deg, #d4a84b 0%, #8b6b3d 100%)' }}>
          <div className="w-full h-full rounded-full flex items-center justify-center">
            <div className="w-3 h-3 rounded-full bg-amber-900 border-2 border-amber-700" />
          </div>
        </div>
      </div>
      <p className="text-sm font-medium" style={{ color: '#d4a84b' }}>Carregando áudio...</p>
      <p className="text-xs mt-1" style={{ color: '#8b6b3d' }}>Acordando o defunto da soneca... 😴💤</p>
    </div>
  );
}