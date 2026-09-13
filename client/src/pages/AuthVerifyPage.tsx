import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import PageLayout from '../components/PageLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { trpc } from '../lib/trpc';
import { dashboardPathForRole, type PortalAudience } from '@shared/roles';

const AuthVerifyPage = () => {
  const [, setLocation] = useLocation();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [errorMessage, setErrorMessage] = useState('');
  const [redirectPath, setRedirectPath] = useState('/client-portal');

  const verifyMutation = trpc.magicLink.verifyMagicLink.useMutation({
    onSuccess: (data) => {
      setStatus('success');
      const path =
        data.user.dashboardPath || dashboardPathForRole(data.user.role);
      setRedirectPath(path);
      setTimeout(() => {
        setLocation(path);
      }, 1200);
    },
    onError: (error) => {
      setStatus('error');
      setErrorMessage(error.message || 'Failed to verify magic link');
    },
  });

  useEffect(() => {
    // Get token from URL query params
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const portalParam = params.get('portal');
    const portal: PortalAudience | undefined =
      portalParam === 'team' || portalParam === 'client'
        ? portalParam
        : undefined;

    if (!token) {
      setStatus('error');
      setErrorMessage('No verification token found in URL');
      return;
    }

    // Verify the magic link token
    verifyMutation.mutate({ token, portal });
  }, []);

  return (
    <PageLayout>
      <section className="min-h-screen flex items-center justify-center py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-md mx-auto">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader className="text-center">
                {status === 'verifying' && (
                  <>
                    <div className="mx-auto mb-4 w-16 h-16 flex items-center justify-center">
                      <Loader2 className="h-12 w-12 text-blue-400 animate-spin" />
                    </div>
                    <CardTitle className="text-white text-2xl">Verifying...</CardTitle>
                    <CardDescription className="text-gray-400">
                      Please wait while we verify your magic link
                    </CardDescription>
                  </>
                )}

                {status === 'success' && (
                  <>
                    <div className="mx-auto mb-4 w-16 h-16 flex items-center justify-center bg-green-500/20 rounded-full">
                      <CheckCircle2 className="h-12 w-12 text-green-400" />
                    </div>
                    <CardTitle className="text-white text-2xl">Success!</CardTitle>
                    <CardDescription className="text-gray-400">
                      You've been successfully authenticated
                    </CardDescription>
                  </>
                )}

                {status === 'error' && (
                  <>
                    <div className="mx-auto mb-4 w-16 h-16 flex items-center justify-center bg-red-500/20 rounded-full">
                      <XCircle className="h-12 w-12 text-red-400" />
                    </div>
                    <CardTitle className="text-white text-2xl">Verification Failed</CardTitle>
                    <CardDescription className="text-gray-400">
                      {errorMessage}
                    </CardDescription>
                  </>
                )}
              </CardHeader>

              <CardContent className="text-center">
                {status === 'success' && (
                  <p className="text-gray-300 mb-4">
                    Opening your dashboard…
                  </p>
                )}

                {status === 'error' && (
                  <div className="space-y-4">
                    <p className="text-gray-300">
                      The magic link may have expired or already been used.
                    </p>
                    <Button
                      onClick={() => setLocation('/client-portal')}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      Request New Magic Link
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </PageLayout>
  );
};

export default AuthVerifyPage;
