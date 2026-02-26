export function svgDataUri(svg: string) {
  const encoded = encodeURIComponent(svg)
    .replace(/%0A/g, "")
    .replace(/%20/g, " ")
    .replace(/%3D/g, "=")
    .replace(/%3A/g, ":")
    .replace(/%2F/g, "/")
    .replace(/%2C/g, ",");
  return `data:image/svg+xml;charset=utf-8,${encoded}`;
}

export function cityHeroBg(cityName: string) {
  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" width="1600" height="520">
    <defs>
      <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
        <stop offset="0" stop-color="#f2e7db"/>
        <stop offset="0.45" stop-color="#f8f1e8"/>
        <stop offset="1" stop-color="#efe2d3"/>
      </linearGradient>
      <linearGradient id="h" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0" stop-color="rgba(0,0,0,0.35)"/>
        <stop offset="0.6" stop-color="rgba(0,0,0,0.10)"/>
        <stop offset="1" stop-color="rgba(255,255,255,0.85)"/>
      </linearGradient>
      <filter id="blur" x="-10%" y="-10%" width="120%" height="120%">
        <feGaussianBlur stdDeviation="18"/>
      </filter>
    </defs>
    <rect width="1600" height="520" fill="url(#g)"/>
    <g filter="url(#blur)" opacity="0.55">
      <circle cx="240" cy="220" r="180" fill="#e6a24a"/>
      <circle cx="640" cy="140" r="220" fill="#111827"/>
      <circle cx="1180" cy="260" r="240" fill="#d7c4ae"/>
    </g>
    <rect width="1600" height="520" fill="url(#h)"/>
    <text x="70" y="430" font-family="ui-serif, Georgia, Times New Roman, serif" font-weight="900" font-size="140" fill="rgba(17,24,39,0.08)">${cityName}</text>
  </svg>`;
  return svgDataUri(svg);
}

export function categoryCover(title: string) {
  const t = title.slice(0, 22);
  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" width="900" height="300">
    <defs>
      <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
        <stop offset="0" stop-color="#c8c8c8"/>
        <stop offset="1" stop-color="#7b7b7b"/>
      </linearGradient>
      <linearGradient id="o" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0" stop-color="rgba(0,0,0,0.35)"/>
        <stop offset="1" stop-color="rgba(0,0,0,0.10)"/>
      </linearGradient>
      <filter id="blur" x="-10%" y="-10%" width="120%" height="120%">
        <feGaussianBlur stdDeviation="22"/>
      </filter>
    </defs>
    <rect width="900" height="300" rx="36" ry="36" fill="url(#g)"/>
    <g filter="url(#blur)" opacity="0.55">
      <circle cx="160" cy="170" r="170" fill="#e6a24a"/>
      <circle cx="520" cy="130" r="200" fill="#111827"/>
      <circle cx="760" cy="220" r="200" fill="#d7c4ae"/>
    </g>
    <rect width="900" height="300" rx="36" ry="36" fill="url(#o)"/>
    <text x="52" y="186" font-family="ui-serif, Georgia, Times New Roman, serif" font-weight="900" font-size="54" fill="rgba(255,255,255,0.92)">${t}</text>
  </svg>`;
  return svgDataUri(svg);
}

export function venueCover(name: string) {
  const t = name.slice(0, 18);
  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" width="900" height="520">
    <defs>
      <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
        <stop offset="0" stop-color="#f0e6dc"/>
        <stop offset="1" stop-color="#d8c6b1"/>
      </linearGradient>
      <linearGradient id="o" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0" stop-color="rgba(0,0,0,0.10)"/>
        <stop offset="0.65" stop-color="rgba(0,0,0,0.25)"/>
        <stop offset="1" stop-color="rgba(0,0,0,0.32)"/>
      </linearGradient>
      <filter id="blur" x="-10%" y="-10%" width="120%" height="120%">
        <feGaussianBlur stdDeviation="26"/>
      </filter>
    </defs>
    <rect width="900" height="520" fill="url(#g)"/>
    <g filter="url(#blur)" opacity="0.65">
      <circle cx="180" cy="190" r="170" fill="#e6a24a"/>
      <circle cx="540" cy="150" r="220" fill="#111827"/>
      <circle cx="760" cy="320" r="240" fill="#b9a38a"/>
    </g>
    <rect width="900" height="520" fill="url(#o)"/>
    <text x="44" y="475" font-family="ui-serif, Georgia, Times New Roman, serif" font-weight="900" font-size="58" fill="rgba(255,255,255,0.18)">${t}</text>
  </svg>`;
  return svgDataUri(svg);
}
