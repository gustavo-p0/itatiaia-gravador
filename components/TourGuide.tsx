"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";

interface TourStep {
  targetId: string;
  title: string;
  content: string;
}

interface TourGuideProps {
  steps: TourStep[];
  onComplete: () => void;
}

export default function TourGuide({ steps, onComplete }: TourGuideProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    const hasSeenTour = localStorage.getItem('hasSeenTourDonaNoite');
    if (!hasSeenTour) {
      setTimeout(() => setVisible(true), 2000);
    }
  }, []);

  useEffect(() => {
    if (visible && mounted) {
      const step = steps[currentStep];
      if (step?.targetId) {
        const element = document.getElementById(step.targetId);
        if (element) {
          const rect = element.getBoundingClientRect();
          const scrollY = window.scrollY;
          
          setTooltipPosition({
            top: rect.bottom + scrollY + 12,
            left: Math.max(16, rect.left + rect.width / 2 - 160)
          });
        }
      }
    }
  }, [currentStep, visible, mounted, steps]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      localStorage.setItem('hasSeenTourDonaNoite', 'true');
      setVisible(false);
      onComplete();
    }
  };

  const handleSkip = () => {
    localStorage.setItem('hasSeenTourDonaNoite', 'true');
    setVisible(false);
    onComplete();
  };

  if (!mounted || !visible) return null;

  const step = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;

  return createPortal(
    <div className="fixed inset-0 z-[9999] pointer-events-none">
      {step?.targetId && (
        <div className="absolute border-2 border-dashed rounded-lg" style={{
          borderColor: '#d4a84b',
          background: 'transparent',
          boxShadow: '0 0 0 9999px rgba(0,0,0,0.85)',
          ...(() => {
            const element = document.getElementById(step.targetId);
            if (element) {
              const rect = element.getBoundingClientRect();
              return {
                top: rect.top - 4,
                left: rect.left - 4,
                width: rect.width + 8,
                height: rect.height + 8,
              };
            }
            return {};
          })()
        }} />
      )}

      <div 
        ref={tooltipRef}
        className="fixed w-80 rounded-xl shadow-2xl pointer-events-auto"
        style={{ 
          top: step?.targetId ? undefined : '50%',
          left: step?.targetId ? tooltipPosition.left : '50%',
          transform: step?.targetId ? undefined : 'translate(-50%, -50%)',
          background: 'linear-gradient(180deg, #3d2b1f 0%, #2d1b14 100%)',
          border: '2px solid #d4a84b',
          zIndex: 10000,
          animation: 'fadeIn 0.3s ease'
        }}
      >
        <div className="mb-3">
          <div className="h-1.5 w-full rounded-full overflow-hidden" style={{ backgroundColor: '#4a3020' }}>
            <div 
              className="h-full rounded-full transition-all duration-300"
              style={{ width: `${progress}%`, backgroundColor: '#d4a84b' }}
            />
          </div>
          <p className="text-xs mt-2 text-right" style={{ color: '#8b6b3d' }}>
            Passo {currentStep + 1} de {steps.length}
          </p>
        </div>

        <h3 className="text-base font-bold mb-2" style={{ color: '#d4a84b', fontFamily: 'Georgia, serif' }}>
          {step?.title}
        </h3>
        
        <p className="text-sm mb-4" style={{ color: '#a08060' }}>
          {step?.content}
        </p>

        <div className="flex gap-2">
          {currentStep > 0 && (
            <button 
              onClick={() => setCurrentStep(currentStep - 1)}
              className="px-3 py-2 rounded text-sm"
              style={{ backgroundColor: '#2d1b14', color: '#8b6b3d', border: '1px solid #4a3020' }}
            >
              Anterior
            </button>
          )}
          
          <button 
            onClick={handleSkip}
            className="px-3 py-2 rounded text-sm"
            style={{ color: '#6b5030' }}
          >
            Pular tour
          </button>
          
          <button 
            onClick={handleNext}
            className="px-4 py-2 rounded text-sm font-bold ml-auto"
            style={{ backgroundColor: '#d4a84b', color: '#2d1b14' }}
          >
            {currentStep < steps.length - 1 ? 'Próximo' : 'Começar a usar!'}
          </button>
        </div>
      </div>

      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>,
    document.body
  );
}