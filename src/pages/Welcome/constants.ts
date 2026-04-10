import { pages } from '@/constants';

// =============================================================================
// LANDING PAGE AUTO-UPDATE RULE
// =============================================================================
// The landing page derives all tool listings from `src/constants.tsx`.
// When you add a new tool to the `pages` array there, it will AUTOMATICALLY
// appear on the landing page in the correct category section, marquee, and
// stats counter — as long as you use the correct path prefix:
//
//   /playground         → "Playground" section
//   /utility/           → "Utility Tools" section
//   /visual-tools/      → "Visual Tools" section
//   /editor/            → "Editor" section
//   /randomizer/        → "Randomizer" section
//   /game/              → "Game" section
//   /docs/              → "Docs / Commands" section
//
// No changes to this file are needed when adding a new tool.
// =============================================================================

// --- Categories with path-prefix based auto-grouping ---
// `pathPrefix` is the single source of truth — the UI filters `pages` by this.
export const categories = [
  {
    title: 'Playground',
    pathPrefix: '/playground',
    desc: 'Experiment, code, and create — directly in your browser.',
    tagline: 'Build amazing things',
    testimonial: {
      quote: 'The playground feature lets me prototype ideas instantly without any setup.',
      author: 'Developer & Creator',
      role: 'Full-stack Developer',
    },
  },
  {
    title: 'Utility Tools',
    pathPrefix: '/utility/',
    desc: 'From quick conversions to encryption — everything you need for everyday dev work.',
    tagline: 'Essential tools, instant access',
    features: [
      'Generate secure passwords and UUIDs instantly',
      'Test regex patterns in real-time',
      'Encode and decode JWT tokens with ease',
    ],
  },
  {
    title: 'Visual Tools',
    pathPrefix: '/visual-tools/',
    desc: 'Edit photos, create vector art, extract text from images, and more — all in your browser.',
    tagline: 'A creative suite at your fingertips',
    testimonial: {
      quote:
        'Everything I need for visual work in one place — editing, viewing, converting. No installs.',
      author: 'Design Professional',
      role: 'UI/UX Designer',
    },
  },
  {
    title: 'Editor',
    pathPrefix: '/editor/',
    desc: 'Edit JSON, Markdown, HTML, or Mermaid diagrams instantly with built-in formatters.',
    tagline: 'Edit and format with precision',
    features: [
      'Format JSON with syntax highlighting',
      'Preview Markdown in real-time',
      'Edit HTML with live preview',
      'Create and edit Mermaid diagrams visually',
    ],
  },
  {
    title: 'Randomizer',
    pathPrefix: '/randomizer/',
    desc: 'Spin, randomize, and pick — perfect for quick ideas and fun experiments.',
    tagline: 'Make decisions fun',
  },
  {
    title: 'Game',
    pathPrefix: '/game/',
    desc: 'Relax and recharge with built-in classic games.',
    tagline: 'Take a break, play smart',
    testimonial: {
      quote: 'Perfect for quick breaks. These games help me reset and come back more focused.',
      author: 'Software Engineer',
      role: 'Product Developer',
    },
  },
  {
    title: 'Docs / Commands',
    pathPrefix: '/docs/',
    desc: 'Quick access to useful documentation, cloud storage, and expressive emoji tools.',
    tagline: 'Find what you need, fast',
  },
];

// --- Sticky Cards: auto-derived from the first 4 categories ---
// Navigates to the first tool found under each category's pathPrefix.
const stickyCardAccents = ['#4353ff', '#2d2d2d', '#ff4081', '#00c853'];

export const stickyCards = categories.slice(0, 4).map((cat, i) => ({
  id: i + 1,
  title: cat.title,
  description: cat.desc,
  color: stickyCardAccents[i],
  path: pages.find((p) => p.path.startsWith(cat.pathPrefix))?.path || '/',
}));

// 2. Horizontal Scroll (Customize Cart -> Explore Tools)
// We will list individual tools here.
export const horizontalScrollItems = pages.slice(0, 8).map((page, index) => ({
  id: index,
  title: page.name,
  color: ['#FF5733', '#33FF57', '#3357FF', '#F333FF', '#FF33A8', '#FF8F33', '#33FFF5', '#8F33FF'][
    index % 8
  ],
  icon: page.icon,
  path: page.path,
}));

// 3. Sticky Feature (Sell Products -> Detailed Features)
// We will highlight specific powerful features.
export const featureSections = [
  {
    id: 1,
    title: 'Code Playground',
    desc: 'Write, run, and iterate on code instantly — JavaScript, TypeScript, Python and more. Real-time output, zero config, no IDE needed. Perfect for prototyping, debugging, and learning.',
    image:
      'https://images.unsplash.com/photo-1542831371-29b0f74f9713?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 2,
    title: 'Image & Visual Tools',
    desc: 'A full creative suite in your browser. Edit photos like Photoshop, create vector art, extract text from images with OCR, generate ASCII art, and convert between formats — all without uploading anything.',
    image:
      'https://images.unsplash.com/photo-1620674156044-52b714665d46?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 3,
    title: 'Security & Encoding',
    desc: 'Generate unbreakable passwords, create UUIDs, encode/decode JWT and AES tokens, and handle Base64 conversions. Every operation runs entirely in your browser — nothing is ever sent to a server.',
    image:
      'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=800&q=80',
  },
];

// 4. Marquee (Community Resources -> All Tools)
// We will create rows of tools for the infinite marquee.
const allTools = pages.map((p) => ({
  title: p.name,
  desc: p.desc,
  type: 'text',
  className: 'card-text-white', // Default style
  button: 'Try Now',
  path: p.path,
}));

// Split tools into 3 rows
const marqueeImages = [
  {
    type: 'image',
    src: 'https://images.unsplash.com/photo-1607799275518-d58665d099db?auto=format&fit=crop&w=400&q=80',
    className: 'card-image',
  },
  {
    type: 'image',
    src: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=400&q=80',
    className: 'card-image',
  },
  {
    type: 'image',
    src: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=400&q=80',
    className: 'card-image',
  },
  {
    type: 'image',
    src: 'https://images.unsplash.com/photo-1550439062-609e1531270e?auto=format&fit=crop&w=400&q=80',
    className: 'card-image',
  },
  {
    type: 'image',
    src: 'https://images.unsplash.com/photo-1542831371-29b0f74f9713?auto=format&fit=crop&w=400&q=80',
    className: 'card-image',
  },
  {
    type: 'image',
    src: 'https://images.unsplash.com/photo-1605379399642-870262d3d051?auto=format&fit=crop&w=400&q=80',
    className: 'card-image',
  },
];

// Helper to mix arrays
const mixArrays = (arr1: any[], arr2: any[]) => {
  const result: any[] = [];
  const maxLength = Math.max(arr1.length, arr2.length);
  for (let i = 0; i < maxLength; i++) {
    if (i < arr1.length) result.push(arr1[i]);
    if (i < arr2.length) result.push(arr2[i]);
  }
  return result;
};

const row1Tools = allTools.slice(0, Math.ceil(allTools.length / 3));
const row2Tools = allTools.slice(
  Math.ceil(allTools.length / 3),
  Math.ceil((allTools.length * 2) / 3),
);
const row3Tools = allTools.slice(Math.ceil((allTools.length * 2) / 3));

export const marqueeRows = [
  mixArrays(row1Tools, marqueeImages.slice(0, 2)),
  mixArrays(row2Tools, marqueeImages.slice(2, 4)),
  mixArrays(row3Tools, marqueeImages.slice(4, 6)),
];

// Add some visual variety to marquee items
marqueeRows[0] = marqueeRows[0].map((item, i) => {
  if (item.type === 'image') return item;
  return {
    ...item,
    className: i % 2 === 0 ? 'card-text-dark' : 'card-text-white',
  };
});
marqueeRows[1] = marqueeRows[1].map((item, i) => {
  if (item.type === 'image') return item;
  return {
    ...item,
    className: i % 3 === 0 ? 'card-gradient-1' : 'card-text-white',
  };
});
marqueeRows[2] = marqueeRows[2].map((item, i) => {
  if (item.type === 'image') return item;
  return {
    ...item,
    className: i % 2 === 0 ? 'card-gradient-2' : 'card-text-white',
  };
});

import { TargetAndTransition, VariantLabels, Transition } from 'framer-motion';

interface HeroVisualConfig {
  key: string;
  className: string;
  initial: boolean | TargetAndTransition | VariantLabels;
  animate: boolean | TargetAndTransition | VariantLabels;
  transition: Transition;
  whileHover: TargetAndTransition | VariantLabels;
  iconAnimate: TargetAndTransition | VariantLabels;
  iconTransition: Transition;
}

export const heroVisuals: HeroVisualConfig[] = [
  {
    key: 'Photo Editor',
    className: 'featured-left',
    initial: { opacity: 0, x: -100, rotateY: -15 },
    animate: { opacity: 1, x: 0, rotateY: 0 },
    transition: { delay: 0.9, duration: 0.8, ease: [0.215, 0.61, 0.355, 1] },
    whileHover: {
      scale: 1.12,
      rotateY: 5,
      rotateZ: -2,
      y: -15,
      transition: { duration: 0.4, ease: 'easeOut' },
    },
    iconAnimate: { rotateZ: [0, 5, -5, 0] },
    iconTransition: { duration: 4, repeat: Infinity, ease: 'easeInOut' },
  },
  {
    key: 'Playground',
    className: 'featured-center',
    initial: { opacity: 0, y: 50, scale: 0.8 },
    animate: { opacity: 1, y: [0, -10, 0], scale: 1 },
    transition: {
      opacity: { delay: 1.0, duration: 0.8 },
      scale: { delay: 1.0, duration: 0.8, ease: [0.215, 0.61, 0.355, 1] },
      y: { delay: 1.8, duration: 3, repeat: Infinity, ease: 'easeInOut' },
    },
    whileHover: {
      scale: 1.15,
      y: -20,
      boxShadow: '0 30px 80px rgba(0, 0, 0, 0.3)',
      transition: { duration: 0.3 },
    },
    iconAnimate: { scale: [1, 1.1, 1] },
    iconTransition: { duration: 2.5, repeat: Infinity, ease: 'easeInOut' },
  },
  {
    key: 'SVG Viewer',
    className: 'featured-right',
    initial: { opacity: 0, x: 100, rotateY: 15 },
    animate: { opacity: 1, x: 0, rotateY: 0 },
    transition: { delay: 1.1, duration: 0.8, ease: [0.215, 0.61, 0.355, 1] },
    whileHover: {
      scale: 1.12,
      rotateY: -5,
      rotateZ: 2,
      y: -15,
      transition: { duration: 0.4, ease: 'easeOut' },
    },
    iconAnimate: { rotateZ: [0, 360] },
    iconTransition: { duration: 20, repeat: Infinity, ease: 'linear' },
  },
];

// --- Marquee rows: auto-derived from all pages ---
