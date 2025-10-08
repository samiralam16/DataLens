import { useState } from 'react';
import { Search, Plus, Eye, Copy, Star } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { ChartRenderer } from './ChartRenderer';
import { ChartConfig } from '../../services/api';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '../ui/dialog';

interface ChartTemplate {
  id: string;
  name: string;
  description: string;
  type: ChartConfig['type'];
  category: 'business' | 'analytics' | 'marketing' | 'finance' | 'operations';
  tags: string[];
  preview: ChartConfig;
  isFavorite: boolean;
  usageCount: number;
}

interface ChartLibraryProps {
  onAddChart: (type: ChartConfig['type']) => void;
  existingCharts: ChartConfig[];
  onUpdateChart: (chartId: string, updates: Partial<ChartConfig>) => void;
}

export function ChartLibrary({ onAddChart, existingCharts, onUpdateChart }: ChartLibraryProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [previewChart, setPreviewChart] = useState<ChartTemplate | null>(null);

  const chartTemplates: ChartTemplate[] = [
    {
      id: '1',
      name: 'Monthly Revenue Trend',
      description: 'Track revenue trends over time with clear monthly breakdowns',
      type: 'line',
      category: 'finance',
      tags: ['revenue', 'monthly', 'trend'],
      isFavorite: true,
      usageCount: 145,
      preview: {
        id: 'preview-1',
        type: 'line',
        title: 'Monthly Revenue',
        data: [
          { month: 'Jan', revenue: 45000, target: 50000 },
          { month: 'Feb', revenue: 52000, target: 50000 },
          { month: 'Mar', revenue: 48000, target: 55000 },
          { month: 'Apr', revenue: 61000, target: 55000 },
          { month: 'May', revenue: 55000, target: 60000 },
          { month: 'Jun', revenue: 67000, target: 60000 }
        ],
        x: 'month',
        y: 'revenue',
        position: { x: 0, y: 0 },
        size: { width: 400, height: 300 },
        filters: {}
      }
    },
    {
      id: '2',
      name: 'Regional Performance',
      description: 'Compare performance across different regions with bar charts',
      type: 'bar',
      category: 'business',
      tags: ['regional', 'comparison', 'performance'],
      isFavorite: false,
      usageCount: 89,
      preview: {
        id: 'preview-2',
        type: 'bar',
        title: 'Sales by Region',
        data: [
          { region: 'North', sales: 125000, orders: 450 },
          { region: 'South', sales: 98000, orders: 320 },
          { region: 'East', sales: 142000, orders: 510 },
          { region: 'West', sales: 87000, orders: 290 }
        ],
        x: 'region',
        y: 'sales',
        position: { x: 0, y: 0 },
        size: { width: 400, height: 300 },
        filters: {}
      }
    },
    {
      id: '3',
      name: 'Market Share Analysis',
      description: 'Visualize market share distribution with pie charts',
      type: 'pie',
      category: 'marketing',
      tags: ['market share', 'distribution', 'percentage'],
      isFavorite: true,
      usageCount: 76,
      preview: {
        id: 'preview-3',
        type: 'pie',
        title: 'Market Share',
        data: [
          { company: 'Our Company', share: 35 },
          { company: 'Competitor A', share: 28 },
          { company: 'Competitor B', share: 18 },
          { company: 'Competitor C', share: 12 },
          { company: 'Others', share: 7 }
        ],
        x: 'company',
        y: 'share',
        position: { x: 0, y: 0 },
        size: { width: 400, height: 300 },
        filters: {}
      }
    },
    {
      id: '4',
      name: 'Customer Correlation',
      description: 'Analyze correlation between customer metrics',
      type: 'scatter',
      category: 'analytics',
      tags: ['correlation', 'customer', 'metrics'],
      isFavorite: false,
      usageCount: 45,
      preview: {
        id: 'preview-4',
        type: 'scatter',
        title: 'Customer Value vs Frequency',
        data: [
          { value: 1200, frequency: 12, segment: 'Premium' },
          { value: 800, frequency: 8, segment: 'Regular' },
          { value: 1500, frequency: 15, segment: 'Premium' },
          { value: 400, frequency: 4, segment: 'Basic' },
          { value: 950, frequency: 9, segment: 'Regular' },
          { value: 2000, frequency: 20, segment: 'Premium' }
        ],
        x: 'frequency',
        y: 'value',
        position: { x: 0, y: 0 },
        size: { width: 400, height: 300 },
        filters: {}
      }
    },
    {
      id: '5',
      name: 'Performance Heatmap',
      description: 'Show performance intensity across categories and time',
      type: 'heatmap',
      category: 'operations',
      tags: ['performance', 'intensity', 'matrix'],
      isFavorite: false,
      usageCount: 32,
      preview: {
        id: 'preview-5',
        type: 'heatmap',
        title: 'Performance Matrix',
        data: [
          { category: 'Sales', period: 'Q1', value: 85 },
          { category: 'Sales', period: 'Q2', value: 92 },
          { category: 'Marketing', period: 'Q1', value: 78 },
          { category: 'Marketing', period: 'Q2', value: 88 },
          { category: 'Support', period: 'Q1', value: 95 },
          { category: 'Support', period: 'Q2', value: 87 }
        ],
        x: 'period',
        y: 'category',
        position: { x: 0, y: 0 },
        size: { width: 400, height: 300 },
        filters: {}
      }
    },
    {
      id: '6',
      name: 'Product Portfolio',
      description: 'Visualize product portfolio with treemap',
      type: 'treemap',
      category: 'business',
      tags: ['portfolio', 'products', 'hierarchy'],
      isFavorite: false,
      usageCount: 28,
      preview: {
        id: 'preview-6',
        type: 'treemap',
        title: 'Product Revenue',
        data: [
          { product: 'Product A', revenue: 150000 },
          { product: 'Product B', revenue: 120000 },
          { product: 'Product C', revenue: 90000 },
          { product: 'Product D', revenue: 75000 },
          { product: 'Product E', revenue: 45000 }
        ],
        x: 'product',
        y: 'revenue',
        position: { x: 0, y: 0 },
        size: { width: 400, height: 300 },
        filters: {}
      }
    }
  ];

  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'business', label: 'Business' },
    { value: 'analytics', label: 'Analytics' },
    { value: 'marketing', label: 'Marketing' },
    { value: 'finance', label: 'Finance' },
    { value: 'operations', label: 'Operations' }
  ];

  const filteredTemplates = chartTemplates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const chartTypeIcons: Record<ChartConfig['type'], string> = {
    bar: '📊',
    line: '📈',
    pie: '🥧',
    scatter: '🔘',
    heatmap: '🔥',
    treemap: '🌳',
    geo: '🗺️'
  };

  return (
    <div className="h-full overflow-auto p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Chart Library</h2>
        <p className="text-muted-foreground">
          Browse and add professional chart templates to your dashboard
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search charts, descriptions, or tags..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </div>

      <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="mb-6">
        <TabsList className="grid grid-cols-3 lg:grid-cols-6">
          {categories.map((category) => (
            <TabsTrigger key={category.value} value={category.value} className="text-xs">
              {category.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map((template) => (
          <Card key={template.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">{chartTypeIcons[template.type]}</span>
                    <CardTitle className="text-base">{template.name}</CardTitle>
                    {template.isFavorite && (
                      <Star className="h-4 w-4 text-yellow-500 fill-current" />
                    )}
                  </div>
                  <CardDescription className="text-sm">
                    {template.description}
                  </CardDescription>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex flex-wrap gap-1">
                  {template.tags.slice(0, 2).map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                  {template.tags.length > 2 && (
                    <Badge variant="outline" className="text-xs">
                      +{template.tags.length - 2}
                    </Badge>
                  )}
                </div>
                <Badge variant="outline" className="text-xs">
                  {template.usageCount} uses
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="h-48 border rounded-lg overflow-hidden bg-muted/20">
                <ChartRenderer chart={template.preview} height={192} />
              </div>
              
              <div className="flex gap-2">
                <Dialog open={previewChart?.id === template.id} onOpenChange={(open) => setPreviewChart(open ? template : null)}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="flex-1">
                      <Eye className="h-4 w-4 mr-1" />
                      Preview
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl">
                    <DialogHeader>
                      <DialogTitle>{template.name}</DialogTitle>
                    </DialogHeader>
                    <div className="h-96">
                      <ChartRenderer chart={template.preview} height={384} />
                    </div>
                  </DialogContent>
                </Dialog>
                
                <Button 
                  size="sm" 
                  className="flex-1"
                  onClick={() => onAddChart(template.type)}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="font-medium mb-2">No charts found</h3>
          <p className="text-muted-foreground text-sm">
            Try adjusting your search terms or category filter
          </p>
        </div>
      )}
    </div>
  );
}