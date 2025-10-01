import { 
  Upload, Database, History, Sparkles, Filter, 
  BarChart, Settings, Home, FileText, Plus 
} from 'lucide-react';
import { Button } from './ui/button';
import { Separator } from './ui/separator';
import { cn } from './ui/utils';

// 👇 1. Define NavItem type here
interface NavItem {
  icon: React.ComponentType<any>;
  label: string;
  id: string;
  onClick?: () => void;   // optional, only some items use this
}

interface SidebarProps {
  isOpen: boolean;
  activeModule: 'sql' | 'web';
  onModuleChange: (module: 'sql' | 'web') => void;

  activeTool?: string;
  setActiveTool?: (tool: string) => void;

  onAIAssistantClick?: () => void;
  onAddChart?: () => void;
}

export function Sidebar({ 
  isOpen, 
  activeModule, 
  onModuleChange, 
  activeTool, 
  setActiveTool, 
  onAIAssistantClick, 
  onAddChart 
}: SidebarProps) {

  // 👇 2. Apply NavItem[] type here
  const sqlBuilderItems: NavItem[] = [
    { icon: Upload, label: 'Data Import', id: 'import' },
    { icon: Database, label: 'Connected Sources', id: 'sources' },
    { icon: FileText, label: 'SQL Editor', id: 'editor' },
    { icon: History, label: 'Saved Queries', id: 'queries' },
    { icon: Sparkles, label: 'AI Assistant', id: 'ai' },
  ];

  const webBuilderItems: NavItem[] = [
    { icon: Home, label: 'Dashboard', id: 'dashboard', onClick: () => console.log('Dashboard clicked') },
    { icon: Plus, label: 'Add Chart', id: 'add-chart', onClick: onAddChart },
    { icon: BarChart, label: 'Chart Library', id: 'charts', onClick: () => console.log('Chart Library clicked') },
    { icon: Filter, label: 'Filters & Data', id: 'filters', onClick: () => console.log('Filters & Data clicked') },
    { icon: Settings, label: 'Export & Share', id: 'export', onClick: () => console.log('Export & Share clicked') },
  ];

  const items = activeModule === 'sql' ? sqlBuilderItems : webBuilderItems;

  return (
    <aside className={cn(
      "border-r border-border bg-card transition-all duration-300 flex flex-col",
      isOpen ? "w-64" : "w-0 overflow-hidden"
    )}>
      <div className="p-4">
        <h2 className="font-semibold text-lg mb-6">DataViz Pro</h2>
        
        {/* Module-specific Navigation */}
        <div className="mb-6">
          <h3 className="font-medium text-xs text-muted-foreground mb-3 uppercase tracking-wider">
            {activeModule === 'sql' ? 'SQL Tools' : 'Dashboard Tools'}
          </h3>
          <nav className="space-y-1">
            {items.map((item) => (
              <Button
                key={item.id}
                variant={activeTool === item.id ? "secondary" : "ghost"} 
                className="w-full justify-start gap-3 h-10 cursor-pointer"
                onClick={() => {
                  if (activeModule === 'sql' && setActiveTool) {
                    setActiveTool(item.id); // switch tools inside SQLBuilder
                  } else if (item.onClick) {
                    item.onClick(); // only runs if defined
                  }
                  if (item.id === 'ai' && onAIAssistantClick) {
                    onAIAssistantClick();
                  }
                }}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Button>
            ))}
          </nav>
        </div>
        
        <Separator className="mb-4" />
        
        {/* General Settings */}
        <div className="space-y-1">
          <Button 
            variant="ghost" 
            className="w-full justify-start gap-3 h-10 cursor-pointer"
            onClick={() => console.log('Settings clicked')}
          >
            <Settings className="h-4 w-4" />
            Settings
          </Button>
        </div>
      </div>
    </aside>
  );
}
