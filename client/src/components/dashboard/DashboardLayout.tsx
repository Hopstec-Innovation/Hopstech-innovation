import { ReactNode, useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  FolderKanban,
  MessageSquare,
  FileText,
  User,
  LogOut,
  Menu,
  X,
  LifeBuoy,
  BarChart3,
} from "lucide-react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { trpc } from "../../lib/trpc";
import { toast } from "sonner";
import { cn } from "../../lib/utils";
import { useAuth } from "../../hooks/useAuth";
import { getClientPortalLoginPath } from "../../const";
import { FullScreenLoader } from "../ui/loading-spinner";
import NotificationCenter from "./NotificationCenter";
import PWAInstallPrompt from "../pwa/PWAInstallPrompt";
import PWAUpdatePrompt from "../pwa/PWAUpdatePrompt";
import OfflineIndicator from "../pwa/OfflineIndicator";
import { BrandLogo } from "../BrandLogo";
import { COMPANY_NAME } from "@shared/const";
import "./portal.css";

interface DashboardLayoutProps {
  children: ReactNode;
}

const pageTitle = (location: string) => {
  if (location === "/client-portal") return "Dashboard";
  if (location.startsWith("/client-portal/projects")) return "Projects";
  if (location.startsWith("/client-portal/messages")) return "Messages";
  if (location.startsWith("/client-portal/invoices")) return "Invoices";
  if (location.startsWith("/client-portal/support")) return "Support";
  if (location.startsWith("/client-portal/analytics")) return "Analytics";
  if (location.startsWith("/client-portal/profile")) return "Profile";
  return "Client portal";
};

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const [location, setLocation] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();

  useEffect(() => {
    if (authLoading) return;
    if (isAuthenticated) return;
    if (location === getClientPortalLoginPath()) return;
    setLocation(getClientPortalLoginPath());
  }, [authLoading, isAuthenticated, location, setLocation]);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location]);

  const { data: stats } = trpc.clientPortal.getDashboardStats.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const logoutMutation = trpc.magicLink.logout.useMutation({
    onSuccess: () => {
      toast.success("Logged out successfully");
      window.location.href = getClientPortalLoginPath();
    },
    onError: () => {
      toast.error("Failed to logout");
    },
  });

  if (authLoading) {
    return <FullScreenLoader message="Loading Hopstec portal..." />;
  }

  if (!isAuthenticated) {
    return <FullScreenLoader message="Redirecting to sign in..." />;
  }

  const navItems = [
    {
      name: "Dashboard",
      href: "/client-portal",
      icon: LayoutDashboard,
      badge: null as number | null,
    },
    {
      name: "Projects",
      href: "/client-portal/projects",
      icon: FolderKanban,
      badge: stats?.projects.active || 0,
    },
    {
      name: "Messages",
      href: "/client-portal/messages",
      icon: MessageSquare,
      badge: stats?.messages.unread || 0,
    },
    {
      name: "Invoices",
      href: "/client-portal/invoices",
      icon: FileText,
      badge: stats?.invoices.pending || 0,
    },
    {
      name: "Support",
      href: "/client-portal/support",
      icon: LifeBuoy,
      badge: stats?.tickets.open || 0,
    },
    {
      name: "Analytics",
      href: "/client-portal/analytics",
      icon: BarChart3,
      badge: null,
    },
    {
      name: "Profile",
      href: "/client-portal/profile",
      icon: User,
      badge: null,
    },
    ...(user?.role === "admin"
      ? [
          {
            name: "Internal ops",
            href: "/internal",
            icon: BarChart3,
            badge: null as number | null,
          },
        ]
      : []),
  ];

  const isActive = (href: string) => {
    if (href === "/client-portal") {
      return location === href;
    }
    return location.startsWith(href);
  };

  const renderNav = (onNavigate?: () => void) =>
    navItems.map((item) => {
      const Icon = item.icon;
      const active = isActive(item.href);

      return (
        <Link key={item.name} href={item.href}>
          <a
            className={cn("portal-nav-link", active && "is-active")}
            onClick={onNavigate}
          >
            <span className="portal-nav-link-main">
              <Icon className="h-4 w-4" />
              {item.name}
            </span>
            {item.badge !== null && item.badge > 0 ? (
              <Badge className="h-5 min-w-5 border-0 bg-[var(--hopstec-teal)] px-1.5 text-slate-950">
                {item.badge}
              </Badge>
            ) : null}
          </a>
        </Link>
      );
    });

  const brandBlock = (
    <Link href="/">
      <a className="portal-brand">
        <BrandLogo size="sm" showRing={false} />
        <span className="portal-brand-text">
          <span className="portal-brand-name">{COMPANY_NAME}</span>
          <span className="portal-brand-sub">Client portal</span>
        </span>
      </a>
    </Link>
  );

  return (
    <div className="portal-shell">
      <aside className="portal-sidebar">
        {brandBlock}
        <nav className="portal-nav">{renderNav()}</nav>
        <div className="portal-sidebar-footer">
          <Button
            onClick={() => logoutMutation.mutate()}
            variant="ghost"
            className="w-full justify-start text-gray-400 hover:bg-white/5 hover:text-white"
            disabled={logoutMutation.isPending}
          >
            <LogOut className="mr-3 h-4 w-4" />
            Log out
          </Button>
        </div>
      </aside>

      <div className="portal-main">
        <header className="portal-topbar">
          <h1 className="portal-topbar-title">{pageTitle(location)}</h1>
          <NotificationCenter />
        </header>

        <header className="portal-mobile-bar">
          <Link href="/">
            <a className="flex items-center gap-2">
              <BrandLogo size="xs" showRing={false} />
              <span className="text-sm font-semibold text-white">Hopstec</span>
            </a>
          </Link>
          <div className="flex items-center gap-1">
            <OfflineIndicator />
            <NotificationCenter />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(true)}
              className="text-white"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </header>

        {sidebarOpen ? (
          <div className="portal-mobile-drawer lg:hidden">
            <button
              type="button"
              className="portal-mobile-drawer-backdrop"
              aria-label="Close menu"
              onClick={() => setSidebarOpen(false)}
            />
            <div className="portal-mobile-drawer-panel">
              <div className="flex items-center justify-between border-b border-white/10 pr-2">
                {brandBlock}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSidebarOpen(false)}
                  className="text-white"
                  aria-label="Close menu"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <nav className="portal-nav">{renderNav(() => setSidebarOpen(false))}</nav>
              <div className="portal-sidebar-footer">
                <Button
                  onClick={() => logoutMutation.mutate()}
                  variant="ghost"
                  className="w-full justify-start text-gray-400 hover:bg-white/5 hover:text-white"
                  disabled={logoutMutation.isPending}
                >
                  <LogOut className="mr-3 h-4 w-4" />
                  Log out
                </Button>
              </div>
            </div>
          </div>
        ) : null}

        {children}
      </div>

      <PWAInstallPrompt />
      <PWAUpdatePrompt />
    </div>
  );
};

export default DashboardLayout;
