import { useState } from 'react';
import { Plus, Settings, Trash2, Filter } from 'lucide-react';
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
import { Separator } from '../ui/separator';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter,
  DialogDescription
} from '../ui/dialog';
import { FilterConfig } from '../WebBuilder';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';

interface FilterPanelProps {
  filters: FilterConfig[];
  onAddFilter: (filter: Omit<FilterConfig, 'id'>) => void;
  onUpdateFilter: (filterId: string, updates: Partial<FilterConfig>) => void;
  onDeleteFilter: (filterId: string) => void;
}

export function FilterPanel({ filters, onAddFilter, onUpdateFilter, onDeleteFilter }: FilterPanelProps) {
  const [isAddingFilter, setIsAddingFilter] = useState(false);
  const [newFilter, setNewFilter] = useState<Omit<FilterConfig, 'id'>>({
    type: 'select',
    label: '',
    column: '',
    value: null
  });

  // Mock data columns for filter creation
  const availableColumns = [
    { name: 'region', type: 'text', values: ['North', 'South', 'East', 'West'] },
    { name: 'month', type: 'text', values: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'] },
    { name: 'revenue', type: 'number', range: { min: 0, max: 100000 } },
    { name: 'orders', type: 'number', range: { min: 0, max: 200 } },
    { name: 'date', type: 'date' }
  ];

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

  const getDefaultValue = (type: FilterConfig['type'], column: any) => {
    switch (type) {
      case 'select':
        return column?.values?.[0] || '';
      case 'checkbox':
        return column?.values || [];
      case 'radio':
        return column?.values?.[0] || '';
      case 'slider':
        return column?.range || { min: 0, max: 100 };
      case 'date':
        return { start: new Date(), end: new Date() };
      default:
        return null;
    }
  };

  const renderFilterControl = (filter: FilterConfig) => {
    switch (filter.type) {
      case 'select':
        return (
          <Select
            value={filter.value}
            onValueChange={(value) => onUpdateFilter(filter.id, { value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select value" />
            </SelectTrigger>
            <SelectContent>
              {filter.options?.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'checkbox':
        return (
          <div className="space-y-2">
            {filter.options?.map((option) => (
              <div key={option} className="flex items-center space-x-2">
                <Checkbox
                  id={`${filter.id}-${option}`}
                  checked={Array.isArray(filter.value) && filter.value.includes(option)}
                  onCheckedChange={(checked) => {
                    const currentValue = Array.isArray(filter.value) ? filter.value : [];
                    const newValue = checked
                      ? [...currentValue, option]
                      : currentValue.filter(v => v !== option);
                    onUpdateFilter(filter.id, { value: newValue });
                  }}
                />
                <Label htmlFor={`${filter.id}-${option}`} className="text-sm">
                  {option}
                </Label>
              </div>
            ))}
          </div>
        );

      case 'radio':
        return (
          <RadioGroup
            value={filter.value}
            onValueChange={(value) => onUpdateFilter(filter.id, { value })}
          >
            {filter.options?.map((option) => (
              <div key={option} className="flex items-center space-x-2">
                <RadioGroupItem value={option} id={`${filter.id}-${option}`} />
                <Label htmlFor={`${filter.id}-${option}`} className="text-sm">
                  {option}
                </Label>
              </div>
            ))}
          </RadioGroup>
        );

      case 'slider':
        const range = filter.range || { min: 0, max: 100 };
        const value = filter.value || range;
        return (
          <div className="space-y-4">
            <div className="px-3">
              <Slider
                value={[value.min, value.max]}
                onValueChange={([min, max]) => 
                  onUpdateFilter(filter.id, { value: { min, max } })
                }
                min={range.min}
                max={range.max}
                step={Math.ceil((range.max - range.min) / 100)}
              />
            </div>
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{value.min}</span>
              <span>{value.max}</span>
            </div>
          </div>
        );

      case 'date':
        const dateValue = filter.value || { start: new Date(), end: new Date() };
        return (
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateValue.start ? format(dateValue.start, "PPP") : "Start date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dateValue.start}
                    onSelect={(date) => 
                      date && onUpdateFilter(filter.id, { 
                        value: { ...dateValue, start: date } 
                      })
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateValue.end ? format(dateValue.end, "PPP") : "End date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dateValue.end}
                    onSelect={(date) => 
                      date && onUpdateFilter(filter.id, { 
                        value: { ...dateValue, end: date } 
                      })
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        );

      default:
        return <div>Unsupported filter type</div>;
    }
  };

  return (
    <div className="h-full flex flex-col bg-card border-r border-border">
      <div className="border-b border-border p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
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
                <DialogDescription>
                  Create a new filter to enable interactive data exploration in your dashboard.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="filter-label">Filter Label</Label>
                  <Input
                    id="filter-label"
                    value={newFilter.label}
                    onChange={(e) => setNewFilter({ ...newFilter, label: e.target.value })}
                    placeholder="e.g., Region Filter"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="filter-column">Data Column</Label>
                  <Select
                    value={newFilter.column}
                    onValueChange={(column) => setNewFilter({ ...newFilter, column })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select column to filter" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableColumns.map((column) => (
                        <SelectItem key={column.name} value={column.name}>
                          <div className="flex items-center justify-between w-full">
                            <span>{column.name}</span>
                            <Badge variant="secondary" className="ml-2 text-xs">
                              {column.type}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="filter-type">Filter Type</Label>
                  <Select
                    value={newFilter.type}
                    onValueChange={(type: FilterConfig['type']) => setNewFilter({ ...newFilter, type })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="select">Dropdown Select</SelectItem>
                      <SelectItem value="checkbox">Checkbox List</SelectItem>
                      <SelectItem value="radio">Radio Buttons</SelectItem>
                      <SelectItem value="slider">Range Slider</SelectItem>
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
                  Add Filter
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        
        <p className="text-sm text-muted-foreground">
          Interactive filters for dashboard cross-filtering
        </p>
      </div>

      <div className="flex-1 overflow-auto p-4">
        {filters.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Filter className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-medium mb-2">No Filters</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Add filters to enable interactive data exploration
            </p>
            <Button variant="outline" size="sm" onClick={() => setIsAddingFilter(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Add First Filter
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {filters.map((filter) => (
              <Card key={filter.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">{filter.label}</CardTitle>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm">
                        <Settings className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDeleteFilter(filter.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Badge variant="outline" className="text-xs">
                      {filter.column}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      {filter.type}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  {renderFilterControl(filter)}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {filters.length > 0 && (
        <div className="border-t border-border p-4">
          <Button variant="outline" size="sm" className="w-full" onClick={() => {
            filters.forEach(filter => {
              onUpdateFilter(filter.id, { value: getDefaultValue(filter.type, availableColumns.find(col => col.name === filter.column)) });
            });
          }}>
            Reset All Filters
          </Button>
        </div>
      )}
    </div>
  );
}