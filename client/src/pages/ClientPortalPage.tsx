import { useEffect, useState } from 'react';
import { Rocket, CheckCircle2, Clock, TrendingUp, Mail, Building2, Phone, FileText, LogIn, Loader2 } from 'lucide-react';
import PageLayout from '../components/PageLayout';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { trpc } from '../lib/trpc';
import { toast } from 'sonner';
import { useAuth } from '../hooks/useAuth';
import DashboardLayout from '../components/dashboard/DashboardLayout';
import DashboardOverview from '../components/dashboard/DashboardOverview';
import { FullScreenLoader } from '../components/ui/loading-spinner';
import { COMPANY_NAME } from '@shared/const';
import { accessRoleLabel, isInternalRole } from '@shared/roles';
import { useLocation } from 'wouter';
import '../components/dashboard/portal.css';

const ClientPortalPage = () => {
  const { isAuthenticated, user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    phone: '',
    projectType: 'web-app',
    budget: '',
    timeline: '',
    description: '',
  });

  const [magicLinkEmail, setMagicLinkEmail] = useState('');
  const [magicLinkName, setMagicLinkName] = useState('');
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  useEffect(() => {
    // Staff accounts use the customer preview inside each engagement.
    if (!authLoading && isAuthenticated && user && isInternalRole(user.role)) {
      setLocation("/internal");
    }
  }, [authLoading, isAuthenticated, user, setLocation]);


  const inquiryMutation = trpc.clientPortal.submitInquiry.useMutation({
    onSuccess: () => {
      toast.success('Project inquiry submitted! Check your email for next steps.');
      setFormData({
        name: '',
        email: '',
        company: '',
        phone: '',
        projectType: 'web-app',
        budget: '',
        timeline: '',
        description: '',
      });
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to submit inquiry. Please try again.');
    },
  });

  const magicLinkMutation = trpc.magicLink.requestMagicLink.useMutation({
    onSuccess: () => {
      toast.success('Magic link sent! Check your email to sign in.');
      setMagicLinkSent(true);
    },
    onError: (error) => {
      const message =
        error.message ||
        "Failed to send magic link. Please try again or contact support.";
      toast.error(message);
      setMagicLinkSent(false);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    inquiryMutation.mutate(formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleMagicLinkSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    magicLinkMutation.mutate({
      email: magicLinkEmail,
      name: magicLinkName || undefined,
      portal: 'client',
    });
  };

  const features = [
    {
      icon: <Rocket className="h-6 w-6 text-[var(--hopstec-teal)]" />,
      title: 'Project Collaboration',
      description: 'Submit project inquiries and collaborate directly with our team',
    },
    {
      icon: <TrendingUp className="h-6 w-6 text-[var(--hopstec-teal)]" />,
      title: 'Real-Time Progress',
      description: 'Track your project milestones and progress in real-time',
    },
    {
      icon: <CheckCircle2 className="h-6 w-6 text-[var(--hopstec-teal)]" />,
      title: 'Project Updates',
      description: 'Receive detailed updates and insights on your active projects',
    },
    {
      icon: <Clock className="h-6 w-6 text-[var(--hopstec-teal)]" />,
      title: 'Fast Response',
      description: 'Get quick responses and dedicated support throughout your project',
    },
  ];

  const projectTypes = [
    { value: 'web-app', label: 'Web Application' },
    { value: 'mobile-app', label: 'Mobile Application' },
    { value: 'devops', label: 'DevOps & Infrastructure' },
    { value: 'cloud-migration', label: 'Cloud Migration' },
    { value: 'consulting', label: 'Technical Consulting' },
    { value: 'other', label: 'Other' },
  ];

  // Loading state
  if (authLoading) {
    return <FullScreenLoader message="Loading Hopstec portal..." />;
  }

  // Authenticated client dashboard. Hopstec team is redirected to /internal above.
  if (isAuthenticated && user) {
    if (isInternalRole(user.role)) {
      return <FullScreenLoader message="Opening engineering workspace..." />;
    }
    return (
      <DashboardLayout>
        <main className="flex-1 overflow-y-auto">
          <div className="p-6">
            <div className="mb-8">
              <h1 className="portal-welcome-title">
                Welcome back, {user.name}
              </h1>
              <p className="portal-welcome-lede">
                {user.jobTitle
                  ? `${user.jobTitle} · ${accessRoleLabel(user.role)}`
                  : accessRoleLabel(user.role)}
                {" — "}
                here is what is happening across your projects today.
              </p>
            </div>
            <DashboardOverview />
          </div>
        </main>
      </DashboardLayout>
    );
  }

  // Not authenticated - Show Login/Registration Form
  return (
    <PageLayout>
      <section className="portal-login-hero">
        <div className="container relative z-10 mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <p className="portal-login-kicker">
              <i aria-hidden="true" />
              {COMPANY_NAME} · Client portal
            </p>
            <h1 className="mb-5 text-4xl font-medium tracking-tight text-white md:text-5xl">
              Access your <em className="font-serif italic text-[#b6e6cd]">dashboard</em>
            </h1>
            <p className="mx-auto max-w-2xl text-lg leading-7 text-gray-400">
              Passwordless sign-in for clients. Track projects, messages, and invoices in one place.
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="border-b border-white/5 py-16">
        <div className="container mx-auto px-4">
          <div className="mb-10 text-center">
            <h2 className="mb-3 text-3xl font-medium tracking-tight text-white md:text-4xl">
              Built for client visibility
            </h2>
            <p className="mx-auto max-w-2xl text-gray-400">
              A quieter, clearer workspace for the work we ship together.
            </p>
          </div>

          <div className="mx-auto grid max-w-6xl grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, index) => (
              <Card key={index} className="border-white/10 bg-slate-900/40 shadow-none">
                <CardHeader>
                  <div className="mb-4">{feature.icon}</div>
                  <CardTitle className="text-white">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-400">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Client Login Section */}
      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-md">
            <div className="mb-8 text-center">
              <h2 className="mb-3 text-3xl font-medium tracking-tight text-white">
                Sign in
              </h2>
              <p className="text-gray-400">
                Enter your email — we will send a secure link. No password needed.
              </p>
            </div>

            <Card className="border-white/10 bg-slate-900/50 shadow-none">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <LogIn className="h-5 w-5 text-[var(--hopstec-teal)]" />
                  Client portal sign-in
                </CardTitle>
                <CardDescription className="text-gray-400">
                  New clients get an account on first successful sign-in.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {magicLinkSent ? (
                  <div className="space-y-4">
                    <div className="portal-success">
                      <div className="flex items-start gap-3">
                        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[var(--hopstec-teal)]" />
                        <div className="flex-1">
                          <h3 className="mb-1 font-semibold text-white">Magic link sent</h3>
                          <p className="mb-2 text-sm text-gray-300">
                            We sent a secure sign-in link to{" "}
                            <strong className="text-white">{magicLinkEmail}</strong>
                          </p>
                          <p className="text-xs text-gray-400">
                            Check your inbox and open the link within 15 minutes.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button
                        onClick={() => {
                          magicLinkMutation.mutate({
                            email: magicLinkEmail,
                            name: magicLinkName || undefined,
                            portal: 'client',
                          });
                        }}
                        variant="outline"
                        className="flex-1 border-white/15 text-white hover:bg-white/5"
                        disabled={magicLinkMutation.isPending}
                      >
                        {magicLinkMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Resending...
                          </>
                        ) : (
                          <>
                            <Mail className="mr-2 h-4 w-4" />
                            Resend link
                          </>
                        )}
                      </Button>

                      <Button
                        onClick={() => {
                          setMagicLinkSent(false);
                          setMagicLinkEmail('');
                          setMagicLinkName('');
                        }}
                        variant="ghost"
                        className="text-gray-400 hover:bg-white/5 hover:text-white"
                      >
                        Use a different email
                      </Button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleMagicLinkSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="magicLinkName" className="text-white">
                        Your name
                      </Label>
                      <Input
                        id="magicLinkName"
                        type="text"
                        value={magicLinkName}
                        onChange={(e) => setMagicLinkName(e.target.value)}
                        className="border-white/10 bg-slate-950 text-white"
                        placeholder="Your name"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="magicLinkEmail" className="text-white">
                        Email address <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="magicLinkEmail"
                        type="email"
                        value={magicLinkEmail}
                        onChange={(e) => setMagicLinkEmail(e.target.value)}
                        required
                        className="border-white/10 bg-slate-950 text-white"
                        placeholder="you@company.com"
                      />
                    </div>

                    <Button
                      type="submit"
                      className="w-full bg-[var(--hopstec-teal)] text-slate-950 hover:bg-[var(--hopstec-teal)]/90"
                      disabled={magicLinkMutation.isPending}
                    >
                      {magicLinkMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Mail className="mr-2 h-4 w-4" />
                          Send magic link
                        </>
                      )}
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Project Inquiry Form Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Start a New Project
              </h2>
              <p className="text-gray-400 text-lg">
                Whether you're a business, individual, or seasonal client - tell us about your project and we'll get back to you within 24 hours
              </p>
            </div>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Project Inquiry Form</CardTitle>
                <CardDescription className="text-gray-400">
                  Fill out the form below to get started with your project
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-white">
                        Full Name <span className="text-red-500">*</span>
                      </Label>
                      <div className="relative">
                        <Input
                          id="name"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          required
                          className="bg-slate-900 border-slate-700 text-white pl-10"
                          placeholder="John Doe"
                        />
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-white">
                        Email Address <span className="text-red-500">*</span>
                      </Label>
                      <div className="relative">
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          value={formData.email}
                          onChange={handleChange}
                          required
                          className="bg-slate-900 border-slate-700 text-white pl-10"
                          placeholder="john@company.com"
                        />
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="company" className="text-white">
                        Company Name <span className="text-gray-500 text-sm">(Optional)</span>
                      </Label>
                      <div className="relative">
                        <Input
                          id="company"
                          name="company"
                          value={formData.company}
                          onChange={handleChange}
                          className="bg-slate-900 border-slate-700 text-white pl-10"
                          placeholder="Your Company or leave blank"
                        />
                        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-white">
                        Phone Number
                      </Label>
                      <div className="relative">
                        <Input
                          id="phone"
                          name="phone"
                          type="tel"
                          value={formData.phone}
                          onChange={handleChange}
                          className="bg-slate-900 border-slate-700 text-white pl-10"
                          placeholder="+33 6 00 00 00 00"
                        />
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="projectType" className="text-white">
                        Project Type <span className="text-red-500">*</span>
                      </Label>
                      <select
                        id="projectType"
                        name="projectType"
                        value={formData.projectType}
                        onChange={handleChange}
                        required
                        className="w-full bg-slate-900 border border-slate-700 text-white rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {projectTypes.map((type) => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="budget" className="text-white">
                        Budget Range
                      </Label>
                      <Input
                        id="budget"
                        name="budget"
                        value={formData.budget}
                        onChange={handleChange}
                        className="bg-slate-900 border-slate-700 text-white"
                        placeholder="e.g., $10k - $50k"
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="timeline" className="text-white">
                        Expected Timeline
                      </Label>
                      <Input
                        id="timeline"
                        name="timeline"
                        value={formData.timeline}
                        onChange={handleChange}
                        className="bg-slate-900 border-slate-700 text-white"
                        placeholder="e.g., 3-6 months"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-white">
                      Project Description <span className="text-red-500">*</span>
                    </Label>
                    <Textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      required
                      rows={6}
                      className="bg-slate-900 border-slate-700 text-white resize-none"
                      placeholder="Tell us about your project goals, requirements, and any specific features you need..."
                    />
                  </div>

                  <Button
                    type="submit"
                    size="lg"
                    className="w-full bg-[var(--hopstec-teal)] text-slate-950 hover:bg-[var(--hopstec-teal)]/90"
                    disabled={inquiryMutation.isPending}
                  >
                    {inquiryMutation.isPending ? (
                      <>
                        <span className="animate-spin mr-2">⏳</span>
                        Submitting...
                      </>
                    ) : (
                      <>
                        <FileText className="mr-2 h-5 w-5" />
                        Submit Project Inquiry
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </PageLayout>
  );
};

export default ClientPortalPage;
