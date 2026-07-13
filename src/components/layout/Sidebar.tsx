import { useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Home, 
  Receipt, 
  Target, 
  CalendarDays, 
  Wallet, 
  Tags, 
  BarChart3,
  Settings,
  X
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { useUIStore } from '@/stores/useUIStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { LogOut } from 'lucide-react';

const navItems = [
  { name: 'Dashboard', path: '/', icon: Home },
  { name: 'Transactions', path: '/transactions', icon: Receipt },
  { name: 'Accounts', path: '/accounts', icon: Wallet },
  { name: 'Categories', path: '/categories', icon: Tags },
  { name: 'Budgets', path: '/budgets', icon: Target },
  { name: 'Calendar', path: '/calendar', icon: CalendarDays },
  { name: 'Reports', path: '/reports', icon: BarChart3 },
  { name: 'Settings', path: '/settings', icon: Settings },
];

export function Sidebar() {
  const { isSidebarOpen, isSidebarCollapsed, closeSidebar } = useUIStore();
  const { logout } = useAuthStore();

  const handleSignOut = () => {
    if (confirm('Are you sure you want to sign out? You will need to select your name and log in again.')) {
      logout();
    }
  };

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isSidebarOpen) {
        closeSidebar();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isSidebarOpen, closeSidebar]);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (isSidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isSidebarOpen]);

  const sidebarContent = (
    <>
      <div className={cn("flex items-center justify-between p-6", isSidebarCollapsed && "md:p-4 md:justify-center")}>
        <h1 className={cn("text-2xl font-bold text-primary flex items-center gap-2", isSidebarCollapsed && "md:hidden")}>
          <Wallet className="w-8 h-8 shrink-0" />
          Expensify
        </h1>
        {isSidebarCollapsed && (
          <Wallet className="w-8 h-8 shrink-0 text-primary hidden md:block" />
        )}
        <button 
          onClick={closeSidebar}
          className="md:hidden p-2 -mr-2 rounded-full hover:bg-accent hover:text-accent-foreground transition-colors"
          aria-label="Close menu"
        >
          <X className="w-6 h-6" />
        </button>
      </div>
      
      <nav className="flex-1 px-4 space-y-2 overflow-y-auto overflow-x-hidden">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={() => closeSidebar()}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-lg text-sm font-medium transition-colors relative group",
                isSidebarCollapsed ? "md:px-2 md:justify-center md:py-3 px-4 py-3" : "px-4 py-3",
                isActive 
                  ? "bg-primary text-primary-foreground" 
                  : "text-foreground hover:bg-accent hover:text-accent-foreground"
              )
            }
          >
            <item.icon className="w-5 h-5 shrink-0" />
            <span className={cn("truncate transition-opacity", isSidebarCollapsed && "md:hidden")}>
              {item.name}
            </span>
            
            {/* Tooltip for collapsed state */}
            {isSidebarCollapsed && (
              <div className="hidden md:block absolute left-full ml-2 px-2 py-1 bg-popover text-popover-foreground border border-border text-xs rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 shadow-md">
                {item.name}
              </div>
            )}
          </NavLink>
        ))}
      </nav>
      
      <div className="p-4 mt-auto border-t border-border">
        <button
          onClick={handleSignOut}
          className={cn(
            "flex items-center gap-3 w-full rounded-lg text-sm font-medium transition-colors text-rose-500 hover:bg-rose-500/10",
            isSidebarCollapsed ? "md:px-2 md:justify-center md:py-3 px-4 py-3" : "px-4 py-3"
          )}
        >
          <LogOut className="w-5 h-5 shrink-0" />
          <span className={cn("truncate", isSidebarCollapsed && "md:hidden")}>
            Sign out
          </span>
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden transition-opacity"
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Drawer / Desktop Sidebar */}
      <aside 
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col bg-card border-r border-border h-full transition-all duration-300 ease-in-out",
          // Mobile specifics
          isSidebarOpen ? "translate-x-0 w-64" : "-translate-x-full w-64",
          // Desktop specifics
          "md:relative md:translate-x-0",
          isSidebarCollapsed ? "md:w-20" : "md:w-64"
        )}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
