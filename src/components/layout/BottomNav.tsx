import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ArrowRightLeft, 
  Wallet, 
  Settings,
  Target,
  CalendarDays
} from 'lucide-react';
import { cn } from '@/utils/cn';

const mobileNavItems = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'Transactions', path: '/transactions', icon: ArrowRightLeft },
  { name: 'Budgets', path: '/budgets', icon: Target },
  { name: 'Calendar', path: '/calendar', icon: CalendarDays },
  { name: 'Accounts', path: '/accounts', icon: Wallet },
  { name: 'Settings', path: '/settings', icon: Settings },
];

export function BottomNav() {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border flex justify-around items-center h-16 pb-safe">
      {mobileNavItems.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          className={({ isActive }) =>
            cn(
              "flex flex-col items-center justify-center w-full h-full text-xs font-medium transition-colors",
              isActive 
                ? "text-primary" 
                : "text-muted-foreground hover:text-foreground"
            )
          }
        >
          <item.icon className="w-5 h-5 mb-1" />
          {item.name}
        </NavLink>
      ))}
    </nav>
  );
}
