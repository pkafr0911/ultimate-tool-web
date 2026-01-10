# Quick Reference: Point Editor

## 🎨 Keyboard Shortcuts

### Tools

- `V` - Selection Tool (exit point edit, commit)
- `A` - Direct Selection (point edit mode)
- `P` - Pen Tool
- `R` - Rectangle
- `C` - Circle
- `T` - Text
- `H` or `Space` - Pan

### Point Editing

- `Shift+C` - Convert anchor type (smooth ↔ corner)
- `Delete` / `Backspace` - Delete selected anchor
- `Enter` - Commit changes
- `Escape` - Cancel changes
- `Alt+Drag` - Break handle symmetry

### General

- `Ctrl+Z` - Undo
- `Ctrl+Shift+Z` - Redo
- `Ctrl+=` - Zoom in
- `Ctrl+-` - Zoom out
- `Ctrl+0` - Reset zoom

## 🔄 Basic Workflow

```
1. Create or select object
   ↓
2. Press A (enter point edit)
   ↓
3. Edit points and handles
   ↓
4. Press Enter (commit) or Escape (cancel)
```

## 📍 Point Types

### Corner Point

- No handles
- Sharp angles
- Click anchor → `Shift+C` to convert

### Smooth Point

- Symmetrical handles
- Smooth curves
- Default for new points
- `Alt+Drag` handle to break symmetry

## 🎯 Common Tasks

### Move Anchor

1. Enter point edit (`A`)
2. Drag anchor point
3. Commit (`Enter`)

### Adjust Curve

1. Enter point edit (`A`)
2. Drag Bezier handle
3. Commit (`Enter`)

### Add Point

1. Enter point edit (`A`)
2. Click on path segment (coming soon)

### Remove Point

1. Enter point edit (`A`)
2. Click anchor to select
3. Press `Delete`

### Change Point Type

1. Enter point edit (`A`)
2. Click anchor to select
3. Press `Shift+C`

## ⚠️ Tips

- **Smooth curves**: Use fewer points with good handle placement
- **Sharp corners**: Use corner points (no handles)
- **Symmetry**: Handles move together by default
- **Independence**: Hold `Alt` to move handles separately
- **Undo**: All changes are undoable with `Ctrl+Z`

## 📚 More Info

See [README.md](README.md) for detailed documentation.
