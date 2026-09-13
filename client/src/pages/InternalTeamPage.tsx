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

const InternalTeamPage = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const utils = trpc.useUtils();
  const staffQuery = trpc.ops.listStaff.useQuery();
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
      utils.ops.listStaff.invalidate();
      utils.ops.listDirectoryUsers.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  return (
    <InternalLayout title="Team & roles">
      <p className="mb-6 max-w-2xl text-sm text-gray-400">
        Hopstec delivery access uses engineering titles — Solutions Architect,
        Full-Stack Engineer, DevOps, IoT, Delivery Manager, and related roles.
        Clients never see these assignments.
      </p>

      <div className="mb-8 grid gap-4 md:grid-cols-2">
        {(staffQuery.data || []).map((member) => (
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
          </Card>
        ))}
        {staffQuery.isLoading ? <Skeleton className="h-28 w-full" /> : null}
        {!staffQuery.isLoading && staffQuery.data?.length === 0 ? (
          <p className="text-gray-400">No staff provisioned yet.</p>
        ) : null}
      </div>

      {isAdmin ? (
        <Card className="portal-stat-card mb-8 border-0 shadow-none">
          <CardHeader>
            <CardTitle className="text-white">Provision Hopstec team</CardTitle>
            <p className="text-sm text-gray-400">
              Grants Engineering ops access. The teammate signs in with magic
              link under “Hopstec team”.
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

      {isAdmin && directoryQuery.data ? (
        <div>
          <h2 className="mb-3 text-lg font-medium text-white">Directory</h2>
          <div className="space-y-2">
            {directoryQuery.data.map((row) => (
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
                      onClick={() =>
                        setAccess.mutate({
                          userId: row.id,
                          role: "client",
                          jobTitle: null,
                        })
                      }
                    >
                      Revoke to client
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
