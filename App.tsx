import React, { useState, useEffect, useRef } from 'react';
import { useCompass } from './hooks/useCompass';
import { useFeedback } from './hooks/useFeedback';
import CompassRing from './components/CompassRing';
import LevelBubble from './components/LevelBubble';
import { Info, Volume2, VolumeX, Compass as CompassIcon, Navigation } from 'lucide-react';

const App: React.FC = () => {
  const { compassData, needsPermission, permissionGranted, requestPermission, error: compassError } = useCompass();
  const { initAudio, playClick, triggerHaptic } = useFeedback();
  
  const [showInfo, setShowInfo] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  
  const prevHeadingRef = useRef(compassData.heading);

  useEffect(() => {
    if (!permissionGranted) return;

    const current = Math.round(compassData.heading);
    const prev = Math.round(prevHeadingRef.current);

    if (current !== prev) {
      const diff = Math.abs(current - prev);
      if (diff < 20) { 
        if (current === 0 || current === 360) {
            if (soundEnabled) playClick('heavy');
            triggerHaptic('heavy');
        } else if (current % 90 === 0) {
            if (soundEnabled) playClick('medium');
            triggerHaptic('medium');
        } else if (current % 2 === 0) {
            if (soundEnabled) playClick('light');
            triggerHaptic('light');
        }
      }
    }
    prevHeadingRef.current = compassData.heading;
  }, [compassData.heading, permissionGranted, soundEnabled, playClick, triggerHaptic]);


  const getCardinalDirection = (deg: number) => {
    const normalized = ((deg % 360) + 360) % 360;
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const index = Math.round(normalized / 45) % 8;
    return directions[index];
  };

  const handleStart = async () => {
    initAudio();
    await requestPermission();
  };

  const toggleSound = () => {
    if (!soundEnabled) initAudio();
    setSoundEnabled(!soundEnabled);
  };

  const displayHeading = Math.round(compassData.heading);

  // Permission / Start Screen
  if (needsPermission && !permissionGranted) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
        {/* Ambient Blobs */}
        <div className="absolute top-[-10%] left-[-10%] w-[60vw] h-[60vw] bg-indigo-600/30 rounded-full blur-[80px] animate-blob" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] bg-cyan-600/30 rounded-full blur-[80px] animate-blob animation-delay-2000" />

        <div className="z-10 flex flex-col items-center space-y-12">
            <div className="w-32 h-32 rounded-[2.5rem] bg-white/5 border border-white/10 backdrop-blur-2xl shadow-[0_0_40px_rgba(0,0,0,0.5)] flex items-center justify-center ring-1 ring-white/20">
                <CompassIcon className="w-14 h-14 text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]" strokeWidth={1.5} />
            </div>
            
            <div className="text-center space-y-3">
                <h1 className="text-5xl font-thin tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60">
                    Aether
                </h1>
                <p className="text-neutral-400 text-sm tracking-[0.2em] uppercase">Next Gen Compass</p>
            </div>

            <button
            onClick={handleStart}
            className="group relative px-10 py-4 bg-white/10 backdrop-blur-xl border border-white/20 text-white rounded-full font-medium tracking-wide overflow-hidden transition-all duration-300 hover:bg-white/20 hover:scale-105 active:scale-95 shadow-[0_0_30px_rgba(255,255,255,0.1)]"
            >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                <span className="relative">Initialize System</span>
            </button>
        </div>
      </div>
    );
  }

  // Main App Interface
  return (
    <div className="relative min-h-screen bg-black text-white overflow-hidden flex flex-col font-sans select-none">
      
      {/* --- Ambient Lighting Background --- */}
      <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-[80vw] h-[80vw] bg-purple-900/20 rounded-full blur-[120px] mix-blend-screen animate-blob" />
          <div className="absolute bottom-0 right-1/4 w-[80vw] h-[80vw] bg-blue-900/20 rounded-full blur-[120px] mix-blend-screen animate-blob animation-delay-4000" />
      </div>

      {/* --- Header --- */}
      <header className="relative z-20 p-6 pt-8 flex justify-between items-center">
         <div className="flex items-center gap-2">
            <Navigation size={14} className="text-cyan-400 fill-cyan-400/20" />
            <span className="text-xs font-semibold tracking-[0.2em] text-cyan-100/50 uppercase">Aether OS</span>
         </div>
         
         <div className="flex space-x-4">
             <button 
                onClick={toggleSound}
                className="w-12 h-12 flex items-center justify-center bg-white/5 backdrop-blur-xl rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-all active:scale-90 border border-white/10 shadow-[0_4px_20px_rgba(0,0,0,0.2)]"
             >
                 {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
             </button>
             <button 
                onClick={() => setShowInfo(!showInfo)}
                className="w-12 h-12 flex items-center justify-center bg-white/5 backdrop-blur-xl rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-all active:scale-90 border border-white/10 shadow-[0_4px_20px_rgba(0,0,0,0.2)]"
             >
                 <Info size={18} />
             </button>
         </div>
      </header>

      {/* --- Main Content --- */}
      <main className="flex-1 flex flex-col items-center justify-center relative pb-20 z-10">
        
        {/* The Indicator (Fixed Needle) */}
        {/* We use a glass prism look for the indicator */}
        <div className="absolute z-30 top-[10%] sm:top-[12%] flex flex-col items-center pointer-events-none">
            <div className="w-1 h-8 bg-gradient-to-b from-red-500 to-transparent rounded-full drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]"></div>
        </div>

        {/* --- The Glass Puck Container --- */}
        <div className="relative">
            
            {/* Outer Glass Ring (The Device Housing Look) */}
            <div className="absolute inset-[-20px] rounded-full border border-white/5 bg-gradient-to-br from-white/5 to-transparent backdrop-blur-[2px] shadow-2xl opacity-60"></div>

            {/* Main Dial Area */}
            <div className="relative w-[90vw] h-[90vw] max-w-[420px] max-h-[420px] rounded-full">
                
                {/* 1. Base Glass Plate */}
                <div className="absolute inset-0 rounded-full bg-black/40 backdrop-blur-2xl border border-white/10 shadow-[inset_0_0_40px_rgba(0,0,0,0.8),_0_20px_60px_rgba(0,0,0,0.5)] ring-1 ring-white/5">
                    {/* Gloss Shine */}
                    <div className="absolute inset-0 rounded-full glass-shine opacity-30 pointer-events-none"></div>
                </div>

                {/* 2. Level Bubble (Liquid Layer) */}
                <LevelBubble roll={compassData.roll} pitch={compassData.pitch} />

                {/* 3. Compass Ring (Floating Layer) */}
                <CompassRing 
                    heading={compassData.heading} 
                    roll={compassData.roll}
                    pitch={compassData.pitch}
                />
                
                {/* 4. Digital Readout (Top Glass Layer) */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <div 
                        className="flex flex-col items-center justify-center transform transition-transform duration-100" 
                        style={{ 
                            transform: `translateZ(50px) rotateX(${-compassData.pitch/2}deg) rotateY(${compassData.roll/2}deg)` 
                        }}
                    >
                        <h1 className="text-7xl sm:text-8xl font-thin tracking-tighter tabular-nums text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-white/50 drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)]">
                            {displayHeading}°
                        </h1>
                        <span className="text-2xl font-light text-cyan-400 tracking-[0.3em] mt-2 drop-shadow-[0_0_10px_rgba(34,211,238,0.4)]">
                            {getCardinalDirection(displayHeading)}
                        </span>
                    </div>
                </div>
            </div>
        </div>

      </main>

      {/* --- Footer Stats --- */}
      <footer className="relative z-20 p-8 flex justify-center mb-safe">
        {compassError ? (
            <div className="backdrop-blur-md bg-red-500/10 border border-red-500/20 px-6 py-3 rounded-2xl">
                <p className="text-red-400 text-xs font-mono">{compassError}</p>
            </div>
        ) : (
            <div className="grid grid-cols-2 gap-px bg-white/10 rounded-2xl overflow-hidden shadow-lg backdrop-blur-xl border border-white/10">
                <div className="px-6 py-3 bg-black/20 flex flex-col items-center">
                    <span className="text-[10px] text-white/40 uppercase tracking-wider">Pitch</span>
                    <span className="text-lg font-light tabular-nums">{Math.round(compassData.pitch)}°</span>
                </div>
                <div className="px-6 py-3 bg-black/20 flex flex-col items-center">
                    <span className="text-[10px] text-white/40 uppercase tracking-wider">Roll</span>
                    <span className="text-lg font-light tabular-nums">{Math.round(compassData.roll)}°</span>
                </div>
            </div>
        )}
      </footer>

      {/* --- Info Modal (Glass Card) --- */}
      {showInfo && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]">
            <div className="bg-[#101010]/80 border border-white/10 rounded-[2.5rem] p-8 max-w-xs w-full shadow-[0_20px_60px_rgba(0,0,0,0.8)] relative overflow-hidden backdrop-blur-3xl">
                {/* Glow effect inside modal */}
                <div className="absolute -top-20 -left-20 w-40 h-40 bg-cyan-500/20 rounded-full blur-[60px]"></div>

                <h2 className="text-xl font-light mb-8 text-white text-center tracking-wider relative z-10">System Guide</h2>
                <div className="space-y-6 relative z-10">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.2)]">1</div>
                        <p className="text-sm text-neutral-400 font-light">Calibrate by tilting.</p>
                    </div>
                     <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.2)]">2</div>
                        <p className="text-sm text-neutral-400 font-light">Audio confirms North.</p>
                    </div>
                </div>
                <button 
                    onClick={() => setShowInfo(false)}
                    className="mt-10 w-full py-4 bg-white text-black rounded-2xl font-medium text-sm active:scale-95 transition-all hover:bg-cyan-50 hover:shadow-[0_0_20px_rgba(255,255,255,0.4)] relative z-10"
                >
                    Close
                </button>
            </div>
        </div>
      )}
    </div>
  );
};

export default App;