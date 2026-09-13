import { useState } from "react";
import InternalLayout from "@/components/internal/InternalLayout";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  STAFF_JOB_TITLES,
  accessRoleLabel,
  isInternalRole,
} from "@shared/roles";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Search, Users2, LockKeyhole } from "lucide-react";

const InternalTeamPage = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const utils = trpc.useUtils();
  const staffQuery = trpc.ops.listStaff.useQuery(undefined, { enabled: isInternalRole(user?.role), retry: false });
  const workQuery = trpc.ops.listEngagements.useQuery(undefined, { enabled: isInternalRole(user?.role), retry: false, refetchInterval: 15000 });
  const [search, setSearch] = useState("");
  const [showProvision, setShowProvision] = useState(false);
  const [pendingRevoke, setPendingRevoke] = useState<number | null>(null);
  const directoryQuery = trpc.ops.listDirectoryUsers.useQuery(undefined, {
    enabled: isAdmin,
  });

  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<"staff" | "admin">("staff");
  const [jobTitle, setJobTitle] =
    useState<(typeof STAFF_JOB_TITLES)[number]>("Full-Stack Engineer");

  const provision = trpc.ops.provisionStaffByEmail.useMutation({
    onSuccess: () => {
      toast.success("Team access provisioned");
      setEmail("");
      setName("");
      utils.ops.listStaff.invalidate();
      utils.ops.listDirectoryUsers.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const setAccess = trpc.ops.setStaffAccess.useMutation({
    onSuccess: () => {
      toast.success("Role updated");
      setPendingRevoke(null);
      utils.ops.listStaff.invalidate();
      utils.ops.listDirectoryUsers.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  return (
    <InternalLayout title="Team & roles">
      <div className="ops-heading"><div><p className="ops-eyebrow">People & ownership</p><h1>The team behind delivery.</h1><p>Find engineers, review their active engagements, and manage access to the internal workspace.</p></div>{isAdmin && <button className="ops-button primary" onClick={() => setShowProvision(!showProvision)}><Users2 size={15} />{showProvision ? "Close access form" : "Add teammate"}</button>}</div>
      <div className="ops-panel"><div className="ops-toolbar"><label className="ops-search"><Search size={16} /><input aria-label="Search team" placeholder="Search people, roles or email…" value={search} onChange={e => setSearch(e.target.value)} /></label><span className="ops-private"><LockKeyhole size={14} />Only admins can change access</span></div></div>
      {staffQuery.isError && <div className="ops-error" role="alert">Team directory couldn’t be loaded. <button className="ops-button" onClick={() => staffQuery.refetch()}>Retry</button></div>}

      <div className="mb-8 grid gap-4 md:grid-cols-2">
        {(staffQuery.data || []).filter(member => `${member.name} ${member.email} ${member.jobTitle}`.toLowerCase().includes(search.toLowerCase())).map((member) => (
          <Card key={member.id} className="portal-stat-card border-0 shadow-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-white">
                {member.name || member.email}
              </CardTitle>
              <p className="text-sm text-[var(--hopstec-teal)]">
                {member.jobTitle || accessRoleLabel(member.role)}
              </p>
            </CardHeader>
            <CardContent className="flex items-center justify-between gap-2 text-xs text-gray-500">
              <span>{member.email}</span>
              <Badge className="border-white/15 bg-white/5 text-gray-300">
                {accessRoleLabel(member.role)}
              </Badge>
            </CardContent>
            <div className="border-t border-white/10 mx-6 pb-5 pt-3"><p className="text-xs text-slate-400 mb-2">{workQuery.isError ? "Assignments unavailable" : `${workQuery.data?.filter(p => p.leadAssigneeId === member.id && p.commercialStage !== "closed").length ?? "—"} active engagements`}</p>{workQuery.data?.filter(p => p.leadAssigneeId === member.id && p.commercialStage !== "closed").map(p => <a key={p.id} href={`/internal/projects/${p.id}`} className="block text-xs text-emerald-200 py-1">{p.title} →</a>)}</div>
          </Card>
        ))}
        {staffQuery.isLoading ? <Skeleton className="h-28 w-full" /> : null}
        {!staffQuery.isLoading && staffQuery.data?.length === 0 ? (
          <p className="text-gray-400">No staff provisioned yet.</p>
        ) : null}
      </div>

      {isAdmin && showProvision ? (
        <Card className="portal-stat-card mb-8 border-0 shadow-none">
          <CardHeader>
            <CardTitle className="text-white">Provision Hopstec team</CardTitle>
            <p className="text-sm text-gray-400">
              Grants Engineering ops access. The teammate signs in with magic
              link at /internal/login. This route is not linked from the public website.
            </p>
          </CardHeader>
          <CardContent>
            <form
              className="grid gap-4 md:grid-cols-2"
              onSubmit={(e) => {
                e.preventDefault();
                provision.mutate({ email, name: name || undefined, role, jobTitle });
              }}
            >
              <div className="space-y-2">
                <Label className="text-white">Work email</Label>
                <Input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="border-white/10 bg-slate-950 text-white"
                  placeholder="engineer@hopstecinnovation.com"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-white">Name</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="border-white/10 bg-slate-950 text-white"
                  placeholder="Optional"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-white">Access role</Label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as "staff" | "admin")}
                  className="h-10 w-full rounded-md border border-white/10 bg-slate-950 px-3 text-sm text-white"
                >
                  <option value="staff">Staff (engineering / delivery)</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label className="text-white">Job title</Label>
                <select
                  value={jobTitle}
                  onChange={(e) =>
                    setJobTitle(e.target.value as (typeof STAFF_JOB_TITLES)[number])
                  }
                  className="h-10 w-full rounded-md border border-white/10 bg-slate-950 px-3 text-sm text-white"
                >
                  {STAFF_JOB_TITLES.map((title) => (
                    <option key={title} value={title}>
                      {title}
                    </option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <Button
                  type="submit"
                  disabled={provision.isPending}
                  className="bg-[var(--hopstec-teal)] text-slate-950 hover:bg-[var(--hopstec-teal)]/90"
                >
                  {provision.isPending ? "Saving…" : "Grant team access"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : null}

      {isAdmin && directoryQuery.isError && <div className="ops-error" role="alert">Access directory couldn’t be loaded. <button className="ops-button" onClick={() => directoryQuery.refetch()}>Retry</button></div>}
      {isAdmin && directoryQuery.data ? (
        <div>
          <h2 className="mb-3 text-lg font-medium text-white">Directory</h2>
          <div className="space-y-2">
            {directoryQuery.data.filter(row => `${row.name} ${row.email}`.toLowerCase().includes(search.toLowerCase())).map((row) => (
              <div
                key={row.id}
                className="flex flex-col gap-3 rounded-lg border border-white/10 bg-slate-900/40 px-4 py-3 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <p className="text-sm text-white">
                    {row.name || "—"}{" "}
                    <span className="text-gray-500">· {row.email}</span>
                  </p>
                  <p className="text-xs text-gray-400">
                    {row.jobTitle || accessRoleLabel(row.role)}
                    {isInternalRole(row.role) ? " · engineering ops" : " · client portal"}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {!isInternalRole(row.role) ? (
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-white/15 text-white"
                      disabled={setAccess.isPending}
                      onClick={() =>
                        setAccess.mutate({
                          userId: row.id,
                          role: "staff",
                          jobTitle: "Full-Stack Engineer",
                        })
                      }
                    >
                      Make staff
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-gray-400"
                      disabled={setAccess.isPending || row.id === user?.id}
                      onClick={() =>
                        pendingRevoke !== row.id ? setPendingRevoke(row.id) : setAccess.mutate({
                          userId: row.id,
                          role: "client",
                          jobTitle: null,
                        })
                      }
                    >
                      {row.id === user?.id ? "Your account" : pendingRevoke === row.id ? "Confirm revoke access" : "Revoke staff access"}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </InternalLayout>
  );
};

export default InternalTeamPage;
