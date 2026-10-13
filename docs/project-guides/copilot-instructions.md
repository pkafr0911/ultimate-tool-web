# Copilot Instructions

## Adding a New Tool

Whenever a new tool or page is created in this project, add it to the `pages` array in `src/constants.tsx`. **No other file needs to be updated** — the landing page automatically reflects it.

### Path Prefix Convention

The path prefix determines which landing page category section the tool appears in:

| Path prefix      | Landing page section |
| ---------------- | -------------------- |
| `/playground`    | Playground           |
| `/utility/`      | Utility Tools        |
| `/visual-tools/` | Visual Tools         |
| `/editor/`       | Editor               |
| `/randomizer/`   | Randomizer           |
| `/game/`         | Game                 |
| `/docs/`         | Docs / Commands      |

### Example

```tsx
// In src/constants.tsx → pages array:
{
  name: 'My New Tool',
  path: '/utility/my-new-tool',   // ← determines the landing page category
  icon: <MyToolIcon />,
  desc: 'Short description shown on the landing page.',
},
```

### What auto-updates on the landing page

- **Category sections** — the new tool card appears in the matching category grid
- **Marquee** — the tool scrolls across the bottom "Explore All Tools" strip
- **Stats counter** — the "35+ Developer Tools" count increments automatically
- **Quick Access sticky cards** — navigation targets the first tool in each category

### Adding a New Category

If the new tool doesn't fit any existing prefix, add a new entry to the `categories` array in `src/pages/Welcome/constants.ts` with a unique `pathPrefix`. The landing page will automatically render a new section for it.
