import { useState, useRef } from 'react';

export const useEditorState = () => {
  const [hoverColor, setHoverColor] = useState<{ x: number; y: number; color: string } | null>(
    null,
  );
  const [pickedColor, setPickedColor] = useState<string | null>(null);

  const [showColorRemovalModal, setShowColorRemovalModal] = useState(false);
  const [selectedColorForRemoval, setSelectedColorForRemoval] = useState<string | null>(null);

  const [showLayerMaskModal, setShowLayerMaskModal] = useState(false);
  const [maskEditingLayerId, setMaskEditingLayerId] = useState<string | null>(null);

  const [showLayerEffectModal, setShowLayerEffectModal] = useState(false);
  const [effectEditingLayerId, setEffectEditingLayerId] = useState<string | null>(null);

  const rulerPoints = useRef<{ x1: number; y1: number; x2: number; y2: number } | null>(null);
  const [dpiMeasured, setDpiMeasured] = useState<number | null>(null);

  const [showExportModal, setShowExportModal] = useState(false);

  const [openTour, setOpenTour] = useState(false);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);

  return {
    hoverColor,
    setHoverColor,
    pickedColor,
    setPickedColor,
    showColorRemovalModal,
    setShowColorRemovalModal,
    selectedColorForRemoval,
    setSelectedColorForRemoval,
    showLayerMaskModal,
    setShowLayerMaskModal,
    maskEditingLayerId,
    setMaskEditingLayerId,
    showLayerEffectModal,
    setShowLayerEffectModal,
    effectEditingLayerId,
    setEffectEditingLayerId,
    rulerPoints,
    dpiMeasured,
    setDpiMeasured,
    showExportModal,
    setShowExportModal,
    openTour,
    setOpenTour,
    toolbarRef,
    sidebarRef,
    canvasContainerRef,
  };
};
