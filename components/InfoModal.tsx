"use client";

import { useState } from "react";

export default function InfoModal() {
  const [isOpen, setIsOpen] = useState(false);
  const whatsappNumber = '5531999967074';

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
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <button 
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 p-3 rounded-lg w-full transition-colors"
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

      <a
        href={`https://wa.me/${whatsappNumber}?text=Oi%20Dona%20da%20Noite!`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 p-3 rounded-lg w-full transition-colors"
        style={{ background: 'linear-gradient(180deg, #25d366 0%, #128c7e 100%)', border: '1px solid #4a3020' }}
      >
        <svg viewBox="0 0 24 24" className="w-4 h-4 text-white" fill="currentColor">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
        <span className="text-sm font-medium text-white">Enviar mensagem pro programa</span>
      </a>
    </div>
  );
}