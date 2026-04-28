"use client";

import { useState } from "react";

export default function InfoModal() {
  const [isOpen, setIsOpen] = useState(false);

  if (isOpen) {
    return (
      <div className="mt-4 p-4 rounded-lg" style={{ background: 'linear-gradient(180deg, #3d2b1f 0%, #2d1b14 100%)', border: '1px solid #4a3020' }}>
        <button 
          onClick={() => setIsOpen(false)}
          className="w-full flex items-center justify-between text-left"
        >
          <div className="flex items-center gap-2">
            <svg viewBox="0 0 24 24" className="w-4 h-4" style={{ color: '#d4a84b' }} fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
            </svg>
            <span className="text-sm font-medium" style={{ color: '#d4a84b' }}>Sobre o programa</span>
          </div>
          <svg viewBox="0 0 24 24" className="w-4 h-4" style={{ color: '#8b6b3d' }} fill="currentColor">
            <path d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6z"/>
          </svg>
        </button>
        
        <div className="mt-3 text-sm space-y-2" style={{ color: '#a08060' }}>
          <p>O <strong style={{ color: '#d4a84b' }}>Itatiaia - Dona da Noite</strong> é uma atração noturna da Rádio Itatiaia focada na interatividade, música e a famosa "Oração do Dia", transmitido diariamente da meia-noite às 4h da manhã.</p>
          
          <p className="text-xs" style={{ color: '#6b5030' }}>Apresentado por Gutemberg Gomes e Tinelão (TinelaoNaArea), com forte participação dos ouvintes via WhatsApp.</p>
          
          <div className="pt-2 border-t" style={{ borderColor: '#4a3020' }}>
            <p className="text-xs" style={{ color: '#6b5030' }}>Horário: De segunda a domingo, das 00h às 04h.</p>
            <p className="text-xs" style={{ color: '#6b5030' }}>Transmitido pela 95,7 FM, 610 AM, rede Itasat e site oficial.</p>
            <p className="text-xs" style={{ color: '#6b5030' }}>WhatsApp: (31) 99996-7074</p>
          </div>
          
          <p className="text-xs italic pt-2" style={{ color: '#5a4030' }}>
            Este app é um reprodução independente. Não possui vínculo com a RNI ou Rádio Itatiaia. As gravações são de autoria do programa.
          </p>
        </div>
      </div>
    );
  }

  return (
    <button 
      onClick={() => setIsOpen(true)}
      className="mt-4 flex items-center gap-2 p-3 rounded-lg w-full transition-colors"
      style={{ background: 'linear-gradient(180deg, #3d2b1f 0%, #2d1b14 100%)', border: '1px solid #4a3020' }}
    >
      <svg viewBox="0 0 24 24" className="w-4 h-4" style={{ color: '#d4a84b' }} fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
      </svg>
      <span className="text-sm font-medium" style={{ color: '#d4a84b' }}>Sobre o programa</span>
      <svg viewBox="0 0 24 24" className="w-4 h-4 ml-auto" style={{ color: '#8b6b3d' }} fill="currentColor">
        <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
      </svg>
    </button>
  );
}