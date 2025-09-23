import { Menu, Bell, User, Search } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from './ui/dropdown-menu';
import { Avatar, AvatarFallback } from './ui/avatar';

interface HeaderProps {
  activeModule: 'sql' | 'web';
  setActiveModule: (module: 'sql' | 'web') => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

export function Header({ 
  activeModule, 
  setActiveModule, 
  sidebarOpen, 
  setSidebarOpen 
}: HeaderProps) {
  return (
    <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center px-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="mr-2"
        >
          <Menu className="h-4 w-4" />
        </Button>
        
        <div className="flex-1 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Module Toggle */}
            <div className="flex items-center bg-muted rounded-lg p-1">
              <Button
                variant={activeModule === 'sql' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveModule('sql')}
                className="h-8 px-3"
              >
                SQL Builder
              </Button>
              <Button
                variant={activeModule === 'web' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveModule('web')}
                className="h-8 px-3"
              >
                Web Builder
              </Button>
            </div>
            
            <div className="hidden md:flex items-center space-x-2 max-w-md">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search tables, queries, charts..."
                  className="pl-8 w-80"
                />
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm">
              <Bell className="h-4 w-4" />
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="relative">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="text-xs">U</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem>
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}