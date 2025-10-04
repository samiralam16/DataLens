// src/components/web-builder/FilterPanel.tsx
import { useState } from 'react';
import { Plus, Settings, Trash2, Filter as FilterIcon } from 'lucide-react';
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '../ui/dialog';
import { format } from 'date-fns';

import { useData } from '../DataContext';
import { FilterConfig } from '../WebBuilder';

type FilterPanelProps = {
  filters: FilterConfig[];
  onAddFilter: (filter: Omit<FilterConfig, 'id'>) => void;
  onUpdateFilter: (filterId: string, updates: Partial<FilterConfig>) => void;
  onDeleteFilter: (filterId: string) => void;
};

export function FilterPanel({ filters, onAddFilter, onUpdateFilter, onDeleteFilter }: FilterPanelProps) {
  const [isAddingFilter, setIsAddingFilter] = useState(false);
  const [newFilter, setNewFilter] = useState<Omit<FilterConfig, 'id'>>({
    type: 'select',
    label: '',
    column: '',
    value: null
  });

  const { dataSources, activeDatasetId } = useData();
  const activeDataset = dataSources.find(ds => ds.id === activeDatasetId);
  const availableColumns = activeDataset?.columns || [];

  // default values when creating filters
  const getDefaultValue = (type: FilterConfig['type'], column: any) => {
    switch (type) {
      case 'select': return column?.values?.[0] || '';
      case 'checkbox': return column?.values || [];
      case 'radio': return column?.values?.[0] || '';
      case 'slider': return column?.range || { min: 0, max: 100 };
      case 'date': return { start: new Date(), end: new Date() };
      default: return null;
    }
  };

  // add filter
  const handleAddFilter = () => {
    if (newFilter.label && newFilter.column) {
      const column = availableColumns.find(col => col.name === newFilter.column);
      const filterConfig: Omit<FilterConfig, 'id'> = {
        ...newFilter,
        options: column?.values,
        range: column?.range,
        value: getDefaultValue(newFilter.type, column)
      };
      onAddFilter(filterConfig);
      setNewFilter({ type: 'select', label: '', column: '', value: null });
      setIsAddingFilter(false);
    }
  };

  // render control per filter type
  const renderFilterControl = (filter: FilterConfig) => {
    switch (filter.type) {
      case 'select':
        return (
          <Select value={filter.value ?? undefined} onValueChange={(value) => onUpdateFilter(filter.id, { value })}>
            <SelectTrigger><SelectValue placeholder="Select value" /></SelectTrigger>
            <SelectContent>
              {filter.options?.map((opt: any) => (
                <SelectItem key={String(opt)} value={String(opt)}>{String(opt)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      case 'checkbox':
        return (
          <div className="space-y-2">
            {filter.options?.map((opt: any) => {
              const checked = Array.isArray(filter.value) && filter.value.includes(opt);
              return (
                <div key={opt} className="flex items-center space-x-2">
                  <Checkbox
                    id={`${filter.id}-${opt}`}
                    checked={checked}
                    onCheckedChange={(c) => {
                      const current: any[] = Array.isArray(filter.value) ? filter.value : [];
                      const next = c ? [...current, opt] : current.filter(v => v !== opt);
                      onUpdateFilter(filter.id, { value: next });
                    }}
                  />
                  <Label htmlFor={`${filter.id}-${opt}`} className="text-sm">{opt}</Label>
                </div>
              );
            })}
          </div>
        );
      case 'radio':
        return (
          <RadioGroup value={filter.value ?? undefined} onValueChange={(val) => onUpdateFilter(filter.id, { value: val })}>
            {filter.options?.map((opt: any) => (
              <div key={opt} className="flex items-center space-x-2">
                <RadioGroupItem value={String(opt)} id={`${filter.id}-${opt}`} />
                <Label htmlFor={`${filter.id}-${opt}`} className="text-sm">{String(opt)}</Label>
              </div>
            ))}
          </RadioGroup>
        );
      case 'slider': {
        const range = filter.range || { min: 0, max: 100 };
        const value = filter.value || range;
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
              <span>{value.min}</span><span>{value.max}</span>
            </div>
          </div>
        );
      }
      case 'date': {
        const dateValue = filter.value || { start: new Date(), end: new Date() };
        return (
          <div className="grid grid-cols-2 gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="justify-start">
                  {dateValue.start ? format(new Date(dateValue.start), "PPP") : "Start date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent><Calendar mode="single" selected={dateValue.start ? new Date(dateValue.start) : undefined}
                onSelect={(date) => date && onUpdateFilter(filter.id, { value: { ...dateValue, start: date } })}
              /></PopoverContent>
            </Popover>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="justify-start">
                  {dateValue.end ? format(new Date(dateValue.end), "PPP") : "End date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent><Calendar mode="single" selected={dateValue.end ? new Date(dateValue.end) : undefined}
                onSelect={(date) => date && onUpdateFilter(filter.id, { value: { ...dateValue, end: date } })}
              /></PopoverContent>
            </Popover>
          </div>
        );
      }
      default:
        return null;
    }
  };

  return (
    <div className="h-full flex flex-col bg-card border-r border-border">
      {/* Header */}
      <div className="border-b border-border p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FilterIcon className="h-5 w-5" />
          <h3 className="font-medium">Filters</h3>
        </div>
        <Dialog open={isAddingFilter} onOpenChange={setIsAddingFilter}>
          <DialogTrigger asChild><Button size="sm" variant="outline"><Plus className="h-4 w-4" /></Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add New Filter</DialogTitle><DialogDescription>Create a filter to explore your data.</DialogDescription></DialogHeader>
            <div className="space-y-4">
              <div><Label>Filter Label</Label><Input value={newFilter.label} onChange={(e) => setNewFilter({ ...newFilter, label: e.target.value })} /></div>
              <div><Label>Column</Label>
                <Select value={newFilter.column} onValueChange={(col) => setNewFilter({ ...newFilter, column: col })}>
                  <SelectTrigger><SelectValue placeholder="Select column" /></SelectTrigger>
                  <SelectContent>
                    {availableColumns.map(c => <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Type</Label>
                <Select value={newFilter.type} onValueChange={(type: FilterConfig['type']) => setNewFilter({ ...newFilter, type })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
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
              <Button variant="outline" onClick={() => setIsAddingFilter(false)}>Cancel</Button>
              <Button onClick={handleAddFilter} disabled={!newFilter.label || !newFilter.column}>Add</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters list */}
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {filters.length === 0 ? (
          <div className="text-center text-sm text-muted-foreground">No filters yet</div>
        ) : (
          filters.map(filter => (
            <Card key={filter.id}>
              <CardHeader className="pb-2 flex justify-between">
                <CardTitle className="text-sm">{filter.label}</CardTitle>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => onDeleteFilter(filter.id)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>{renderFilterControl(filter)}</CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Reset button */}
      {filters.length > 0 && (
        <div className="border-t border-border p-4">
          <Button variant="outline" size="sm" className="w-full" onClick={() => {
            filters.forEach(f => {
              const col = availableColumns.find(c => c.name === f.column);
              onUpdateFilter(f.id, { value: getDefaultValue(f.type, col) });
            });
          }}>
            Reset All Filters
          </Button>
        </div>
      )}
    </div>
  );
}
