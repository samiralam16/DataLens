import { useState, useRef, useCallback, useEffect } from 'react';
import { Settings, Trash2, Move } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { ChartConfig } from '../WebBuilder';
import { ChartRenderer } from './ChartRenderer';
import { ChartConfigPanel } from './ChartConfigPanel';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger 
} from '../ui/sheet';

interface ResizableChartProps {
  chart: ChartConfig;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<ChartConfig>, mode?: 'preview' | 'apply' | 'cancel') => void;
  onDelete: () => void;
  isGridMode: boolean;
}

type ResizeDirection = 'se' | 'e' | 'w' | 's' | 'n' | 'nw' | 'ne' | 'sw';

export function ResizableChart({ 
  chart, 
  isSelected, 
  onSelect, 
  onUpdate, 
  onDelete,
  isGridMode 
}: ResizableChartProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeDirection, setResizeDirection] = useState<ResizeDirection>('se');
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ 
    width: 0, 
    height: 0, 
    x: 0, 
    y: 0, 
    mouseX: 0, 
    mouseY: 0 
  });
  const chartRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (isGridMode) return;
    
    e.preventDefault();
    e.stopPropagation();
    onSelect();
    
    const rect = chartRef.current?.getBoundingClientRect();
    if (rect) {
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
      setIsDragging(true);
    }
  }, [isGridMode, onSelect]);

  const handleResizeMouseDown = useCallback((e: React.MouseEvent, direction: ResizeDirection) => {
    if (isGridMode) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    setResizeStart({
      width: chart.size.width,
      height: chart.size.height,
      x: chart.position.x,
      y: chart.position.y,
      mouseX: e.clientX,
      mouseY: e.clientY
    });
    setResizeDirection(direction);
    setIsResizing(true);
  }, [isGridMode, chart.size, chart.position]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging && !isGridMode) {
      const container = chartRef.current?.parentElement;
      if (container) {
        const containerRect = container.getBoundingClientRect();
        const newX = Math.max(0, e.clientX - containerRect.left - dragOffset.x);
        const newY = Math.max(0, e.clientY - containerRect.top - dragOffset.y);
        
        onUpdate({ position: { x: newX, y: newY } }, 'preview');
      }
    } else if (isResizing && !isGridMode) {
      const deltaX = e.clientX - resizeStart.mouseX;
      const deltaY = e.clientY - resizeStart.mouseY;
      
      let newWidth = resizeStart.width;
      let newHeight = resizeStart.height;
      let newX = resizeStart.x;
      let newY = resizeStart.y;

      switch (resizeDirection) {
        case 'e':
          newWidth = Math.max(200, resizeStart.width + deltaX);
          break;
        case 'w':
          newWidth = Math.max(200, resizeStart.width - deltaX);
          newX = Math.max(0, resizeStart.x + deltaX);
          if (newWidth === 200) newX = resizeStart.x + resizeStart.width - 200;
          break;
        case 's':
          newHeight = Math.max(150, resizeStart.height + deltaY);
          break;
        case 'n':
          newHeight = Math.max(150, resizeStart.height - deltaY);
          newY = Math.max(0, resizeStart.y + deltaY);
          if (newHeight === 150) newY = resizeStart.y + resizeStart.height - 150;
          break;
        case 'se':
          newWidth = Math.max(200, resizeStart.width + deltaX);
          newHeight = Math.max(150, resizeStart.height + deltaY);
          break;
        case 'sw':
          newWidth = Math.max(200, resizeStart.width - deltaX);
          newHeight = Math.max(150, resizeStart.height + deltaY);
          newX = Math.max(0, resizeStart.x + deltaX);
          if (newWidth === 200) newX = resizeStart.x + resizeStart.width - 200;
          break;
        case 'ne':
          newWidth = Math.max(200, resizeStart.width + deltaX);
          newHeight = Math.max(150, resizeStart.height - deltaY);
          newY = Math.max(0, resizeStart.y + deltaY);
          if (newHeight === 150) newY = resizeStart.y + resizeStart.height - 150;
          break;
        case 'nw':
          newWidth = Math.max(200, resizeStart.width - deltaX);
          newHeight = Math.max(150, resizeStart.height - deltaY);
          newX = Math.max(0, resizeStart.x + deltaX);
          newY = Math.max(0, resizeStart.y + deltaY);
          if (newWidth === 200) newX = resizeStart.x + resizeStart.width - 200;
          if (newHeight === 150) newY = resizeStart.y + resizeStart.height - 150;
          break;
      }
      
      onUpdate(
        { size: { width: newWidth, height: newHeight }, position: { x: newX, y: newY } },
        'preview'
      );
    }
  }, [isDragging, isResizing, isGridMode, dragOffset, resizeStart, resizeDirection, onUpdate]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
  }, []);

  useEffect(() => {
    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, isResizing, handleMouseMove, handleMouseUp]);

  const ResizeHandle = ({ direction, className, cursor }: { 
    direction: ResizeDirection; 
    className: string; 
    cursor: string;
  }) => (
    <div
      className={`absolute bg-primary opacity-0 hover:opacity-100 transition-opacity ${className}`}
      style={{ cursor }}
      onMouseDown={(e) => handleResizeMouseDown(e, direction)}
      onClick={(e) => e.stopPropagation()}
    />
  );

  // ✅ Helper to properly forward ChartConfigPanel events
  const handleConfigUpdate = (mode: 'preview' | 'apply' | 'cancel', updates: Partial<ChartConfig>) => {
    if (mode === 'apply') {
      onUpdate(updates, 'apply');
    } else if (mode === 'cancel') {
      onUpdate({}, 'cancel');
    } else {
      onUpdate(updates, 'preview');
    }
  };

  if (isGridMode) {
    return (
      <Card
        className={`cursor-pointer transition-all hover:shadow-lg ${
          isSelected ? 'ring-2 ring-primary' : ''
        }`}
        onClick={onSelect}
      >
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">{chart.title}</CardTitle>
            <div className="flex items-center gap-1">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <Settings className="h-4 w-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[420px] sm:w-[480px] p-0 flex flex-col">
                  <SheetHeader className="p-4">
                    <SheetTitle>Chart Configuration</SheetTitle>
                  </SheetHeader>
                  <div className="flex-1 overflow-hidden">
                    <ChartConfigPanel chart={chart} onUpdateChart={handleConfigUpdate} />
                  </div>
                </SheetContent>
              </Sheet>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ChartRenderer chart={chart} height={256} />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      ref={chartRef}
      className={`absolute cursor-move transition-all hover:shadow-lg ${
        isSelected ? 'ring-2 ring-primary' : ''
      } ${isDragging ? 'z-50' : ''}`}
      style={{
        left: chart.position.x,
        top: chart.position.y,
        width: chart.size.width,
        height: chart.size.height
      }}
      onMouseDown={handleMouseDown}
      onClick={onSelect}
    >
      <CardHeader className="pb-2 cursor-move">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Move className="h-3 w-3 text-muted-foreground" />
            {chart.title}
          </CardTitle>
          <div className="flex items-center gap-1">
            <Sheet>
              <SheetTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Settings className="h-3 w-3" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[420px] sm:w-[480px] p-0 flex flex-col">
                <SheetHeader className="p-4">
                  <SheetTitle>Chart Configuration</SheetTitle>
                </SheetHeader>
                <div className="flex-1 overflow-hidden">
                  <ChartConfigPanel chart={chart} onUpdateChart={handleConfigUpdate} />
                </div>
              </SheetContent>
            </Sheet>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0 h-full pb-6">
        <div style={{ height: chart.size.height - 80 }}>
          <ChartRenderer chart={chart} height={chart.size.height - 80} />
        </div>
      </CardContent>
      
      {isSelected && !isGridMode && (
        <>
          <ResizeHandle direction="se" className="bottom-0 right-0 w-3 h-3 rounded-tl-md" cursor="se-resize" />
          <ResizeHandle direction="sw" className="bottom-0 left-0 w-3 h-3 rounded-tr-md" cursor="sw-resize" />
          <ResizeHandle direction="ne" className="top-0 right-0 w-3 h-3 rounded-bl-md" cursor="ne-resize" />
          <ResizeHandle direction="nw" className="top-0 left-0 w-3 h-3 rounded-br-md" cursor="nw-resize" />
          <ResizeHandle direction="e" className="top-1/2 right-0 w-2 h-8 -translate-y-1/2 rounded-l-md" cursor="e-resize" />
          <ResizeHandle direction="w" className="top-1/2 left-0 w-2 h-8 -translate-y-1/2 rounded-r-md" cursor="w-resize" />
          <ResizeHandle direction="s" className="bottom-0 left-1/2 h-2 w-8 -translate-x-1/2 rounded-t-md" cursor="s-resize" />
          <ResizeHandle direction="n" className="top-0 left-1/2 h-2 w-8 -translate-x-1/2 rounded-b-md" cursor="n-resize" />
        </>
      )}
      
      {isSelected && !isGridMode && (
        <div className="absolute inset-0 border-2 border-primary rounded-lg pointer-events-none opacity-30" />
      )}
    </Card>
  );
}
