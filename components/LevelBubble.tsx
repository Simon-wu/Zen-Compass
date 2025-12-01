import React from 'react';

interface LevelBubbleProps {
  roll: number;  // X tilt
  pitch: number; // Y tilt
}

const LevelBubble: React.FC<LevelBubbleProps> = ({ roll, pitch }) => {
  const maxTilt = 15;
  const x = Math.max(-maxTilt, Math.min(maxTilt, roll));
  const y = Math.max(-maxTilt, Math.min(maxTilt, pitch));
  
  // Visual range in pixels
  const range = 60;
  const xOffset = (x / maxTilt) * range; 
  const yOffset = (y / maxTilt) * range;

  const isLevel = Math.abs(roll) < 1.5 && Math.abs(pitch) < 1.5;

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
        
        {/* Crosshair etchings on the glass */}
        <div className="absolute w-[60%] h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
        <div className="absolute h-[60%] w-[1px] bg-gradient-to-b from-transparent via-white/10 to-transparent"></div>
        
        {/* Center Target Marker */}
        <div className={`w-12 h-12 rounded-full border transition-all duration-700 ease-out flex items-center justify-center
            ${isLevel 
                ? 'border-cyan-400/40 shadow-[0_0_30px_rgba(34,211,238,0.2)]' 
                : 'border-white/5'
            }`}>
             <div className={`w-1 h-1 rounded-full transition-colors duration-500 ${isLevel ? 'bg-cyan-400' : 'bg-white/10'}`}></div>
        </div>

        {/* The Liquid Bubble Container */}
        <div 
            className="absolute flex items-center justify-center will-change-transform"
            style={{
                transform: `translate(${xOffset}px, ${yOffset}px)`,
                transition: 'transform 0.1s cubic-bezier(0.1, 0.5, 0.2, 1)' // Responsive liquid feel
            }}
        >
            {/* 
               Mercury / Liquid Chrome Effect 
               Combining gradients and shadows to look like reflective liquid metal
            */}
            <div className={`w-8 h-8 rounded-full transition-all duration-500 relative
                ${isLevel 
                    ? 'scale-110' 
                    : 'scale-100'
                }
            `}>
                {/* Core Liquid */}
                <div className={`absolute inset-0 rounded-full shadow-[0_4px_10px_rgba(0,0,0,0.5)] bg-gradient-to-b
                    ${isLevel 
                        ? 'from-cyan-300 via-cyan-500 to-blue-600' 
                        : 'from-gray-100 via-gray-300 to-gray-500'
                    }
                `}></div>
                
                {/* Surface Reflection (Gloss) */}
                <div className="absolute top-1 left-2 right-2 h-3 rounded-full bg-gradient-to-b from-white/90 to-transparent opacity-80 blur-[1px]"></div>
                
                {/* Bottom Glow (Caustics) */}
                <div className={`absolute -bottom-1 left-1 right-1 h-2 rounded-full blur-md opacity-60
                     ${isLevel ? 'bg-cyan-400' : 'bg-white'}
                `}></div>
            </div>
        </div>
    </div>
  );
};

export default LevelBubble;