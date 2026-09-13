import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, Mail } from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/useAuth";
import { FullScreenLoader } from "@/components/ui/loading-spinner";
import { COMPANY_NAME } from "@shared/const";
import { isInternalRole } from "@shared/roles";
import { useLocation } from "wouter";
import "@/components/dashboard/portal.css";

/**
 * Staff-only sign-in. Not linked from the public site or client portal.
 * Access is still gated server-side: only provisioned staff/admin accounts
 * receive a magic link; responses do not reveal whether an email exists.
 */
const InternalStaffLoginPage = () => {
  const { isAuthenticated, user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (isAuthenticated && user && isInternalRole(user.role)) {
      setLocation("/internal");
    }
  }, [authLoading, isAuthenticated, user, setLocation]);

  const magicLinkMutation = trpc.magicLink.requestMagicLink.useMutation({
    onSuccess: () => {
      setSent(true);
    },
    onError: () => {
      // Keep UI generic — never surface provisioning details on this surface.
      setSent(true);
    },
  });

  if (authLoading) {
    return <FullScreenLoader message="Checking session..." />;
  }

  if (isAuthenticated && user && isInternalRole(user.role)) {
    return <FullScreenLoader message="Opening console..." />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#070b12] px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <BrandLogo size="sm" showRing={false} />
          <p className="mt-4 text-xs uppercase tracking-[0.2em] text-gray-500">
            {COMPANY_NAME}
          </p>
          <h1 className="mt-2 text-xl font-medium text-white">Staff sign-in</h1>
          <p className="mt-2 text-sm text-gray-500">
            Restricted access. Accounts are provisioned by an administrator.
          </p>
        </div>

        <div className="rounded-xl border border-white/10 bg-slate-950/80 p-6">
          {sent ? (
            <div className="space-y-3 text-center">
              <CheckCircle2 className="mx-auto h-8 w-8 text-[var(--hopstec-teal)]" />
              <p className="text-sm text-gray-300">
                If this account is authorised, a sign-in link is on its way.
                Check your inbox within 15 minutes.
              </p>
              <Button
                variant="ghost"
                className="text-gray-400 hover:text-white"
                onClick={() => {
                  setSent(false);
                  setEmail("");
                }}
              >
                Try another email
              </Button>
            </div>
          ) : (
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                magicLinkMutation.mutate({
                  email,
                  portal: "team",
                });
              }}
            >
              <div className="space-y-2">
                <Label htmlFor="staffEmail" className="text-white">
                  Work email
                </Label>
                <Input
                  id="staffEmail"
                  type="email"
                  required
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="border-white/10 bg-slate-950 text-white"
                  placeholder="name@company.com"
                />
              </div>
              <Button
                type="submit"
                disabled={magicLinkMutation.isPending}
                className="w-full bg-[var(--hopstec-teal)] text-slate-950 hover:bg-[var(--hopstec-teal)]/90"
              >
                {magicLinkMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending…
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    Send sign-in link
                  </>
                )}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default InternalStaffLoginPage;
