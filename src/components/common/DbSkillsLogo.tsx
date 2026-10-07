import React from 'react';

export const DbSkillsLogo = ({ className = "h-9 w-auto" }: { className?: string }) => {
  return (
    <svg 
      viewBox="0 0 500 300" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg" 
      className={className}
    >
      {/* Top Green Leader Silhouette */}
      <circle cx="250" cy="28" r="16" fill="#62B548" />
      <path 
        d="M210 65 C230 75 270 75 290 65 C275 110 250 120 250 120 C250 120 225 110 210 65 Z" 
        fill="#62B548" 
      />

      {/* Cyan Silhouette Left */}
      <circle cx="160" cy="75" r="13" fill="#1BB2E0" />
      <path 
        d="M130 115 C150 122 175 120 190 108 C175 140 160 148 160 148 C160 148 142 140 130 115 Z" 
        fill="#1BB2E0" 
      />

      {/* Cyan Silhouette Right */}
      <circle cx="340" cy="75" r="13" fill="#1BB2E0" />
      <path 
        d="M370 115 C350 122 325 120 310 108 C325 140 340 148 340 148 C340 148 358 140 370 115 Z" 
        fill="#1BB2E0" 
      />

      {/* Orange Silhouette Left */}
      <circle cx="115" cy="138" r="13" fill="#F15A24" />
      <path 
        d="M85 182 C108 185 132 178 142 165 C125 195 112 205 112 205 C112 205 98 198 85 182 Z" 
        fill="#F15A24" 
      />

      {/* Orange Silhouette Right */}
      <circle cx="385" cy="138" r="13" fill="#F15A24" />
      <path 
        d="M415 182 C392 185 368 178 358 165 C375 195 388 205 388 205 C388 205 402 198 415 182 Z" 
        fill="#F15A24" 
      />

      {/* Bottom Cyan Silhouette Left */}
      <circle cx="90" cy="205" r="11" fill="#1BB2E0" />
      <path 
        d="M102 230 C125 220 135 200 135 200 C135 200 115 205 102 230 Z" 
        fill="#1BB2E0" 
      />

      {/* Bottom Cyan Silhouette Right */}
      <circle cx="410" cy="205" r="11" fill="#1BB2E0" />
      <path 
        d="M398 230 C375 220 365 200 365 200 C365 200 385 205 398 230 Z" 
        fill="#1BB2E0" 
      />

      {/* Central Brand Letters "DB" */}
      <text 
        x="195" 
        y="185" 
        fontFamily="Georgia, serif" 
        fontStyle="italic" 
        fontWeight="bold" 
        fontSize="76" 
        fill="#00AEEF"
      >
        D
      </text>
      <text 
        x="260" 
        y="185" 
        fontFamily="Georgia, serif" 
        fontStyle="italic" 
        fontWeight="bold" 
        fontSize="76" 
        fill="#F15A24"
      >
        B
      </text>

      {/* Base Curved Cyan Horizon Arc */}
      <path 
        d="M 5 285 Q 250 200 495 285 Q 250 220 5 285 Z" 
        fill="#1BB2E0" 
      />

      {/* Bold Green Base Text: SKILLS */}
      <text 
        x="250" 
        y="288" 
        textAnchor="middle" 
        fontFamily="Arial, Helvetica, sans-serif" 
        fontWeight="900" 
        fontSize="44" 
        letterSpacing="6" 
        fill="#007A3D"
      >
        SKILLS
      </text>
    </svg>
  );
};
