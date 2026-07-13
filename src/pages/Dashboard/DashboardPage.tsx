import { useDashboardStore, WidgetState, DateFilterType } from '@/stores/useDashboardStore';
import { 
  DndContext, closestCenter, KeyboardSensor, PointerSensor, 
  useSensor, useSensors, DragEndEvent 
} from '@dnd-kit/core';
import { 
  arrayMove, SortableContext, sortableKeyboardCoordinates, 
  rectSortingStrategy 
} from '@dnd-kit/sortable';
import { WidgetContainer } from '@/components/dashboard/WidgetContainer';
import { 
  SummaryCardsWidget, IncomeExpenseChartWidget, CashFlowChartWidget,
  CategoryBreakdownWidget, BudgetUsageWidget, AccountDistributionWidget, InsightsWidget,
  UpcomingRemindersWidget
} from '@/components/dashboard/DashboardWidgets';
import { Button } from '@/components/common/Button';
import { Eye, Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/utils/cn';

export function DashboardPage() {
  const { 
    widgets, reorderWidgets, dateFilter, setDateFilter, resetWidgets 
  } = useDashboardStore();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = widgets.findIndex((w) => w.id === active.id);
      const newIndex = widgets.findIndex((w) => w.id === over.id);
      reorderWidgets(arrayMove(widgets, oldIndex, newIndex));
    }
  };

  const hiddenCount = widgets.filter(w => !w.visible).length;

  const renderWidget = (widget: WidgetState) => {
    switch (widget.type) {
      case 'summary': return <SummaryCardsWidget />;
      case 'income_expense': return <IncomeExpenseChartWidget />;
      case 'cash_flow': return <CashFlowChartWidget />;
      case 'categories': return <CategoryBreakdownWidget />;
      case 'accounts': return <AccountDistributionWidget />;
      case 'budgets': return <BudgetUsageWidget />;
      case 'insights': return <InsightsWidget />;
      case 'upcoming_reminders': return <UpcomingRemindersWidget />;
      default: return null;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-card p-4 rounded-xl border border-border shadow-sm">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Your financial overview</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {hiddenCount > 0 && (
            <Button variant="outline" size="sm" onClick={resetWidgets} className="whitespace-nowrap">
              <Eye className="w-4 h-4 mr-2" /> Restore {hiddenCount} Hidden
            </Button>
          )}
          
          <div className="flex items-center gap-2 bg-muted p-1.5 rounded-lg w-full md:w-auto">
            <CalendarIcon className="w-4 h-4 text-muted-foreground ml-2" />
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as DateFilterType)}
              className="bg-transparent border-none text-sm font-medium focus:ring-0 cursor-pointer w-full"
            >
              <option value="last_month">Last Month</option>
              <option value="last_year">Last Year</option>
              <option value="month">This Month</option>
              <option value="week">This Week</option>
              <option value="year">This Year</option>
              <option value="today">Today</option>
            </select>
          </div>
        </div>
      </div>

      {/* Widgets Grid */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={widgets.map(w => w.id)} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {widgets.map((widget) => {
              // The summary widget should probably span full width on large screens
              const isFullWidth = widget.type === 'summary' || widget.type === 'cash_flow';
              return (
                <div key={widget.id} className={cn(isFullWidth ? "xl:col-span-2" : "")}>
                  <WidgetContainer widget={widget}>
                    {renderWidget(widget)}
                  </WidgetContainer>
                </div>
              );
            })}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
