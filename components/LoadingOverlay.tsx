"use client";

export default function LoadingOverlay() {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center z-10" style={{ background: 'rgba(26, 21, 16, 0.9)' }}>
      <div className="relative w-20 h-20 mb-4">
        <div className="absolute inset-0 border-4 border-amber-800/30" />
        <div className="absolute inset-0 border-4 border-transparent border-t-amber-600 animate-spin" />
        <div className="absolute inset-[30%]" style={{ background: 'linear-gradient(135deg, #d4a84b 0%, #8b6b3d 100%)' }}>
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-2 h-2 bg-amber-900" />
          </div>
        </div>
      </div>
      <p className="text-sm font-medium" style={{ color: '#d4a84b' }}>Carregando áudio...</p>
      <p className="text-xs mt-1" style={{ color: '#8b6b3d' }}>Acordando o defunto...</p>
    </div>
  );
}