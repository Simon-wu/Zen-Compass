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
      // Only trigger feedback if movement is smooth/slow enough to be intentional
      // or if we cross major boundaries
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
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans select-none">
        {/* Ambient Blobs */}
        <div className="absolute top-0 left-[-20%] w-[80vw] h-[80vw] bg-indigo-900/40 rounded-full blur-[100px] blob-1" />
        <div className="absolute bottom-0 right-[-20%] w-[80vw] h-[80vw] bg-purple-900/30 rounded-full blur-[100px] blob-2" />

        <div className="z-10 flex flex-col items-center space-y-12 animate-[fadeIn_1s_ease-out]">
            <div className="w-32 h-32 rounded-[2.5rem] bg-gradient-to-br from-white/10 to-white/5 border border-white/20 backdrop-blur-2xl shadow-[0_0_50px_rgba(255,255,255,0.15)] flex items-center justify-center">
                <CompassIcon className="w-14 h-14 text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.8)]" strokeWidth={1.5} />
            </div>
            
            <div className="text-center space-y-4">
                <h1 className="text-5xl font-thin tracking-tighter text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.5)]">
                    Aether
                </h1>
                <p className="text-white/50 text-xs tracking-[0.3em] uppercase">Precision Instrument</p>
            </div>

            <button
            onClick={handleStart}
            className="group relative px-12 py-5 bg-white/5 backdrop-blur-xl border border-white/20 text-white rounded-full font-medium tracking-wide overflow-hidden transition-all duration-500 hover:bg-white/10 hover:border-white/40 hover:scale-105 active:scale-95 shadow-[0_0_40px_rgba(0,0,0,0.5)]"
            >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                <span className="relative drop-shadow-md">INITIALIZE</span>
            </button>
        </div>
      </div>
    );
  }

  // Main App Interface
  return (
    <div className="relative min-h-screen bg-black text-white overflow-hidden flex flex-col font-sans select-none touch-none">
      
      {/* --- Ambient Lighting Background --- */}
      <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[70vw] h-[70vw] bg-blue-900/20 rounded-full blur-[120px] mix-blend-screen blob-1" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[70vw] h-[70vw] bg-fuchsia-900/20 rounded-full blur-[120px] mix-blend-screen blob-2" />
      </div>

      {/* --- Header --- */}
      <header className="relative z-20 p-6 pt-10 flex justify-between items-center">
         <div className="flex items-center gap-3 glass-panel px-4 py-2 rounded-full">
            <Navigation size={14} className="text-cyan-400 fill-cyan-400" />
            <span className="text-[10px] font-bold tracking-[0.2em] text-white/80 uppercase">Aether OS</span>
         </div>
         
         <div className="flex space-x-4">
             <button 
                onClick={toggleSound}
                className={`w-11 h-11 flex items-center justify-center rounded-full transition-all duration-300 backdrop-blur-md border ${soundEnabled ? 'bg-white/10 border-white/20 text-white shadow-[0_0_15px_rgba(255,255,255,0.1)]' : 'bg-transparent border-white/5 text-white/40'}`}
             >
                 {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
             </button>
             <button 
                onClick={() => setShowInfo(!showInfo)}
                className="w-11 h-11 flex items-center justify-center bg-transparent border border-white/10 rounded-full text-white/60 hover:text-white hover:bg-white/5 transition-all backdrop-blur-md"
             >
                 <Info size={18} />
             </button>
         </div>
      </header>

      {/* --- Main Content --- */}
      <main className="flex-1 flex flex-col items-center justify-center relative pb-20 z-10 perspective-[1000px]">
        
        {/* The Indicator (Fixed Needle) */}
        <div className="absolute z-40 top-[8%] sm:top-[10%] flex flex-col items-center pointer-events-none opacity-90">
            <div className="w-[3px] h-8 bg-gradient-to-b from-red-500 to-transparent rounded-full shadow-[0_0_15px_rgba(239,68,68,1)]"></div>
        </div>

        {/* --- The Glass Puck Container --- */}
        <div className="relative group">
            
            {/* Ambient Glow behind the puck */}
            <div className="absolute inset-4 rounded-full bg-cyan-500/10 blur-[60px] animate-pulse"></div>

            {/* Main Dial Area */}
            <div className="relative w-[88vw] h-[88vw] max-w-[380px] max-h-[380px] rounded-full">
                
                {/* 1. Base Glass Plate */}
                <div className="absolute inset-0 rounded-full bg-[#0a0a0a]/60 backdrop-blur-3xl border border-white/10 shadow-[inset_0_0_30px_rgba(255,255,255,0.05),_0_30px_80px_rgba(0,0,0,0.8)]">
                    {/* Ring Highlights */}
                    <div className="absolute inset-0 rounded-full border border-white/5 mix-blend-overlay"></div>
                    <div className="absolute inset-[2px] rounded-full border border-white/5 mix-blend-overlay opacity-50"></div>
                </div>

                {/* 2. Level Bubble (Liquid Layer) */}
                <LevelBubble roll={compassData.roll} pitch={compassData.pitch} />

                {/* 3. Compass Ring (Floating Layer) */}
                <CompassRing 
                    heading={compassData.heading} 
                    roll={compassData.roll}
                    pitch={compassData.pitch}
                />
                
                {/* 4. Digital Readout (Floating Text) */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <div 
                        className="flex flex-col items-center justify-center transform transition-transform duration-200 ease-out" 
                        style={{ 
                            transform: `translateZ(40px) rotateX(${-compassData.pitch/3}deg) rotateY(${compassData.roll/3}deg)` 
                        }}
                    >
                        <h1 className="text-7xl sm:text-8xl font-thin tracking-[-0.05em] tabular-nums text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]">
                            {displayHeading}°
                        </h1>
                        <div className="mt-2 px-4 py-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
                            <span className="text-xl font-medium text-cyan-300 tracking-[0.2em] drop-shadow-[0_0_8px_rgba(34,211,238,0.6)]">
                                {getCardinalDirection(displayHeading)}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

      </main>

      {/* --- Footer Stats --- */}
      <footer className="relative z-20 p-8 flex justify-center mb-safe">
        {compassError ? (
            <div className="glass-panel px-6 py-3 rounded-2xl bg-red-500/5 border-red-500/20">
                <p className="text-red-400 text-xs font-mono tracking-wide">{compassError}</p>
            </div>
        ) : (
            <div className="grid grid-cols-2 gap-[1px] bg-white/10 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-xl border border-white/10">
                <div className="px-8 py-4 bg-black/40 flex flex-col items-center gap-1 group">
                    <span className="text-[9px] text-white/30 uppercase tracking-[0.2em] group-hover:text-cyan-400 transition-colors">Pitch</span>
                    <span className="text-lg font-light tabular-nums text-white/90">{Math.round(compassData.pitch)}°</span>
                </div>
                <div className="px-8 py-4 bg-black/40 flex flex-col items-center gap-1 group">
                    <span className="text-[9px] text-white/30 uppercase tracking-[0.2em] group-hover:text-cyan-400 transition-colors">Roll</span>
                    <span className="text-lg font-light tabular-nums text-white/90">{Math.round(compassData.roll)}°</span>
                </div>
            </div>
        )}
      </footer>

      {/* --- Info Modal (Glass Card) --- */}
      {showInfo && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]">
            <div className="glass-panel p-8 max-w-xs w-full rounded-[2rem] relative overflow-hidden">
                
                <div className="relative z-10 text-center">
                    <h2 className="text-2xl font-thin mb-8 text-white tracking-widest uppercase">Guide</h2>
                    <div className="space-y-6 text-left">
                        <div className="flex items-center gap-4 group">
                            <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.2)] group-hover:scale-110 transition-transform">1</div>
                            <p className="text-sm text-neutral-300 font-light">Tilt device to float dial.</p>
                        </div>
                         <div className="flex items-center gap-4 group">
                            <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.2)] group-hover:scale-110 transition-transform">2</div>
                            <p className="text-sm text-neutral-300 font-light">Haptics signal North.</p>
                        </div>
                    </div>
                    <button 
                        onClick={() => setShowInfo(false)}
                        className="mt-10 w-full py-4 bg-white text-black rounded-xl font-bold tracking-widest text-xs uppercase hover:bg-cyan-50 hover:shadow-[0_0_20px_rgba(255,255,255,0.5)] transition-all active:scale-95"
                    >
                        Dismiss
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default App;