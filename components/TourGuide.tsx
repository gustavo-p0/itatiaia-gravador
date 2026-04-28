"use client";

import { useState, useEffect } from "react";

interface TourStep {
  title: string;
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

interface TourGuideProps {
  steps: TourStep[];
  onComplete: () => void;
}

export default function TourGuide({ steps, onComplete }: TourGuideProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const hasSeenTour = localStorage.getItem('hasSeenTour');
    if (!hasSeenTour) {
      setTimeout(() => setVisible(true), 1500);
    }
  }, []);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      localStorage.setItem('hasSeenTour', 'true');
      setVisible(false);
      onComplete();
    }
  };

  const handleSkip = () => {
    localStorage.setItem('hasSeenTour', 'true');
    setVisible(false);
    onComplete();
  };

  if (!visible) return null;

  const step = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleSkip} />
      
      <div 
        className="relative mx-4 max-w-sm rounded-xl p-5 shadow-2xl animate-pulse-glow"
        style={{ 
          background: 'linear-gradient(180deg, #3d2b1f 0%, #2d1b14 100%)',
          border: '2px solid #d4a84b',
          animation: 'pulse-glow 2s ease-in-out infinite'
        }}
      >
        <div className="mb-4">
          <div className="h-2 w-full rounded-full overflow-hidden" style={{ backgroundColor: '#4a3020' }}>
            <div 
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${progress}%`, backgroundColor: '#d4a84b' }}
            />
          </div>
          <p className="text-xs mt-2 text-right" style={{ color: '#8b6b3d' }}>
            {currentStep + 1} de {steps.length}
          </p>
        </div>

        <h3 className="text-lg font-bold mb-2" style={{ color: '#d4a84b', fontFamily: 'Georgia, serif' }}>
          {step.title}
        </h3>
        
        <p className="text-sm mb-4" style={{ color: '#a08060' }}>
          {step.content}
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
            className="px-3 py-2 rounded text-sm ml-auto"
            style={{ color: '#6b5030' }}
          >
            Pular
          </button>
          
          <button 
            onClick={handleNext}
            className="px-4 py-2 rounded text-sm font-bold"
            style={{ backgroundColor: '#d4a84b', color: '#2d1b14' }}
          >
            {currentStep < steps.length - 1 ? 'Próximo' : 'Começar'}
          </button>
        </div>
      </div>
    </div>
  );
}