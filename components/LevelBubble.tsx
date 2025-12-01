import React from 'react';

interface LevelBubbleProps {
  roll: number;  // X tilt
  pitch: number; // Y tilt
}

const LevelBubble: React.FC<LevelBubbleProps> = ({ roll, pitch }) => {
  // Constrain movement within the circle
  // Max tilt to visualize approx 45 degrees
  const maxTilt = 20; 
  
  const x = Math.max(-maxTilt, Math.min(maxTilt, roll));
  const y = Math.max(-maxTilt, Math.min(maxTilt, pitch));
  
  // Map tilt to percentage offset. Center is 50%.
  // If tilt is 0, left is 50%.
  // If tilt is maxTilt, left is roughly 100% or close to edge.
  // We want pixels relative to the center crosshair.
  // Let's say range is +/- 50px visually.
  
  const xOffset = (x / maxTilt) * 40; 
  const yOffset = (y / maxTilt) * 40;

  const isLevel = Math.abs(roll) < 2 && Math.abs(pitch) < 2;

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {/* Outer Crosshair lines (Static) */}
        <div className="w-[120px] h-[1px] bg-neutral-800 absolute"></div>
        <div className="h-[120px] w-[1px] bg-neutral-800 absolute"></div>
        
        {/* Center Target (Static) */}
        <div className={`w-2 h-2 rounded-full border border-neutral-700 absolute transition-colors duration-500 ${isLevel ? 'bg-white border-white' : 'bg-transparent'}`}></div>

        {/* Moving Bubble */}
        <div 
            className="w-[200px] h-[200px] absolute flex items-center justify-center"
            style={{
                transform: `translate(${xOffset}px, ${yOffset}px)`,
                transition: 'transform 0.1s linear'
            }}
        >
            <div className={`w-12 h-12 rounded-full border border-neutral-500 opacity-40 flex items-center justify-center shadow-inner ${isLevel ? 'bg-green-500/20 border-green-400' : ''}`}>
                 <div className="w-1 h-1 bg-white rounded-full opacity-80"></div>
            </div>
        </div>
    </div>
  );
};

export default LevelBubble;