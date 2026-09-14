export type RarityGrade =
  | 'consumer'
  | 'industrial'
  | 'mil-spec'
  | 'restricted'
  | 'classified'
  | 'covert'
  | 'gold';

export interface CaseItem {
  id: string;
  name: string;
  skin: string;
  rarity: RarityGrade;
  weight: number; // probability weight (e.g., 79.92% mil-spec, 15.98% restricted, 3.2% classified, 0.64% covert, 0.26% gold)
  image?: string;
  weaponType?: string;
  color?: string;
}

export interface CasePreset {
  id: string;
  title: string;
  subtitle: string;
  description?: string;
  items: CaseItem[];
  isCustom?: boolean;
}

export interface UnboxedItem {
  id: string;
  item: CaseItem;
  floatValue: number;
  wear: 'Factory New' | 'Minimal Wear' | 'Field-Tested' | 'Well-Worn' | 'Battle-Scarred';
  isStatTrak: boolean;
  statTrakCount?: number;
  timestamp: number;
  caseTitle: string;
}

export const RARITY_CONFIG: Record<
  RarityGrade,
  { name: string; color: string; bgGradient: string; weightDefault: number }
> = {
  consumer: {
    name: 'Consumer Grade',
    color: '#afafaf',
    bgGradient: 'linear-gradient(180deg, rgba(175,175,175,0.15) 0%, rgba(175,175,175,0.03) 100%)',
    weightDefault: 50,
  },
  industrial: {
    name: 'Industrial Grade',
    color: '#5e98d9',
    bgGradient: 'linear-gradient(180deg, rgba(94,152,217,0.2) 0%, rgba(94,152,217,0.03) 100%)',
    weightDefault: 30,
  },
  'mil-spec': {
    name: 'Mil-Spec Grade',
    color: '#4b69ff',
    bgGradient: 'linear-gradient(180deg, rgba(75,105,255,0.22) 0%, rgba(75,105,255,0.04) 100%)',
    weightDefault: 79.92,
  },
  restricted: {
    name: 'Restricted',
    color: '#8847ff',
    bgGradient: 'linear-gradient(180deg, rgba(136,71,255,0.25) 0%, rgba(136,71,255,0.05) 100%)',
    weightDefault: 15.98,
  },
  classified: {
    name: 'Classified',
    color: '#d32ce6',
    bgGradient: 'linear-gradient(180deg, rgba(211,44,230,0.28) 0%, rgba(211,44,230,0.06) 100%)',
    weightDefault: 3.2,
  },
  covert: {
    name: 'Covert',
    color: '#eb4b4b',
    bgGradient: 'linear-gradient(180deg, rgba(235,75,75,0.3) 0%, rgba(235,75,75,0.08) 100%)',
    weightDefault: 0.64,
  },
  gold: {
    name: '★ Rare Special Item ★',
    color: '#ffd700',
    bgGradient: 'linear-gradient(180deg, rgba(255,215,0,0.35) 0%, rgba(255,215,0,0.1) 100%)',
    weightDefault: 0.26,
  },
};
