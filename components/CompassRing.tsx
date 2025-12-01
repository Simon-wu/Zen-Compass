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
        // Major Tick - Glowing "Neon Tubes"
        major.push(
          <line
            key={`major-${i}`}
            x1="150"
            y1="25"
            x2="150"
            y2="42"
            stroke="white"
            strokeWidth="2"
            transform={transform}
            strokeLinecap="round"
            className="opacity-90 drop-shadow-[0_0_4px_rgba(255,255,255,0.8)]"
          />
        );
        
        // Degree Numbers
        if (i % 90 !== 0) { 
             lbls.push(
                <text
                    key={`deg-${i}`}
                    x="150"
                    y="20"
                    fill="rgba(255,255,255,0.5)"
                    fontSize="8"
                    fontWeight="500"
                    textAnchor="middle"
                    transform={`rotate(${i} 150 150)`}
                    className="font-mono tracking-widest"
                >
                    {i}
                </text>
             )
        }

      } else if (i % 2 === 0) {
        // Minor Tick - Subtle etching
        const isNearCardinal = i % 90 < 5 || i % 90 > 85;
        if (!isNearCardinal) {
            minor.push(
            <line
                key={`minor-${i}`}
                x1="150"
                y1="34"
                x2="150"
                y2="42"
                stroke="rgba(255,255,255,0.15)"
                strokeWidth="1"
                transform={transform}
                strokeLinecap="round"
            />
            );
        }
      }
    }
    
    const cards = [
        { label: 'N', deg: 0, color: '#FF453A' }, // SF Red
        { label: 'E', deg: 90, color: '#F2F2F7' },
        { label: 'S', deg: 180, color: '#F2F2F7' },
        { label: 'W', deg: 270, color: '#F2F2F7' },
    ];

    return { majorTicks: major, minorTicks: minor, labels: lbls, cardinals: cards };
  }, []);

  const xTilt = Math.max(-20, Math.min(20, pitch)); 
  const yTilt = Math.max(-20, Math.min(20, roll));

  return (
    <div 
        className="relative w-full h-full flex items-center justify-center pointer-events-none"
        style={{ perspective: '1000px' }}
    >
      <div 
        className="w-full h-full absolute top-0 left-0 will-change-transform"
        style={{
            transform: `rotateX(${-xTilt}deg) rotateY(${yTilt}deg)`,
            transition: 'transform 0.2s cubic-bezier(0.2, 0.8, 0.2, 1)'
        }}
      >
          <svg
            viewBox="0 0 300 300"
            className="w-full h-full will-change-transform"
            style={{ 
                transform: `rotate(${-heading}deg)`,
                transition: 'transform 0.1s linear', // Smoother constant rotation
            }}
          >
            {/* Inner decorative glow ring */}
            <circle cx="150" cy="150" r="120" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="40" />
            <circle cx="150" cy="150" r="138" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1" strokeDasharray="2 6" opacity="0.5" />

            <g>{minorTicks}</g>
            <g>{majorTicks}</g>
            <g>{labels}</g>

            {/* Cardinal Letters */}
            {cardinals.map((c) => (
                <g key={c.label} transform={`rotate(${c.deg} 150 150)`}>
                    <text
                        x="150"
                        y="75" 
                        fill={c.color}
                        fontSize="32"
                        fontWeight="700"
                        textAnchor="middle"
                        className="font-sans"
                        style={{
                            filter: c.label === 'N' ? 'drop-shadow(0 0 8px rgba(255, 69, 58, 0.6))' : 'drop-shadow(0 0 4px rgba(255,255,255,0.2))'
                        }}
                    >
                        {c.label}
                    </text>
                    {/* Glowing indicator dot for cardinals */}
                    <circle cx="150" cy="90" r="2" fill={c.color} opacity="0.6" />
                </g>
            ))}
          </svg>
      </div>
    </div>
  );
};

export default CompassRing;