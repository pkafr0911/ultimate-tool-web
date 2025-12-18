import React, { useEffect, useState } from 'react'; // Import React hooks
import { List, Button, Typography, Space } from 'antd'; // Import Ant Design components
import {
  EyeOutlined, // Icon for visible layer
  EyeInvisibleOutlined, // Icon for hidden layer
  LockOutlined, // Icon for locked layer
  UnlockOutlined, // Icon for unlocked layer
  DeleteOutlined, // Icon for delete action
  HolderOutlined, // Icon for drag handle
} from '@ant-design/icons'; // Import icons from Ant Design
import { useVectorEditor } from '../context'; // Import custom hook for editor context
import { FabricObject } from 'fabric'; // Import Fabric.js object type
import {
  DndContext, // Context provider for drag and drop
  closestCenter, // Collision detection algorithm
  KeyboardSensor, // Sensor for keyboard interactions
  PointerSensor, // Sensor for pointer (mouse/touch) interactions
  useSensor, // Hook to use a specific sensor
  useSensors, // Hook to combine multiple sensors
  DragEndEvent, // Type for drag end event
} from '@dnd-kit/core'; // Import core DnD Kit functionalities
import {
  arrayMove, // Utility to move items in an array
  SortableContext, // Context for sortable items
  sortableKeyboardCoordinates, // Keyboard coordinates for sorting
  verticalListSortingStrategy, // Sorting strategy for vertical lists
  useSortable, // Hook to make an item sortable
} from '@dnd-kit/sortable'; // Import sortable functionalities
import { CSS } from '@dnd-kit/utilities'; // Import CSS utilities for transforms

const { Title } = Typography; // Destructure Title from Typography

interface SortableItemProps {
  id: string; // Unique identifier for the sortable item
  children: React.ReactNode; // Content of the item
  isSelected: boolean; // Whether the item is currently selected
  onClick: () => void; // Click handler for the item
}

const SortableItem: React.FC<SortableItemProps> = ({ id, children, isSelected, onClick }) => {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition } =
    useSortable({ id }); // Initialize sortable hook

  const style = {
    transform: CSS.Transform.toString(transform), // Apply transform for dragging
    transition, // Apply transition for smooth movement
    backgroundColor: isSelected ? '#e6f7ff' : 'transparent', // Highlight if selected
    marginBottom: 4, // Spacing between items
    border: '1px solid #f0f0f0', // Border for the item
    borderRadius: 4, // Rounded corners
    padding: '4px 8px', // Padding inside the item
    display: 'flex', // Flexbox layout
    alignItems: 'center', // Center items vertically
  };

  return (
    <div ref={setNodeRef} style={style}>
      {' '}
      {/* Main container for the sortable item */}
      <div
        ref={setActivatorNodeRef} // Set this element as the drag handle
        {...attributes} // Spread accessibility attributes
        {...listeners} // Spread event listeners
        style={{
          cursor: 'grab', // Cursor style for grabbing
          marginRight: 8, // Spacing to the right
          display: 'flex', // Flexbox layout
          alignItems: 'center', // Center items vertically
          color: '#999', // Color for the handle icon
        }}
      >
        <HolderOutlined /> {/* Drag handle icon */}
      </div>
      <div onClick={onClick} style={{ flex: 1, cursor: 'pointer' }}>
        {' '}
        {/* Clickable area for selection */}
        {children} {/* Render children content */}
      </div>
    </div>
  );
};

const LayersPanel: React.FC = () => {
  const { canvas, selectedObject, setSelectedObject, history } = useVectorEditor(); // Access editor context
  const [objects, setObjects] = useState<FabricObject[]>([]); // State to store canvas objects

  const sensors = useSensors(
    useSensor(PointerSensor), // Use pointer sensor for mouse/touch
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates, // Use keyboard coordinates for accessibility
    }),
  );

  const updateObjects = () => {
    if (!canvas) return; // Exit if canvas is not available
    const objs = canvas.getObjects(); // Get all objects from canvas
    objs.forEach((obj: any) => {
      if (!obj.uid) obj.uid = Math.random().toString(36).substr(2, 9); // Assign unique ID if missing
    });
    // Reverse to show top layers first (Fabric stores bottom-up)
    setObjects([...objs].reverse()); // Update state with reversed objects
  };

  useEffect(() => {
    if (!canvas) return; // Exit if canvas is not available

    let timeout: NodeJS.Timeout; // Variable for debounce timeout
    const debouncedUpdate = () => {
      clearTimeout(timeout); // Clear previous timeout
      timeout = setTimeout(updateObjects, 100); // Set new timeout for update
    };

    canvas.on('object:added', debouncedUpdate); // Listen for object addition
    canvas.on('object:removed', debouncedUpdate); // Listen for object removal
    canvas.on('object:modified', debouncedUpdate); // Listen for object modification

    updateObjects(); // Initial update

    return () => {
      canvas.off('object:added', debouncedUpdate); // Cleanup listener
      canvas.off('object:removed', debouncedUpdate); // Cleanup listener
      canvas.off('object:modified', debouncedUpdate); // Cleanup listener
      clearTimeout(timeout); // Clear timeout
    };
  }, [canvas]); // Re-run effect when canvas changes

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event; // Destructure active and over items

    if (over && active.id !== over.id) {
      // Check if dropped on a different item
      const oldIndex = objects.findIndex((obj: any) => obj.uid === active.id); // Find index of dragged item
      const newIndex = objects.findIndex((obj: any) => obj.uid === over.id); // Find index of target item

      if (oldIndex !== -1 && newIndex !== -1) {
        // Ensure both indices are valid
        // Calculate fabric indices (reversed)
        // objects[0] is Top (Fabric index N-1)
        // objects[N-1] is Bottom (Fabric index 0)

        // We want to move the object at oldIndex to newIndex in the UI list.
        // In Fabric, we need to calculate the target index.

        // Example: [A, B, C] (UI) -> [C, B, A] (Fabric)
        // Move A (0) to 1. Result: [B, A, C] (UI) -> [C, A, B] (Fabric)

        // The target index in Fabric corresponds to the new position in the UI list.
        // If we move to UI index `newIndex`, it means it should be at `objects.length - 1 - newIndex` in Fabric?
        // Let's verify.
        // If newIndex is 0 (Top), fabric index should be length-1.
        // If newIndex is length-1 (Bottom), fabric index should be 0.
        // So yes, fabricNewIndex = objects.length - 1 - newIndex.

        const fabricNewIndex = objects.length - 1 - newIndex; // Calculate new index for Fabric
        const obj = objects[oldIndex]; // Get the object being moved

        canvas?.moveObjectTo(obj, fabricNewIndex); // Move object in Fabric canvas
        canvas?.requestRenderAll(); // Request re-render
        history.saveState(); // Save state to history
        updateObjects(); // Update local state
      }
    }
  };

  const toggleVisibility = (obj: FabricObject, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent event bubbling
    obj.visible = !obj.visible; // Toggle visibility property
    if (!obj.visible) {
      canvas?.discardActiveObject(); // Deselect if hidden
    }
    canvas?.requestRenderAll(); // Request re-render
    history.saveState(); // Save state to history
    // Force update
    setObjects([...(canvas?.getObjects() || [])].reverse()); // Update local state
  };

  const toggleLock = (obj: FabricObject, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent event bubbling
    obj.lockMovementX = !obj.lockMovementX; // Toggle X movement lock
    obj.lockMovementY = !obj.lockMovementY; // Toggle Y movement lock
    obj.lockRotation = !obj.lockRotation; // Toggle rotation lock
    obj.lockScalingX = !obj.lockScalingX; // Toggle X scaling lock
    obj.lockScalingY = !obj.lockScalingY; // Toggle Y scaling lock
    obj.selectable = !obj.lockMovementX; // If locked, not selectable

    if (!obj.selectable) {
      canvas?.discardActiveObject(); // Deselect if not selectable
    }

    canvas?.requestRenderAll(); // Request re-render
    history.saveState(); // Save state to history
    setObjects([...(canvas?.getObjects() || [])].reverse()); // Update local state
  };

  const selectObject = (obj: FabricObject) => {
    if (!canvas || !obj.visible || !obj.selectable) return; // Exit if not selectable
    canvas.setActiveObject(obj); // Set active object in canvas
    canvas.requestRenderAll(); // Request re-render
  };

  const deleteObject = (obj: FabricObject, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent event bubbling
    canvas?.remove(obj); // Remove object from canvas
    canvas?.requestRenderAll(); // Request re-render
    history.saveState(); // Save state to history
  };

  return (
    <div style={{ marginTop: 16 }}>
      {' '}
      {/* Container with top margin */}
      <Title level={5}>Layers</Title> {/* Panel title */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        {' '}
        {/* DnD Context */}
        <SortableContext
          items={objects.map((obj: any) => obj.uid)} // Items to be sorted
          strategy={verticalListSortingStrategy} // Sorting strategy
        >
          <div
            style={{
              maxHeight: 300, // Maximum height
              overflowY: 'auto', // Vertical scroll if needed
              border: '1px solid #d9d9d9', // Border style
              borderRadius: 4, // Rounded corners
              padding: 4, // Padding
            }}
          >
            {objects.map((item: any, index) => {
              // Iterate over objects
              const isSelected = selectedObject === item; // Check if selected
              const type = item.type || 'Object'; // Get object type
              const name = item.name || `${type} ${objects.length - index}`; // Generate name

              return (
                <SortableItem
                  key={item.uid} // Unique key
                  id={item.uid} // Sortable ID
                  isSelected={isSelected} // Selection state
                  onClick={() => selectObject(item)} // Click handler
                >
                  <div
                    style={{
                      display: 'flex', // Flexbox layout
                      alignItems: 'center', // Center items vertically
                      width: '100%', // Full width
                      justifyContent: 'space-between', // Space between content
                    }}
                  >
                    <span
                      style={{
                        overflow: 'hidden', // Hide overflow
                        textOverflow: 'ellipsis', // Show ellipsis
                        whiteSpace: 'nowrap', // No wrap
                        maxWidth: 120, // Max width for text
                      }}
                    >
                      {name} {/* Display name */}
                    </span>
                    <Space size={4}>
                      {' '}
                      {/* Space between buttons */}
                      <Button
                        type="text" // Text button style
                        size="small" // Small size
                        icon={item.visible ? <EyeOutlined /> : <EyeInvisibleOutlined />} // Visibility icon
                        onClick={(e) => toggleVisibility(item, e)} // Toggle visibility handler
                        onMouseDown={(e) => e.stopPropagation()} // Prevent drag start
                      />
                      <Button
                        type="text" // Text button style
                        size="small" // Small size
                        icon={item.lockMovementX ? <LockOutlined /> : <UnlockOutlined />} // Lock icon
                        onClick={(e) => toggleLock(item, e)} // Toggle lock handler
                        onMouseDown={(e) => e.stopPropagation()} // Prevent drag start
                      />
                      <Button
                        type="text" // Text button style
                        size="small" // Small size
                        danger // Danger style (red)
                        icon={<DeleteOutlined />} // Delete icon
                        onClick={(e) => deleteObject(item, e)} // Delete handler
                        onMouseDown={(e) => e.stopPropagation()} // Prevent drag start
                      />
                    </Space>
                  </div>
                </SortableItem>
              );
            })}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
};

export default LayersPanel; // Export component
