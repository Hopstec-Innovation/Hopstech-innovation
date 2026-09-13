import { ReactNode, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { BrandLogo } from "@/components/BrandLogo";
import { COMPANY_NAME } from "@shared/const";
import { useAuth } from "@/hooks/useAuth";
import { FullScreenLoader } from "@/components/ui/loading-spinner";
import { getClientPortalLoginPath } from "@/const";
import "@/components/dashboard/portal.css";

type InternalLayoutProps = {
  children: ReactNode;
  title?: string;
};

const InternalLayout = ({ children, title = "Ops" }: InternalLayoutProps) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      setLocation(getClientPortalLoginPath());
      return;
    }
    if (user?.role !== "admin") {
      setLocation("/client-portal");
    }
  }, [isLoading, isAuthenticated, user, setLocation]);

  if (isLoading || !isAuthenticated || user?.role !== "admin") {
    return <FullScreenLoader message="Loading Hopstec ops..." />;
  }

  return (
    <div className="portal-shell">
      <aside className="portal-sidebar" style={{ display: "flex" }}>
        <Link href="/internal">
          <a className="portal-brand">
            <BrandLogo size="sm" showRing={false} />
            <span className="portal-brand-text">
              <span className="portal-brand-name">{COMPANY_NAME}</span>
              <span className="portal-brand-sub">Internal ops</span>
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
          <Link href="/client-portal">
            <a className="portal-nav-link">Client portal</a>
          </Link>
          <Link href="/">
            <a className="portal-nav-link">Public site</a>
          </Link>
        </nav>
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
