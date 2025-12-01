import React, { useMemo } from 'react';

interface CompassRingProps {
  heading: number;
  roll?: number;
  pitch?: number;
}

const CompassRing: React.FC<CompassRingProps> = ({ heading, roll = 0, pitch = 0 }) => {
  const { majorTicks, minorTicks, labels, cardinals } = useMemo(() => {
    const major = [];
    const minor = [];
    const lbls = [];

    for (let i = 0; i < 360; i++) {
      const transform = `rotate(${i} 150 150)`;

      if (i % 30 === 0) {
        // Major Tick - Glowing "Light Pipes"
        major.push(
          <line
            key={`major-${i}`}
            x1="150"
            y1="25"
            x2="150"
            y2="40"
            stroke="url(#gradTick)"
            strokeWidth="2"
            transform={transform}
            strokeLinecap="round"
            className="drop-shadow-[0_0_2px_rgba(255,255,255,0.5)]"
          />
        );
        
        // Degree Numbers
        if (i % 90 !== 0) { 
             lbls.push(
                <text
                    key={`deg-${i}`}
                    x="150"
                    y="18"
                    fill="rgba(255,255,255,0.6)"
                    fontSize="9"
                    fontWeight="600"
                    textAnchor="middle"
                    transform={`rotate(${i} 150 150)`}
                    className="font-mono tracking-tighter"
                >
                    {i}
                </text>
             )
        }

      } else if (i % 2 === 0) {
        // Minor Tick - Etched glass look
        const isNearCardinal = i % 90 < 4 || i % 90 > 86;
        if (!isNearCardinal) {
            minor.push(
            <line
                key={`minor-${i}`}
                x1="150"
                y1="32"
                x2="150"
                y2="40"
                stroke="rgba(255,255,255,0.2)"
                strokeWidth="1"
                transform={transform}
                strokeLinecap="round"
            />
            );
        }
      }
    }
    
    const cards = [
        { label: 'N', deg: 0, color: '#FF3B30' }, // Apple Red
        { label: 'E', deg: 90, color: '#F8F9FA' },
        { label: 'S', deg: 180, color: '#F8F9FA' },
        { label: 'W', deg: 270, color: '#F8F9FA' },
    ];

    return { majorTicks: major, minorTicks: minor, labels: lbls, cardinals: cards };
  }, []);

  const xTilt = Math.max(-15, Math.min(15, pitch)); 
  const yTilt = Math.max(-15, Math.min(15, roll));

  return (
    <div 
        className="relative w-full h-full flex items-center justify-center"
        style={{ perspective: '1200px' }}
    >
      <div 
        className="w-full h-full absolute top-0 left-0 will-change-transform"
        style={{
            transform: `rotateX(${-xTilt}deg) rotateY(${yTilt}deg)`,
            transition: 'transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)'
        }}
      >
          <svg
            viewBox="0 0 300 300"
            className="w-full h-full will-change-transform"
            style={{ 
                transform: `rotate(${-heading}deg)`,
                transition: 'transform 0.15s cubic-bezier(0.25, 1, 0.5, 1)',
            }}
          >
            <defs>
                <linearGradient id="gradTick" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="white" stopOpacity="1" />
                    <stop offset="100%" stopColor="white" stopOpacity="0.4" />
                </linearGradient>
            </defs>

            {/* Subtle rotating glow behind the ticks */}
            <circle cx="150" cy="150" r="130" fill="none" stroke="url(#gradTick)" strokeWidth="0.5" opacity="0.1" strokeDasharray="4 4" />

            <g>{minorTicks}</g>
            <g>{majorTicks}</g>
            <g>{labels}</g>

            {/* Cardinal Letters */}
            {cardinals.map((c) => (
                <g key={c.label} transform={`rotate(${c.deg} 150 150)`}>
                    <text
                        x="150"
                        y="68" 
                        fill={c.color}
                        fontSize="36"
                        fontWeight="700"
                        textAnchor="middle"
                        className="font-sans"
                        style={{
                            textShadow: c.label === 'N' ? '0 0 20px rgba(255, 59, 48, 0.6)' : '0 0 10px rgba(255,255,255,0.3)'
                        }}
                    >
                        {c.label}
                    </text>
                    {/* Add a tiny dot below the letter for precision */}
                    <circle cx="150" cy="85" r="2" fill={c.color} opacity="0.8" />
                </g>
            ))}
          </svg>
      </div>
    </div>
  );
};

export default CompassRing;