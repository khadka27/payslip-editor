'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  FileUp, 
  Sparkles, 
  CheckCircle2, 
  Edit3, 
  Type, 
  Square, 
  Stamp, 
  PenTool, 
  Download, 
  Undo2, 
  Redo2, 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  Trash2, 
  Copy, 
  Eye, 
  EyeOff, 
  Layers, 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  Sliders, 
  Check, 
  Plus, 
  X, 
  FileText, 
  RefreshCw, 
  ShieldCheck, 
  Printer, 
  Image as ImageIcon,
  Move,
  Bold,
  Italic,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Palette,
  MousePointerClick
} from 'lucide-react';
import jsPDF from 'jspdf';
import { 
  PdfTextItem, 
  PdfOverlayElement, 
  PdfPageData, 
  processPdfTextItems, 
  matchesCategory,
  generateSampleCorporatePdfBuffer 
} from '../lib/pdfEditorUtils';
import { CustomSelect } from './ui/CustomSelect';

type ToolMode = 'direct_edit' | 'add_text' | 'whiteout' | 'stamp';
type SidebarTab = 'smart_replace' | 'layers' | 'stamps';

export const PdfImporter: React.FC = () => {
  // Document State
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfBuffer, setPdfBuffer] = useState<ArrayBuffer | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageDataMap, setPageDataMap] = useState<Record<number, PdfPageData>>({});
  
  // Canvas & Zoom State
  const [zoomScale, setZoomScale] = useState<number>(1.0);
  const [activeTool, setActiveTool] = useState<ToolMode>('direct_edit');
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>('smart_replace');
  
  // Overlays (Per Page)
  const [elementsByPage, setElementsByPage] = useState<Record<number, PdfOverlayElement[]>>({});
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [hoveredTextItem, setHoveredTextItem] = useState<PdfTextItem | null>(null);
  
  // Dragging / Resizing State for Overlays
  const [isDraggingElement, setIsDraggingElement] = useState<boolean>(false);
  const [dragStartPos, setDragStartPos] = useState<{ mouseX: number; mouseY: number; elX: number; elY: number } | null>(null);
  const [isResizingElement, setIsResizingElement] = useState<boolean>(false);
  const [resizeStartPos, setResizeStartPos] = useState<{ mouseX: number; mouseY: number; startW: number; startH: number } | null>(null);

  // History State for Undo / Redo
  const [history, setHistory] = useState<Array<Record<number, PdfOverlayElement[]>>>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  
  // Export state
  const [isExporting, setIsExporting] = useState<boolean>(false);
  
  // Smart Search & Filter
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterCategory, setFilterCategory] = useState<'all' | 'amount' | 'date' | 'id' | 'name'>('all');

  // Signature Pad State
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState<boolean>(false);
  const signatureCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);

  // References
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const renderTaskRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const workbenchRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const stampImageInputRef = useRef<HTMLInputElement>(null);
  const activeInputRef = useRef<HTMLInputElement>(null);

  // Current page data & overlay elements
  const currentPageData = pageDataMap[currentPage] || null;
  const currentElements = elementsByPage[currentPage] || [];
  const selectedElement = currentElements.find(el => el.id === selectedElementId) || null;

  // Push new state to history
  const pushHistory = useCallback((newElementsMap: Record<number, PdfOverlayElement[]>) => {
    setHistory(prev => {
      const next = prev.slice(0, historyIndex + 1);
      return [...next, JSON.parse(JSON.stringify(newElementsMap))];
    });
    setHistoryIndex(prev => prev + 1);
  }, [historyIndex]);

  const updateElementsByPage = useCallback((updater: (prev: Record<number, PdfOverlayElement[]>) => Record<number, PdfOverlayElement[]>) => {
    setElementsByPage(prev => {
      const updated = updater(prev);
      pushHistory(updated);
      return updated;
    });
  }, [pushHistory]);

  const handleUndo = () => {
    if (historyIndex > 0) {
      const prevIndex = historyIndex - 1;
      setHistoryIndex(prevIndex);
      setElementsByPage(JSON.parse(JSON.stringify(history[prevIndex])));
      setSelectedElementId(null);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const nextIndex = historyIndex + 1;
      setHistoryIndex(nextIndex);
      setElementsByPage(JSON.parse(JSON.stringify(history[nextIndex])));
    }
  };

  // Load PDF from ArrayBuffer
  const loadPdfFromBuffer = async (buffer: ArrayBuffer, name: string) => {
    setIsProcessing(true);
    setFileName(name);
    setPdfBuffer(buffer);
    setElementsByPage({});
    setHistory([{}]);
    setHistoryIndex(0);
    setSelectedElementId(null);

    try {
      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.js`;

      const loadingTask = pdfjsLib.getDocument({
        data: buffer,
        useSystemFonts: true,
        disableFontFace: false,
      });
      const doc = await loadingTask.promise;
      setPdfDoc(doc);
      setNumPages(doc.numPages);
      setCurrentPage(1);

      // Extract native page dimensions and text content for each page
      const newPageDataMap: Record<number, PdfPageData> = {};
      for (let p = 1; p <= doc.numPages; p++) {
        const page = await doc.getPage(p);
        const unscaledViewport = page.getViewport({ scale: 1.0 });
        const textContent = await page.getTextContent();
        const textItems = processPdfTextItems(textContent.items, unscaledViewport, p);

        const width = unscaledViewport.width;
        const height = unscaledViewport.height;
        const aspectRatio = width / height;

        newPageDataMap[p] = {
          pageIndex: p,
          width,
          height,
          aspectRatio,
          isLandscape: width > height,
          textItems,
        };
      }
      setPageDataMap(newPageDataMap);
    } catch (err) {
      console.error('Error parsing PDF buffer:', err);
      alert('Could not parse PDF file. Please ensure it is a valid PDF document.');
    } finally {
      setIsProcessing(false);
    }
  };

  // File Upload Handlers
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPdfFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (ev.target?.result instanceof ArrayBuffer) {
        loadPdfFromBuffer(ev.target.result, file.name);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleLoadSamplePdf = () => {
    const buffer = generateSampleCorporatePdfBuffer();
    loadPdfFromBuffer(buffer, 'Acme_Corporate_Payslip_Sample.pdf');
  };

  // Calculate dynamic display dimensions matching the exact PDF page aspect ratio
  const calculateDisplayDimensions = () => {
    if (!currentPageData) {
      return { displayWidth: 650, displayHeight: 920, nativeWidth: 650, nativeHeight: 920 };
    }

    const { width, height, aspectRatio, isLandscape } = currentPageData;
    const baseWidth = isLandscape ? 820 : 640;
    const displayWidth = Math.round(baseWidth * zoomScale);
    const displayHeight = Math.round(displayWidth / aspectRatio);

    return { displayWidth, displayHeight, nativeWidth: width, nativeHeight: height };
  };

  const { displayWidth, displayHeight, nativeWidth, nativeHeight } = calculateDisplayDimensions();

  // Render current PDF page to canvas with high resolution and race-condition safety
  useEffect(() => {
    if (!pdfDoc || !canvasRef.current || !currentPageData) return;

    let isCancelled = false;

    const renderPage = async () => {
      // Cancel previous render task if active
      if (renderTaskRef.current) {
        try {
          renderTaskRef.current.cancel();
        } catch (_) {}
        renderTaskRef.current = null;
      }

      try {
        const page = await pdfDoc.getPage(currentPage);
        if (isCancelled) return;

        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // High resolution scale factor (device pixel ratio + high quality supersampling)
        const dpr = typeof window !== 'undefined' ? Math.max(2, window.devicePixelRatio || 2) : 2;
        const renderScale = (displayWidth / currentPageData.width) * dpr;
        const renderViewport = page.getViewport({ scale: renderScale });

        canvas.width = renderViewport.width;
        canvas.height = renderViewport.height;
        canvas.style.width = '100%';
        canvas.style.height = '100%';

        const renderContext = {
          canvasContext: ctx,
          viewport: renderViewport,
        };

        const renderTask = page.render(renderContext);
        renderTaskRef.current = renderTask;
        await renderTask.promise;
      } catch (err: any) {
        if (!isCancelled && err?.name !== 'RenderingCancelledException') {
          console.error('Error rendering page:', err);
        }
      } finally {
        if (renderTaskRef.current && !isCancelled) {
          renderTaskRef.current = null;
        }
      }
    };

    renderPage();

    return () => {
      isCancelled = true;
      if (renderTaskRef.current) {
        try {
          renderTaskRef.current.cancel();
        } catch (_) {}
        renderTaskRef.current = null;
      }
    };
  }, [pdfDoc, currentPage, currentPageData, displayWidth]);

  // Focus active input when an element is selected
  useEffect(() => {
    if (selectedElementId && activeInputRef.current) {
      activeInputRef.current.focus();
    }
  }, [selectedElementId]);

  // Click on PDF Canvas Handler
  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDraggingElement || isResizingElement) return;
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const xPct = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const yPct = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));

    if (activeTool === 'whiteout') {
      const newEl: PdfOverlayElement = {
        id: `wo_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        pageIndex: currentPage,
        type: 'whiteout',
        x: Math.max(0, Math.min(80, xPct)),
        y: Math.max(0, Math.min(95, yPct)),
        width: 20,
        height: 3.5,
        fillColor: '#ffffff',
      };

      updateElementsByPage(prev => ({
        ...prev,
        [currentPage]: [...(prev[currentPage] || []), newEl],
      }));
      setSelectedElementId(newEl.id);
      setActiveTool('direct_edit');
      return;
    }

    // In Direct Edit or Add Text mode: clicking blank space adds/selects new text box
    if (e.target === containerRef.current || (e.target as HTMLElement).tagName === 'CANVAS') {
      if (activeTool === 'add_text' || activeTool === 'direct_edit') {
        const newEl: PdfOverlayElement = {
          id: `txt_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
          pageIndex: currentPage,
          type: 'text',
          x: Math.max(0, Math.min(80, xPct)),
          y: Math.max(0, Math.min(95, yPct)),
          width: 22,
          height: 3.8,
          text: 'Type text...',
          fontSize: 14,
          fontFamily: 'Inter',
          color: '#0f172a',
          bold: false,
          italic: false,
          align: 'left',
          hasWhiteoutBg: false,
        };

        updateElementsByPage(prev => ({
          ...prev,
          [currentPage]: [...(prev[currentPage] || []), newEl],
        }));
        setSelectedElementId(newEl.id);
      } else {
        setSelectedElementId(null);
      }
    }
  };

  // Sample background color and contrast text color from underlying rendered PDF canvas
  const sampleBackgroundColorAt = (xPct: number, yPct: number, widthPct: number, heightPct: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { bgColor: '#ffffff', textColor: '#0f172a' };

    try {
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return { bgColor: '#ffffff', textColor: '#0f172a' };

      const pixelX = Math.round((xPct / 100) * canvas.width);
      const pixelY = Math.round((yPct / 100) * canvas.height);
      const pixelW = Math.round((widthPct / 100) * canvas.width);
      const pixelH = Math.round((heightPct / 100) * canvas.height);

      // Sample edge/corner points to capture the true background rather than the glyph stroke
      const samplePoints = [
        { x: Math.max(1, pixelX + 1), y: Math.max(1, pixelY + 1) },
        { x: Math.min(canvas.width - 2, pixelX + pixelW - 1), y: Math.max(1, pixelY + 1) },
        { x: Math.max(1, pixelX + 1), y: Math.min(canvas.height - 2, pixelY + pixelH - 1) },
      ];

      let rTotal = 0, gTotal = 0, bTotal = 0;
      for (const pt of samplePoints) {
        const data = ctx.getImageData(pt.x, pt.y, 1, 1).data;
        rTotal += data[0];
        gTotal += data[1];
        bTotal += data[2];
      }
      const r = Math.round(rTotal / samplePoints.length);
      const g = Math.round(gTotal / samplePoints.length);
      const b = Math.round(bTotal / samplePoints.length);

      const hex = `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
      const luminance = (r * 299 + g * 587 + b * 114) / 1000;
      // Dark background (e.g. blue banner, dark header) -> White text; Light background -> Dark text
      const textColor = luminance < 140 ? '#ffffff' : '#0f172a';

      return { bgColor: hex, textColor };
    } catch (err) {
      return { bgColor: '#ffffff', textColor: '#0f172a' };
    }
  };

  // Convert Detected Text Item to DIRECT Editable Replacement Overlay
  const handleEditDetectedText = (textItem: PdfTextItem) => {
    const existing = currentElements.find(el => el.originalTextId === textItem.id);
    if (existing) {
      setSelectedElementId(existing.id);
      return;
    }

    const { bgColor, textColor } = sampleBackgroundColorAt(textItem.x, textItem.y, textItem.width, textItem.height);

    // Calculate proportional font size
    const pageNativeHeight = currentPageData?.height || 842;
    const calculatedFontSize = Math.max(
      10,
      Math.round((textItem.height / 100) * pageNativeHeight * 0.72)
    );

    const isHeading = calculatedFontSize >= 18 || /Report|Summary|Total|Invoice|Payslip|Title|Cost|Gross|Net|Statement/i.test(textItem.str);

    const newEl: PdfOverlayElement = {
      id: `rep_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      pageIndex: currentPage,
      type: 'text',
      x: textItem.x,
      y: textItem.y,
      width: Math.max(textItem.width + 1.2, 5),
      height: Math.max(textItem.height, 2.4),
      text: textItem.str,
      fontSize: calculatedFontSize,
      fontFamily: 'Inter',
      color: textColor, // Auto-matches contrast (white on dark blue, dark on light)
      bold: isHeading,
      italic: false,
      align: 'left',
      hasWhiteoutBg: true, // Seamlessly masks original text with exact background color
      fillColor: bgColor, // Exact sampled background color of the canvas at that position
      originalTextId: textItem.id,
    };

    updateElementsByPage(prev => ({
      ...prev,
      [currentPage]: [...(prev[currentPage] || []), newEl],
    }));
    setSelectedElementId(newEl.id);
  };

  // Drag & Move Elements Handler
  const startDragElement = (e: React.MouseEvent, el: PdfOverlayElement) => {
    e.stopPropagation();
    setSelectedElementId(el.id);
    setIsDraggingElement(true);
    setDragStartPos({
      mouseX: e.clientX,
      mouseY: e.clientY,
      elX: el.x,
      elY: el.y,
    });
  };

  // Resize Element Handler
  const startResizeElement = (e: React.MouseEvent, el: PdfOverlayElement) => {
    e.stopPropagation();
    setSelectedElementId(el.id);
    setIsResizingElement(true);
    setResizeStartPos({
      mouseX: e.clientX,
      mouseY: e.clientY,
      startW: el.width,
      startH: el.height,
    });
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingElement && dragStartPos && selectedElementId && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const deltaXPct = ((e.clientX - dragStartPos.mouseX) / rect.width) * 100;
        const deltaYPct = ((e.clientY - dragStartPos.mouseY) / rect.height) * 100;

        const newX = Math.max(0, Math.min(98, dragStartPos.elX + deltaXPct));
        const newY = Math.max(0, Math.min(98, dragStartPos.elY + deltaYPct));

        setElementsByPage(prev => {
          const pageEls = prev[currentPage] || [];
          return {
            ...prev,
            [currentPage]: pageEls.map(el => el.id === selectedElementId ? { ...el, x: newX, y: newY } : el),
          };
        });
      } else if (isResizingElement && resizeStartPos && selectedElementId && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const deltaWPct = ((e.clientX - resizeStartPos.mouseX) / rect.width) * 100;
        const deltaHPct = ((e.clientY - resizeStartPos.mouseY) / rect.height) * 100;

        const newW = Math.max(3, Math.min(100, resizeStartPos.startW + deltaWPct));
        const newH = Math.max(1.5, Math.min(100, resizeStartPos.startH + deltaHPct));

        setElementsByPage(prev => {
          const pageEls = prev[currentPage] || [];
          return {
            ...prev,
            [currentPage]: pageEls.map(el => el.id === selectedElementId ? { ...el, width: newW, height: newH } : el),
          };
        });
      }
    };

    const handleMouseUp = () => {
      if (isDraggingElement || isResizingElement) {
        setIsDraggingElement(false);
        setIsResizingElement(false);
        setDragStartPos(null);
        setResizeStartPos(null);
        pushHistory(elementsByPage);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingElement, isResizingElement, dragStartPos, resizeStartPos, selectedElementId, currentPage, elementsByPage, pushHistory]);

  // Update selected element property
  const updateSelectedElement = (props: Partial<PdfOverlayElement>) => {
    if (!selectedElementId) return;
    updateElementsByPage(prev => {
      const pageEls = prev[currentPage] || [];
      const updated = pageEls.map(el => el.id === selectedElementId ? { ...el, ...props } : el);
      return { ...prev, [currentPage]: updated };
    });
  };

  // Delete element
  const handleDeleteElement = (id: string) => {
    updateElementsByPage(prev => {
      const pageEls = prev[currentPage] || [];
      return {
        ...prev,
        [currentPage]: pageEls.filter(el => el.id !== id),
      };
    });
    if (selectedElementId === id) {
      setSelectedElementId(null);
    }
  };

  // Preset Stamp Insertion
  const handleAddPresetStamp = (label: string, color: string) => {
    const newEl: PdfOverlayElement = {
      id: `stamp_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      pageIndex: currentPage,
      type: 'stamp',
      x: 70,
      y: 80,
      width: 22,
      height: 7,
      text: label,
      stampColor: color,
      opacity: 0.9,
    };

    updateElementsByPage(prev => ({
      ...prev,
      [currentPage]: [...(prev[currentPage] || []), newEl],
    }));
    setSelectedElementId(newEl.id);
  };

  // Image Upload Stamp Insertion
  const handleStampImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      if (!dataUrl) return;

      const newEl: PdfOverlayElement = {
        id: `img_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        pageIndex: currentPage,
        type: 'image',
        x: 65,
        y: 75,
        width: 25,
        height: 12,
        dataUrl,
        opacity: 1,
      };

      updateElementsByPage(prev => ({
        ...prev,
        [currentPage]: [...(prev[currentPage] || []), newEl],
      }));
      setSelectedElementId(newEl.id);
    };
    reader.readAsDataURL(file);
  };

  // Signature Pad Handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#1e3a8a';
    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const saveSignature = () => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');

    const newEl: PdfOverlayElement = {
      id: `sig_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      pageIndex: currentPage,
      type: 'image',
      x: 65,
      y: 78,
      width: 25,
      height: 10,
      dataUrl,
      opacity: 1,
    };

    updateElementsByPage(prev => ({
      ...prev,
      [currentPage]: [...(prev[currentPage] || []), newEl],
    }));
    setSelectedElementId(newEl.id);
    setIsSignatureModalOpen(false);
  };

  // High-DPI PDF Export matching exact native page sizes
  const handleExportPdf = async () => {
    if (!pdfDoc) return;
    setIsExporting(true);

    try {
      let pdfExport: jsPDF | null = null;

      for (let p = 1; p <= numPages; p++) {
        const page = await pdfDoc.getPage(p);
        const unscaledViewport = page.getViewport({ scale: 1.0 });
        const ptWidth = unscaledViewport.width;
        const ptHeight = unscaledViewport.height;
        const mmWidth = ptWidth * 0.352778;
        const mmHeight = ptHeight * 0.352778;
        const orientation = ptWidth > ptHeight ? 'landscape' : 'portrait';

        if (p === 1) {
          pdfExport = new jsPDF({
            orientation,
            unit: 'mm',
            format: [mmWidth, mmHeight],
          });
        } else if (pdfExport) {
          pdfExport.addPage([mmWidth, mmHeight], orientation);
        }

        const exportScale = 3.0;
        const viewport = page.getViewport({ scale: exportScale });

        const offscreenCanvas = document.createElement('canvas');
        offscreenCanvas.width = viewport.width;
        offscreenCanvas.height = viewport.height;
        const ctx = offscreenCanvas.getContext('2d');
        if (!ctx || !pdfExport) continue;

        // 1. Draw base PDF page
        await page.render({ canvasContext: ctx, viewport }).promise;

        // 2. Draw overlay elements on top of the base PDF
        const pageEls = elementsByPage[p] || [];
        for (const el of pageEls) {
          const elX = (el.x / 100) * offscreenCanvas.width;
          const elY = (el.y / 100) * offscreenCanvas.height;
          const elW = (el.width / 100) * offscreenCanvas.width;
          const elH = (el.height / 100) * offscreenCanvas.height;

          ctx.save();

          if (el.type === 'whiteout' || (el.type === 'text' && el.hasWhiteoutBg)) {
            ctx.fillStyle = el.fillColor || '#ffffff';
            ctx.fillRect(elX, elY, elW, elH);
          }

          if (el.type === 'text' && el.text) {
            const fontPx = ((el.fontSize || 14) / 72) * (exportScale * 72);
            ctx.font = `${el.bold ? 'bold ' : ''}${el.italic ? 'italic ' : ''}${fontPx}px ${el.fontFamily || 'Inter'}, sans-serif`;
            ctx.fillStyle = el.color || '#0f172a';
            ctx.textBaseline = 'middle';
            
            let textX = elX;
            if (el.align === 'center') textX = elX + (elW / 2);
            else if (el.align === 'right') textX = elX + elW;
            ctx.textAlign = el.align || 'left';

            ctx.fillText(el.text, textX, elY + (elH / 2));
          } else if (el.type === 'stamp' && el.text) {
            ctx.globalAlpha = el.opacity ?? 0.9;
            ctx.strokeStyle = el.stampColor || '#10b981';
            ctx.lineWidth = 4 * exportScale;
            ctx.strokeRect(elX, elY, elW, elH);

            const fontPx = ((el.height * 0.45) / 100) * offscreenCanvas.height;
            ctx.font = `bold ${fontPx}px sans-serif`;
            ctx.fillStyle = el.stampColor || '#10b981';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(el.text, elX + (elW / 2), elY + (elH / 2));
          } else if (el.type === 'image' && el.dataUrl) {
            ctx.globalAlpha = el.opacity ?? 1;
            const img = new Image();
            img.src = el.dataUrl;
            await new Promise((res) => { img.onload = res; });
            ctx.drawImage(img, elX, elY, elW, elH);
          }

          ctx.restore();
        }

        const pageImgData = offscreenCanvas.toDataURL('image/jpeg', 0.98);
        pdfExport.addImage(pageImgData, 'JPEG', 0, 0, mmWidth, mmHeight);
      }

      if (pdfExport) {
        const saveName = fileName ? `Edited_${fileName.replace(/\.pdf$/i, '')}.pdf` : 'Edited_Document.pdf';
        pdfExport.save(saveName);
      }
    } catch (err) {
      console.error('PDF Export Error:', err);
      alert('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  // Text Items for Current Page with Search & Filter
  const allPageItems = currentPageData?.textItems || [];

  const categoryCounts = {
    all: allPageItems.length,
    amount: allPageItems.filter(item => matchesCategory(item.str, 'amount')).length,
    date: allPageItems.filter(item => matchesCategory(item.str, 'date')).length,
    id: allPageItems.filter(item => matchesCategory(item.str, 'id')).length,
    name: allPageItems.filter(item => matchesCategory(item.str, 'name')).length,
  };

  const currentPageTextItems = allPageItems.filter(item => {
    if (filterCategory !== 'all' && !matchesCategory(item.str, filterCategory)) return false;
    if (searchQuery.trim() && !item.str.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Upload Dropzone View (When No PDF is Loaded) */}
      {!pdfDoc ? (
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-8 rounded-3xl text-white shadow-xl border border-slate-800 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10 max-w-3xl space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-bold shadow-2xs">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                <span>Direct PDF In-Place Document Editor</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                Directly Edit Any <span className="bg-gradient-to-r from-indigo-400 to-violet-300 bg-clip-text text-transparent">Uploaded PDF</span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium">
                Upload your payslip, certificate, contract, or document. Simply click directly on any text or number inside the PDF to edit and replace it inline, with 100% original visual layout preserved.
              </p>
            </div>
          </div>

          {/* Upload Dropzone Box */}
          <div className="bg-white p-8 sm:p-14 rounded-3xl border-2 border-dashed border-slate-300 hover:border-indigo-500 transition-all text-center space-y-6 shadow-xs">
            <div className="w-18 h-18 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center mx-auto shadow-lg shadow-indigo-100">
              <FileUp className="w-9 h-9" />
            </div>

            <div className="space-y-2 max-w-md mx-auto">
              <h3 className="text-xl font-extrabold text-slate-900">Upload PDF for Direct In-Place Editing</h3>
              <p className="text-xs sm:text-sm text-slate-500">
                Click any word, amount, date, or name directly inside the document to edit it in real-time.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <label className="px-6 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs sm:text-sm shadow-md shadow-indigo-600/20 transition-all cursor-pointer flex items-center gap-2 active:scale-95">
                <FileUp className="w-4 h-4" />
                <span>{isProcessing ? 'Loading Document...' : 'Browse & Upload PDF'}</span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
                  onChange={handleFileUpload}
                  disabled={isProcessing}
                  className="hidden"
                />
              </label>

              <button
                onClick={handleLoadSamplePdf}
                disabled={isProcessing}
                className="px-5 py-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs sm:text-sm transition-all flex items-center gap-2 border border-slate-200"
              >
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span>Try Sample Corporate Payslip PDF</span>
              </button>
            </div>

            {/* Feature Grid Badges */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-2xl mx-auto pt-6 text-left">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                  <MousePointerClick className="w-3.5 h-3.5 text-indigo-600" /> 1-Click Direct In-Place Edit
                </div>
                <div className="text-[11px] text-slate-500 mt-1">Hover and click any text inside the PDF to edit it immediately.</div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                  <Square className="w-3.5 h-3.5 text-emerald-600" /> Auto Masking & Whiteout
                </div>
                <div className="text-[11px] text-slate-500 mt-1">Automatically masks the original text behind your new edits.</div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                  <Stamp className="w-3.5 h-3.5 text-violet-600" /> Stamps & Signatures
                </div>
                <div className="text-[11px] text-slate-500 mt-1">Add official 'PAID' badges or draw signatures with your mouse.</div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        
        /* Interactive PDF Document Editor Studio */
        <div className="space-y-4">
          
          {/* Top Main Toolbar */}
          <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200/90 shadow-xs flex flex-wrap items-center justify-between gap-3">
            
            {/* File & Page Indicator */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold border border-indigo-100">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-extrabold text-slate-900 flex items-center gap-2 max-w-[200px] sm:max-w-xs truncate">
                  <span className="truncate">{fileName || 'Uploaded PDF'}</span>
                </div>
                <div className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1.5">
                  <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Direct Edit Active (Click any text on PDF)</span>
                </div>
              </div>
            </div>

            {/* Mode Switcher Tools */}
            <div className="flex items-center gap-1 p-1 bg-slate-100/90 rounded-xl border border-slate-200 text-xs font-bold">
              <button
                onClick={() => setActiveTool('direct_edit')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-all ${
                  activeTool === 'direct_edit'
                    ? 'bg-indigo-600 text-white shadow-xs font-extrabold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Click any text in the PDF to edit it directly"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Direct Edit</span>
              </button>

              <button
                onClick={() => setActiveTool('add_text')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                  activeTool === 'add_text'
                    ? 'bg-white text-indigo-600 shadow-xs font-extrabold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Click anywhere on PDF to add new text"
              >
                <Type className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Add Text</span>
              </button>

              <button
                onClick={() => setActiveTool('whiteout')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                  activeTool === 'whiteout'
                    ? 'bg-white text-indigo-600 shadow-xs font-extrabold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Click to place a whiteout mask"
              >
                <Square className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Whiteout</span>
              </button>

              <button
                onClick={() => setSidebarTab('stamps')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-slate-600 hover:text-slate-900 transition-all"
                title="Stamps and Signature"
              >
                <Stamp className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Stamps</span>
              </button>
            </div>

            {/* Actions: Undo/Redo, Zoom, Change PDF, Export */}
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
                <button
                  onClick={handleUndo}
                  disabled={historyIndex <= 0}
                  className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 disabled:opacity-40 disabled:hover:text-slate-600"
                  title="Undo (Ctrl+Z)"
                >
                  <Undo2 className="w-4 h-4" />
                </button>
                <button
                  onClick={handleRedo}
                  disabled={historyIndex >= history.length - 1}
                  className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 disabled:opacity-40 disabled:hover:text-slate-600"
                  title="Redo (Ctrl+Y)"
                >
                  <Redo2 className="w-4 h-4" />
                </button>
              </div>

              {/* Zoom Controls */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
                <button
                  onClick={() => setZoomScale(prev => Math.max(0.4, Number((prev - 0.15).toFixed(2))))}
                  className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setZoomScale(1.0)}
                  className="font-mono font-bold text-[11px] px-1 text-slate-700 min-w-[40px] text-center hover:bg-white rounded"
                  title="Reset Zoom to 100%"
                >
                  {Math.round(zoomScale * 100)}%
                </button>
                <button
                  onClick={() => setZoomScale(prev => Math.min(2.0, Number((prev + 0.15).toFixed(2))))}
                  className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900"
                  title="Zoom In"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
              </div>

              <button
                onClick={() => {
                  setPdfDoc(null);
                  setPdfBuffer(null);
                }}
                className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all border border-slate-200"
              >
                Change PDF
              </button>

              <button
                onClick={handleExportPdf}
                disabled={isExporting}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-md shadow-indigo-600/20 transition-all flex items-center gap-1.5 active:scale-95"
              >
                <Download className="w-4 h-4" />
                <span>{isExporting ? 'Exporting...' : 'Download PDF'}</span>
              </button>
            </div>

          </div>

          {/* Contextual Properties Bar (Always ready when any element is active) */}
          {selectedElement && (
            <div className="bg-indigo-50/95 p-2.5 sm:p-3 rounded-2xl border border-indigo-200 flex flex-wrap items-center justify-between gap-3 text-xs animate-fade-in shadow-xs">
              <div className="flex flex-wrap items-center gap-3">
                <span className="font-bold text-indigo-900 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Formatting:</span>
                </span>

                {selectedElement.type === 'text' && (
                  <>
                    {/* Font Family */}
                    <div className="w-32">
                      <CustomSelect
                        options={['Inter', 'Arial', 'Helvetica', 'Times New Roman', 'Courier Prime', 'Roboto', 'Outfit', 'Montserrat']}
                        value={selectedElement.fontFamily || 'Inter'}
                        onChange={(f) => updateSelectedElement({ fontFamily: f })}
                      />
                    </div>

                    {/* Font Size */}
                    <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-300">
                      <button
                        onClick={() => updateSelectedElement({ fontSize: Math.max(8, (selectedElement.fontSize || 14) - 1) })}
                        className="px-2 py-0.5 font-bold hover:bg-slate-100 rounded"
                      >
                        -
                      </button>
                      <span className="font-mono font-bold px-1 text-[11px]">{selectedElement.fontSize || 14}pt</span>
                      <button
                        onClick={() => updateSelectedElement({ fontSize: Math.min(60, (selectedElement.fontSize || 14) + 1) })}
                        className="px-2 py-0.5 font-bold hover:bg-slate-100 rounded"
                      >
                        +
                      </button>
                    </div>

                    {/* Text Styling Toggles */}
                    <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-300">
                      <button
                        onClick={() => updateSelectedElement({ bold: !selectedElement.bold })}
                        className={`p-1.5 rounded ${selectedElement.bold ? 'bg-indigo-100 text-indigo-700' : 'text-slate-600 hover:bg-slate-100'}`}
                        title="Bold"
                      >
                        <Bold className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => updateSelectedElement({ italic: !selectedElement.italic })}
                        className={`p-1.5 rounded ${selectedElement.italic ? 'bg-indigo-100 text-indigo-700' : 'text-slate-600 hover:bg-slate-100'}`}
                        title="Italic"
                      >
                        <Italic className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Text Color Picker */}
                    <div className="flex items-center gap-1.5 bg-white px-2 py-1 rounded-xl border border-slate-300">
                      <span className="text-[10px] text-slate-500 font-bold">Text:</span>
                      <input
                        type="color"
                        value={selectedElement.color || '#0f172a'}
                        onChange={(e) => updateSelectedElement({ color: e.target.value })}
                        className="w-4 h-4 rounded cursor-pointer border-0 p-0"
                      />
                      <span className="font-mono text-[10px] text-slate-600">{selectedElement.color || '#0f172a'}</span>
                    </div>

                    {/* Mask Original Background & Color Picker */}
                    <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-300">
                      <button
                        onClick={() => updateSelectedElement({ hasWhiteoutBg: !selectedElement.hasWhiteoutBg })}
                        className={`flex items-center gap-1 px-2 py-0.5 rounded-lg font-bold text-[10px] transition-all ${
                          selectedElement.hasWhiteoutBg
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                        title="Covers original PDF text behind this block"
                      >
                        <Square className="w-3 h-3" />
                        <span>Mask</span>
                      </button>

                      {selectedElement.hasWhiteoutBg && (
                        <div className="flex items-center gap-1 pl-1 border-l border-slate-200">
                          <input
                            type="color"
                            value={selectedElement.fillColor || '#ffffff'}
                            onChange={(e) => updateSelectedElement({ fillColor: e.target.value })}
                            className="w-4 h-4 rounded cursor-pointer border-0 p-0"
                            title="Mask background color"
                          />
                          <span className="font-mono text-[10px] text-slate-600">{selectedElement.fillColor || '#ffffff'}</span>
                        </div>
                      )}
                    </div>
                  </>
                )}

                {selectedElement.type === 'whiteout' && (
                  <div className="flex items-center gap-2 bg-white px-2 py-1 rounded-xl border border-slate-300">
                    <span className="font-semibold text-slate-700">Mask Color:</span>
                    <input
                      type="color"
                      value={selectedElement.fillColor || '#ffffff'}
                      onChange={(e) => updateSelectedElement({ fillColor: e.target.value })}
                      className="w-5 h-5 rounded cursor-pointer border-0 p-0"
                    />
                  </div>
                )}
              </div>

              {/* Delete Button */}
              <button
                onClick={() => handleDeleteElement(selectedElement.id)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 font-bold border border-rose-200 transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            </div>
          )}

          {/* Main 2-Column PDF Workbench */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Column: Smart Inspector & Tools Sidebar */}
            <div className="lg:col-span-4 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-5 max-h-[82vh] overflow-y-auto custom-scrollbar">
              
              {/* Sidebar Tabs */}
              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl text-xs font-bold">
                <button
                  onClick={() => setSidebarTab('smart_replace')}
                  className={`flex-1 py-1.5 px-2 rounded-lg text-center transition-all ${
                    sidebarTab === 'smart_replace'
                      ? 'bg-white text-indigo-600 shadow-xs font-extrabold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Quick Replace
                </button>
                <button
                  onClick={() => setSidebarTab('layers')}
                  className={`flex-1 py-1.5 px-2 rounded-lg text-center transition-all ${
                    sidebarTab === 'layers'
                      ? 'bg-white text-indigo-600 shadow-xs font-extrabold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Layers ({currentElements.length})
                </button>
                <button
                  onClick={() => setSidebarTab('stamps')}
                  className={`flex-1 py-1.5 px-2 rounded-lg text-center transition-all ${
                    sidebarTab === 'stamps'
                      ? 'bg-white text-indigo-600 shadow-xs font-extrabold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Stamps & Sign
                </button>
              </div>

              {/* Tab 1: Smart Replace (Auto-detected text in uploaded PDF) */}
              {sidebarTab === 'smart_replace' && (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Auto-Detected Fields (Page {currentPage})</span>
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Search or click any field from the uploaded PDF to update its text and mask the original.
                    </p>
                  </div>

                  {/* Search and Category Filters */}
                  <div className="space-y-2">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        placeholder="Search detected text in PDF..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      />
                    </div>

                    <div className="flex flex-wrap gap-1 text-[10px] font-bold">
                      {(['all', 'amount', 'date', 'id', 'name'] as const).map((cat) => (
                        <button
                          key={cat}
                          onClick={() => setFilterCategory(cat)}
                          className={`px-2.5 py-1 rounded-lg capitalize transition-all flex items-center gap-1 ${
                            filterCategory === cat
                              ? 'bg-indigo-600 text-white shadow-xs'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          <span>{cat === 'all' ? 'All Items' : (cat === 'id' ? 'IDs & Codes' : (cat === 'amount' ? 'Amounts ($)' : cat))}</span>
                          <span className={`text-[9px] px-1 py-0.2 rounded font-mono ${
                            filterCategory === cat ? 'bg-indigo-700 text-white' : 'bg-slate-200 text-slate-700'
                          }`}>
                            {categoryCounts[cat]}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Detected Items List */}
                  <div className="space-y-2 max-h-[50vh] overflow-y-auto custom-scrollbar pr-1">
                    {currentPageTextItems.length === 0 ? (
                      <div className="p-6 text-center text-xs text-slate-400 border border-dashed rounded-xl">
                        No matching text items found on this page.
                      </div>
                    ) : (
                      currentPageTextItems.map((item) => {
                        const matchingOverlay = currentElements.find(el => el.originalTextId === item.id);
                        return (
                          <div
                            key={item.id}
                            onMouseEnter={() => setHoveredTextItem(item)}
                            onMouseLeave={() => setHoveredTextItem(null)}
                            className={`p-2.5 rounded-xl border transition-all text-xs space-y-1.5 ${
                              matchingOverlay
                                ? 'bg-indigo-50/70 border-indigo-200'
                                : 'bg-slate-50 hover:bg-white border-slate-200 hover:border-indigo-300'
                            }`}
                          >
                            <div className="flex items-center justify-between text-[10px]">
                              <span className={`px-1.5 py-0.5 rounded font-bold uppercase ${
                                item.category === 'amount' ? 'bg-emerald-100 text-emerald-800' :
                                item.category === 'date' ? 'bg-amber-100 text-amber-800' :
                                item.category === 'id' ? 'bg-purple-100 text-purple-800' :
                                'bg-slate-200 text-slate-700'
                              }`}>
                                {item.category}
                              </span>
                              <span className="text-slate-400 font-mono">
                                pos: {Math.round(item.x)}%, {Math.round(item.y)}%
                              </span>
                            </div>

                            <div className="font-semibold text-slate-900 line-clamp-1 font-mono text-[11px]">
                              {item.str}
                            </div>

                            {matchingOverlay ? (
                              <div className="space-y-1 pt-1 border-t border-indigo-100">
                                <label className="text-[10px] text-indigo-700 font-bold">Replacement Text:</label>
                                <input
                                  type="text"
                                  value={matchingOverlay.text || ''}
                                  onChange={(e) => {
                                    updateElementsByPage(prev => {
                                      const pageEls = prev[currentPage] || [];
                                      const updated = pageEls.map(el => el.id === matchingOverlay.id ? { ...el, text: e.target.value } : el);
                                      return { ...prev, [currentPage]: updated };
                                    });
                                  }}
                                  className="w-full p-1.5 text-xs rounded-lg border border-indigo-300 bg-white font-bold text-slate-900 focus:outline-none"
                                />
                              </div>
                            ) : (
                              <button
                                onClick={() => handleEditDetectedText(item)}
                                className="w-full py-1 rounded-lg bg-white hover:bg-indigo-600 hover:text-white text-indigo-600 font-bold text-[11px] border border-slate-200 hover:border-indigo-600 transition-all flex items-center justify-center gap-1"
                              >
                                <Edit3 className="w-3 h-3" />
                                <span>Edit This Text</span>
                              </button>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

              {/* Tab 2: Layers Manager */}
              {sidebarTab === 'layers' && (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Page Elements ({currentElements.length})</span>
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Manage all overlays, text modifications, and whiteout boxes.
                    </p>
                  </div>

                  {currentElements.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400 border border-dashed rounded-xl">
                      No edits or overlays placed on page {currentPage} yet.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[55vh] overflow-y-auto custom-scrollbar">
                      {currentElements.map((el, idx) => (
                        <div
                          key={el.id}
                          onClick={() => setSelectedElementId(el.id)}
                          className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 text-xs transition-all cursor-pointer ${
                            selectedElementId === el.id
                              ? 'bg-indigo-50 border-indigo-300 ring-2 ring-indigo-500/10'
                              : 'bg-slate-50 hover:bg-white border-slate-200'
                          }`}
                        >
                          <div className="flex items-center gap-2 overflow-hidden">
                            <span className="text-[10px] font-mono text-slate-400">#{idx + 1}</span>
                            <span className="font-bold text-slate-800 capitalize truncate">
                              {el.type === 'text' ? (el.text || 'Text Box') : el.type}
                            </span>
                          </div>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteElement(el.id);
                            }}
                            className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Tab 3: Stamps & Signatures */}
              {sidebarTab === 'stamps' && (
                <div className="space-y-4 text-xs">
                  <div className="space-y-1">
                    <h3 className="font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <Stamp className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Official Stamps & Badges</span>
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Click to place an official status stamp on the document.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleAddPresetStamp('PAID', '#10b981')}
                      className="p-2.5 rounded-xl border-2 border-emerald-500 bg-emerald-50 text-emerald-700 font-extrabold text-center hover:scale-105 transition-all shadow-xs"
                    >
                      PAID
                    </button>
                    <button
                      onClick={() => handleAddPresetStamp('APPROVED', '#2563eb')}
                      className="p-2.5 rounded-xl border-2 border-blue-500 bg-blue-50 text-blue-700 font-extrabold text-center hover:scale-105 transition-all shadow-xs"
                    >
                      APPROVED
                    </button>
                    <button
                      onClick={() => handleAddPresetStamp('VERIFIED', '#7c3aed')}
                      className="p-2.5 rounded-xl border-2 border-purple-500 bg-purple-50 text-purple-700 font-extrabold text-center hover:scale-105 transition-all shadow-xs"
                    >
                      VERIFIED
                    </button>
                    <button
                      onClick={() => handleAddPresetStamp('CONFIDENTIAL', '#e11d48')}
                      className="p-2.5 rounded-xl border-2 border-rose-500 bg-rose-50 text-rose-700 font-extrabold text-center hover:scale-105 transition-all shadow-xs"
                    >
                      CONFIDENTIAL
                    </button>
                  </div>

                  <div className="space-y-2 pt-3 border-t border-slate-100">
                    <h4 className="font-bold text-slate-900">Custom Signature</h4>
                    <button
                      onClick={() => {
                        setIsSignatureModalOpen(true);
                        setTimeout(clearSignature, 50);
                      }}
                      className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 font-bold border border-slate-200 transition-all flex items-center justify-center gap-2"
                    >
                      <PenTool className="w-4 h-4 text-indigo-600" />
                      <span>Draw Hand-Drawn Signature</span>
                    </button>

                    <label className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold border border-slate-200 transition-all flex items-center justify-center gap-2 cursor-pointer">
                      <ImageIcon className="w-4 h-4 text-slate-600" />
                      <span>Upload Logo / Stamp Image</span>
                      <input
                        ref={stampImageInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleStampImageUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              )}

            </div>

            {/* Right Column: Interactive PDF Canvas Workbench */}
            <div 
              ref={workbenchRef}
              className="lg:col-span-8 bg-slate-100/90 p-4 sm:p-8 rounded-2xl border border-slate-300/80 flex flex-col items-center justify-start overflow-auto custom-scrollbar min-h-[75vh]"
            >
              
              {/* Pagination Bar */}
              {numPages > 1 && (
                <div className="bg-white px-4 py-2 rounded-xl shadow-md border border-slate-200 flex items-center gap-3 mb-4 text-xs font-bold z-10 sticky top-0">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage <= 1}
                    className="p-1 rounded-lg text-slate-600 hover:bg-slate-100 disabled:opacity-40"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span>Page {currentPage} of {numPages}</span>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(numPages, prev + 1))}
                    disabled={currentPage >= numPages}
                    className="p-1 rounded-lg text-slate-600 hover:bg-slate-100 disabled:opacity-40"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* PDF Document Container with EXACT Dynamic Aspect Ratio */}
              <div
                ref={containerRef}
                onClick={handleCanvasClick}
                className="relative bg-white shadow-2xl rounded-xs overflow-hidden select-none border border-slate-300 transition-all cursor-text shrink-0"
                style={{
                  width: `${displayWidth}px`,
                  height: `${displayHeight}px`,
                  maxWidth: '100%',
                }}
              >
                {/* 1. Underlying High-Res Rendered PDF Canvas */}
                <canvas ref={canvasRef} className="block w-full h-full pointer-events-none" />

                {/* 2. Direct In-Place Interactive PDF Text Layer (ALWAYS ACTIVE) */}
                {(currentPageData?.textItems || []).map((item) => {
                  const isHovered = hoveredTextItem?.id === item.id;
                  const isExisting = currentElements.some(el => el.originalTextId === item.id);
                  if (isExisting) return null;

                  return (
                    <div
                      key={item.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditDetectedText(item);
                      }}
                      onMouseEnter={() => setHoveredTextItem(item)}
                      onMouseLeave={() => setHoveredTextItem(null)}
                      className={`absolute rounded-xs transition-all cursor-pointer ${
                        isHovered
                          ? 'bg-indigo-500/25 ring-2 ring-indigo-500 border border-indigo-600 z-20 shadow-xs'
                          : 'hover:bg-indigo-50/20 hover:border hover:border-indigo-400/50'
                      }`}
                      style={{
                        left: `${item.x}%`,
                        top: `${item.y}%`,
                        width: `${item.width}%`,
                        height: `${item.height}%`,
                      }}
                      title={`Click directly to edit "${item.str}"`}
                    >
                      {isHovered && (
                        <span className="absolute -top-5 left-0 bg-indigo-600 text-white text-[9px] font-bold px-1.5 py-0.2 rounded shadow-xs pointer-events-none whitespace-nowrap z-30">
                          Click to edit
                        </span>
                      )}
                    </div>
                  );
                })}

                {/* 3. Interactive Active Overlay Edits, Whiteouts, Replacement Text, Stamps */}
                {currentElements.map((el) => {
                  const isSelected = selectedElementId === el.id;

                  return (
                    <div
                      key={el.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedElementId(el.id);
                      }}
                      className={`absolute group transition-shadow ${
                        isSelected
                          ? 'ring-2 ring-indigo-600 shadow-md z-30'
                          : 'hover:ring-1 hover:ring-indigo-400 z-10'
                      }`}
                      style={{
                        left: `${el.x}%`,
                        top: `${el.y}%`,
                        width: `${el.width}%`,
                        height: `${el.height}%`,
                        backgroundColor: el.type === 'whiteout' ? (el.fillColor || '#ffffff') : (el.hasWhiteoutBg ? (el.fillColor || '#ffffff') : 'transparent'),
                      }}
                    >
                      {/* Direct Inline Text Input */}
                      {el.type === 'text' && (
                        <div
                          className="w-full h-full flex items-center px-0.5"
                          style={{
                            justifyContent: el.align === 'center' ? 'center' : (el.align === 'right' ? 'flex-end' : 'flex-start'),
                          }}
                        >
                          <input
                            ref={isSelected ? activeInputRef : undefined}
                            type="text"
                            value={el.text || ''}
                            onChange={(e) => {
                              const newText = e.target.value;
                              updateElementsByPage(prev => {
                                const pageEls = prev[currentPage] || [];
                                const updated = pageEls.map(item => item.id === el.id ? { ...item, text: newText } : item);
                                return { ...prev, [currentPage]: updated };
                              });
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === 'Escape') {
                                (e.target as HTMLInputElement).blur();
                              }
                            }}
                            className="w-full h-full bg-transparent border-0 outline-none p-0 focus:ring-0"
                            style={{
                              fontSize: `${Math.max(8, ((el.fontSize || 14) * (displayWidth / (nativeWidth || 600))))}px`,
                              fontFamily: el.fontFamily || 'Inter',
                              color: el.color || '#0f172a',
                              fontWeight: el.bold ? 'bold' : 'normal',
                              fontStyle: el.italic ? 'italic' : 'normal',
                              textAlign: el.align || 'left',
                            }}
                          />
                        </div>
                      )}

                      {/* Stamp Element Render */}
                      {el.type === 'stamp' && (
                        <div
                          className="w-full h-full flex items-center justify-center border-2 font-extrabold uppercase select-none"
                          style={{
                            borderColor: el.stampColor || '#10b981',
                            color: el.stampColor || '#10b981',
                            fontSize: `${Math.max(10, 14 * (displayWidth / 650))}px`,
                            opacity: el.opacity ?? 0.9,
                          }}
                        >
                          {el.text}
                        </div>
                      )}

                      {/* Image / Signature Element Render */}
                      {el.type === 'image' && el.dataUrl && (
                        <img
                          src={el.dataUrl}
                          alt="Stamp / Signature"
                          className="w-full h-full object-contain pointer-events-none"
                          style={{ opacity: el.opacity ?? 1 }}
                        />
                      )}

                      {/* Move Drag Handle when Selected */}
                      {isSelected && (
                        <>
                          <div
                            onMouseDown={(e) => startDragElement(e, el)}
                            className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-indigo-600 text-white rounded-md px-1.5 py-0.5 text-[9px] font-bold shadow-md cursor-grab active:cursor-grabbing flex items-center gap-1 z-40"
                          >
                            <Move className="w-2.5 h-2.5" />
                            <span>Drag</span>
                          </div>

                          <div className="absolute -top-3.5 -right-3.5 flex items-center gap-1 z-40 bg-white rounded-full shadow-md border border-slate-200 p-0.5">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteElement(el.id);
                              }}
                              className="w-5 h-5 rounded-full bg-rose-500 text-white flex items-center justify-center text-[10px] hover:bg-rose-600 font-bold"
                              title="Delete"
                            >
                              ✕
                            </button>
                          </div>

                          {/* Bottom-Right Resize Handle */}
                          <div
                            onMouseDown={(e) => startResizeElement(e, el)}
                            className="absolute -bottom-1.5 -right-1.5 w-3.5 h-3.5 bg-indigo-600 rounded-full border-2 border-white shadow-md cursor-nwse-resize z-40"
                            title="Resize"
                          />
                        </>
                      )}
                    </div>
                  );
                })}

              </div>

            </div>

          </div>

        </div>
      )}

      {/* Hand-Drawn Signature Modal */}
      {isSignatureModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-scale-up">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                <PenTool className="w-4 h-4 text-indigo-600" />
                <span>Draw Your Signature</span>
              </h3>
              <button
                onClick={() => setIsSignatureModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Sign below using your mouse or touch stylus. We will place it directly on the document.
            </p>

            <div className="border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 p-1 flex items-center justify-center">
              <canvas
                ref={signatureCanvasRef}
                width={440}
                height={160}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                className="bg-white rounded-lg cursor-crosshair touch-none w-full"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={clearSignature}
                className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
              >
                Clear
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsSignatureModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  onClick={saveSignature}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-md"
                >
                  Insert Signature
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};