import { Upload, Database, History, Sparkles, Filter, BarChart, Settings, Home, FileText, Plus } from 'lucide-react';
import { Button } from './ui/button';
import { Separator } from './ui/separator';
import { cn } from './ui/utils';

interface SidebarProps {
  isOpen: boolean;
  activeModule: 'sql' | 'web';
  onModuleChange: (module: 'sql' | 'web') => void;
  onAIAssistantClick?: () => void;
  onAddChart?: () => void;
}

export function Sidebar({ isOpen, activeModule, onModuleChange, onAIAssistantClick, onAddChart }: SidebarProps) {
  const sqlBuilderItems = [
    { icon: Upload, label: 'Data Import', id: 'import', onClick: () => console.log('Data Import clicked') },
    { icon: Database, label: 'Connected Sources', id: 'sources', onClick: () => console.log('Connected Sources clicked') },
    { icon: FileText, label: 'SQL Editor', id: 'editor', onClick: () => console.log('SQL Editor clicked') },
    { icon: History, label: 'Saved Queries', id: 'queries', onClick: () => console.log('Saved Queries clicked') },
    { icon: Sparkles, label: 'AI Assistant', id: 'ai', onClick: onAIAssistantClick },
  ];

  const webBuilderItems = [
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
                variant="ghost"
                className="w-full justify-start gap-3 h-10 cursor-pointer"
                onClick={item.onClick}
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