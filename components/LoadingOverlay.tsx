"use client";

export default function LoadingOverlay() {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center z-10" style={{ background: 'linear-gradient(180deg, #2d251b 0%, #1a1510 100%)', boxShadow: 'inset 0 0 40px rgba(0,0,0,0.8)' }}>
      <div className="flex justify-center mb-4">
        <div className="relative w-24 h-24">
          <div className="absolute inset-0 rounded-full disc-grooves animate-spin" style={{ animationDuration: '3s', animationPlayState: 'running' }} />
          <div className="absolute inset-[26%] rounded-full disc-center animate-spin" style={{ animationDuration: '3s', animationPlayState: 'running' }} />
          <div className="absolute inset-0 rounded-full flex items-center justify-center">
            <div className="w-3 h-3 rounded-full bg-amber-900 border-2 border-amber-700" />
          </div>
        </div>
      </div>
      <h2 className="text-center italic font-bold mb-1" style={{ color: '#d4a84b', fontFamily: 'Georgia, serif' }}>Carregando...</h2>
      <p className="text-center text-sm" style={{ color: '#8b6b3d' }}>Acordando o defunto da soneca... 😴💤</p>
    </div>
  );
}