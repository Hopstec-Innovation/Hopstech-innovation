import { Link, useLocation } from "wouter";
import { useEffect } from "react";
import { BrandLogo } from "@/components/BrandLogo";
import { COMPANY_NAME } from "@shared/const";
import { useAuth } from "@/hooks/useAuth";
import { FullScreenLoader } from "@/components/ui/loading-spinner";
import { getClientPortalLoginPath } from "@/const";
import { accessRoleLabel, isInternalRole } from "@shared/roles";
import "@/components/dashboard/portal.css";

type InternalLayoutProps = {
  children: React.ReactNode;
  title?: string;
};

const InternalLayout = ({
  children,
  title = "Delivery console",
}: InternalLayoutProps) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const canAccess = isInternalRole(user?.role);

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      setLocation(`${getClientPortalLoginPath()}?portal=team`);
      return;
    }
    if (!canAccess) {
      setLocation("/client-portal");
    }
  }, [isLoading, isAuthenticated, canAccess, setLocation]);

  if (isLoading || !isAuthenticated || !canAccess) {
    return <FullScreenLoader message="Loading Hopstec delivery console..." />;
  }

  return (
    <div className="portal-shell">
      <aside className="portal-sidebar" style={{ display: "flex" }}>
        <Link href="/internal">
          <a className="portal-brand">
            <BrandLogo size="sm" showRing={false} />
            <span className="portal-brand-text">
              <span className="portal-brand-name">{COMPANY_NAME}</span>
              <span className="portal-brand-sub">Engineering ops</span>
            </span>
          </a>
        </Link>
        <nav className="portal-nav">
          <Link href="/internal">
            <a className="portal-nav-link">Engagements</a>
          </Link>
          <Link href="/internal/intake">
            <a className="portal-nav-link">Intake queue</a>
          </Link>
          <Link href="/internal/team">
            <a className="portal-nav-link">Team & roles</a>
          </Link>
          <Link href="/client-portal">
            <a className="portal-nav-link">Client portal</a>
          </Link>
          <Link href="/">
            <a className="portal-nav-link">Public site</a>
          </Link>
        </nav>
        <div className="mt-auto border-t border-white/10 p-4 text-xs text-gray-400">
          <p className="font-medium text-white">{user?.name}</p>
          <p>{user?.jobTitle || accessRoleLabel(user?.role)}</p>
        </div>
      </aside>
      <div className="portal-main">
        <header className="portal-topbar" style={{ display: "flex" }}>
          <h1 className="portal-topbar-title">{title}</h1>
        </header>
        <div className="flex-1 overflow-y-auto p-6">{children}</div>
      </div>
    </div>
  );
};

export default InternalLayout;
