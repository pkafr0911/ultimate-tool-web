import emojiText from '@/assets/emoji_15.1.txt?raw';
import { kaomojiData, emojiData as localEmojiData } from './emojis';

export type EmojiEntry = {
  emoji: string;
  name: string;
};

/** Convert Unicode code points like "1F1FB 1F1FA" → 🇻🇺 */
function decodeEmojiFromCodePoints(hexSequence: string): string {
  return hexSequence
    .trim()
    .split(/\s+/)
    .map((cp) => String.fromCodePoint(parseInt(cp, 16)))
    .join('');
}

/** Parse emoji-test.txt into categorized emoji data */
export const fetchUnicodeEmojiData = (): Record<string, EmojiEntry[]> => {
  const lines = emojiText.split('\n');
  let currentGroup = '';
  const data: Record<string, EmojiEntry[]> = {};

  for (const line of lines) {
    if (!line.trim()) continue;

    const groupMatch = line.match(/^# group: (.+)/);
    if (groupMatch) {
      currentGroup = groupMatch[1].trim();
      if (!data[currentGroup]) data[currentGroup] = [];
      continue;
    }

    const match = line.match(/^([0-9A-F ]+);\s+fully-qualified\s+#\s+(\S+)\s+E\d+\.\d+\s+(.+)/);

    if (match && currentGroup) {
      const codePoints = match[1].trim();
      const emojiChar = decodeEmojiFromCodePoints(codePoints);
      const name = match[3].trim();

      if (!data[currentGroup].some((e) => e.emoji === emojiChar)) {
        data[currentGroup].push({ emoji: emojiChar, name });
      }
    }
  }

  const simplified: Record<string, EmojiEntry[]> = {
    Smileys: [],
    People: [],
    Animals: [],
    Food: [],
    Activities: [],
    Travel: [],
    Objects: [],
    Symbols: [],
    Flags: [],
    Aesthetic: (localEmojiData.Aesthetic || []).map((e) => ({
      emoji: e,
      name: 'Aesthetic emoji',
    })),
  };

  const mapping: Record<string, keyof typeof simplified> = {
    'Smileys & Emotion': 'Smileys',
    'People & Body': 'People',
    'Animals & Nature': 'Animals',
    'Food & Drink': 'Food',
    'Travel & Places': 'Travel',
    Activities: 'Activities',
    Objects: 'Objects',
    Symbols: 'Symbols',
    Flags: 'Flags',
  };

  for (const [group, emojis] of Object.entries(data)) {
    const key = mapping[group];
    if (key) simplified[key] = [...(simplified[key] || []), ...emojis];
  }

  for (const [key, arr] of Object.entries(localEmojiData)) {
    const merged = simplified[key] || [];
    simplified[key] = [...merged, ...arr.map((e) => ({ emoji: e, name: 'Custom emoji' }))];
  }

  return simplified;
};

/** Load Unicode + local emoji data asynchronously to avoid UI freeze */
export async function loadEmojiData(): Promise<{
  emojis: Record<string, EmojiEntry[]>;
  kaomoji: Record<string, string[]>;
}> {
  return new Promise((resolve) => {
    setTimeout(() => {
      try {
        const emojis = fetchUnicodeEmojiData();
        resolve({ emojis, kaomoji: kaomojiData });
      } catch (err) {
        console.error('Failed to load Unicode emoji data:', err);
        resolve({
          emojis: Object.fromEntries(
            Object.entries(localEmojiData).map(([k, arr]) => [
              k,
              arr.map((e) => ({ emoji: e, name: 'Fallback emoji' })),
            ]),
          ),
          kaomoji: kaomojiData,
        });
      }
    }, 10); // small async delay to yield control
  });
}
