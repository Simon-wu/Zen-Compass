import React, { useMemo } from 'react';

interface CompassRingProps {
  heading: number;
  roll?: number;
  pitch?: number;
}

const CompassRing: React.FC<CompassRingProps> = ({ heading, roll = 0, pitch = 0 }) => {
  // Memoize the dial generation to prevent expensive recalculations on every frame
  const { majorTicks, minorTicks, labels, cardinals } = useMemo(() => {
    const major = [];
    const minor = [];
    const lbls = [];

    for (let i = 0; i < 360; i++) {
      // Rotate transform for each tick
      // Center is 150, 150
      const transform = `rotate(${i} 150 150)`;

      if (i % 30 === 0) {
        // Major Tick (Every 30 degrees)
        major.push(
          <line
            key={`major-${i}`}
            x1="150"
            y1="25"
            x2="150"
            y2="45"
            stroke="white"
            strokeWidth="2"
            transform={transform}
            strokeLinecap="round"
          />
        );
        
        // Degree Numbers (Skip Cardinals)
        if (i % 90 !== 0) { 
             lbls.push(
                <text
                    key={`deg-${i}`}
                    x="150"
                    y="18"
                    fill="#a3a3a3" // neutral-400
                    fontSize="10"
                    fontWeight="500"
                    textAnchor="middle"
                    transform={`rotate(${i} 150 150)`}
                    className="font-mono tracking-tighter"
                    style={{ 
                        // Force hardware acceleration for text rendering
                        transformOrigin: '150px 150px' 
                    }}
                >
                    {i}
                </text>
             )
        }

      } else if (i % 2 === 0) {
        // Minor Tick (Every 2 degrees)
        // Skip area near cardinals for cleanliness
        const isNearCardinal = i % 90 < 4 || i % 90 > 86;
        if (!isNearCardinal) {
            minor.push(
            <line
                key={`minor-${i}`}
                x1="150"
                y1="35"
                x2="150"
                y2="45"
                stroke="#525252" // neutral-600
                strokeWidth="1"
                transform={transform}
                opacity="0.5"
                strokeLinecap="round"
            />
            );
        }
      }
    }
    
    // Cardinal Directions
    // Standard compass: N is at 0 degrees.
    const cards = [
        { label: 'N', deg: 0, color: '#ef4444' }, // Red for North
        { label: 'E', deg: 90, color: '#ffffff' },
        { label: 'S', deg: 180, color: '#ffffff' },
        { label: 'W', deg: 270, color: '#ffffff' },
    ];

    return { majorTicks: major, minorTicks: minor, labels: lbls, cardinals: cards };
  }, []);

  // Limit tilt for visual sanity and smooth dampening
  const xTilt = Math.max(-10, Math.min(10, pitch)); 
  const yTilt = Math.max(-10, Math.min(10, roll));

  return (
    <div 
        className="relative w-full h-full flex items-center justify-center"
        style={{
            perspective: '1000px',
            transformStyle: 'preserve-3d'
        }}
    >
      {/* SVG Container with 3D Float Effect */}
      <div 
        className="w-full h-full absolute top-0 left-0 will-change-transform"
        style={{
            // Rotate the plane slightly opposite to the phone tilt to create a "floating gyroscope" effect
            transform: `rotateX(${-xTilt}deg) rotateY(${yTilt}deg)`,
            transition: 'transform 0.2s cubic-bezier(0.2, 0.8, 0.2, 1)'
        }}
      >
          <svg
            viewBox="0 0 300 300"
            className="w-full h-full will-change-transform"
            style={{ 
                transform: `rotate(${-heading}deg)`,
                transition: 'transform 0.1s cubic-bezier(0.25, 1, 0.5, 1)', // Snappier response
                filter: 'drop-shadow(0px 10px 20px rgba(0,0,0,0.6))'
            }}
          >
            {/* Subtle Gradient Ring Background */}
            <circle cx="150" cy="150" r="145" fill="#171717" stroke="none" opacity="0.3" />
            
            {/* Ticks */}
            <g>{minorTicks}</g>
            <g>{majorTicks}</g>
            <g>{labels}</g>

            {/* Cardinal Letters (N, E, S, W) */}
            {cardinals.map((c) => (
                <g key={c.label} transform={`rotate(${c.deg} 150 150)`}>
                    <text
                        x="150"
                        y="65" 
                        fill={c.color}
                        fontSize="32"
                        fontWeight="600"
                        textAnchor="middle"
                        className="font-sans"
                        style={{
                            // We counter-rotate the letter so it stays upright relative to the screen?
                            // Actually, standard compasses have the letter fixed to the dial.
                            // If I turn East (90), the dial rotates -90. E moves to top.
                            // So E should be upright relative to the DIAL center.
                            // However, strictly readable letters often stay upright relative to viewer in digital UIs,
                            // but for a physical simulation, they should rotate with the dial.
                            // Let's keep them fixed to dial for realism.
                        }}
                    >
                        {c.label}
                    </text>
                </g>
            ))}

            {/* Inner Decoration Ring */}
            <circle cx="150" cy="150" r="148" fill="none" stroke="#333" strokeWidth="1" opacity="0.5" />
          </svg>
      </div>
    </div>
  );
};

export default CompassRing;