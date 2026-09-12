import { useState } from "react";
import { Mail, Phone, MapPin, Send, CheckCircle } from "lucide-react";
import PageLayout from "../components/PageLayout";
import { FadeIn } from "@/components/animations/FadeIn";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { trpc } from "../lib/trpc";
import { toast } from "sonner";
import {
  enterpriseContact,
  enterpriseFooter,
} from "@/content/enterprise";
import "@/components/enterprise/page-surface.css";

const ContactPage = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    subject: "",
    message: "",
    phone: "",
  });
  const [isSubmitted, setIsSubmitted] = useState(false);

  const contactMutation = trpc.contact.submit.useMutation({
    onSuccess: () => {
      setIsSubmitted(true);
      toast.success("Message sent successfully!");
      setFormData({
        name: "",
        email: "",
        company: "",
        subject: "",
        message: "",
        phone: "",
      });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to send message. Please try again.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    contactMutation.mutate(formData);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <PageLayout>
      <div className="page-surface">
        <section className="page-surface-hero">
          <div className="page-surface-container">
            <FadeIn>
              <p className="page-surface-kicker">
                <i aria-hidden="true" />
                {enterpriseContact.kicker}
              </p>
              <h1 className="page-surface-title">
                Start a <em>conversation</em>
              </h1>
              <p className="page-surface-lede">{enterpriseContact.intro}</p>
            </FadeIn>
          </div>
        </section>

        <section className="page-surface-body">
          <div className="page-surface-container">
            <div className="page-surface-grid">
              <FadeIn>
                <aside className="page-surface-panel">
                  <h2 className="page-surface-panel-title">
                    {enterpriseContact.infoTitle}
                  </h2>
                  <p className="page-surface-panel-intro">
                    {enterpriseContact.infoIntro}
                  </p>

                  <div className="page-surface-channel">
                    <div className="page-surface-channel-icon">
                      <Mail className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="page-surface-channel-label">
                        {enterpriseContact.emailLabel}
                      </p>
                      <a href={`mailto:${enterpriseFooter.email}`}>
                        {enterpriseFooter.email}
                      </a>
                    </div>
                  </div>

                  <div className="page-surface-channel">
                    <div className="page-surface-channel-icon">
                      <Phone className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="page-surface-channel-label">
                        {enterpriseContact.phoneLabel}
                      </p>
                      <a href={enterpriseFooter.phoneHref}>
                        {enterpriseFooter.phone}
                      </a>
                    </div>
                  </div>

                  <div className="page-surface-channel">
                    <div className="page-surface-channel-icon">
                      <MapPin className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="page-surface-channel-label">
                        {enterpriseContact.hqLabel}
                      </p>
                      <span>{enterpriseFooter.address}</span>
                    </div>
                  </div>

                  <div className="page-surface-note">
                    <h3>{enterpriseContact.responseTitle}</h3>
                    <p>{enterpriseContact.responseBody}</p>
                  </div>
                </aside>
              </FadeIn>

              <FadeIn delay={0.08}>
                <div className="page-surface-panel">
                  <h2 className="page-surface-panel-title">
                    {enterpriseContact.formTitle}
                  </h2>
                  <p className="page-surface-panel-intro">
                    {enterpriseContact.formIntro}
                  </p>

                  {isSubmitted ? (
                    <div className="page-surface-success">
                      <CheckCircle className="h-14 w-14" />
                      <h3>{enterpriseContact.successTitle}</h3>
                      <p>{enterpriseContact.successBody}</p>
                      <Button
                        onClick={() => setIsSubmitted(false)}
                        variant="outline"
                        className="border-[var(--hopstec-teal)] text-[var(--hopstec-teal)] hover:bg-[var(--hopstec-teal)]/10"
                      >
                        {enterpriseContact.successCta}
                      </Button>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit} className="space-y-5">
                      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                        <div className="page-surface-field">
                          <label htmlFor="name">Name *</label>
                          <Input
                            id="name"
                            name="name"
                            type="text"
                            required
                            value={formData.name}
                            onChange={handleChange}
                            className="text-white"
                            placeholder="Your name"
                          />
                        </div>
                        <div className="page-surface-field">
                          <label htmlFor="email">Email *</label>
                          <Input
                            id="email"
                            name="email"
                            type="email"
                            required
                            value={formData.email}
                            onChange={handleChange}
                            className="text-white"
                            placeholder="you@company.com"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                        <div className="page-surface-field">
                          <label htmlFor="company">Company</label>
                          <Input
                            id="company"
                            name="company"
                            type="text"
                            value={formData.company}
                            onChange={handleChange}
                            className="text-white"
                            placeholder="Company name"
                          />
                        </div>
                        <div className="page-surface-field">
                          <label htmlFor="phone">Phone</label>
                          <Input
                            id="phone"
                            name="phone"
                            type="tel"
                            value={formData.phone}
                            onChange={handleChange}
                            className="text-white"
                            placeholder={enterpriseContact.phonePlaceholder}
                          />
                        </div>
                      </div>

                      <div className="page-surface-field">
                        <label htmlFor="subject">Subject *</label>
                        <Input
                          id="subject"
                          name="subject"
                          type="text"
                          required
                          value={formData.subject}
                          onChange={handleChange}
                          className="text-white"
                          placeholder="What should we talk about?"
                        />
                      </div>

                      <div className="page-surface-field">
                        <label htmlFor="message">Message *</label>
                        <Textarea
                          id="message"
                          name="message"
                          required
                          value={formData.message}
                          onChange={handleChange}
                          className="min-h-[150px] text-white"
                          placeholder="Tell us about your product, platform, or automation needs..."
                        />
                      </div>

                      <Button
                        type="submit"
                        size="lg"
                        className="w-full bg-[var(--hopstec-teal)] text-slate-950 hover:bg-[var(--hopstec-teal)]/90"
                        disabled={contactMutation.isPending}
                      >
                        {contactMutation.isPending ? (
                          enterpriseContact.submittingLabel
                        ) : (
                          <>
                            <Send className="mr-2 h-4 w-4" />
                            {enterpriseContact.submitLabel}
                          </>
                        )}
                      </Button>
                    </form>
                  )}
                </div>
              </FadeIn>
            </div>
          </div>
        </section>
      </div>
    </PageLayout>
  );
};

export default ContactPage;
