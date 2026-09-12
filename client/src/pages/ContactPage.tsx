import { useState } from 'react';
import { Mail, Phone, MapPin, Send, CheckCircle } from 'lucide-react';
import PageLayout from '../components/PageLayout';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { trpc } from '../lib/trpc';
import { toast } from 'sonner';
import { enterpriseFooter } from '@/content/enterprise';

const ContactPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    subject: '',
    message: '',
    phone: '',
  });
  const [isSubmitted, setIsSubmitted] = useState(false);

  const contactMutation = trpc.contact.submit.useMutation({
    onSuccess: () => {
      setIsSubmitted(true);
      toast.success('Message sent successfully!');
      setFormData({
        name: '',
        email: '',
        company: '',
        subject: '',
        message: '',
        phone: '',
      });
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to send message. Please try again.');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    contactMutation.mutate(formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <PageLayout>
      {/* Hero Section */}
      <section className="pt-32 pb-16 bg-gradient-to-br from-blue-900/20 via-slate-950 to-purple-900/20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-[var(--hopstec-teal)] via-cyan-300 to-blue-400">
              Get in Touch
            </h1>
            <p className="text-xl text-gray-300">
              Have a project in mind? Tell us about your product, platform, or automation challenge — we typically respond within one business day.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Contact Information */}
            <div className="space-y-6">
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Contact Information</CardTitle>
                  <CardDescription className="text-gray-400">
                    Feel free to reach out through any of these channels
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <Mail className="h-5 w-5 text-[var(--hopstec-teal)] mt-1" />
                    <div>
                      <div className="text-sm text-gray-400 mb-1">Email</div>
                      <a
                        href={`mailto:${enterpriseFooter.email}`}
                        className="text-white hover:text-[var(--hopstec-teal)] transition-colors"
                      >
                        {enterpriseFooter.email}
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <Phone className="h-5 w-5 text-[var(--hopstec-teal)] mt-1" />
                    <div>
                      <div className="text-sm text-gray-400 mb-1">Phone</div>
                      <a
                        href={enterpriseFooter.phoneHref}
                        className="text-white hover:text-[var(--hopstec-teal)] transition-colors"
                      >
                        {enterpriseFooter.phone}
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <MapPin className="h-5 w-5 text-[var(--hopstec-teal)] mt-1" />
                    <div>
                      <div className="text-sm text-gray-400 mb-1">Headquarters</div>
                      <div className="text-white">{enterpriseFooter.address}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-[var(--hopstec-teal)]/20 bg-gradient-to-br from-[var(--hopstec-teal)]/10 to-blue-600/10 border">
                <CardContent className="p-6">
                  <h3 className="text-white font-semibold mb-2">Response Time</h3>
                  <p className="text-gray-300 text-sm">
                    We respond to all business inquiries within 24 hours on working days.
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-2">
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Send us a message</CardTitle>
                  <CardDescription className="text-gray-400">
                    Share your scope, timeline, and goals — our team will follow up promptly
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isSubmitted ? (
                    <div className="text-center py-12">
                      <CheckCircle className="h-16 w-16 text-green-400 mx-auto mb-4" />
                      <h3 className="text-2xl font-semibold text-white mb-2">
                        Message Sent Successfully!
                      </h3>
                      <p className="text-gray-400 mb-6">
                        Thank you for reaching out. Our team will get back to you soon.
                      </p>
                      <Button
                        onClick={() => setIsSubmitted(false)}
                        variant="outline"
                        className="border-[var(--hopstec-teal)] text-[var(--hopstec-teal)] hover:bg-[var(--hopstec-teal)]/10"
                      >
                        Send Another Message
                      </Button>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="name" className="text-white">
                            Name *
                          </Label>
                          <Input
                            id="name"
                            name="name"
                            type="text"
                            required
                            value={formData.name}
                            onChange={handleChange}
                            className="bg-slate-900 border-slate-700 text-white"
                            placeholder="Your name"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="email" className="text-white">
                            Email *
                          </Label>
                          <Input
                            id="email"
                            name="email"
                            type="email"
                            required
                            value={formData.email}
                            onChange={handleChange}
                            className="bg-slate-900 border-slate-700 text-white"
                            placeholder="your@email.com"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="company" className="text-white">
                            Company
                          </Label>
                          <Input
                            id="company"
                            name="company"
                            type="text"
                            value={formData.company}
                            onChange={handleChange}
                            className="bg-slate-900 border-slate-700 text-white"
                            placeholder="Your company"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="phone" className="text-white">
                            Phone
                          </Label>
                          <Input
                            id="phone"
                            name="phone"
                            type="tel"
                            value={formData.phone}
                            onChange={handleChange}
                            className="bg-slate-900 border-slate-700 text-white"
                            placeholder="+1 (555) 000-0000"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="subject" className="text-white">
                          Subject *
                        </Label>
                        <Input
                          id="subject"
                          name="subject"
                          type="text"
                          required
                          value={formData.subject}
                          onChange={handleChange}
                          className="bg-slate-900 border-slate-700 text-white"
                          placeholder="What's this about?"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="message" className="text-white">
                          Message *
                        </Label>
                        <Textarea
                          id="message"
                          name="message"
                          required
                          value={formData.message}
                          onChange={handleChange}
                          className="bg-slate-900 border-slate-700 text-white min-h-[150px]"
                          placeholder="Tell us about your project, product, or platform needs..."
                        />
                      </div>

                      <Button
                        type="submit"
                        size="lg"
                        className="w-full bg-[var(--hopstec-teal)] text-slate-950 hover:bg-[var(--hopstec-teal)]/90"
                        disabled={contactMutation.isPending}
                      >
                        {contactMutation.isPending ? (
                          'Sending...'
                        ) : (
                          <>
                            <Send className="mr-2 h-4 w-4" />
                            Send Message
                          </>
                        )}
                      </Button>
                    </form>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </PageLayout>
  );
};

export default ContactPage;
