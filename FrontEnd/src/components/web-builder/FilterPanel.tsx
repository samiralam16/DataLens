import { useState } from 'react';
import { Plus, Trash2, Filter as FilterIcon } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Slider } from '../ui/slider';
import { Checkbox } from '../ui/checkbox';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Calendar } from '../ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Badge } from '../ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from '../ui/dialog';
import { format } from 'date-fns';
import { useData } from '../DataContext';
import { FilterConfig } from '../WebBuilder';
import { useEffect } from 'react';

type FilterPanelProps = {
  filters: FilterConfig[];
  onAddFilter: (filter: Omit<FilterConfig, 'id'>) => void;
  onUpdateFilter: (filterId: string, updates: Partial<FilterConfig>) => void;
  onDeleteFilter: (filterId: string) => void;
};

export function FilterPanel({
  filters,
  onAddFilter,
  onUpdateFilter,
  onDeleteFilter,
}: FilterPanelProps) {
  const [isAddingFilter, setIsAddingFilter] = useState(false);
  const [newFilter, setNewFilter] = useState<Omit<FilterConfig, 'id'>>({
    type: 'select',
    label: '',
    column: '',
    value: null,
  });

 const { dataSources, activeDatasetId, setFilters } = useData();
  const activeDataset = dataSources.find((ds) => ds.id === activeDatasetId);
  const availableColumns = activeDataset?.columns || [];

  // ---------- Default value generator ----------
  const getDefaultValue = (type: FilterConfig['type'], column: any) => {
    switch (type) {
      case 'select':
        return column?.values?.[0] || '';
      case 'checkbox':
        return column?.values || [];
      case 'radio':
        return column?.values?.[0] || '';
      case 'slider': {
        const numericValues = (column?.values || []).filter((v: any) => typeof v === 'number');
        const min =
          column?.range?.min ?? (numericValues.length ? Math.min(...numericValues) : 0);
        const max =
          column?.range?.max ?? (numericValues.length ? Math.max(...numericValues) : 100);
        return { min, max };
      }
      case 'date':
        return { start: null, end: null };
      default:
        return null;
    }
  };

  // ---------- Add new filter ----------
  const handleAddFilter = () => {
    if (!newFilter.label || !newFilter.column) return;

    const column = availableColumns.find((col) => col.name === newFilter.column);
    const filterConfig: Omit<FilterConfig, 'id'> = {
      ...newFilter,
      options: column?.values || [],
      range: column?.range || undefined,
      value: getDefaultValue(newFilter.type, column),
    };

    onAddFilter(filterConfig);
    setNewFilter({ type: 'select', label: '', column: '', value: null });
    setIsAddingFilter(false);
  };

  // ---------- Render control ----------
  const renderFilterControl = (filter: FilterConfig) => {
    switch (filter.type) {
      // Dropdown
      case 'select':
        return (
          <Select
            value={filter.value ?? undefined}
            onValueChange={(value) => onUpdateFilter(filter.id, { value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select value" />
            </SelectTrigger>
            <SelectContent>
              {Array.isArray(filter.options) && filter.options.length > 0 ? (
                filter.options.map((opt: any) => (
                  <SelectItem key={String(opt)} value={String(opt)}>
                    {String(opt)}
                  </SelectItem>
                ))
              ) : (
                <SelectItem disabled value="">
                  No options available
                </SelectItem>
              )}
            </SelectContent>
          </Select>
        );

      // Checkbox group
      case 'checkbox':
        return (
          <div className="space-y-2">
            {Array.isArray(filter.options) && filter.options.length > 0 ? (
              filter.options.map((opt: any) => {
                const checked =
                  Array.isArray(filter.value) && filter.value.includes(opt);
                return (
                  <div key={opt} className="flex items-center space-x-2">
                    <Checkbox
                      id={`${filter.id}-${opt}`}
                      checked={checked}
                      onCheckedChange={(c) => {
                        const current: any[] = Array.isArray(filter.value)
                          ? filter.value
                          : [];
                        const next = c
                          ? [...current, opt]
                          : current.filter((v) => v !== opt);
                        onUpdateFilter(filter.id, { value: next });
                      }}
                    />
                    <Label htmlFor={`${filter.id}-${opt}`} className="text-sm capitalize">
                      {String(opt)}
                    </Label>
                  </div>
                );
              })
            ) : (
              <div className="text-xs text-muted-foreground">No options available</div>
            )}
          </div>
        );

      // Radio group
      case 'radio':
  return (
    <RadioGroup
      value={filter.value ? String(filter.value) : ''}
      onValueChange={(val) => onUpdateFilter(filter.id, { value: val })}
      className="space-y-2"
    >
      {Array.isArray(filter.options) && filter.options.length > 0 ? (
        filter.options.map((opt: any) => {
          const optionValue = String(opt);
          return (
            <div key={optionValue} className="flex items-center space-x-2">
              <RadioGroupItem
                value={optionValue}
                id={`${filter.id}-${optionValue}`}
                className="border-2 border-muted-foreground text-primary 
                           data-[state=checked]:border-primary data-[state=checked]:bg-primary 
                           w-4 h-4 rounded-full"
              />
              <Label
                htmlFor={`${filter.id}-${optionValue}`}
                className="text-sm text-foreground cursor-pointer capitalize"
              >
                {optionValue}
              </Label>
            </div>
          );
        })
      ) : (
        <div className="text-xs text-muted-foreground">No options available</div>
      )}
    </RadioGroup>
  );
      // Slider
      case 'slider': {
        const range = filter.range || { min: 0, max: 100 };
        const value = filter.value || { min: range.min, max: range.max };
        return (
          <div className="space-y-4">
            <Slider
              value={[Number(value.min), Number(value.max)]}
              onValueChange={([min, max]) => onUpdateFilter(filter.id, { value: { min, max } })}
              min={Number(range.min)}
              max={Number(range.max)}
              step={Math.ceil((Number(range.max) - Number(range.min)) / 100) || 1}
            />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{value.min}</span>
              <span>{value.max}</span>
            </div>
          </div>
        );
      }

      // ✅ Fixed & compact Date range
      case 'date': {
          const dateValue = filter.value || { start: null, end: null };
          const formattedRange =
            dateValue.start && dateValue.end
              ? `${format(new Date(dateValue.start), 'MMM d, yyyy')} → ${format(
                  new Date(dateValue.end),
                  'MMM d, yyyy'
                )}`
              : 'Select date range';

          return (
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-center text-sm font-medium"
                >
                  {dateValue.start && dateValue.end ? 'Change Date Range' : 'Select Date Range'}
                </Button>
              </PopoverTrigger>
              <PopoverContent align="start" className="p-3">
                <Calendar
                  mode="range"
                  numberOfMonths={2}
                  selected={{
                    from: dateValue.start ? new Date(dateValue.start) : undefined,
                    to: dateValue.end ? new Date(dateValue.end) : undefined,
                  }}
                  onSelect={(range) => {
                    if (!range) return;
                    const { from, to } = range;
                    onUpdateFilter(filter.id, {
                      value: { start: from ?? null, end: to ?? null },
                    });
                  }}
                />
                {dateValue.start || dateValue.end ? (
                  <div className="mt-3 flex justify-between items-center text-xs text-muted-foreground">
                    <span className="italic">
                      {formattedRange}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        onUpdateFilter(filter.id, { value: { start: null, end: null } })
                      }
                    >
                      Clear
                    </Button>
                  </div>
                ) : null}
              </PopoverContent>
            </Popover>
          );
        }

      default:
        return <div className="text-sm text-muted-foreground">Unsupported filter</div>;
    }
  };

  useEffect(() => {
  setFilters(filters);
}, [filters]);

  // ---------- Main render ----------
  return (
    <div className="h-full flex flex-col bg-card border-r border-border">
      {/* Header */}
      <div className="border-b border-border p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FilterIcon className="h-5 w-5" />
          <h3 className="font-medium">Filters</h3>
        </div>

        <Dialog open={isAddingFilter} onOpenChange={setIsAddingFilter}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline">
              <Plus className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Filter</DialogTitle>
              <DialogDescription>Create a filter to explore your data.</DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label>Filter Label</Label>
                <Input
                  value={newFilter.label}
                  onChange={(e) => setNewFilter({ ...newFilter, label: e.target.value })}
                />
              </div>

              <div>
                <Label>Column</Label>
                <Select
                  value={newFilter.column}
                  onValueChange={(col) => setNewFilter({ ...newFilter, column: col })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select column" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableColumns.length > 0 ? (
                      availableColumns.map((c) => (
                        <SelectItem key={c.name} value={c.name}>
                          {c.name}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem disabled value="">
                        No columns available
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Type</Label>
                <Select
                  value={newFilter.type}
                  onValueChange={(type: FilterConfig['type']) =>
                    setNewFilter({ ...newFilter, type })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="select">Dropdown</SelectItem>
                    <SelectItem value="checkbox">Checkbox</SelectItem>
                    <SelectItem value="radio">Radio</SelectItem>
                    <SelectItem value="slider">Slider</SelectItem>
                    <SelectItem value="date">Date Range</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddingFilter(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddFilter} disabled={!newFilter.label || !newFilter.column}>
                Add
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters List */}
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {filters.length === 0 ? (
          <div className="text-center text-sm text-muted-foreground">No filters yet</div>
        ) : (
          filters.map((filter) => (
            <Card key={filter.id}>
              <CardHeader className="pb-2 flex justify-between items-start">
                <div className="flex flex-col gap-1">
                  <CardTitle className="text-sm capitalize">{filter.label}</CardTitle>
                  <Badge variant="secondary" className="text-xs max-w-[160px] truncate">
                    {filter.type === 'date' && filter.value
                      ? `${filter.value.start ? format(new Date(filter.value.start), 'MMM d, yyyy') : 'Start'} → ${
                          filter.value.end ? format(new Date(filter.value.end), 'MMM d, yyyy') : 'End'
                        }`
                      : Array.isArray(filter.value)
                      ? `${filter.value.length} selected`
                      : typeof filter.value === 'object' && filter.value !== null
                      ? ''
                      : String(filter.value ?? '')}
                  </Badge>
                </div>

                <Button variant="ghost" size="sm" onClick={() => onDeleteFilter(filter.id)}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </CardHeader>

              <CardContent>{renderFilterControl(filter)}</CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Reset All */}
      {filters.length > 0 && (
        <div className="border-t border-border p-4">
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => {
              filters.forEach((f) => {
                const col = availableColumns.find((c) => c.name === f.column);
                onUpdateFilter(f.id, { value: getDefaultValue(f.type, col) });
              });
            }}
          >
            Reset All Filters
          </Button>
        </div>
      )}
    </div>
  );
}
