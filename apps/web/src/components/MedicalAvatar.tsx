import React, { useState, useEffect } from 'react';

export type AvatarStatus = 'idle' | 'listening' | 'loading' | 'done';

export interface MedicalAvatarProps {
  status?: AvatarStatus;
  isSpeaking?: boolean;
  language?: 'en' | 'hi' | 'mr';
  onClick?: () => void;
}

export const MedicalAvatar: React.FC<MedicalAvatarProps> = ({ onClick }) => {
  const [blink, setBlink] = useState(false);

  // Natural Eye Blinking Timer (Body stays static in one place)
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setBlink(true);
      setTimeout(() => setBlink(false), 160);
    }, 3500);
    return () => clearInterval(blinkInterval);
  }, []);

  return (
    <div
      onClick={onClick}
      className="relative flex flex-col items-center justify-center cursor-pointer select-none"
    >
      {/* Main White Robot Companion Body Container (Static Body Position) */}
      <div className="relative w-64 h-72 sm:w-72 sm:h-80 flex items-center justify-center">
        <svg
          viewBox="0 0 240 260"
          className="w-full h-full drop-shadow-xl"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Matte White Body Gradients */}
            <linearGradient id="robotBodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="70%" stopColor="#f1f5f9" />
              <stop offset="100%" stopColor="#e2e8f0" />
            </linearGradient>

            <linearGradient id="knobGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#cbd5e1" />
            </linearGradient>

            <linearGradient id="visorScreenGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0f172a" />
              <stop offset="40%" stopColor="#020617" />
              <stop offset="100%" stopColor="#000000" />
            </linearGradient>

            <linearGradient id="eyeGlowGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#f8fafc" />
            </linearGradient>

            {/* Glossy Visor Highlight */}
            <linearGradient id="visorGloss" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.25" />
              <stop offset="30%" stopColor="#ffffff" stopOpacity="0.05" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Left Top Cylinder Knob / Antenna */}
          <g transform="rotate(-22, 70, 45)">
            <rect x="62" y="32" width="16" height="24" rx="5" fill="url(#knobGrad)" stroke="#cbd5e1" strokeWidth="1" />
            <rect x="60" y="24" width="20" height="10" rx="3" fill="url(#robotBodyGrad)" stroke="#cbd5e1" strokeWidth="1" />
          </g>

          {/* Right Top Cylinder Knob / Antenna */}
          <g transform="rotate(22, 170, 45)">
            <rect x="162" y="32" width="16" height="24" rx="5" fill="url(#knobGrad)" stroke="#cbd5e1" strokeWidth="1" />
            <rect x="160" y="24" width="20" height="10" rx="3" fill="url(#robotBodyGrad)" stroke="#cbd5e1" strokeWidth="1" />
          </g>

          {/* Stubby Left Arm */}
          <path
            d="M 52 140 C 35 155 35 175 48 185 C 55 175 58 155 56 142 Z"
            fill="url(#robotBodyGrad)"
            stroke="#e2e8f0"
            strokeWidth="1.5"
          />

          {/* Stubby Right Arm */}
          <path
            d="M 188 140 C 205 155 205 175 192 185 C 185 175 182 155 184 142 Z"
            fill="url(#robotBodyGrad)"
            stroke="#e2e8f0"
            strokeWidth="1.5"
          />

          {/* Main White Matte Body */}
          <path
            d="M 65 65 
               C 65 42, 175 42, 175 65
               C 192 75, 196 185, 182 205
               C 175 215, 155 230, 140 220
               C 130 214, 110 214, 100 220
               C 85 230, 65 215, 58 205
               C 44 185, 48 75, 65 65 Z"
            fill="url(#robotBodyGrad)"
            stroke="#cbd5e1"
            strokeWidth="1.5"
          />

          {/* Subtle Horizontal Body Seam Line */}
          <path
            d="M 52 135 C 90 138, 150 138, 188 135"
            stroke="#cbd5e1"
            strokeWidth="1.2"
            fill="none"
          />

          {/* Chest Sensor Button (Minimal Pill) */}
          <rect
            x="100"
            y="172"
            width="40"
            height="14"
            rx="7"
            fill="#f1f5f9"
            stroke="#cbd5e1"
            strokeWidth="1.5"
          />

          {/* Large Glossy Black Curved Visor Screen */}
          <rect
            x="70"
            y="68"
            width="100"
            height="74"
            rx="32"
            fill="url(#visorScreenGrad)"
            stroke="#334155"
            strokeWidth="2"
          />

          {/* Glossy Curved Visor Highlight Overlay */}
          <path
            d="M 74 95 C 74 76, 88 72, 120 72 C 152 72, 166 76, 166 95 C 166 78, 150 74, 120 74 C 90 74, 74 78, 74 95 Z"
            fill="url(#visorGloss)"
          />

          {/* Natural Eye Blinking Animation inside Visor Screen */}
          <g>
            <rect
              x="94"
              y={blink ? '103' : '94'}
              width="12"
              height={blink ? '3' : '22'}
              rx={blink ? '1.5' : '6'}
              fill="url(#eyeGlowGrad)"
              className="transition-all duration-150"
            />
            <rect
              x="134"
              y={blink ? '103' : '94'}
              width="12"
              height={blink ? '3' : '22'}
              rx={blink ? '1.5' : '6'}
              fill="url(#eyeGlowGrad)"
              className="transition-all duration-150"
            />
          </g>
        </svg>
      </div>
    </div>
  );
};

export default MedicalAvatar;
