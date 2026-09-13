import { useState } from "react";
import InternalLayout from "@/components/internal/InternalLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useLocation } from "wouter";

const InternalIntakePage = () => {
  const [, setLocation] = useLocation();
  const { data, isLoading, refetch } = trpc.ops.listInquiries.useQuery();
  const [userIds, setUserIds] = useState<Record<number, string>>({});

  const promote = trpc.ops.promoteInquiry.useMutation({
    onSuccess: (project) => {
      toast.success("Engagement created");
      refetch();
      setLocation(`/internal/projects/${project.id}`);
    },
    onError: (err) => toast.error(err.message),
  });

  return (
    <InternalLayout title="Intake queue">
      <p className="mb-6 max-w-2xl text-sm text-gray-400">
        Inquiries arrive by email / contact form. Promote them into an engagement once the client
        has a portal user (same email).
      </p>

      {isLoading ? (
        <p className="text-gray-400">Loading…</p>
      ) : (
        <div className="space-y-4">
          {(data || []).map((inquiry) => (
            <Card key={inquiry.id} className="portal-panel border-0 shadow-none">
              <CardHeader>
                <CardTitle className="text-white">
                  {inquiry.name} · {inquiry.projectType}
                </CardTitle>
                <p className="text-sm text-gray-400">
                  {inquiry.email} · {inquiry.status} ·{" "}
                  {new Date(inquiry.createdAt).toLocaleString()}
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-gray-300 whitespace-pre-wrap">{inquiry.description}</p>
                <div className="flex flex-wrap items-end gap-3">
                  <div className="min-w-[200px] flex-1">
                    <label className="mb-1 block text-xs text-gray-500">
                      Portal user id (if email match fails)
                    </label>
                    <Input
                      value={userIds[inquiry.id] || ""}
                      onChange={(e) =>
                        setUserIds((prev) => ({ ...prev, [inquiry.id]: e.target.value }))
                      }
                      placeholder="Optional user id"
                      className="border-white/10 bg-slate-950 text-white"
                    />
                  </div>
                  <Button
                    className="bg-[var(--hopstec-teal)] text-slate-950 hover:bg-[var(--hopstec-teal)]/90"
                    disabled={promote.isPending || inquiry.status === "accepted"}
                    onClick={() =>
                      promote.mutate({
                        inquiryId: inquiry.id,
                        userId: userIds[inquiry.id]
                          ? Number(userIds[inquiry.id])
                          : undefined,
                      })
                    }
                  >
                    Promote to engagement
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {data?.length === 0 ? (
            <p className="text-gray-400">Intake queue is empty.</p>
          ) : null}
        </div>
      )}
    </InternalLayout>
  );
};

export default InternalIntakePage;
