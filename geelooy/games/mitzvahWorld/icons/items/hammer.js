/**
 * B"H
 * Sparks Collector (Hammer) Icon
 */
export default /*html*/`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="handleGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#8B4513;stop-opacity:1" />
      <stop offset="50%" style="stop-color:#A0522D;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#8B4513;stop-opacity:1" />
    </linearGradient>
    <linearGradient id="headGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#FFD700;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#FFA500;stop-opacity:1" />
    </linearGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="5" result="blur"/>
      <feComposite in="SourceGraphic" in2="blur" operator="over"/>
    </filter>
  </defs>
  
  <!-- Handle -->
  <rect x="236" y="150" width="40" height="300" rx="5" fill="url(#handleGrad)" stroke="#5e300d" stroke-width="2" transform="rotate(-15 256 256)"/>
  
  <!-- The Head (Sparks Collector) -->
  <g transform="rotate(-15 256 256)">
    <!-- Back weight -->
    <rect x="166" y="100" width="60" height="80" rx="5" fill="#555" stroke="#333" stroke-width="2"/>
    
    <!-- Main Head -->
    <rect x="226" y="80" width="120" height="120" rx="10" fill="url(#headGrad)" stroke="#B8860B" stroke-width="4" filter="url(#glow)"/>
    
    <!-- Shiny Spark Symbol on Head -->
    <path d="M 286 110 L 296 130 L 316 140 L 296 150 L 286 170 L 276 150 L 256 140 L 276 130 Z" fill="#FFF" fill-opacity="0.8"/>
  </g>
  
  <!-- Impact Spark (Visual Flair) -->
  <path d="M 360 80 L 380 60 M 370 100 L 400 100 M 360 120 L 380 140" stroke="#00FFFF" stroke-width="4" stroke-linecap="round" />
</svg>
`;