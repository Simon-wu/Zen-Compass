import React, { useState, useEffect, useRef } from 'react';
import { useCompass } from './hooks/useCompass';
import { useFeedback } from './hooks/useFeedback';
import CompassRing from './components/CompassRing';
import LevelBubble from './components/LevelBubble';
import { Info, Volume2, VolumeX, Compass } from 'lucide-react';

const App: React.FC = () => {
  const { compassData, needsPermission, permissionGranted, requestPermission, error: compassError } = useCompass();
  const { initAudio, playClick, triggerHaptic } = useFeedback();
  
  const [showInfo, setShowInfo] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  
  // Track previous heading to trigger effects on change
  const prevHeadingRef = useRef(compassData.heading);

  // Handle Feedback (Audio/Haptics)
  useEffect(() => {
    if (!permissionGranted) return;

    const current = Math.round(compassData.heading);
    const prev = Math.round(prevHeadingRef.current);

    if (current !== prev) {
      const diff = Math.abs(current - prev);
      // Avoid triggering on large jumps (wrap-around handled elsewhere usually, but safety check)
      if (diff < 20) { 
        // Logic for feedback type
        if (current === 0 || current === 360) {
            // North - Heavy feedback
            if (soundEnabled) playClick('heavy');
            triggerHaptic('heavy');
        } else if (current % 90 === 0) {
            // East, South, West - Medium feedback
            if (soundEnabled) playClick('medium');
            triggerHaptic('medium');
        } else if (current % 2 === 0) {
            // Every 2 degrees - Light tick
            if (soundEnabled) playClick('light');
            triggerHaptic('light');
        }
      }
    }
    prevHeadingRef.current = compassData.heading;
  }, [compassData.heading, permissionGranted, soundEnabled, playClick, triggerHaptic]);


  // Helper to convert heading to cardinal direction string
  const getCardinalDirection = (deg: number) => {
    // Normalized degree 0-360
    const normalized = ((deg % 360) + 360) % 360;
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const index = Math.round(normalized / 45) % 8;
    return directions[index];
  };

  const handleStart = async () => {
    initAudio(); // Unlock audio context on user gesture
    await requestPermission();
  };

  const toggleSound = () => {
    if (!soundEnabled) initAudio(); // Ensure context is ready if enabling
    setSoundEnabled(!soundEnabled);
  };

  // Safe display for heading
  const displayHeading = Math.round(compassData.heading);

  if (needsPermission && !permissionGranted) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 space-y-8 font-sans">
        <div className="w-24 h-24 rounded-[2rem] bg-neutral-900 border border-neutral-800 flex items-center justify-center shadow-2xl shadow-black/50 ring-1 ring-white/10">
          <Compass className="w-12 h-12 text-white animate-pulse" strokeWidth={1} />
        </div>
        <div className="text-center space-y-4">
            <h1 className="text-3xl font-light tracking-wide">Zen Compass</h1>
            <p className="text-neutral-500 max-w-xs mx-auto text-sm leading-relaxed">
              Precision orientation tool.
              <br />
              Tap below to calibrate.
            </p>
        </div>
        <button
          onClick={handleStart}
          className="px-12 py-4 bg-white text-black rounded-full font-medium tracking-wide active:scale-95 transition-all duration-300 hover:bg-neutral-200 shadow-[0_0_20px_rgba(255,255,255,0.3)]"
        >
          Start
        </button>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-black text-white overflow-hidden flex flex-col font-sans select-none">
      {/* Background radial gradient for subtle texture */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-neutral-900/40 via-black to-black pointer-events-none" />

      {/* Header */}
      <header className="relative z-10 p-6 flex justify-between items-center opacity-0 animate-[fadeIn_1s_ease-out_forwards]">
         <div className="flex flex-col">
            <h1 className="text-sm font-medium tracking-[0.2em] text-neutral-400 uppercase">Compass</h1>
         </div>
         
         <div className="flex space-x-3">
             <button 
                onClick={toggleSound}
                className="w-10 h-10 flex items-center justify-center bg-neutral-900/80 backdrop-blur-md rounded-full text-neutral-400 hover:text-white transition-all active:scale-90 border border-white/5"
             >
                 {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
             </button>
             <button 
                onClick={() => setShowInfo(!showInfo)}
                className="w-10 h-10 flex items-center justify-center bg-neutral-900/80 backdrop-blur-md rounded-full text-neutral-400 hover:text-white transition-all active:scale-90 border border-white/5"
             >
                 <Info size={16} />
             </button>
         </div>
      </header>

      {/* Main Compass Area */}
      <main className="flex-1 flex flex-col items-center justify-center relative pb-20">
        
        {/* The Top Indicator Triangle */}
        <div className="absolute z-20 top-[8%] sm:top-[12%] md:top-[15%] flex flex-col items-center">
            <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[10px] border-t-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.6)]"></div>
            <div className="w-[1px] h-6 bg-gradient-to-b from-red-500/50 to-transparent mt-1"></div>
        </div>

        {/* Compass Dial Container */}
        <div className="relative w-[88vw] h-[88vw] max-w-[400px] max-h-[400px]">
          
          {/* Level Bubble Layer */}
          <LevelBubble roll={compassData.roll} pitch={compassData.pitch} />

          {/* Rotating Ring with 3D Tilt Props */}
          <CompassRing 
            heading={compassData.heading} 
            roll={compassData.roll}
            pitch={compassData.pitch}
          />
          
          {/* Center Digital Readout (Floating) */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <div className="flex flex-col items-center justify-center z-30 transform transition-transform duration-100" style={{ transform: 'translateZ(40px)' }}>
                 <h1 className="text-6xl sm:text-7xl font-light tracking-tighter tabular-nums text-white drop-shadow-2xl">
                    {displayHeading}°
                 </h1>
                 <span className="text-xl sm:text-2xl font-normal text-neutral-500 mt-1 tracking-widest ml-1">
                    {getCardinalDirection(displayHeading)}
                 </span>
            </div>
          </div>
        </div>

      </main>

      {/* Footer Info */}
      <footer className="relative z-10 p-8 flex flex-col items-center space-y-2 mb-safe">
        {compassError ? (
            <p className="text-red-400 text-xs bg-red-900/10 border border-red-900/30 px-4 py-2 rounded-full backdrop-blur-sm">{compassError}</p>
        ) : (
            <div className="flex space-x-8 text-neutral-600 text-[10px] tracking-widest font-mono uppercase">
                <span>Pitch {Math.round(compassData.pitch)}°</span>
                <span>Roll {Math.round(compassData.roll)}°</span>
            </div>
        )}
      </footer>

      {/* Info Modal/Overlay */}
      {showInfo && (
        <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-6 animate-[fadeIn_0.2s_ease-out]">
            <div className="bg-[#1c1c1e] border border-white/10 rounded-3xl p-8 max-w-xs w-full shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-neutral-800 via-white/20 to-neutral-800"></div>
                <h2 className="text-lg font-medium mb-6 text-white text-center tracking-wide">Usage Guide</h2>
                <div className="space-y-4 text-sm text-neutral-400 leading-relaxed font-light">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white shrink-0">1</div>
                        <p>Keep device flat.</p>
                    </div>
                     <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white shrink-0">2</div>
                        <p>Avoid magnets & metal.</p>
                    </div>
                     <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white shrink-0">3</div>
                        <p>Feedback confirms North.</p>
                    </div>
                </div>
                <button 
                    onClick={() => setShowInfo(false)}
                    className="mt-8 w-full py-3.5 bg-white text-black rounded-xl font-medium text-sm active:scale-95 transition-all hover:bg-neutral-100"
                >
                    Dismiss
                </button>
            </div>
        </div>
      )}
    </div>
  );
};

export default App;