import { DateFilterType } from '../hooks/useReportsData';
import { Button } from '@/components/common/Button';

interface ReportFiltersProps {
  filterType: DateFilterType;
  setFilterType: (type: DateFilterType) => void;
}

export function ReportFilters({ filterType, setFilterType }: ReportFiltersProps) {
  const presetFilters: { value: DateFilterType; label: string }[] = [
    { value: 'today', label: 'Today' },
    { value: 'yesterday', label: 'Yesterday' },
    { value: 'this_week', label: 'This Week' },
    { value: 'last_week', label: 'Last Week' },
    { value: 'this_month', label: 'This Month' },
    { value: 'last_month', label: 'Last Month' },
    { value: 'this_year', label: 'This Year' },
    { value: 'last_year', label: 'Last Year' },
  ];

  return (
    <div className="flex flex-wrap gap-2 mb-6">
      {presetFilters.map((preset) => (
        <Button
          key={preset.value}
          variant={filterType === preset.value ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilterType(preset.value)}
        >
          {preset.label}
        </Button>
      ))}
      <Button 
        variant={filterType === 'custom' ? 'default' : 'outline'} 
        size="sm"
        onClick={() => setFilterType('custom')}
      >
        Custom Range
      </Button>
    </div>
  );
}
