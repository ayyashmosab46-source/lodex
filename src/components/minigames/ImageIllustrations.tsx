import React from 'react';

interface SvgProps {
  name: string;
  className?: string;
}

export const ImageIllustration: React.FC<SvgProps> = ({ name, className = "w-full h-full" }) => {
  switch (name) {
    case 'burj_khalifa':
      return (
        <svg viewBox="0 0 200 200" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="200" height="200" fill="#0f172a" />
          <path d="M98 10L102 10L103 40L106 70L112 110L120 160L130 190H70L80 160L88 110L94 70L97 40Z" fill="url(#burjGrad)" stroke="#38bdf8" strokeWidth="2"/>
          <line x1="100" y1="5" x2="100" y2="40" stroke="#f8fafc" strokeWidth="3"/>
          <line x1="85" y1="120" x2="115" y2="120" stroke="#38bdf8" strokeWidth="1.5"/>
          <line x1="78" y1="150" x2="122" y2="150" stroke="#38bdf8" strokeWidth="1.5"/>
          <line x1="72" y1="175" x2="128" y2="175" stroke="#38bdf8" strokeWidth="1.5"/>
          <circle cx="100" cy="8" r="2.5" fill="#ef4444" />
          <defs>
            <linearGradient id="burjGrad" x1="100" y1="10" x2="100" y2="190" gradientUnits="userSpaceOnUse">
              <stop stopColor="#38bdf8" stopOpacity="0.8"/>
              <stop offset="1" stopColor="#0369a1" stopOpacity="0.95"/>
            </linearGradient>
          </defs>
        </svg>
      );

    case 'kaaba':
      return (
        <svg viewBox="0 0 200 200" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="200" height="200" fill="#090d16" />
          <rect x="50" y="55" width="100" height="105" rx="4" fill="#18181b" stroke="#eab308" strokeWidth="2.5"/>
          <rect x="50" y="75" width="100" height="18" fill="#eab308" />
          <line x1="50" y1="84" x2="150" y2="84" stroke="#a16207" strokeWidth="1"/>
          <rect x="110" y="105" width="26" height="42" fill="#ca8a04" stroke="#fef08a" strokeWidth="1.5" rx="2"/>
          <circle cx="58" cy="150" r="5" fill="#94a3b8" stroke="#cbd5e1" strokeWidth="1.5"/>
        </svg>
      );

    case 'camel':
      return (
        <svg viewBox="0 0 200 200" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="200" height="200" fill="#1c1917" />
          {/* Desert Dunes */}
          <path d="M0 160 Q 50 140 100 160 T 200 150 L 200 200 L 0 200 Z" fill="#d97706" opacity="0.3"/>
          {/* Camel silhouette */}
          <path d="M165 70 C165 60 150 55 145 65 C140 75 140 90 135 95 C125 90 115 70 95 70 C80 70 75 90 65 95 C55 90 45 75 35 80 C28 85 30 100 35 110 C38 120 40 140 38 165 H 48 L 52 135 C60 135 65 135 70 135 L 72 165 H 82 L 80 130 C95 130 110 130 120 130 L 118 165 H 128 L 132 125 C140 120 145 110 150 100 C155 95 165 80 165 70 Z" fill="#f59e0b"/>
          <circle cx="158" cy="65" r="2" fill="#78350f" />
        </svg>
      );

    case 'dallah':
      return (
        <svg viewBox="0 0 200 200" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="200" height="200" fill="#0f172a" />
          {/* Dallah Spout */}
          <path d="M70 95 C50 85 45 65 50 55 C55 55 60 75 80 85" stroke="#facc15" strokeWidth="4" fill="none" strokeLinecap="round"/>
          {/* Main Body */}
          <path d="M85 60 L115 60 L125 110 C128 130 115 155 100 155 C85 155 72 130 75 110 Z" fill="#eab308" stroke="#fef08a" strokeWidth="2"/>
          {/* Lid & Tip */}
          <path d="M100 25 L97 45 L103 45 Z" fill="#facc15"/>
          <circle cx="100" cy="25" r="4" fill="#facc15"/>
          <path d="M85 55 Q 100 45 115 55 Z" fill="#ca8a04"/>
          {/* Handle */}
          <path d="M115 70 C145 75 145 130 115 140" stroke="#facc15" strokeWidth="5" fill="none" strokeLinecap="round"/>
          {/* Base */}
          <ellipse cx="100" cy="155" rx="22" ry="7" fill="#ca8a04" stroke="#fef08a" strokeWidth="1.5"/>
        </svg>
      );

    case 'falcon':
      return (
        <svg viewBox="0 0 200 200" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="200" height="200" fill="#1e1b4b" />
          <path d="M100 30 C120 30 135 45 135 65 C135 80 125 90 120 100 C140 105 170 120 180 145 C150 140 130 130 120 135 L125 170 L100 160 L75 170 L80 135 C70 130 50 140 20 145 C30 120 60 105 80 100 C75 90 65 80 65 65 C65 45 80 30 100 30 Z" fill="#d97706"/>
          {/* Beak */}
          <path d="M135 55 L150 62 L135 68 Z" fill="#facc15"/>
          <circle cx="118" cy="50" r="4" fill="#0f172a" />
          <circle cx="119" cy="49" r="1.5" fill="#ffffff" />
        </svg>
      );

    case 'palm_tree':
      return (
        <svg viewBox="0 0 200 200" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="200" height="200" fill="#022c22" />
          {/* Trunk */}
          <path d="M96 170 C94 140 92 110 98 80 H 104 C100 110 98 140 106 170 Z" fill="#92400e" stroke="#78350f" strokeWidth="2"/>
          {/* Fronds */}
          <path d="M100 80 Q 60 50 25 75 Q 65 75 100 80" fill="#22c55e"/>
          <path d="M100 80 Q 140 50 175 75 Q 135 75 100 80" fill="#16a34a"/>
          <path d="M100 80 Q 70 30 40 40 Q 75 55 100 80" fill="#15803d"/>
          <path d="M100 80 Q 130 30 160 40 Q 125 55 100 80" fill="#22c55e"/>
          <path d="M100 80 Q 100 20 100 15 Q 105 45 100 80" fill="#16a34a"/>
          {/* Dates Clusters */}
          <circle cx="94" cy="85" r="4" fill="#f59e0b"/>
          <circle cx="106" cy="85" r="4" fill="#f59e0b"/>
          <circle cx="100" cy="89" r="4" fill="#d97706"/>
        </svg>
      );

    case 'pizza':
      return (
        <svg viewBox="0 0 200 200" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="200" height="200" fill="#1c1917" />
          <circle cx="100" cy="100" r="75" fill="#ea580c" stroke="#b45309" strokeWidth="6"/>
          <circle cx="100" cy="100" r="66" fill="#facc15"/>
          {/* Pepperoni & toppings */}
          <circle cx="80" cy="75" r="11" fill="#dc2626" />
          <circle cx="125" cy="80" r="12" fill="#dc2626" />
          <circle cx="95" cy="115" r="13" fill="#dc2626" />
          <circle cx="130" cy="125" r="10" fill="#dc2626" />
          <circle cx="68" cy="120" r="10" fill="#dc2626" />
          {/* Olives */}
          <circle cx="105" cy="70" r="5" fill="#1e293b" />
          <circle cx="115" cy="105" r="5" fill="#1e293b" />
          <circle cx="75" cy="98" r="5" fill="#1e293b" />
        </svg>
      );

    case 'football':
      return (
        <svg viewBox="0 0 200 200" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="200" height="200" fill="#0f172a" />
          <circle cx="100" cy="100" r="65" fill="#f8fafc" stroke="#334155" strokeWidth="4"/>
          {/* Center pentagon */}
          <polygon points="100,80 118,93 111,114 89,114 82,93" fill="#0f172a"/>
          {/* Surrounding segments */}
          <line x1="100" y1="80" x2="100" y2="40" stroke="#0f172a" strokeWidth="4"/>
          <line x1="118" y1="93" x2="155" y2="85" stroke="#0f172a" strokeWidth="4"/>
          <line x1="111" y1="114" x2="138" y2="150" stroke="#0f172a" strokeWidth="4"/>
          <line x1="89" y1="114" x2="62" y2="150" stroke="#0f172a" strokeWidth="4"/>
          <line x1="82" y1="93" x2="45" y2="85" stroke="#0f172a" strokeWidth="4"/>
        </svg>
      );

    case 'smartphone':
      return (
        <svg viewBox="0 0 200 200" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="200" height="200" fill="#090d16" />
          <rect x="62" y="30" width="76" height="140" rx="16" fill="#1e293b" stroke="#38bdf8" strokeWidth="3"/>
          <rect x="68" y="42" width="64" height="116" rx="8" fill="#0284c7"/>
          {/* Notch / Dynamic island */}
          <rect x="88" y="35" width="24" height="4" rx="2" fill="#0f172a"/>
          {/* App icons */}
          <rect x="74" y="52" width="12" height="12" rx="3" fill="#f59e0b"/>
          <rect x="94" y="52" width="12" height="12" rx="3" fill="#10b981"/>
          <rect x="114" y="52" width="12" height="12" rx="3" fill="#ec4899"/>
          <rect x="74" y="70" width="12" height="12" rx="3" fill="#6366f1"/>
          <rect x="94" y="70" width="12" height="12" rx="3" fill="#ef4444"/>
          <rect x="114" y="70" width="12" height="12" rx="3" fill="#eab308"/>
        </svg>
      );

    case 'eiffel_tower':
      return (
        <svg viewBox="0 0 200 200" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="200" height="200" fill="#1e1b4b" />
          <line x1="100" y1="20" x2="100" y2="60" stroke="#e2e8f0" strokeWidth="3"/>
          <path d="M96 60 L104 60 L110 110 L135 180 H 115 L108 140 Q 100 135 92 140 L85 180 H 65 L90 110 Z" fill="#94a3b8" stroke="#cbd5e1" strokeWidth="2"/>
          <line x1="88" y1="110" x2="112" y2="110" stroke="#f1f5f9" strokeWidth="3"/>
          <line x1="80" y1="140" x2="120" y2="140" stroke="#f1f5f9" strokeWidth="3"/>
        </svg>
      );

    case 'pyramids':
      return (
        <svg viewBox="0 0 200 200" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="200" height="200" fill="#1c1917" />
          {/* Sun */}
          <circle cx="160" cy="50" r="20" fill="#fbbf24"/>
          {/* Pyramid 2 (back) */}
          <polygon points="120,70 175,150 85,150" fill="#ca8a04"/>
          <polygon points="120,70 175,150 130,150" fill="#a16207"/>
          {/* Pyramid 1 (front) */}
          <polygon points="65,90 125,165 20,165" fill="#facc15"/>
          <polygon points="65,90 125,165 75,165" fill="#d97706"/>
          {/* Sand base */}
          <rect x="0" y="160" width="200" height="40" fill="#b45309"/>
        </svg>
      );

    case 'airplane':
      return (
        <svg viewBox="0 0 200 200" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="200" height="200" fill="#0f172a" />
          {/* Plane fuselage */}
          <path d="M100 25 C108 25 112 45 112 90 L180 125 L180 140 L112 125 L112 160 L130 175 L130 185 L100 178 L70 185 L70 175 L88 160 L88 125 L20 140 L20 125 L88 90 C88 45 92 25 100 25 Z" fill="#38bdf8" stroke="#f0f9ff" strokeWidth="2"/>
          {/* Cockpit */}
          <ellipse cx="100" cy="45" rx="5" ry="9" fill="#0369a1"/>
        </svg>
      );

    case 'crescent_moon':
      return (
        <svg viewBox="0 0 200 200" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="200" height="200" fill="#020617" />
          <path d="M115 35 C70 40 45 80 55 125 C65 170 115 185 155 155 C120 155 85 130 85 95 C85 65 100 45 115 35 Z" fill="#facc15" stroke="#fef08a" strokeWidth="2"/>
          {/* Star */}
          <polygon points="145,75 149,87 161,87 151,95 155,107 145,99 135,107 139,95 129,87 141,87" fill="#fbbf24"/>
        </svg>
      );

    case 'crown':
      return (
        <svg viewBox="0 0 200 200" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="200" height="200" fill="#18181b" />
          <polygon points="40,140 40,75 75,105 100,60 125,105 160,75 160,140" fill="#eab308" stroke="#fef08a" strokeWidth="3"/>
          <circle cx="40" cy="72" r="6" fill="#ef4444"/>
          <circle cx="100" cy="57" r="7" fill="#3b82f6"/>
          <circle cx="160" cy="72" r="6" fill="#ef4444"/>
          <circle cx="70" cy="125" r="5" fill="#10b981"/>
          <circle cx="100" cy="125" r="6" fill="#ec4899"/>
          <circle cx="130" cy="125" r="5" fill="#10b981"/>
          <rect x="36" y="140" width="128" height="12" rx="3" fill="#ca8a04"/>
        </svg>
      );

    default:
      // Generic attractive vector shape
      return (
        <svg viewBox="0 0 200 200" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="200" height="200" fill="#0f172a" />
          <circle cx="100" cy="100" r="65" fill="#6366f1" opacity="0.3" />
          <circle cx="100" cy="100" r="45" fill="#8b5cf6" opacity="0.6" />
          <path d="M100 45 L115 85 L155 100 L115 115 L100 155 L85 115 L45 100 L85 85 Z" fill="#ec4899" />
          <circle cx="100" cy="100" r="14" fill="#facc15" />
        </svg>
      );
  }
};
