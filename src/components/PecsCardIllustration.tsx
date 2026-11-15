import React from 'react';
import { VisualCard } from '../types';
import { stripArabicDiacritics } from '../data/curriculum';

interface PecsCardIllustrationProps {
  card: VisualCard;
}

export const PecsCardIllustration: React.FC<PecsCardIllustrationProps> = ({ card }) => {
  const plainLabel = stripArabicDiacritics(card.label);
  const symbol = card.symbol;

  // 1. Open Colorful Book (كتاب)
  if (plainLabel.includes('كتاب') || symbol === '📘' || symbol === '📖') {
    return (
      <svg viewBox="0 0 120 120" className="w-28 h-28 sm:w-32 sm:h-32" fill="none">
        {/* Soft background halo */}
        <circle cx="60" cy="60" r="50" fill="#D6EAF8" />
        {/* Book cover shadow */}
        <rect x="18" y="30" width="84" height="64" rx="8" fill="#1D3557" />
        {/* Left page */}
        <path
          d="M23 34H58C59.5 34 60 35 60 37V88C60 86.5 58.5 86 56 86H23V34Z"
          fill="#FFFFFF"
        />
        {/* Right page */}
        <path
          d="M97 34H62C60.5 34 60 35 60 37V88C60 86.5 61.5 86 64 86H97V34Z"
          fill="#F8F9F9"
        />
        {/* Center spine */}
        <line x1="60" y1="33" x2="60" y2="89" stroke="#457B9D" strokeWidth="3" />
        {/* Colorful illustration lines on pages */}
        <rect x="29" y="43" width="24" height="6" rx="3" fill="#52B788" />
        <rect x="29" y="54" width="20" height="5" rx="2.5" fill="#90CAF9" />
        <rect x="29" y="64" width="24" height="5" rx="2.5" fill="#90CAF9" />
        <circle cx="79" cy="52" r="10" fill="#F6BD60" />
        <rect x="68" y="68" width="22" height="5" rx="2.5" fill="#457B9D" />
        {/* Bookmark ribbon */}
        <path d="M56 86V99L60 95L64 99V86H56Z" fill="#E76F51" />
      </svg>
    );
  }

  // 2. Waving Hand for Greeting (تلويح باليد / السلام عليكم / مرحباً)
  if (
    plainLabel.includes('تلويح') ||
    plainLabel.includes('السلام') ||
    plainLabel.includes('مرحبا') ||
    symbol === '👋' ||
    symbol === '✋'
  ) {
    return (
      <svg viewBox="0 0 120 120" className="w-28 h-28 sm:w-32 sm:h-32" fill="none">
        <circle cx="60" cy="60" r="50" fill="#E8F6F3" />
        {/* Gentle motion arcs */}
        <path
          d="M26 42C21 50 21 62 26 70"
          stroke="#52B788"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <path
          d="M94 42C99 50 99 62 94 70"
          stroke="#52B788"
          strokeWidth="4"
          strokeLinecap="round"
        />
        {/* Warm open hand illustration */}
        <path
          d="M44 68V38C44 34.5 49 34.5 49 38V58M50 56V30C50 26.5 56 26.5 56 30V56M57 56V28C57 24.5 63 24.5 63 28V56M64 58V33C64 29.5 70 29.5 70 33V62"
          stroke="#D99B78"
          strokeWidth="8"
          strokeLinecap="round"
        />
        <path
          d="M40 58C40 48 74 48 74 62V76C74 88 64 95 55 95C44 95 38 87 38 75V64C38 58 43 58 43 64"
          fill="#F5CBA7"
          stroke="#D99B78"
          strokeWidth="3"
        />
        {/* Thumb */}
        <path
          d="M39 68L31 58C28.5 55 33 50 36.5 53.5L43 61"
          fill="#F5CBA7"
          stroke="#D99B78"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  // 3. Warm Shining Morning Sun (صباح الخير)
  if (plainLabel.includes('صباح') || symbol === '🌅') {
    return (
      <svg viewBox="0 0 120 120" className="w-28 h-28 sm:w-32 sm:h-32" fill="none">
        <circle cx="60" cy="60" r="50" fill="#FEF9E7" />
        {/* Sun rays */}
        <g stroke="#F4A261" strokeWidth="4.5" strokeLinecap="round">
          <line x1="60" y1="18" x2="60" y2="26" />
          <line x1="30" y1="30" x2="36" y2="36" />
          <line x1="90" y1="30" x2="84" y2="36" />
          <line x1="18" y1="60" x2="26" y2="60" />
          <line x1="102" y1="60" x2="94" y2="60" />
        </g>
        {/* Warm smiling sun */}
        <circle cx="60" cy="60" r="24" fill="#F6BD60" stroke="#F4A261" strokeWidth="3" />
        <circle cx="52" cy="56" r="2.5" fill="#1D3557" />
        <circle cx="68" cy="56" r="2.5" fill="#1D3557" />
        <path
          d="M53 65C55.5 68.5 64.5 68.5 67 65"
          stroke="#1D3557"
          strokeWidth="2.8"
          strokeLinecap="round"
        />
        {/* Soft horizon cloud */}
        <path
          d="M26 86C26 80 32 76 38 77C41 72 49 70 55 74C60 70 70 71 74 77C81 76 88 80 88 86H26Z"
          fill="#A8DADC"
        />
      </svg>
    );
  }

  // 4. Large Pencil (قلم / نقرأ الدرس)
  if (plainLabel.includes('قلم') || plainLabel.includes('نقرأ') || symbol === '✏️' || symbol === '📝') {
    return (
      <svg viewBox="0 0 120 120" className="w-28 h-28 sm:w-32 sm:h-32" fill="none">
        <circle cx="60" cy="60" r="50" fill="#FEF9E7" />
        <g transform="rotate(-35 60 60)">
          {/* Eraser top */}
          <rect x="48" y="18" width="24" height="14" rx="5" fill="#F4A298" stroke="#1D3557" strokeWidth="2.5" />
          {/* Metal ferrule */}
          <rect x="48" y="30" width="24" height="7" fill="#B0BEC5" stroke="#1D3557" strokeWidth="2.5" />
          {/* Pencil body */}
          <rect x="48" y="37" width="24" height="46" fill="#F6BD60" stroke="#1D3557" strokeWidth="2.5" />
          <line x1="56" y1="37" x2="56" y2="83" stroke="#E09F3E" strokeWidth="2" />
          <line x1="64" y1="37" x2="64" y2="83" stroke="#E09F3E" strokeWidth="2" />
          {/* Wood cone */}
          <path d="M48 83L60 103L72 83H48Z" fill="#F5CBA7" stroke="#1D3557" strokeWidth="2.5" strokeLinejoin="round" />
          {/* Graphite tip */}
          <path d="M55 95L60 103L65 95H55Z" fill="#1D3557" />
        </g>
      </svg>
    );
  }

  // 5. School Backpack (محفظة)
  if (plainLabel.includes('محفظة') || symbol === '🎒') {
    return (
      <svg viewBox="0 0 120 120" className="w-28 h-28 sm:w-32 sm:h-32" fill="none">
        <circle cx="60" cy="60" r="50" fill="#E8F6F3" />
        {/* Top handle */}
        <path
          d="M48 30C48 22 72 22 72 30"
          stroke="#1D3557"
          strokeWidth="5"
          strokeLinecap="round"
        />
        {/* Side pockets */}
        <rect x="24" y="56" width="12" height="26" rx="5" fill="#457B9D" stroke="#1D3557" strokeWidth="2.5" />
        <rect x="84" y="56" width="12" height="26" rx="5" fill="#457B9D" stroke="#1D3557" strokeWidth="2.5" />
        {/* Main bag body */}
        <rect x="32" y="30" width="56" height="64" rx="16" fill="#52B788" stroke="#1D3557" strokeWidth="3" />
        {/* Top flap */}
        <path
          d="M32 46C32 36 40 30 50 30H70C80 30 88 36 88 46V52C88 56 84 58 80 58H40C36 58 32 56 32 52V46Z"
          fill="#40916C"
          stroke="#1D3557"
          strokeWidth="2.5"
        />
        {/* Front pocket */}
        <rect x="42" y="64" width="36" height="22" rx="7" fill="#F6BD60" stroke="#1D3557" strokeWidth="2.5" />
        <line x1="48" y1="72" x2="72" y2="72" stroke="#1D3557" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    );
  }

  // 6. Notebook or Ruler (دفتر / مسطرة)
  if (plainLabel.includes('دفتر') || plainLabel.includes('مسطرة') || symbol === '📒' || symbol === '📏') {
    return (
      <svg viewBox="0 0 120 120" className="w-28 h-28 sm:w-32 sm:h-32" fill="none">
        <circle cx="60" cy="60" r="50" fill="#F5EEF8" />
        <rect x="32" y="24" width="56" height="72" rx="8" fill="#F6BD60" stroke="#1D3557" strokeWidth="3" />
        <rect x="40" y="24" width="48" height="72" rx="6" fill="#FFFFFF" stroke="#1D3557" strokeWidth="2.5" />
        <rect x="48" y="38" width="30" height="12" rx="3" fill="#A8DADC" stroke="#1D3557" strokeWidth="2" />
        <line x1="48" y1="62" x2="78" y2="62" stroke="#90CAF9" strokeWidth="3" strokeLinecap="round" />
        <line x1="48" y1="72" x2="78" y2="72" stroke="#90CAF9" strokeWidth="3" strokeLinecap="round" />
        <line x1="48" y1="82" x2="68" y2="82" stroke="#90CAF9" strokeWidth="3" strokeLinecap="round" />
      </svg>
    );
  }

  // 7. Two Children Cooperating / Greeting Friend / Passing Turn (حي صديقك / تعاون / نمرر الدور)
  if (
    plainLabel.includes('صديق') ||
    plainLabel.includes('تعاون') ||
    plainLabel.includes('نمرر') ||
    plainLabel.includes('زميل') ||
    symbol === '🧑‍🤝‍🧑' ||
    symbol === '🤝'
  ) {
    return (
      <svg viewBox="0 0 120 120" className="w-28 h-28 sm:w-32 sm:h-32" fill="none">
        <circle cx="60" cy="60" r="50" fill="#E8F6F3" />
        {/* Left Child */}
        <circle cx="40" cy="46" r="14" fill="#F5CBA7" stroke="#1D3557" strokeWidth="2.5" />
        <path d="M28 42C30 33 48 33 52 42" fill="#1D3557" />
        <circle cx="36" cy="46" r="1.8" fill="#1D3557" />
        <circle cx="44" cy="46" r="1.8" fill="#1D3557" />
        <path d="M36 52C38 54 42 54 44 52" stroke="#1D3557" strokeWidth="2" strokeLinecap="round" />
        <path d="M22 90C22 72 30 64 40 64C50 64 56 72 56 90H22Z" fill="#457B9D" stroke="#1D3557" strokeWidth="2.5" />

        {/* Right Child */}
        <circle cx="80" cy="46" r="14" fill="#F5CBA7" stroke="#1D3557" strokeWidth="2.5" />
        <path d="M68 42C70 33 88 33 92 42" fill="#457B9D" />
        <circle cx="76" cy="46" r="1.8" fill="#1D3557" />
        <circle cx="84" cy="46" r="1.8" fill="#1D3557" />
        <path d="M76 52C78 54 82 54 84 52" stroke="#1D3557" strokeWidth="2" strokeLinecap="round" />
        <path d="M64 90C64 72 70 64 80 64C90 64 98 72 98 90H64Z" fill="#52B788" stroke="#1D3557" strokeWidth="2.5" />

        {/* Friendly joined hands in center */}
        <circle cx="60" cy="76" r="7" fill="#F6BD60" stroke="#1D3557" strokeWidth="2.5" />
      </svg>
    );
  }

  // 8. Calm Seated Waiting / Classroom Chair (جلوس هادئ / انتظار هادئ)
  if (plainLabel.includes('انتظار') || plainLabel.includes('جلوس') || symbol === '🪑') {
    return (
      <svg viewBox="0 0 120 120" className="w-28 h-28 sm:w-32 sm:h-32" fill="none">
        <circle cx="60" cy="60" r="50" fill="#EBF5FB" />
        {/* Calm Child Seated */}
        <circle cx="60" cy="36" r="14" fill="#F5CBA7" stroke="#1D3557" strokeWidth="2.5" />
        <circle cx="55" cy="35" r="2" fill="#1D3557" />
        <circle cx="65" cy="35" r="2" fill="#1D3557" />
        <path d="M55 41C57.5 43.5 62.5 43.5 65 41" stroke="#1D3557" strokeWidth="2.2" strokeLinecap="round" />
        {/* Desk / Calm Hands Folded */}
        <path d="M38 76C38 60 48 52 60 52C72 52 82 60 82 76H38Z" fill="#52B788" stroke="#1D3557" strokeWidth="2.5" />
        <rect x="26" y="76" width="68" height="12" rx="5" fill="#F6BD60" stroke="#1D3557" strokeWidth="2.5" />
        <ellipse cx="60" cy="75" rx="12" ry="5" fill="#F5CBA7" stroke="#1D3557" strokeWidth="2" />
      </svg>
    );
  }

  // 9. Distinct Color Cards (أزرق / أخضر / أصفر / برتقالي)
  if (
    plainLabel.includes('أزرق') ||
    plainLabel.includes('أخضر') ||
    plainLabel.includes('أصفر') ||
    plainLabel.includes('برتقالي') ||
    ['🔵', '🟢', '🟡', '🟠'].includes(symbol)
  ) {
    const colorMap: Record<string, { fill: string; ring: string }> = {
      '🔵': { fill: '#2196F3', ring: '#BBDEFB' },
      '🟢': { fill: '#4CAF50', ring: '#C8E6C9' },
      '🟡': { fill: '#FDD835', ring: '#FFF9C4' },
      '🟠': { fill: '#FB8C00', ring: '#FFE0B2' },
    };
    const palette = colorMap[symbol] || { fill: '#457B9D', ring: '#D6EAF8' };
    return (
      <svg viewBox="0 0 120 120" className="w-28 h-28 sm:w-32 sm:h-32" fill="none">
        <circle cx="60" cy="60" r="48" fill={palette.ring} />
        <circle cx="60" cy="60" r="34" fill={palette.fill} stroke="#1D3557" strokeWidth="3.5" />
        <circle cx="48" cy="48" r="7" fill="#FFFFFF" fillOpacity="0.45" />
      </svg>
    );
  }

  // 10. Familiar Animals & Carrot (قطة / أرنب / طائر / سمكة / جزر)
  if (
    plainLabel.includes('قطة') ||
    plainLabel.includes('أرنب') ||
    plainLabel.includes('طائر') ||
    plainLabel.includes('سمكة') ||
    plainLabel.includes('جزر') ||
    ['🐱', '🐰', '🐦', '🐟', '🥕'].includes(symbol)
  ) {
    return (
      <svg viewBox="0 0 120 120" className="w-28 h-28 sm:w-32 sm:h-32" fill="none">
        <circle cx="60" cy="60" r="50" fill="#FEF9E7" />
        {symbol === '🐱' && (
          <g>
            <path d="M34 48L28 24L50 36Z" fill="#F4A261" stroke="#1D3557" strokeWidth="2.5" strokeLinejoin="round" />
            <path d="M86 48L92 24L70 36Z" fill="#F4A261" stroke="#1D3557" strokeWidth="2.5" strokeLinejoin="round" />
            <circle cx="60" cy="62" r="28" fill="#F6BD60" stroke="#1D3557" strokeWidth="3" />
            <circle cx="49" cy="57" r="3.5" fill="#1D3557" />
            <circle cx="71" cy="57" r="3.5" fill="#1D3557" />
            <polygon points="60,63 56,68 64,68" fill="#E76F51" />
            <path d="M52 73C56 76 64 76 68 73" stroke="#1D3557" strokeWidth="2.5" strokeLinecap="round" />
          </g>
        )}
        {symbol === '🐰' && (
          <g>
            <ellipse cx="48" cy="30" rx="7" ry="18" fill="#FFFFFF" stroke="#1D3557" strokeWidth="2.5" />
            <ellipse cx="48" cy="30" rx="3.5" ry="12" fill="#F4A298" />
            <ellipse cx="72" cy="30" rx="7" ry="18" fill="#FFFFFF" stroke="#1D3557" strokeWidth="2.5" />
            <ellipse cx="72" cy="30" rx="3.5" ry="12" fill="#F4A298" />
            <circle cx="60" cy="66" r="25" fill="#FFFFFF" stroke="#1D3557" strokeWidth="3" />
            <circle cx="50" cy="62" r="3.2" fill="#1D3557" />
            <circle cx="70" cy="62" r="3.2" fill="#1D3557" />
            <circle cx="60" cy="69" r="3.5" fill="#F4A298" />
            <path d="M54 76C57 79 63 79 66 76" stroke="#1D3557" strokeWidth="2.5" strokeLinecap="round" />
          </g>
        )}
        {symbol === '🥕' && (
          <g>
            <path d="M52 28C48 18 56 16 60 26C64 16 72 18 68 28" stroke="#52B788" strokeWidth="5" strokeLinecap="round" />
            <path d="M44 34H76L63 94C61.5 99 58.5 99 57 94L44 34Z" fill="#F4A261" stroke="#1D3557" strokeWidth="3" strokeLinejoin="round" />
            <line x1="52" y1="48" x2="64" y2="48" stroke="#E76F51" strokeWidth="3" strokeLinecap="round" />
            <line x1="54" y1="64" x2="66" y2="64" stroke="#E76F51" strokeWidth="3" strokeLinecap="round" />
          </g>
        )}
        {(symbol === '🐦' || symbol === '🐟') && (
          <g>
            <ellipse cx="58" cy="62" rx="28" ry="20" fill="#457B9D" stroke="#1D3557" strokeWidth="3" />
            <polygon points="86,62 98,55 98,69" fill="#F6BD60" stroke="#1D3557" strokeWidth="2.5" />
            <circle cx="46" cy="57" r="3.5" fill="#FFFFFF" />
            <circle cx="46" cy="57" r="1.8" fill="#1D3557" />
            <path d="M52 62C58 68 66 68 72 62" stroke="#A8DADC" strokeWidth="3" strokeLinecap="round" />
          </g>
        )}
      </svg>
    );
  }

  // 11. Default / Star / School Closing (شكراً على المشاركة / نجمة)
  return (
    <svg viewBox="0 0 120 120" className="w-28 h-28 sm:w-32 sm:h-32" fill="none">
      <circle cx="60" cy="60" r="50" fill="#FEF9E7" />
      <path
        d="M60 22L71.2 44.7L96.2 48.3L78.1 65.9L82.4 90.8L60 79L37.6 90.8L41.9 65.9L23.8 48.3L48.8 44.7L60 22Z"
        fill="#F6BD60"
        stroke="#1D3557"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <circle cx="53" cy="56" r="2.8" fill="#1D3557" />
      <circle cx="67" cy="56" r="2.8" fill="#1D3557" />
      <path
        d="M54 65C56.5 68 63.5 68 66 65"
        stroke="#1D3557"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
    </svg>
  );
};
