"use client";

export default function LoadingOverlay() {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center z-10" style={{ background: 'linear-gradient(180deg, #2d251b 0%, #1a1510 100%)', boxShadow: 'inset 0 0 40px rgba(0,0,0,0.8)' }}>
      <div className="relative w-24 h-24 mb-4">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-20 h-20 rounded-sm bg-gradient-to-br from-neutral-800 to-neutral-950 border border-neutral-600" style={{ transform: 'rotate(-10deg) translateX(-8px)' }} />
          <div className="absolute w-20 h-20 rounded-sm bg-gradient-to-br from-neutral-800 to-neutral-950 border border-neutral-600 flex items-center justify-center" style={{ animation: 'slideOut 1.5s ease-in-out infinite' }}>
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-neutral-700 to-neutral-900" />
            <div className="absolute w-4 h-4 rounded-full bg-neutral-950" />
            <div className="absolute w-2 h-2 rounded-full bg-neutral-500" />
          </div>
        </div>
      </div>
      <h2 className="text-center italic font-bold mb-1" style={{ color: '#d4a84b', fontFamily: 'Georgia, serif' }}>Carregando...</h2>
      <p className="text-center text-sm" style={{ color: '#8b6b3d' }}>Acordando o defunto da soneca... 😴💤</p>
      <style jsx>{`
        @keyframes slideOut {
          0%, 100% { transform: translateX(0) rotate(-5deg); }
          50% { transform: translateX(12px) rotate(0deg); }
        }
      `}</style>
    </div>
  );
}