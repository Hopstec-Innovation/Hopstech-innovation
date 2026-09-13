import { Link, useLocation } from "wouter";
import { useEffect, useState } from "react";
import { BrandLogo } from "@/components/BrandLogo";
import { useAuth } from "@/hooks/useAuth";
import { FullScreenLoader } from "@/components/ui/loading-spinner";
import { accessRoleLabel, isInternalRole } from "@shared/roles";
import { Layers3, Inbox, Users2, ShieldCheck, ArrowUpRight, Menu, X, LogOut, MessagesSquare } from "lucide-react";
import { trpc } from "@/lib/trpc";
import "@/components/dashboard/portal.css";
import "./internal.css";

const navigation = [
  { href: "/internal", label: "Engagements", icon: Layers3 },
  { href: "/internal/inbox", label: "Team inbox", icon: MessagesSquare },
  { href: "/internal/intake", label: "Intake queue", icon: Inbox },
  { href: "/internal/team", label: "Team & access", icon: Users2 },
];

export default function InternalLayout({ children, title = "Delivery workspace" }: { children: React.ReactNode; title?: string }) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [location, setLocation] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const canAccess = isInternalRole(user?.role);
  const utils = trpc.useUtils();
  const availability = trpc.chat.getMyAvailability.useQuery(undefined, { enabled: canAccess, refetchInterval: 15000 });
  const setAvailability = trpc.chat.setAvailability.useMutation({
    onSuccess: () => {
      void utils.chat.getMyAvailability.invalidate();
      void utils.chat.listInbox.invalidate();
    },
  });
  const logout = trpc.magicLink.logout.useMutation({ onSuccess: () => { window.location.href = "/internal/login"; } });
  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) setLocation("/internal/login");
    else if (!canAccess) setLocation("/client-portal");
  }, [isLoading, isAuthenticated, canAccess, setLocation]);
  useEffect(() => { setMenuOpen(false); }, [location]);
  if (isLoading || !isAuthenticated || !canAccess) return <FullScreenLoader message="Opening engineering workspace…" />;
  return <div className="ops-shell">
    {menuOpen && <button className="ops-backdrop" aria-label="Close navigation" onClick={() => setMenuOpen(false)} />}
    <aside className={`ops-sidebar ${menuOpen ? "is-open" : ""}`}>
      <Link href="/internal" className="ops-brand"><BrandLogo size="sm" showRing={false} /><span><strong>Hopstec</strong><small>ENGINEERING WORKSPACE</small></span></Link>
      <div className="ops-workspace-label"><span className="ops-dot" /> Internal workspace <ShieldCheck size={14} /></div>
      <nav aria-label="Engineering workspace"><p className="ops-eyebrow">Workspace</p>
        {navigation.map(({ href, label, icon: Icon }) => {
          const active = href === "/internal" ? location === href || location.startsWith("/internal/projects/") : location === href;
          return <Link key={href} href={href} className={`ops-nav-link ${active ? "is-active" : ""}`} aria-current={active ? "page" : undefined}><Icon size={18} />{label}{active && <span className="ops-nav-marker" />}</Link>;
        })}
        <p className="ops-eyebrow mt-8">Other spaces</p>
        <Link href="/internal" className="ops-nav-link" title="Use Customer preview inside an engagement">Customer view is inside each engagement</Link>
        <Link href="/" className="ops-nav-link">Public website <ArrowUpRight size={15} /></Link>
      </nav>
      <div className="ops-sidebar-bottom"><ShieldCheck size={17} /><p>Staff access only<small>Client updates are published separately.</small></p></div>
      <div className="ops-profile"><div className="ops-avatar">{user?.name?.slice(0, 2).toUpperCase() || "HK"}</div><div><strong>{user?.name}</strong><small>{user?.jobTitle || accessRoleLabel(user?.role)}</small></div><button aria-label="Sign out" title="Sign out" disabled={logout.isPending} onClick={() => logout.mutate()}><LogOut size={16} /></button></div>
    </aside>
    <div className="ops-main"><header className="ops-topbar"><button className="ops-menu" aria-label={menuOpen ? "Close navigation" : "Open navigation"} aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X size={20} /> : <Menu size={20} />}</button><span className="ops-breadcrumb">Workspace <span>/</span> <strong>{title}</strong></span><div className="ml-auto flex items-center gap-2"><label className="hidden text-xs text-slate-500 sm:block" htmlFor="team-availability">Chat status</label><select id="team-availability" aria-label="Live chat availability" value={availability.data?.availability || "offline"} onChange={event => setAvailability.mutate({ availability: event.target.value as "available" | "busy" | "in_meeting" | "offline" })} className="rounded-full border border-white/10 bg-slate-950 px-3 py-1.5 text-xs capitalize text-white"><option value="available">Available</option><option value="busy">Busy</option><option value="in_meeting">In a meeting</option><option value="offline">Offline</option></select><span className="ops-private"><ShieldCheck size={14} /> Staff only</span></div></header><main className="ops-content">{children}</main></div>
  </div>;
}
