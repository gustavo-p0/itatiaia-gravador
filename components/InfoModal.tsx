"use client";

import { useState } from "react";

export default function InfoModal() {
  const [isOpen, setIsOpen] = useState(false);
  const whatsappNumber = '5531999967074';

  return (
    <div className="flex flex-col gap-2 mt-4">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between p-3 rounded-lg w-full transition-all"
        style={{ 
          background: 'linear-gradient(180deg, #3d2b1f 0%, #2d1b14 100%)', 
          border: '1px solid #4a3020'
        }}
      >
        <div className="flex items-center gap-2">
          <svg viewBox="0 0 24 24" className="w-5 h-5" style={{ color: '#d4a84b' }} fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
          </svg>
          <span className="text-sm font-medium" style={{ color: '#d4a84b' }}>Sobre o programa</span>
        </div>
        <svg 
          viewBox="0 0 24 24" 
          className="w-5 h-5 transition-transform" 
          style={{ 
            color: '#8b6b3d',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)'
          }} 
          fill="currentColor"
        >
          <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6z"/>
        </svg>
      </button>

      {isOpen && (
        <div className="p-4 rounded-lg" style={{ background: 'linear-gradient(180deg, #3d2b1f 0%, #2d1b14 100%)', border: '1px solid #4a3020' }}>
          <div className="text-sm space-y-2" style={{ color: '#a08060' }}>
            <p>O <strong style={{ color: '#d4a84b' }}>Itatiaia - Dona da Noite</strong> é uma atração noturna da Rádio Itatiaia focada na interatividade, música e a famosa "Oração do Dia", transmitido diariamente da meia-noite às 4h da manhã.</p>
            
            <p className="text-xs" style={{ color: '#6b5030' }}>Apresentado por Gutemberg Gomes e Tinelão (TinelaoNaArea), com forte participação dos ouvintes via WhatsApp.</p>
            
            <div className="pt-2 border-t" style={{ borderColor: '#4a3020' }}>
              <p className="text-xs" style={{ color: '#6b5030' }}>Horário: De segunda a domingo, das 00h às 04h.</p>
              <p className="text-xs" style={{ color: '#6b5030' }}>Transmitido pela 95,7 FM, 610 AM, rede Itasat e site oficial.</p>
              <p className="text-xs" style={{ color: '#6b5030' }}>WhatsApp: (31) 99996-7074</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}