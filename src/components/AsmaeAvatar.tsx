import React from 'react';
import { SystemState } from '../types';

interface AsmaeAvatarProps {
  systemState: SystemState;
  isSpeaking: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const AsmaeAvatar: React.FC<AsmaeAvatarProps> = ({
  systemState,
  isSpeaking,
  size = 'lg',
}) => {
  const dimensions =
    size === 'lg' ? 'w-36 h-36 sm:w-40 sm:h-40' : size === 'md' ? 'w-24 h-24' : 'w-16 h-16';

  const stateLabels: Record<SystemState, string> = {
    IDLE: 'أسماء مستعدة للبدء بهدوء',
    PRESENTING: 'أسماء تقدم التعليمة الآن',
    WAITING: 'أسماء تنتظر بهدوء (بدون استعجال)',
    PAUSED: 'النشاط متوقف مؤقتاً',
    COMPLETED: 'اكتمل النشاط بهدوء',
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative flex items-center justify-center">
        {/* Gentle Audio Wave Visualizer rings around Asmae ONLY when speaking */}
        {isSpeaking && (
          <>
            <span
              aria-hidden="true"
              className="absolute -inset-3 rounded-full border-2 border-[#52B788]/50 animate-ping"
              style={{ animationDuration: '2.4s' }}
            />
            <span
              aria-hidden="true"
              className="absolute -inset-2 rounded-full border-4 border-[#52B788]/40 animate-pulse"
              style={{ animationDuration: '1.6s' }}
            />
          </>
        )}

        <div
          className={`${dimensions} rounded-full bg-gradient-to-b from-[#EBF5FB] to-[#D8E2DC] border-4 ${
            isSpeaking
              ? 'border-[#52B788] shadow-[0_0_24px_rgba(82,183,136,0.35)] scale-[1.03]'
              : 'border-[#457B9D]/30 shadow-xs'
          } flex items-center justify-center relative overflow-hidden transition-all duration-500`}
          aria-label="الشخصية التربوية الهادئة المعلمة أسماء"
        >
          {/* Custom High-Clarity Pastel SVG Illustration of Teacher Asmae in Hijab */}
          <svg
            viewBox="0 0 160 160"
            className="w-full h-full"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Soft Circular Classroom Aura */}
            <circle cx="80" cy="80" r="74" fill="#F1FAEE" fillOpacity="0.65" />

            {/* Shoulders / Modest Teacher Attire in Pastel Teal */}
            <path
              d="M28 148C32 120 52 108 80 108C108 108 128 120 132 148H28Z"
              fill="#52B788"
            />
            <path
              d="M46 148C50 126 63 116 80 116C97 116 110 126 114 148H46Z"
              fill="#457B9D"
            />

            {/* Outer Hijab Drape (Calm Serene Blue-Slate) */}
            <path
              d="M32 82C32 45 50 24 80 24C110 24 128 45 128 82C128 110 112 128 80 128C48 128 32 110 32 82Z"
              fill="#457B9D"
            />

            {/* Inner Hijab Fold / Soft Underscarf */}
            <path
              d="M42 80C42 52 57 35 80 35C103 35 118 52 118 80C118 103 103 118 80 118C57 118 42 103 42 80Z"
              fill="#A8DADC"
            />
            <path
              d="M47 46C57 38 68 35 80 35C92 35 103 38 113 46C106 39 94 37 80 37C66 37 54 39 47 46Z"
              fill="#F1FAEE"
            />

            {/* Warm, Friendly Face */}
            <ellipse cx="80" cy="78" rx="31" ry="33" fill="#FBE5D6" />

            {/* Soft Hijab Forehead Band */}
            <path
              d="M49 68C52 48 64 40 80 40C96 40 108 48 111 68C101 59 91 56 80 56C69 56 59 59 49 68Z"
              fill="#457B9D"
            />

            {/* Gentle Eyebrows */}
            <path
              d="M61 68C64 65.5 69 65.5 72 67.5"
              stroke="#1D3557"
              strokeWidth="2.4"
              strokeLinecap="round"
            />
            <path
              d="M88 67.5C91 65.5 96 65.5 99 68"
              stroke="#1D3557"
              strokeWidth="2.4"
              strokeLinecap="round"
            />

            {/* Warm Reassuring Eyes */}
            <circle cx="66.5" cy="75.5" r="3.6" fill="#1D3557" />
            <circle cx="65.3" cy="74.3" r="1.2" fill="#FFFFFF" />
            <circle cx="93.5" cy="75.5" r="3.6" fill="#1D3557" />
            <circle cx="92.3" cy="74.3" r="1.2" fill="#FFFFFF" />

            {/* Gentle Nose */}
            <path
              d="M80 77V83.5C80 84.8 78.5 85.5 77.2 85"
              stroke="#D9A796"
              strokeWidth="2.2"
              strokeLinecap="round"
            />

            {/* Soft Pastel Cheeks */}
            <ellipse cx="59" cy="84" rx="5.5" ry="3.2" fill="#F4A298" fillOpacity="0.45" />
            <ellipse cx="101" cy="84" rx="5.5" ry="3.2" fill="#F4A298" fillOpacity="0.45" />

            {/* Calm Reassuring Smile (Animated gently when speaking) */}
            {isSpeaking ? (
              <g>
                <ellipse cx="80" cy="93" rx="6.5" ry="4.5" fill="#C96A6A" />
                <path
                  d="M75 91.5H85"
                  stroke="#FFFFFF"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </g>
            ) : (
              <path
                d="M70 91C73.5 95.5 86.5 95.5 90 91"
                stroke="#1D3557"
                strokeWidth="3"
                strokeLinecap="round"
              />
            )}

            {/*Hijab Decorative Brooch Pin */}
            <circle cx="80" cy="118" r="4.5" fill="#F6BD60" stroke="#FFFFFF" strokeWidth="1.5" />
          </svg>
        </div>
      </div>

      {/* Gentle Audio Wave Visualizer Bar when Asmae is Speaking */}
      {isSpeaking ? (
        <div
          className="flex items-center gap-1.5 bg-[#E8F6F3] border border-[#52B788]/50 px-3.5 py-1.5 rounded-2xl shadow-2xs"
          aria-live="polite"
        >
          <div className="flex items-end gap-1 h-4" aria-hidden="true">
            <span
              className="w-1 bg-[#52B788] rounded-full animate-bounce"
              style={{ height: '65%', animationDuration: '0.9s' }}
            />
            <span
              className="w-1 bg-[#457B9D] rounded-full animate-bounce"
              style={{ height: '100%', animationDuration: '0.7s' }}
            />
            <span
              className="w-1 bg-[#52B788] rounded-full animate-bounce"
              style={{ height: '80%', animationDuration: '1.1s' }}
            />
            <span
              className="w-1 bg-[#457B9D] rounded-full animate-bounce"
              style={{ height: '55%', animationDuration: '0.8s' }}
            />
          </div>
          <span className="text-xs font-bold text-[#1D3557]">
            أسماء تتحدث بهدوء الآن...
          </span>
        </div>
      ) : (
        <div className="text-xs text-[#1D3557]/85 font-bold text-center bg-slate-100/80 px-3 py-1 rounded-xl">
          <span>المعلمة أسماء</span>
          <span aria-hidden="true" className="mx-1.5">·</span>
          <span>{stateLabels[systemState]}</span>
        </div>
      )}
    </div>
  );
};
