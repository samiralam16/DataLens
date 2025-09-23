import { useState } from 'react';
import { Search, Play, Edit, Trash2, Star, Clock, Tag } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '../ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '../ui/alert-dialog';
import { toast } from 'sonner@2.0.3';

interface SavedQuery {
  id: string;
  name: string;
  description: string;
  query: string;
  tags: string[];
  createdAt: Date;
  lastRun: Date;
  isFavorite: boolean;
  author: string;
}

interface SavedQueriesProps {
  onLoadQuery: (query: string) => void;
}

export function SavedQueries({ onLoadQuery }: SavedQueriesProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('recent');
  const [filterTag, setFilterTag] = useState('all');

  const [savedQueries] = useState<SavedQuery[]>([
    {
      id: '1',
      name: 'Monthly Revenue Analysis',
      description: 'Shows monthly revenue trends with year-over-year comparison',
      query: `SELECT 
    DATE_TRUNC('month', order_date) as month,
    SUM(total_amount) as revenue,
    COUNT(*) as order_count
FROM orders 
WHERE order_date >= DATE_TRUNC('year', CURRENT_DATE)
GROUP BY 1
ORDER BY 1;`,
      tags: ['revenue', 'monthly', 'trends'],
      createdAt: new Date('2024-03-15'),
      lastRun: new Date('2024-03-20'),
      isFavorite: true,
      author: 'John Doe'
    },
    {
      id: '2',
      name: 'Top Customers by Sales',
      description: 'Identifies the highest value customers based on total purchases',
      query: `SELECT 
    c.customer_name,
    SUM(o.total_amount) as total_sales,
    COUNT(o.id) as order_count
FROM customers c
JOIN orders o ON c.id = o.customer_id
GROUP BY c.id, c.customer_name
ORDER BY total_sales DESC
LIMIT 20;`,
      tags: ['customers', 'sales', 'ranking'],
      createdAt: new Date('2024-03-10'),
      lastRun: new Date('2024-03-18'),
      isFavorite: false,
      author: 'Jane Smith'
    },
    {
      id: '3',
      name: 'User Registration Funnel',
      description: 'Analyzes user registration and onboarding completion rates',
      query: `WITH funnel_steps AS (
  SELECT 
    COUNT(*) as registrations,
    COUNT(CASE WHEN onboarding_completed THEN 1 END) as completed_onboarding,
    COUNT(CASE WHEN first_purchase_date IS NOT NULL THEN 1 END) as made_purchase
  FROM users
  WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
)
SELECT 
  registrations,
  completed_onboarding,
  made_purchase,
  ROUND(completed_onboarding * 100.0 / registrations, 2) as onboarding_rate,
  ROUND(made_purchase * 100.0 / registrations, 2) as conversion_rate
FROM funnel_steps;`,
      tags: ['users', 'funnel', 'conversion'],
      createdAt: new Date('2024-03-05'),
      lastRun: new Date('2024-03-19'),
      isFavorite: true,
      author: 'John Doe'
    },
    {
      id: '4',
      name: 'Product Performance Dashboard',
      description: 'Comprehensive product sales and inventory analysis',
      query: `SELECT 
    p.product_name,
    p.category,
    SUM(oi.quantity) as units_sold,
    SUM(oi.line_total) as revenue,
    AVG(p.price) as avg_price,
    p.stock_quantity as current_stock
FROM products p
LEFT JOIN order_items oi ON p.id = oi.product_id
LEFT JOIN orders o ON oi.order_id = o.id
WHERE o.order_date >= CURRENT_DATE - INTERVAL '90 days'
GROUP BY p.id, p.product_name, p.category, p.stock_quantity
ORDER BY revenue DESC;`,
      tags: ['products', 'inventory', 'sales'],
      createdAt: new Date('2024-02-28'),
      lastRun: new Date('2024-03-17'),
      isFavorite: false,
      author: 'Mike Johnson'
    }
  ]);

  const allTags = Array.from(new Set(savedQueries.flatMap(q => q.tags)));

  const filteredQueries = savedQueries.filter(query => {
    const matchesSearch = query.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         query.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         query.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesTag = filterTag === 'all' || query.tags.includes(filterTag);
    
    return matchesSearch && matchesTag;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'created':
        return b.createdAt.getTime() - a.createdAt.getTime();
      case 'recent':
        return b.lastRun.getTime() - a.lastRun.getTime();
      case 'favorites':
        if (a.isFavorite && !b.isFavorite) return -1;
        if (!a.isFavorite && b.isFavorite) return 1;
        return b.lastRun.getTime() - a.lastRun.getTime();
      default:
        return 0;
    }
  });

  const handleLoadQuery = (query: SavedQuery) => {
    onLoadQuery(query.query);
    toast.success(`Loaded query: ${query.name}`);
  };

  const handleToggleFavorite = (queryId: string) => {
    // In a real app, this would update the backend
    toast.success('Favorite status updated');
  };

  const handleDeleteQuery = (queryId: string) => {
    // In a real app, this would delete from backend
    toast.success('Query deleted');
  };

  return (
    <div className="h-full overflow-auto p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Saved Queries</h2>
        <p className="text-muted-foreground">
          Manage and reuse your favorite SQL queries
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search queries, descriptions, or tags..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recent">Recently Used</SelectItem>
            <SelectItem value="created">Date Created</SelectItem>
            <SelectItem value="name">Name A-Z</SelectItem>
            <SelectItem value="favorites">Favorites First</SelectItem>
          </SelectContent>
        </Select>
        
        <Select value={filterTag} onValueChange={setFilterTag}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filter by tag" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Tags</SelectItem>
            {allTags.map(tag => (
              <SelectItem key={tag} value={tag}>{tag}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4">
        {filteredQueries.map((query) => (
          <Card key={query.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <CardTitle className="text-lg">{query.name}</CardTitle>
                    {query.isFavorite && (
                      <Star className="h-4 w-4 text-yellow-500 fill-current" />
                    )}
                  </div>
                  <CardDescription className="text-sm">
                    {query.description}
                  </CardDescription>
                </div>
                
                <div className="flex items-center gap-1 ml-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggleFavorite(query.id)}
                  >
                    <Star className={`h-4 w-4 ${query.isFavorite ? 'text-yellow-500 fill-current' : ''}`} />
                  </Button>
                  
                  <Button variant="ghost" size="sm">
                    <Edit className="h-4 w-4" />
                  </Button>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Query</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete "{query.name}"? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDeleteQuery(query.id)}>
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="pt-0">
              <div className="space-y-3">
                <div className="flex flex-wrap gap-1">
                  {query.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      <Tag className="h-3 w-3 mr-1" />
                      {tag}
                    </Badge>
                  ))}
                </div>
                
                <div className="bg-muted p-3 rounded text-sm font-mono overflow-x-auto max-h-32">
                  <pre className="whitespace-pre-wrap text-xs">
                    {query.query.length > 200 ? query.query.substring(0, 200) + '...' : query.query}
                  </pre>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Last run: {query.lastRun.toLocaleDateString()}
                    </span>
                    <span>by {query.author}</span>
                  </div>
                  
                  <Button onClick={() => handleLoadQuery(query)} className="gap-2">
                    <Play className="h-4 w-4" />
                    Load Query
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredQueries.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="font-medium mb-2">No queries found</h3>
          <p className="text-muted-foreground text-sm">
            Try adjusting your search terms or filters
          </p>
        </div>
      )}
    </div>
  );
}