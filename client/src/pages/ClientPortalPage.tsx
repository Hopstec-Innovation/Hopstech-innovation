import { useState } from 'react';
import { Rocket, CheckCircle2, Clock, TrendingUp, Mail, Building2, Phone, FileText, LogIn, Loader2 } from 'lucide-react';
import PageLayout from '../components/PageLayout';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { trpc } from '../lib/trpc';
import { toast } from 'sonner';
import { useAuth } from '../hooks/useAuth';
import DashboardLayout from '../components/dashboard/DashboardLayout';
import DashboardOverview from '../components/dashboard/DashboardOverview';
import { FullScreenLoader } from '../components/ui/loading-spinner';

const ClientPortalPage = () => {
  const { isAuthenticated, user, isLoading: authLoading } = useAuth();
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
    magicLinkMutation.mutate({ email: magicLinkEmail, name: magicLinkName });
  };

  const features = [
    {
      icon: <Rocket className="h-6 w-6 text-blue-400" />,
      title: 'Project Collaboration',
      description: 'Submit project inquiries and collaborate directly with our team',
    },
    {
      icon: <TrendingUp className="h-6 w-6 text-purple-400" />,
      title: 'Real-Time Progress',
      description: 'Track your project milestones and progress in real-time',
    },
    {
      icon: <CheckCircle2 className="h-6 w-6 text-green-400" />,
      title: 'Project Updates',
      description: 'Receive detailed updates and insights on your active projects',
    },
    {
      icon: <Clock className="h-6 w-6 text-orange-400" />,
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
    return <FullScreenLoader message="Loading HOPSTECH Portal..." />;
  }

  // Authenticated - Show Dashboard
  if (isAuthenticated && user) {
    return (
      <DashboardLayout>
        <main className="flex-1 overflow-y-auto">
          <div className="p-6">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-white mb-2">
                Welcome back, {user.name}!
              </h1>
              <p className="text-gray-400">
                Here's what's happening with your projects today
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
      {/* Hero Section */}
      <section className="relative min-h-[60vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-slate-950 to-purple-900/20" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]" />

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <Badge variant="outline" className="text-blue-400 border-blue-400 px-4 py-2 text-sm mb-6">
              Client Collaboration Portal
            </Badge>
            
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">
              Let's Build Something Amazing Together
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Whether you're a business, startup, freelancer, or individual - your gateway to seamless project collaboration and expert DevOps solutions.
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-slate-900/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Why Choose Our Client Portal?
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Experience a modern, transparent approach to project development
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {features.map((feature, index) => (
              <Card key={index} className="bg-slate-800/50 border-slate-700 hover:border-blue-500/50 transition-all">
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
      <section className="py-20 bg-slate-900/30">
        <div className="container mx-auto px-4">
          <div className="max-w-md mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Access Your Dashboard
              </h2>
              <p className="text-gray-400 text-lg">
                Sign in or create an account - no password needed!
              </p>
            </div>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <LogIn className="h-5 w-5 text-blue-400" />
                  Passwordless Sign In
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Enter your email and we'll send you a secure link. New users will automatically get an account!
                </CardDescription>
              </CardHeader>
              <CardContent>
                {magicLinkSent ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-green-900/20 border border-green-700 rounded-lg">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-0.5">
                          <svg className="h-5 w-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <h3 className="text-white font-semibold mb-1">Magic Link Sent!</h3>
                          <p className="text-gray-300 text-sm mb-2">
                            We've sent a secure sign-in link to <strong className="text-white">{magicLinkEmail}</strong>
                          </p>
                          <p className="text-gray-400 text-xs">
                            Check your inbox and click the link to access your client portal. The link will expire in 15 minutes.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={() => {
                          magicLinkMutation.mutate({ email: magicLinkEmail, name: magicLinkName });
                        }}
                        variant="outline"
                        className="flex-1 border-slate-700 text-white hover:bg-slate-800"
                        disabled={magicLinkMutation.isPending}
                      >
                        {magicLinkMutation.isPending ? (
                          <>
                            <span className="animate-spin mr-2">⏳</span>
                            Resending...
                          </>
                        ) : (
                          <>
                            <Mail className="mr-2 h-4 w-4" />
                            Resend Link
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
                        className="text-gray-400 hover:text-white hover:bg-slate-800"
                      >
                        Use Different Email
                      </Button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleMagicLinkSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="magicLinkName" className="text-white">
                        Your Name
                      </Label>
                      <Input
                        id="magicLinkName"
                        type="text"
                        value={magicLinkName}
                        onChange={(e) => setMagicLinkName(e.target.value)}
                        className="bg-slate-900 border-slate-700 text-white"
                        placeholder="John Doe"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="magicLinkEmail" className="text-white">
                        Email Address <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="magicLinkEmail"
                        type="email"
                        value={magicLinkEmail}
                        onChange={(e) => setMagicLinkEmail(e.target.value)}
                        required
                        className="bg-slate-900 border-slate-700 text-white"
                        placeholder="your@email.com"
                      />
                    </div>

                    <Button
                      type="submit"
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                      disabled={magicLinkMutation.isPending}
                    >
                      {magicLinkMutation.isPending ? (
                        <>
                          <span className="animate-spin mr-2">⏳</span>
                          Sending...
                        </>
                      ) : (
                        <>
                          <Mail className="mr-2 h-4 w-4" />
                          Send Magic Link
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
                          placeholder="+1 (555) 000-0000"
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
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
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

