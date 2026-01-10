# Point Editor Examples

This directory contains examples demonstrating various point editing workflows.

## Available Examples

### 1. Basic Path Editing

- Create a simple path using the Pen tool
- Enter point edit mode
- Move anchors and adjust Bezier handles

### 2. Shape to Path Conversion

- Start with a rectangle or circle
- Convert to editable path with anchor points
- Modify to create custom shapes

### 3. Bezier Curve Manipulation

- Create smooth curves
- Adjust tangent handles
- Convert between smooth and corner points

### 4. Advanced Techniques

- Add/remove points dynamically
- Break handle symmetry for complex curves
- Work with transformed objects

## Usage Patterns

### Pattern 1: Quick Shape Editing

```typescript
// 1. Create shape (R for rectangle, C for circle)
// 2. Press A to enter point edit
// 3. Drag points to reshape
// 4. Press Enter to commit
```

### Pattern 2: Precise Curve Control

```typescript
// 1. Use Pen tool (P) to create path
// 2. Press A to enter point edit
// 3. Drag Bezier handles for smooth curves
// 4. Hold Alt while dragging to break symmetry
// 5. Press Shift+C to toggle smooth/corner
```

### Pattern 3: Path Refinement

```typescript
// 1. Select existing path
// 2. Press A to edit
// 3. Click on segments to add points
// 4. Select unwanted points and Delete
// 5. Adjust remaining points
// 6. Press Enter when done
```

## Demo Workflows

### Workflow 1: Create a Custom Icon

1. Press `R` to create rectangle base
2. Press `A` to enter point edit mode
3. Select corners and press `Shift+C` to make them smooth
4. Adjust Bezier handles to create rounded corners
5. Click on edges to add more control points
6. Shape into desired icon form
7. Press `Enter` to finalize

### Workflow 2: Edit a Logo Path

1. Import or draw logo path with Pen tool (`P`)
2. Press `A` to enter direct selection
3. Fine-tune anchor positions by dragging
4. Adjust curve handles for smooth transitions
5. Add detail points by clicking on segments
6. Remove unnecessary points with `Delete`
7. Press `Enter` to save changes

### Workflow 3: Trace and Refine

1. Place reference image on canvas
2. Use Pen tool (`P`) to trace rough outline
3. Press `A` to enter point edit mode
4. Refine each curve by adjusting handles
5. Add points where detail is needed
6. Smooth out curves by converting corner points
7. Press `Enter` to complete

## Interactive Examples

Run the VectorEditor and try these:

### Example A: Star to Flower

1. Create a rectangle
2. Enter point edit (A)
3. Add midpoint on each side (click segments)
4. Drag new points outward
5. Convert all to smooth points (Shift+C)
6. Adjust handles to create petal shapes

### Example B: Simple Face

1. Create circle for head
2. Add circles for eyes (don't enter point edit yet)
3. Draw mouth with pen tool
4. Select mouth path and press A
5. Adjust smile curve with handles
6. Fine-tune expressions

### Example C: Wave Pattern

1. Draw horizontal line with pen tool
2. Enter point edit (A)
3. Add points along the line
4. Drag alternating points up and down
5. Convert to smooth points
6. Adjust handles to create wave

## Tips & Tricks

- **Smooth Curves**: Use smooth points with symmetrical handles
- **Sharp Corners**: Use corner points (no handles)
- **Precision**: Hold Shift while dragging for constrained movement (coming soon)
- **Symmetry**: Default behavior maintains handle symmetry; use Alt to break
- **Efficiency**: Use keyboard shortcuts for faster workflow

## Common Mistakes

❌ **Forgetting to commit**: Always press Enter or V to save changes  
✅ **Solution**: Press Enter after editing

❌ **Too many points**: Adding unnecessary anchors  
✅ **Solution**: Use fewer smooth points with good handle placement

❌ **Broken handles**: Accidentally pressing Alt while dragging  
✅ **Solution**: Convert back to smooth (Shift+C twice) to reset

## Performance Notes

- **Under 100 points**: Excellent performance
- **100-200 points**: Good performance
- **200+ points**: Consider path simplification

## Next Steps

1. Practice basic workflows above
2. Experiment with different shapes
3. Try combining with other tools (selection, pan, zoom)
4. Export your creations

For more information, see the main [VectorEditor README](../README.md).
