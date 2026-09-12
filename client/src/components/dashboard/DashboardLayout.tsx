import { ReactNode, useEffect, useState } from 'react';
import { Link, useLocation } from 'wouter';
import {
  LayoutDashboard,
  FolderKanban,
  MessageSquare,
  FileText,
  User,
  Bell,
  LogOut,
  Menu,
  X,
  LifeBuoy,
  BarChart3
} from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { trpc } from '../../lib/trpc';
import { toast } from 'sonner';
import { cn } from '../../lib/utils';
import { useAuth } from '../../hooks/useAuth';
import { getClientPortalLoginPath } from '../../const';
import { FullScreenLoader } from '../ui/loading-spinner';
import NotificationCenter from './NotificationCenter';
import PWAInstallPrompt from '../pwa/PWAInstallPrompt';
import PWAUpdatePrompt from '../pwa/PWAUpdatePrompt';
import OfflineIndicator from '../pwa/OfflineIndicator';

interface DashboardLayoutProps {
  children: ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const [location, setLocation] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  useEffect(() => {
    if (authLoading) return;
    if (isAuthenticated) return;
    if (location === getClientPortalLoginPath()) return;
    setLocation(getClientPortalLoginPath());
  }, [authLoading, isAuthenticated, location, setLocation]);

  const { data: stats } = trpc.clientPortal.getDashboardStats.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const { data: notifications } = trpc.clientPortal.getNotifications.useQuery(
    {
      limit: 5,
      offset: 0,
      unreadOnly: true,
    },
    { enabled: isAuthenticated }
  );

  const logoutMutation = trpc.magicLink.logout.useMutation({
    onSuccess: () => {
      toast.success('Logged out successfully');
      window.location.href = getClientPortalLoginPath();
    },
    onError: () => {
      toast.error('Failed to logout');
    },
  });

  if (authLoading) {
    return <FullScreenLoader message="Loading HOPSTECH Portal..." />;
  }

  if (!isAuthenticated) {
    return <FullScreenLoader message="Redirecting to sign in..." />;
  }

  const navItems = [
    {
      name: 'Dashboard',
      href: '/client-portal',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      name: 'Projects',
      href: '/client-portal/projects',
      icon: FolderKanban,
      badge: stats?.projects.active || 0,
    },
    {
      name: 'Messages',
      href: '/client-portal/messages',
      icon: MessageSquare,
      badge: stats?.messages.unread || 0,
    },
    {
      name: 'Invoices',
      href: '/client-portal/invoices',
      icon: FileText,
      badge: stats?.invoices.pending || 0,
    },
    {
      name: 'Support',
      href: '/client-portal/support',
      icon: LifeBuoy,
      badge: stats?.tickets.open || 0,
    },
    {
      name: 'Analytics',
      href: '/client-portal/analytics',
      icon: BarChart3,
      badge: null,
    },
    {
      name: 'Profile',
      href: '/client-portal/profile',
      icon: User,
      badge: null,
    },
  ];

  const isActive = (href: string) => {
    if (href === '/client-portal') {
      return location === href;
    }
    return location.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 bg-slate-900 border-r border-slate-800">
        <div className="p-6 border-b border-slate-800">
          <Link href="/">
            <a className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">H</span>
              </div>
              <div>
                <h2 className="text-white font-bold text-lg">HOPSTECH</h2>
                <p className="text-gray-400 text-xs">Client Portal</p>
              </div>
            </a>
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            
            return (
              <Link key={item.name} href={item.href}>
                <a
                  className={cn(
                    "flex items-center justify-between px-4 py-3 rounded-lg transition-all",
                    active
                      ? "bg-blue-600 text-white"
                      : "text-gray-400 hover:bg-slate-800 hover:text-white"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="h-5 w-5" />
                    <span className="font-medium">{item.name}</span>
                  </div>
                  {item.badge !== null && item.badge > 0 && (
                    <Badge className="bg-red-500 text-white border-0 h-5 min-w-5 px-1.5">
                      {item.badge}
                    </Badge>
                  )}
                </a>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <Button
            onClick={() => logoutMutation.mutate()}
            variant="ghost"
            className="w-full justify-start text-gray-400 hover:text-white hover:bg-slate-800"
            disabled={logoutMutation.isPending}
          >
            <LogOut className="h-5 w-5 mr-3" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar - Desktop */}
        <header className="hidden lg:flex bg-slate-900 border-b border-slate-800 px-6 py-4 items-center justify-between">
          <div>
            <h1 className="text-white font-semibold text-lg">
              {location === '/client-portal' && 'Dashboard'}
              {location.startsWith('/client-portal/projects') && 'Projects'}
              {location.startsWith('/client-portal/messages') && 'Messages'}
              {location.startsWith('/client-portal/invoices') && 'Invoices'}
              {location.startsWith('/client-portal/support') && 'Support'}
              {location.startsWith('/client-portal/analytics') && 'Analytics'}
              {location.startsWith('/client-portal/profile') && 'Profile'}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <NotificationCenter />
          </div>
        </header>

        {/* Top Bar - Mobile */}
        <header className="lg:hidden bg-slate-900 border-b border-slate-800 p-4">
          <div className="flex items-center justify-between">
            <Link href="/">
              <a className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold">H</span>
                </div>
                <span className="text-white font-bold">HOPSTECH</span>
              </a>
            </Link>
            <div className="flex items-center gap-2">
              <OfflineIndicator />
              <NotificationCenter />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="text-white"
              >
                {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </Button>
            </div>
          </div>
        </header>

        {children}
      </div>

      {/* PWA Components */}
      <PWAInstallPrompt />
      <PWAUpdatePrompt />
    </div>
  );
};

export default DashboardLayout;

