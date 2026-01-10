# Vector Editor - Point Editing System

An Illustrator-style point and handle editing system for Fabric.js objects with support for Bezier curves, anchor points, and advanced path manipulation.

## Features

- **Direct Selection Mode**: Edit individual anchor points and Bezier handles
- **Anchor Point Manipulation**: Move, add, delete, and convert anchor points
- **Bezier Handle Control**: Adjust curve tangents with symmetry support
- **Keyboard Shortcuts**: Full keyboard workflow for efficient editing
- **Undo/Redo Integration**: All point edits are history-aware
- **Transform Support**: Handles work correctly with scaled, rotated, and transformed objects

## Quick Start

### Basic Usage

1. **Select an Object**: Click on a path, polyline, polygon, or shape
2. **Enter Point Edit Mode**: Press `A` (Direct Selection Tool)
3. **Edit Points**:
   - Click and drag anchor points to move them
   - Drag Bezier handles to adjust curves
   - Hold `Alt` while dragging handles to break symmetry
4. **Exit Point Edit Mode**: Press `V` (Selection Tool) or `Enter` to commit changes

### Creating Editable Shapes

```typescript
// Pen tool (P) creates editable paths
// Rectangle (R), Circle (C) also support point editing

// After creating a shape:
// 1. Press A to enter point edit mode
// 2. Edit the points
// 3. Press Enter to commit or Escape to cancel
```

## Keyboard Shortcuts

| Key                    | Action                                                |
| ---------------------- | ----------------------------------------------------- |
| `V`                    | Selection Tool (exit point edit, commit changes)      |
| `A`                    | Direct Selection Tool (enter point edit mode)         |
| `P`                    | Pen Tool (draw paths)                                 |
| `R`                    | Rectangle Tool                                        |
| `C`                    | Circle Tool                                           |
| `T`                    | Text Tool                                             |
| `H` or `Space`         | Pan Tool                                              |
| `Shift+C`              | Convert Anchor Type (smooth ↔ corner)                |
| `Delete` / `Backspace` | Delete selected anchor (in point edit mode) or object |
| `Enter`                | Commit point edits                                    |
| `Escape`               | Cancel point edits                                    |
| `Ctrl+Z`               | Undo                                                  |
| `Ctrl+Shift+Z`         | Redo                                                  |
| `Ctrl+=`               | Zoom In                                               |
| `Ctrl+-`               | Zoom Out                                              |
| `Ctrl+0`               | Reset Zoom                                            |

## Point Edit Mode

### Anchor Point Types

1. **Corner Points**:
   - No Bezier handles
   - Create sharp angles
   - Convert with `Shift+C`

2. **Smooth Points**:
   - Symmetrical Bezier handles
   - Create smooth curves
   - Handles move together by default
   - Hold `Alt` to break symmetry

3. **Symmetric Points**:
   - Bezier handles maintain equal distance and opposite direction
   - Provide balanced curves

### Bezier Handle Manipulation

- **Drag Handle**: Adjust curve shape
- **Alt+Drag**: Break handle symmetry (independent control points)
- **Shift+C**: Convert between corner and smooth point types

### Adding Points

While in point edit mode:

1. Click on a path segment where you want to add a point
2. A new smooth anchor point is created at that location

### Removing Points

1. Select an anchor point (click on it)
2. Press `Delete` or `Backspace`
3. Minimum 2 points are maintained

## Advanced Features

### Working with Transforms

The point editor correctly handles:

- **Scaled Objects**: Handles scale with the object
- **Rotated Objects**: Handles rotate with the object
- **Translated Objects**: Handles follow the object position

All coordinates are stored in object-local space and transformed to canvas space for display.

### History Integration

- All point modifications are recorded in the undo/redo history
- Temporary helper objects (handles, lines) are excluded from history via the `isTemp` flag
- Snapshot is taken when entering point edit mode
- Commit saves to history; cancel restores snapshot

### Supported Object Types

| Type            | Support Level | Notes                               |
| --------------- | ------------- | ----------------------------------- |
| Path            | Full          | Complete Bezier curve editing       |
| Polyline        | Full          | Corner points only                  |
| Polygon         | Full          | Corner points only                  |
| Rectangle       | Full          | 4 corner points                     |
| Circle          | Full          | 4 smooth points with Bezier handles |
| Pen-drawn paths | Full          | Created via Pen tool                |
| Groups          | Partial       | May require isolation mode          |

## API Reference

### usePointEditor Hook

```typescript
const pointEditor = usePointEditor(canvas, history, options);
```

#### Options

```typescript
interface UsePointEditorOptions {
  handleRadius?: number; // Bezier handle radius (default: 4)
  anchorRadius?: number; // Anchor point radius (default: 5)
  handleStyle?: {
    fill?: string; // Handle fill color (default: #0066ff)
    stroke?: string; // Handle stroke color (default: #fff)
    strokeWidth?: number; // Handle stroke width (default: 1)
  };
  lineStyle?: {
    stroke?: string; // Handle line color (default: #0066ff)
    strokeWidth?: number; // Handle line width (default: 1)
    strokeDashArray?: number[]; // Line dash pattern (default: [3,3])
  };
  onChange?: (event: PointEditEvent) => void;
  onCommit?: (object: FabricObject) => void;
  onCancel?: () => void;
}
```

#### Methods

- `enter(object, opts?)`: Enter point edit mode for an object
- `exit(commit?)`: Exit point edit mode (commit=true saves, false cancels)
- `addPoint(canvasPoint)`: Add anchor at canvas coordinates
- `removePoint(index)`: Remove anchor by index
- `movePoint(index, localPoint)`: Move anchor to new position
- `selectPoint(index)`: Select an anchor
- `convertPointType(index, type)`: Convert anchor type
- `getAnchors()`: Get current anchor array
- `dispose()`: Clean up handles

#### Events

```typescript
interface PointEditEvent {
  type: 'anchor:move' | 'anchor:add' | 'anchor:remove' | 'handle:move' | 'type:change';
  objectId?: string;
  anchorIndex?: number;
  before?: AnchorPoint;
  after?: AnchorPoint;
}
```

## Implementation Details

### Data Model

Anchor points are stored with this structure:

```typescript
interface AnchorPoint {
  x: number; // Anchor X (object-local)
  y: number; // Anchor Y (object-local)
  type: 'corner' | 'smooth' | 'symmetric';
  cp1?: { x: number; y: number }; // Control point before
  cp2?: { x: number; y: number }; // Control point after
  handlesBroken?: boolean; // True if cp1/cp2 are independent
}
```

### Path Conversion

The system converts between Fabric path commands and anchor arrays:

```typescript
// Path → Anchors
const anchors = pathToAnchors(object.path);

// Anchors → Path
const path = anchorsToPath(anchors);
object.set('path', path);
```

### Coordinate Systems

- **Local Coordinates**: Stored in `AnchorPoint` data (relative to object)
- **Canvas Coordinates**: Used for handle display and user interaction
- **Transformation**: Handled via `object.calcTransformMatrix()` and `util.invertTransform()`

## Examples

### Example 1: Edit a Pen-Drawn Path

```typescript
// 1. Press P to activate pen tool
// 2. Click to create path points
// 3. Double-click to finish
// 4. Press A to enter point edit mode
// 5. Drag handles to adjust curves
// 6. Press Enter to commit
```

### Example 2: Convert Rectangle to Curved Shape

```typescript
// 1. Press R to create rectangle
// 2. Press A to enter point edit mode
// 3. Select a corner point
// 4. Press Shift+C to convert to smooth
// 5. Drag Bezier handles to create curves
// 6. Press Enter to commit
```

### Example 3: Add Points to a Path

```typescript
// 1. Select existing path
// 2. Press A to enter point edit mode
// 3. Click on a segment where you want to add a point
// 4. New smooth point is created
// 5. Drag to position as needed
```

## Troubleshooting

### Handles Don't Appear

- Ensure you're in point edit mode (press `A`)
- Check that the object type is supported (path, polyline, polygon, rect, circle)

### Can't Edit Grouped Objects

- Groups may require isolation mode
- Try ungrouping the object first

### Handles Don't Follow Transform

- This should work automatically
- If not, ensure the object has a valid transform matrix

### Undo/Redo Not Working

- Check that `isTemp` flag is set on helper objects
- Ensure history.saveState() is called on exit(commit=true)

## Future Enhancements

- [ ] Add point snapping to grid
- [ ] Multi-point selection and manipulation
- [ ] Curve fitting and path simplification
- [ ] Isolation mode for grouped objects
- [ ] Custom `fabric.Control` renderer for better performance
- [ ] Path operations (boolean, offset, etc.)

## Related Demos

- [Fabric.js Stickman Demo](https://fabric5.fabricjs.com/stickman) - Similar control point system
- [Fabric.js Quadratic Curve Demo](https://fabric5.fabricjs.com/quadratic-curve) - Bezier curve editing

## License

Part of the Ultimate Tool Web project.
