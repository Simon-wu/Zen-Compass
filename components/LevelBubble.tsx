import React from 'react';

interface LevelBubbleProps {
  roll: number;  // X tilt
  pitch: number; // Y tilt
}

const LevelBubble: React.FC<LevelBubbleProps> = ({ roll, pitch }) => {
  const maxTilt = 15; // Increased sensitivity visually
  const x = Math.max(-maxTilt, Math.min(maxTilt, roll));
  const y = Math.max(-maxTilt, Math.min(maxTilt, pitch));
  
  // Visual range in pixels
  const range = 50;
  const xOffset = (x / maxTilt) * range; 
  const yOffset = (y / maxTilt) * range;

  const isLevel = Math.abs(roll) < 1.5 && Math.abs(pitch) < 1.5;

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
        {/* Inner Glass Cavity (Inset Shadow) */}
        <div className="w-[140px] h-[140px] rounded-full border border-white/5 bg-black/20 shadow-[inset_0_4px_10px_rgba(0,0,0,0.5)] flex items-center justify-center backdrop-blur-sm">
            
            {/* Crosshair etchings */}
            <div className="absolute w-full h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
            <div className="absolute h-full w-[1px] bg-gradient-to-b from-transparent via-white/20 to-transparent"></div>

            {/* Target Zone */}
            <div className={`w-8 h-8 rounded-full border transition-all duration-500 ${isLevel ? 'border-cyan-400/50 bg-cyan-400/10 shadow-[0_0_15px_rgba(34,211,238,0.3)]' : 'border-white/10'}`}></div>

            {/* The Liquid Bubble */}
            <div 
                className="absolute w-10 h-10 flex items-center justify-center will-change-transform"
                style={{
                    transform: `translate(${xOffset}px, ${yOffset}px)`,
                    transition: 'transform 0.15s cubic-bezier(0.2, 0.8, 0.2, 1)'
                }}
            >
                {/* Bubble Body - Mercury/Liquid Glass Style */}
                <div className={`w-6 h-6 rounded-full shadow-[0_2px_10px_rgba(0,0,0,0.5)] transition-all duration-300
                    ${isLevel 
                        ? 'bg-gradient-to-br from-cyan-300 to-blue-600 shadow-[0_0_20px_rgba(34,211,238,0.6)] scale-110' 
                        : 'bg-gradient-to-br from-white to-neutral-400'
                    }
                `}>
                    {/* Specular Highlight on Bubble */}
                    <div className="absolute top-1 left-1 w-2 h-1 bg-white rounded-full opacity-90 blur-[0.5px]"></div>
                </div>
            </div>
        </div>
    </div>
  );
};

export default LevelBubble;