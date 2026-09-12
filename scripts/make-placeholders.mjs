// Generates lightweight SVG placeholder images so the site looks complete
// before real photos are added. Replace files in content/images/projects/
// with real .jpg/.webp photos and update content/projects.json.
import { mkdirSync, writeFileSync } from 'node:fs';

const OUT = 'content/images/projects';
mkdirSync(OUT, { recursive: true });

const P = {
  sky: ['#e9e4da', '#d8d1c4'],
  wall: '#efece5',
  wallDark: '#ded8cc',
  wood: '#c9a97e',
  woodDark: '#a88264',
  green: '#3c4a35',
  greenSoft: '#6b7860',
  glass: '#b9c2bd',
  line: '#8d8676',
};

const frame = (w, h, kids, bg) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="Placeholder image">
<defs>
<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${P.sky[0]}"/><stop offset="1" stop-color="${P.sky[1]}"/></linearGradient>
<linearGradient id="warm" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${P.wood}" stop-opacity=".55"/><stop offset="1" stop-color="${P.green}" stop-opacity=".25"/></linearGradient>
<linearGradient id="glassg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#cfd6d1"/><stop offset="1" stop-color="#9aa49d"/></linearGradient>
</defs>
<rect width="${w}" height="${h}" fill="${bg || 'url(#sky)'}"/>
${kids}
</svg>`;

// Exterior: modern house silhouette against a warm sky
const exterior = (w, h) => {
  const g = h * 0.72;
  return frame(w, h, `
  <rect y="${g}" width="${w}" height="${h - g}" fill="${P.greenSoft}" opacity=".35"/>
  <rect x="${w * 0.08}" y="${h * 0.3}" width="${w * 0.5}" height="${g - h * 0.3}" fill="${P.wall}"/>
  <rect x="${w * 0.08}" y="${h * 0.3}" width="${w * 0.5}" height="${h * 0.04}" fill="${P.wallDark}"/>
  <rect x="${w * 0.55}" y="${h * 0.42}" width="${w * 0.37}" height="${g - h * 0.42}" fill="${P.wood}" opacity=".75"/>
  ${Array.from({ length: 9 }, (_, i) => `<rect x="${w * 0.55 + i * w * 0.041}" y="${h * 0.42}" width="${w * 0.012}" height="${g - h * 0.42}" fill="${P.woodDark}" opacity=".5"/>`).join('')}
  <rect x="${w * 0.13}" y="${h * 0.4}" width="${w * 0.4}" height="${h * 0.26}" fill="url(#glassg)"/>
  <rect x="${w * 0.33}" y="${h * 0.4}" width="${w * 0.008}" height="${h * 0.26}" fill="${P.wall}"/>
  <rect y="${g}" width="${w}" height="${h * 0.015}" fill="${P.line}" opacity=".35"/>
  <circle cx="${w * 0.8}" cy="${h * 0.18}" r="${h * 0.07}" fill="${P.wood}" opacity=".35"/>`);
};

// Interior: room with window light and furniture blocks
const interior = (w, h) => frame(w, h, `
  <rect width="${w}" height="${h}" fill="${P.wall}"/>
  <rect x="${w * 0.06}" y="${h * 0.12}" width="${w * 0.4}" height="${h * 0.5}" fill="url(#glassg)"/>
  <rect x="${w * 0.26}" y="${h * 0.12}" width="${w * 0.01}" height="${h * 0.5}" fill="${P.wall}"/>
  <rect y="${h * 0.74}" width="${w}" height="${h * 0.26}" fill="${P.wood}" opacity=".55"/>
  <rect x="${w * 0.52}" y="${h * 0.34}" width="${w * 0.4}" height="${h * 0.4}" fill="${P.wallDark}"/>
  <rect x="${w * 0.56}" y="${h * 0.44}" width="${w * 0.32}" height="${h * 0.2}" fill="${P.green}" opacity=".55"/>
  <rect x="${w * 0.1}" y="${h * 0.66}" width="${w * 0.3}" height="${h * 0.12}" fill="${P.greenSoft}" opacity=".5"/>
  <path d="M${w * 0.06} ${h * 0.62} L${w * 0.46} ${h * 0.62} L${w * 0.52} ${h * 0.74} L${w * 0.0} ${h * 0.74} Z" fill="#ffffff" opacity=".3"/>`);

// Detail: tiles / bathroom / kitchen texture
const detail = (w, h) => {
  const cols = 6, rows = 4, cw = w / cols, ch = h / rows;
  let cells = '';
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const t = (r * cols + c) % 5;
    const fill = [P.wall, P.wallDark, P.wood, P.greenSoft, P.glass][t];
    cells += `<rect x="${c * cw + 2}" y="${r * ch + 2}" width="${cw - 4}" height="${ch - 4}" fill="${fill}" opacity="${0.35 + t * 0.1}"/>`;
  }
  return frame(w, h, `${cells}<rect width="${w}" height="${h}" fill="url(#warm)" opacity=".35"/>`, P.wall);
};

const files = {
  'apartment-cover': interior, 'apartment-1': interior, 'apartment-2': detail, 'apartment-3': interior,
  'house-cover': exterior, 'house-1': exterior, 'house-2': detail,
  'villa-cover': exterior, 'villa-1': interior, 'villa-2': detail,
  'office-cover': interior, 'office-1': interior,
  'hero': exterior, 'contact': exterior,
};

for (const [name, fn] of Object.entries(files)) {
  const [w, h] = name === 'hero' ? [1600, 900] : [1200, 900];
  writeFileSync(`${OUT}/${name}.svg`, fn(w, h));
}
console.log(`Generated ${Object.keys(files).length} placeholder images in ${OUT}`);
