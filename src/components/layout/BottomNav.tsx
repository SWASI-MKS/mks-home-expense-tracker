import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ArrowRightLeft, 
  Wallet, 
  Target,
  CalendarDays
} from 'lucide-react';
import { cn } from '@/utils/cn';

const mobileNavItems = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'Transactions', path: '/transactions', icon: ArrowRightLeft },
  { name: 'Accounts', path: '/accounts', icon: Wallet },
  { name: 'Budgets', path: '/budgets', icon: Target },
  { name: 'Calendar', path: '/calendar', icon: CalendarDays },
];

export function BottomNav() {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border flex justify-around items-center h-16 pb-safe z-30">
      {mobileNavItems.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          className={({ isActive }) =>
            cn(
              "flex flex-col items-center justify-center w-full h-full text-[10px] font-medium transition-colors",
              isActive 
                ? "text-primary" 
                : "text-muted-foreground hover:text-foreground"
            )
          }
        >
          <item.icon className="w-5 h-5 mb-1" />
          <span className="truncate w-full text-center px-1">{item.name}</span>
        </NavLink>
      ))}
    </nav>
  );
}
