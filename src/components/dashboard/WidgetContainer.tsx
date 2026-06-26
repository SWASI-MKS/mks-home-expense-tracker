import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card } from '@/components/common/Card';
import { GripHorizontal, ChevronUp, ChevronDown, EyeOff } from 'lucide-react';
import { useDashboardStore, WidgetState } from '@/stores/useDashboardStore';
import { cn } from '@/utils/cn';

interface WidgetContainerProps {
  widget: WidgetState;
  children: React.ReactNode;
}

export function WidgetContainer({ widget, children }: WidgetContainerProps) {
  const { toggleWidgetCollapse, toggleWidgetVisibility } = useDashboardStore();
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: widget.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  if (!widget.visible) return null;

  return (
    <Card 
      ref={setNodeRef} 
      style={style} 
      className={cn(
        "bg-card border border-border shadow-sm flex flex-col",
        isDragging && "opacity-50 z-50 ring-2 ring-primary ring-offset-2 ring-offset-background"
      )}
    >
      <div className="flex items-center justify-between p-3 border-b border-border bg-muted/50">
        <div className="flex items-center gap-2">
          <div 
            {...attributes} 
            {...listeners}
            className="cursor-grab hover:bg-accent hover:text-accent-foreground p-1.5 rounded transition-colors"
          >
            <GripHorizontal className="w-4 h-4 text-muted-foreground" />
          </div>
          <h3 className="font-semibold text-sm">{widget.title}</h3>
        </div>
        <div className="flex items-center gap-1">
          <button 
            onClick={() => toggleWidgetCollapse(widget.id, !widget.collapsed)}
            className="p-1.5 text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors rounded"
            title={widget.collapsed ? "Expand" : "Collapse"}
          >
            {widget.collapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
          <button 
            onClick={() => toggleWidgetVisibility(widget.id, false)}
            className="p-1.5 text-muted-foreground hover:bg-destructive hover:text-destructive-foreground transition-colors rounded"
            title="Hide Widget"
          >
            <EyeOff className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      {!widget.collapsed && (
        <div className="p-4 flex-1 animate-in slide-in-from-top-2 duration-300">
          {children}
        </div>
      )}
    </Card>
  );
}
