import { useState } from "react";
import { Link } from "wouter";
import {
  ArrowRight,
  Bell,
  CheckCircle2,
  Clock3,
  Droplets,
  Expand,
  Gauge,
  Home,
  ShieldCheck,
  ShoppingCart,
  Smartphone,
  Wrench,
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import PageLayout from "../components/PageLayout";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Dialog, DialogContent } from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { trpc } from "../lib/trpc";
import ResponsiveShowcaseImage from "../components/ResponsiveShowcaseImage";

const plans = [
  {
    id: "starter",
    name: "Starter Protection",
    price: "EUR89",
    note: "Device pre-order",
    eyebrow: "For single-home protection",
    description: "Best for early customers who want the AquaPulse device reserved first.",
    features: [
      "1 AquaPulse AP-100 device",
      "Leak detection and auto shutoff",
      "Mobile app access",
      "Installation guidance",
    ],
    accent: "border-cyan-400/50 bg-cyan-500/10",
    glowClass: "shadow-cyan-950/30",
    titleClass: "text-cyan-50",
    priceClass: "text-cyan-300",
    noteClass: "text-cyan-200/80",
    chipClass: "border-cyan-400/30 bg-cyan-500/10 text-cyan-100",
    buttonClass: "bg-cyan-400 text-slate-950 hover:bg-cyan-300",
  },
  {
    id: "connected",
    name: "Connected Home",
    price: "EUR129",
    note: "Device + onboarding",
    eyebrow: "Most complete home setup",
    description: "A stronger package for homes that want setup support and alerts ready on day one.",
    features: [
      "Everything in Starter",
      "Priority setup review",
      "Alert tuning support",
      "First-year dashboard onboarding",
    ],
    accent: "border-emerald-400/50 bg-emerald-500/10",
    glowClass: "shadow-emerald-950/40",
    titleClass: "text-emerald-50",
    priceClass: "text-emerald-300",
    noteClass: "text-emerald-200/80",
    chipClass: "border-emerald-400/30 bg-emerald-500/10 text-emerald-100",
    buttonClass: "bg-emerald-400 text-slate-950 hover:bg-emerald-300",
  },
  {
    id: "partner",
    name: "Property Partner",
    price: "Custom",
    note: "Multi-device quote",
    eyebrow: "For landlords and property teams",
    description: "For landlords, hotels, and property teams who need multiple devices and rollout planning.",
    features: [
      "Bulk device pricing",
      "Deployment planning",
      "Multi-site recommendations",
      "Dedicated sales follow-up",
    ],
    accent: "border-amber-400/50 bg-amber-500/10",
    glowClass: "shadow-amber-950/30",
    titleClass: "text-amber-50",
    priceClass: "text-amber-200",
    noteClass: "text-amber-200/80",
    chipClass: "border-amber-400/30 bg-amber-500/10 text-amber-100",
    buttonClass: "bg-amber-300 text-slate-950 hover:bg-amber-200",
  },
] as const;

const highlightCards = [
  {
    title: "Leak protection in real time",
    description: "Monitor water flow in real time and trigger shutoff before damage spreads.",
    icon: ShieldCheck,
  },
  {
    title: "Clarity from your phone",
    description: "Give customers a simple dashboard to check activity, history, and alerts.",
    icon: Smartphone,
  },
  {
    title: "Ready for homes and properties",
    description: "From one apartment to multi-unit rollout, AquaPulse scales with the need.",
    icon: Home,
  },
];

const steps = [
  {
    title: "Install on the water line",
    description: "AquaPulse connects to the incoming supply and starts reading flow immediately.",
    icon: Wrench,
  },
  {
    title: "Detect unusual behavior",
    description: "The system watches for spikes, continuous flow, and signs of a hidden leak.",
    icon: Gauge,
  },
  {
    title: "Alert and act",
    description: "Customers receive notifications, and AquaPulse can shut off water automatically when needed.",
    icon: Bell,
  },
];

const includedFeatures = [
  "Real-time flow monitoring",
  "Instant leak alerts",
  "Automatic shutoff response",
  "Mobile dashboard access",
  "Usage analytics for households",
  "Support for property-scale deployments",
];

const appStoreBadges = [
  {
    id: "apple",
    name: "App Store",
    href: import.meta.env.VITE_AQUAPULSE_APP_STORE_URL || "",
    status: "Coming soon for iPhone and iPad",
    imageSrc: "https://developer.apple.com/assets/elements/badges/download-on-the-app-store.svg",
    imageAlt: "Download on the App Store",
  },
  {
    id: "google",
    name: "Google Play",
    href: import.meta.env.VITE_AQUAPULSE_GOOGLE_PLAY_URL || "",
    status: "Coming soon for Android",
    imageSrc: "https://play.google.com/intl/en_us/badges/static/images/badges/en_badge_web_generic.png",
    imageAlt: "Get it on Google Play",
  },
] as const;

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

const AquaPulsePage = () => {
  const [selectedPlan, setSelectedPlan] = useState<(typeof plans)[number]["id"]>("connected");
  const [previewImage, setPreviewImage] = useState<{ src: string; alt: string } | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    quantity: "1",
    address: "",
    message: "",
  });

  const activePlan = plans.find((plan) => plan.id === selectedPlan) ?? plans[1];

  const contactMutation = trpc.contact.submit.useMutation({
    onSuccess: () => {
      toast.success("AquaPulse order request sent successfully.");
      setFormData({
        name: "",
        email: "",
        phone: "",
        company: "",
        quantity: "1",
        address: "",
        message: "",
      });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to send your request. Please try again.");
    },
  });

  const scrollToOrder = () => {
    document.getElementById("order")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handlePlanSelect = (planId: (typeof plans)[number]["id"]) => {
    setSelectedPlan(planId);
    window.setTimeout(scrollToOrder, 50);
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    const quantity = Number.parseInt(formData.quantity, 10);
    const safeQuantity = Number.isNaN(quantity) || quantity < 1 ? 1 : quantity;

    contactMutation.mutate({
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      company: formData.company,
      subject: `AquaPulse order request - ${activePlan.name}`,
      message: [
        `Selected plan: ${activePlan.name}`,
        `Requested quantity: ${safeQuantity}`,
        `Installation address: ${formData.address || "Not provided"}`,
        "",
        "Customer notes:",
        formData.message || "No extra notes provided.",
      ].join("\n"),
    });
  };

  return (
    <PageLayout>
      <section className="relative overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.16),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.18),transparent_28%),linear-gradient(180deg,#020617_0%,#071329_48%,#020617_100%)] pt-24 pb-14 sm:pt-28 sm:pb-20">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(30,41,59,0.32)_1px,transparent_1px),linear-gradient(to_bottom,rgba(30,41,59,0.32)_1px,transparent_1px)] bg-[size:5rem_5rem] opacity-30" />
        <motion.div
          className="absolute -left-12 top-24 h-56 w-56 rounded-full bg-cyan-400/10 blur-3xl"
          animate={{ y: [0, -18, 0], opacity: [0.35, 0.65, 0.35] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <div className="container relative z-10 mx-auto px-4">
          <div className="grid gap-8 sm:gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <motion.div
              className="max-w-3xl"
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              transition={{ duration: 0.7, ease: "easeOut" }}
            >
              <Badge className="mb-5 border-cyan-400/30 bg-cyan-500/10 px-3 py-1 text-cyan-200 sm:px-4">
                AquaPulse AP-100 | Smart water protection
              </Badge>
              <motion.h1
                className="max-w-3xl bg-gradient-to-r from-white via-cyan-100 to-sky-300 bg-clip-text text-4xl font-black tracking-tight text-transparent sm:text-5xl md:text-6xl"
                variants={fadeUp}
                transition={{ delay: 0.12, duration: 0.7 }}
              >
                Protect your home with intelligent water monitoring that feels simple from day one.
              </motion.h1>
              <motion.p
                className="mt-5 max-w-2xl text-base leading-7 text-slate-300 sm:mt-6 sm:text-lg sm:leading-8"
                variants={fadeUp}
                transition={{ delay: 0.2, duration: 0.7 }}
              >
                AquaPulse helps homeowners and property teams detect leaks early, stay informed in real time, and move forward with confidence before small issues become expensive damage.
              </motion.p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Button size="lg" className="w-full bg-cyan-400 text-slate-950 hover:bg-cyan-300 sm:w-auto" onClick={scrollToOrder}>
                  Reserve Your Device
                  <ShoppingCart className="h-4 w-4" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full border-cyan-400/40 text-cyan-100 hover:bg-cyan-400/10 sm:w-auto"
                  asChild
                >
                  <a href="#pricing">Explore Packages</a>
                </Button>
                <Button
                  size="lg"
                  variant="ghost"
                  className="w-full text-slate-200 hover:bg-white/5 hover:text-white sm:w-auto"
                  asChild
                >
                  <Link href="/#case-studies">See case study on our site</Link>
                </Button>
              </div>

              <div className="mt-8 flex gap-3 overflow-x-auto pb-2 pr-4 text-sm text-slate-300 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <a href="#features" className="shrink-0 rounded-full border border-slate-700 bg-slate-900/60 px-4 py-2 transition hover:border-cyan-400/50 hover:text-white">
                  Features
                </a>
                <a href="#how-it-works" className="shrink-0 rounded-full border border-slate-700 bg-slate-900/60 px-4 py-2 transition hover:border-cyan-400/50 hover:text-white">
                  How it works
                </a>
                <a href="#pricing" className="shrink-0 rounded-full border border-slate-700 bg-slate-900/60 px-4 py-2 transition hover:border-cyan-400/50 hover:text-white">
                  Pricing
                </a>
                <a href="#order" className="shrink-0 rounded-full border border-slate-700 bg-slate-900/60 px-4 py-2 transition hover:border-cyan-400/50 hover:text-white">
                  Order form
                </a>
              </div>

              <div className="mt-8 grid gap-3 sm:mt-10 sm:gap-4 sm:grid-cols-3">
                <Card className="border-cyan-500/20 bg-slate-950/70">
                  <CardContent className="p-5">
                    <div className="text-2xl font-bold text-cyan-300">&lt; 1 sec</div>
                    <p className="mt-2 text-sm text-slate-400">Fast response once abnormal water flow is detected.</p>
                  </CardContent>
                </Card>
                <Card className="border-cyan-500/20 bg-slate-950/70">
                  <CardContent className="p-5">
                    <div className="text-2xl font-bold text-cyan-300">24/7</div>
                    <p className="mt-2 text-sm text-slate-400">Continuous monitoring for homes, rentals, and managed properties.</p>
                  </CardContent>
                </Card>
                <Card className="border-cyan-500/20 bg-slate-950/70">
                  <CardContent className="p-5">
                    <div className="text-2xl font-bold text-cyan-300">Mobile-first</div>
                    <p className="mt-2 text-sm text-slate-400">Customers can review alerts and water activity from their phone.</p>
                  </CardContent>
                </Card>
              </div>
            </motion.div>

            <motion.div
              className="space-y-3 sm:space-y-4"
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.18, duration: 0.8, ease: "easeOut" }}
            >
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
              >
                <Card className="overflow-hidden border-cyan-500/20 bg-slate-950/70 shadow-2xl shadow-cyan-950/40">
                  <CardContent className="p-3">
                    <button
                      type="button"
                      onClick={() =>
                        setPreviewImage({
                          src: "/showcase/AquaDevices.png",
                          alt: "AquaPulse device dashboard preview",
                        })
                      }
                      className="group relative block w-full"
                    >
                      <ResponsiveShowcaseImage
                        src="/showcase/AquaDevices.png"
                        alt="AquaPulse device dashboard preview"
                        className="h-full w-full rounded-xl object-cover"
                        sizes="(max-width: 640px) 92vw, (max-width: 1200px) 40vw, 560px"
                        fetchPriority="high"
                      />
                      <span className="absolute right-3 top-3 rounded-full bg-black/60 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm transition group-hover:bg-black/75">
                        Tap to expand
                      </span>
                    </button>
                  </CardContent>
                </Card>
              </motion.div>
              <div className="grid gap-4 sm:grid-cols-2">
                <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.34, duration: 0.65 }}>
                  <Card className="overflow-hidden border-slate-700 bg-slate-950/70">
                    <CardContent className="p-3">
                      <button
                        type="button"
                        onClick={() =>
                          setPreviewImage({
                            src: "/showcase/AquaDashboard.png",
                            alt: "AquaPulse dashboard",
                          })
                        }
                        className="group relative block w-full"
                      >
                        <ResponsiveShowcaseImage
                          src="/showcase/AquaDashboard.png"
                          alt="AquaPulse dashboard"
                          className="h-full w-full rounded-xl object-cover"
                          sizes="(max-width: 640px) 92vw, (max-width: 1200px) 20vw, 280px"
                          loading="lazy"
                        />
                        <span className="absolute right-3 top-3 rounded-full bg-black/60 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm transition group-hover:bg-black/75">
                          Expand
                        </span>
                      </button>
                    </CardContent>
                  </Card>
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.42, duration: 0.65 }}>
                  <Card className="overflow-hidden border-slate-700 bg-slate-950/70">
                    <CardContent className="p-3">
                      <button
                        type="button"
                        onClick={() =>
                          setPreviewImage({
                            src: "/showcase/AquaMenu.png",
                            alt: "AquaPulse mobile menu",
                          })
                        }
                        className="group relative block w-full"
                      >
                        <ResponsiveShowcaseImage
                          src="/showcase/AquaMenu.png"
                          alt="AquaPulse mobile menu"
                          className="h-full w-full rounded-xl object-cover"
                          sizes="(max-width: 640px) 92vw, (max-width: 1200px) 20vw, 280px"
                          loading="lazy"
                        />
                        <span className="absolute right-3 top-3 rounded-full bg-black/60 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm transition group-hover:bg-black/75">
                          Expand
                        </span>
                      </button>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <Dialog open={Boolean(previewImage)} onOpenChange={(open) => !open && setPreviewImage(null)}>
        <DialogContent className="max-w-[96vw] border-slate-800 bg-slate-950 p-3 sm:p-5 text-white">
          <div className="flex items-center justify-between gap-3 px-1 pb-2">
            <div>
              <p className="text-sm font-semibold text-white">AquaPulse preview</p>
              <p className="text-xs text-slate-400">Expanded mobile-friendly view</p>
            </div>
            <Expand className="h-4 w-4 text-slate-400" />
          </div>
          <div className="flex min-h-[72vh] items-center justify-center overflow-hidden rounded-xl bg-black">
            {previewImage ? (
              <img
                src={previewImage.src}
                alt={previewImage.alt}
                className="max-h-[80vh] w-full object-contain"
              />
            ) : null}
          </div>
        </DialogContent>
      </Dialog>

      <section id="features" className="scroll-mt-28 bg-slate-950 py-16 sm:py-20">
        <div className="container mx-auto px-4">
          <motion.div
            className="max-w-2xl"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.35 }}
            variants={fadeUp}
            transition={{ duration: 0.6 }}
          >
            <Badge className="border-cyan-400/30 bg-cyan-500/10 text-cyan-200">Why AquaPulse</Badge>
            <h2 className="mt-4 bg-gradient-to-r from-cyan-100 via-white to-sky-300 bg-clip-text text-3xl font-bold text-transparent md:text-4xl">A reassuring experience from first visit to first install.</h2>
            <p className="mt-4 text-lg text-slate-400">
              AquaPulse is presented as a calm, premium way to protect homes, reduce water waste, and make installation feel straightforward from the start.
            </p>
          </motion.div>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {highlightCards.map(({ title, description, icon: Icon }, index) => (
              <motion.div
                key={title}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.35 }}
                variants={fadeUp}
                transition={{ delay: index * 0.08, duration: 0.55 }}
              >
                <Card className="border-slate-800 bg-slate-900/70">
                  <CardContent className="p-6">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-300">
                      <Icon className="h-6 w-6" />
                    </div>
                    <h3 className="mt-5 text-xl font-semibold text-cyan-50">{title}</h3>
                    <p className="mt-3 text-sm leading-7 text-slate-400">{description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <div className="mt-8 grid gap-4 rounded-3xl border border-slate-800 bg-slate-900/60 p-4 sm:p-6 md:grid-cols-2 xl:grid-cols-3">
            {includedFeatures.map((feature) => (
              <div key={feature} className="flex items-start gap-3 rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                <CheckCircle2 className="mt-0.5 h-5 w-5 text-cyan-300" />
                <span className="text-sm text-slate-200">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="scroll-mt-28 bg-slate-900/40 py-16 sm:py-20">
        <div className="container mx-auto px-4">
          <motion.div
            className="max-w-2xl"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.35 }}
            variants={fadeUp}
            transition={{ duration: 0.6 }}
          >
            <Badge className="border-emerald-400/30 bg-emerald-500/10 text-emerald-200">How it works</Badge>
            <h2 className="mt-4 bg-gradient-to-r from-emerald-200 via-cyan-100 to-white bg-clip-text text-3xl font-bold text-transparent md:text-4xl">Simple to install. Reassuring to live with.</h2>
          </motion.div>

          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            {steps.map(({ title, description, icon: Icon }, index) => (
              <motion.div
                key={title}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.35 }}
                variants={fadeUp}
                transition={{ delay: index * 0.08, duration: 0.55 }}
              >
                <Card className="border-slate-800 bg-slate-950/70">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-300">
                        <Icon className="h-6 w-6" />
                      </div>
                      <span className="text-sm font-semibold text-slate-500">0{index + 1}</span>
                    </div>
                    <h3 className="mt-5 text-xl font-semibold text-emerald-50">{title}</h3>
                    <p className="mt-3 text-sm leading-7 text-slate-400">{description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-950 py-16 sm:py-20">
        <div className="container mx-auto px-4">
          <div className="grid gap-6 rounded-[2rem] border border-cyan-500/20 bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.12),transparent_45%),linear-gradient(180deg,rgba(15,23,42,0.96),rgba(2,6,23,0.98))] p-5 sm:gap-8 sm:p-8 shadow-2xl shadow-cyan-950/20 lg:grid-cols-[1fr_auto] lg:items-center">
            <div className="max-w-2xl">
              <Badge className="border-cyan-400/30 bg-cyan-500/10 text-cyan-200">AquaPulse App</Badge>
              <h2 className="mt-4 bg-gradient-to-r from-white via-cyan-100 to-cyan-300 bg-clip-text text-3xl font-bold text-transparent md:text-4xl">The AquaPulse app is on the way.</h2>
              <p className="mt-4 text-lg leading-8 text-slate-400">
                The AquaPulse mobile experience is being prepared for release. Once available, customers will be able to download the app from the App Store and Google Play to activate devices, monitor status, and manage alerts.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {appStoreBadges.map((store) => {
                const isReady = Boolean(store.href);

                return (
                  <a
                    key={store.id}
                    href={isReady ? store.href : undefined}
                    target={isReady ? "_blank" : undefined}
                    rel={isReady ? "noopener noreferrer" : undefined}
                    aria-disabled={!isReady}
                    className={`group block rounded-[1.5rem] border border-slate-800 bg-slate-950/80 p-4 transition ${
                      isReady
                        ? "hover:-translate-y-1 hover:border-cyan-400/40 hover:bg-slate-900"
                        : "cursor-default opacity-90"
                    }`}
                    onClick={(event) => {
                      if (!isReady) {
                        event.preventDefault();
                      }
                    }}
                  >
                    <div className="rounded-2xl bg-black p-3">
                      <img
                        src={store.imageSrc}
                        alt={store.imageAlt}
                        className={`h-14 w-auto ${store.id === "google" ? "rounded-xl" : ""}`}
                        loading="lazy"
                      />
                    </div>
                    <div className="mt-4 flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-cyan-50">{store.name}</p>
                        <p className="text-xs text-slate-500">{store.status}</p>
                      </div>
                      <span className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-xs font-medium text-cyan-200">
                        {isReady ? "Live" : "Soon"}
                      </span>
                    </div>
                  </a>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section id="pricing" className="scroll-mt-28 bg-slate-950 py-16 sm:py-20">
        <div className="container mx-auto px-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <Badge className="border-amber-400/30 bg-amber-500/10 text-amber-200">Packages</Badge>
              <h2 className="mt-4 bg-gradient-to-r from-amber-100 via-white to-cyan-200 bg-clip-text text-3xl font-bold text-transparent md:text-4xl">Choose the device package that fits your home or property.</h2>
            </div>
            <p className="max-w-lg text-sm leading-7 text-slate-400">
              Start with the device package that matches the level of support you want. Connected Home remains our recommended option for the smoothest setup experience.
            </p>
          </div>

          <div className="mt-8 grid gap-5 xl:grid-cols-3 sm:mt-10 sm:gap-6">
            {plans.map((plan) => {
              const isSelected = plan.id === selectedPlan;

              return (
                <Card
                  key={plan.id}
                  className={`relative overflow-hidden border-slate-800 bg-slate-900/70 shadow-xl transition hover:-translate-y-1 ${plan.glowClass} ${isSelected ? plan.accent : ""}`}
                >
                  <div className={`absolute inset-x-0 top-0 h-1 ${plan.id === "starter" ? "bg-cyan-300/90" : plan.id === "connected" ? "bg-emerald-300/90" : "bg-amber-300/90"}`} />
                  <CardContent className="p-5 sm:p-7">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className={`text-sm uppercase tracking-[0.24em] ${plan.noteClass}`}>{plan.note}</p>
                        <h3 className={`mt-3 text-2xl font-bold ${plan.titleClass}`}>{plan.name}</h3>
                        <p className="mt-2 text-xs uppercase tracking-[0.18em] text-slate-500">{plan.eyebrow}</p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        {plan.id === "connected" ? (
                          <Badge className="border-emerald-400/30 bg-emerald-500/10 text-emerald-100">Recommended</Badge>
                        ) : null}
                        {isSelected ? (
                          <Badge className={plan.chipClass}>Selected</Badge>
                        ) : null}
                      </div>
                    </div>

                    <div className={`mt-6 text-4xl font-black ${plan.priceClass}`}>{plan.price}</div>
                    <p className="mt-3 text-sm leading-7 text-slate-400">{plan.description}</p>

                    <div className="mt-6 space-y-3">
                      {plan.features.map((feature) => (
                        <div key={feature} className="flex items-start gap-3">
                          <CheckCircle2 className="mt-0.5 h-5 w-5 text-cyan-300" />
                          <span className="text-sm text-slate-200">{feature}</span>
                        </div>
                      ))}
                    </div>

                    <Button
                      className={`mt-8 w-full ${plan.buttonClass}`}
                      onClick={() => handlePlanSelect(plan.id)}
                    >
                      Choose {plan.name}
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      <section id="order" className="scroll-mt-28 bg-[linear-gradient(180deg,#08111f_0%,#020617_100%)] py-16 sm:py-20">
        <div className="container mx-auto px-4">
          <div className="grid gap-8 xl:grid-cols-[0.9fr_1.1fr]">
            <div className="space-y-6">
              <Badge className="border-cyan-400/30 bg-cyan-500/10 text-cyan-200">Order request</Badge>
              <h2 className="bg-gradient-to-r from-white via-cyan-100 to-sky-300 bg-clip-text text-3xl font-bold text-transparent md:text-4xl">Tell us what you need and we will help you get started.</h2>
              <p className="text-lg leading-8 text-slate-400">
                Share a few details and we will guide you toward the right package, installation flow, and next steps for your property.
              </p>

              <Card className="border-slate-800 bg-slate-900/70">
                <CardContent className="p-6">
                  <p className="text-sm uppercase tracking-[0.22em] text-slate-500">Current selection</p>
                  <div className="mt-4 flex items-center gap-3">
                    <Droplets className="h-6 w-6 text-cyan-300" />
                    <div>
                      <div className="text-xl font-semibold text-cyan-50">{activePlan.name}</div>
                      <div className="text-sm text-slate-400">{activePlan.price}</div>
                    </div>
                  </div>
                  <div className="mt-5 space-y-3">
                    {activePlan.features.map((feature) => (
                      <div key={feature} className="flex items-start gap-3 text-sm text-slate-300">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 text-cyan-300" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <div className="grid gap-4 sm:grid-cols-2">
                <Card className="border-slate-800 bg-slate-900/70">
                  <CardContent className="p-5">
                    <Clock3 className="h-5 w-5 text-cyan-300" />
                    <p className="mt-3 text-sm text-slate-300">Fast follow-up for quotes, setup questions, and next steps.</p>
                  </CardContent>
                </Card>
                <Card className="border-slate-800 bg-slate-900/70">
                  <CardContent className="p-5">
                    <ShieldCheck className="h-5 w-5 text-cyan-300" />
                    <p className="mt-3 text-sm text-slate-300">A calmer path to leak prevention, savings, and peace of mind.</p>
                  </CardContent>
                </Card>
              </div>
            </div>

            <Card className="border-slate-800 bg-slate-900/80">
              <CardContent className="p-5 sm:p-8">
                <form className="space-y-6" onSubmit={handleSubmit}>
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-white">
                        Full name
                      </Label>
                      <Input
                        id="name"
                        name="name"
                        required
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Customer full name"
                        className="border-slate-700 bg-slate-950 text-white"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-white">
                        Email
                      </Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="customer@email.com"
                        className="border-slate-700 bg-slate-950 text-white"
                      />
                    </div>
                  </div>

                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-white">
                        Phone
                      </Label>
                      <Input
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="+33 6 00 00 00 00"
                        className="border-slate-700 bg-slate-950 text-white"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="company" className="text-white">
                        Company or property name
                      </Label>
                      <Input
                        id="company"
                        name="company"
                        value={formData.company}
                        onChange={handleChange}
                        placeholder="Optional"
                        className="border-slate-700 bg-slate-950 text-white"
                      />
                    </div>
                  </div>

                  <div className="grid gap-6 md:grid-cols-[0.55fr_1.45fr]">
                    <div className="space-y-2">
                      <Label htmlFor="quantity" className="text-white">
                        Quantity
                      </Label>
                      <Input
                        id="quantity"
                        name="quantity"
                        type="number"
                        min="1"
                        value={formData.quantity}
                        onChange={handleChange}
                        className="border-slate-700 bg-slate-950 text-white"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="address" className="text-white">
                        Installation address
                      </Label>
                      <Input
                        id="address"
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        placeholder="City, property, or installation location"
                        className="border-slate-700 bg-slate-950 text-white"
                      />
                    </div>
                  </div>

                  <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-4">
                    <div className="flex items-center gap-3">
                      <Smartphone className="h-5 w-5 text-cyan-300" />
                      <div>
                        <p className="font-medium text-cyan-50">Selected package</p>
                        <p className="text-sm text-slate-300">{activePlan.name}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message" className="text-white">
                      Notes
                    </Label>
                    <Textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      placeholder="Anything the customer wants to tell you about the property, expected installation, or timeline."
                      className="min-h-36 border-slate-700 bg-slate-950 text-white"
                    />
                  </div>

                  <Button
                    type="submit"
                    size="lg"
                    className="w-full bg-cyan-400 text-slate-950 hover:bg-cyan-300"
                    disabled={contactMutation.isPending}
                  >
                    {contactMutation.isPending ? "Sending order request..." : "Send AquaPulse Order Request"}
                    <ArrowRight className="h-4 w-4" />
                  </Button>

                  <p className="text-center text-sm text-slate-500">
                    Need a custom rollout? Use the Property Partner package or reach out through the{" "}
                    <Link href="/contact">
                      <a className="text-cyan-300 hover:text-cyan-200">contact page</a>
                    </Link>
                    .
                  </p>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </PageLayout>
  );
};

export default AquaPulsePage;
