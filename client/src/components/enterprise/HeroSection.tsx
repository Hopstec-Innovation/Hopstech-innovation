import { Link } from "wouter";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FadeIn } from "@/components/animations/FadeIn";
import { enterpriseHero } from "@/content/enterprise";
import { COMPANY_NAME } from "@shared/const";
import { handleSectionLink } from "@/lib/scrollToSection";

const HeroSection = () => {
  const handleSeeWork = (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    handleSectionLink("/#case-studies");
  };

  return (
    <section
      id="hero"
      className="relative flex min-h-screen items-center justify-center overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-slate-950 to-purple-900/20" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]" />

      <div className="container relative z-10 mx-auto px-4">
        <FadeIn className="mx-auto max-w-4xl text-center">
          <p className="mb-5 text-sm font-medium tracking-[0.22em] text-[var(--hopstec-teal)] uppercase md:text-base">
            {COMPANY_NAME}
          </p>
          <div className="mb-6 inline-block">
            <Badge
              variant="outline"
              className="border-[var(--hopstec-teal)] px-4 py-2 text-sm text-[var(--hopstec-teal)]"
            >
              {enterpriseHero.locationTag}
            </Badge>
          </div>

          <h1 className="mb-6 text-4xl font-bold leading-tight text-white md:text-6xl lg:text-7xl">
            <span className="block">{enterpriseHero.headlineLine1}</span>
            <span className="mt-3 block bg-clip-text text-transparent bg-gradient-to-r from-[var(--hopstec-teal)] via-cyan-300 to-blue-400">
              {enterpriseHero.headlineLine2}
            </span>
          </h1>

          <p className="mx-auto mb-8 max-w-3xl text-lg text-gray-300 md:text-xl">
            {enterpriseHero.subheadline}
          </p>

          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <a href="/#case-studies" onClick={handleSeeWork}>
              <Button
                size="lg"
                className="bg-[var(--hopstec-teal)] text-slate-950 hover:bg-[var(--hopstec-teal)]/90"
              >
                {enterpriseHero.ctaSeeWork}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </a>
            <Link href="/contact">
              <Button
                size="lg"
                variant="outline"
                className="border-[var(--hopstec-teal)] text-[var(--hopstec-teal)] hover:bg-[var(--hopstec-teal)]/10"
              >
                {enterpriseHero.ctaGetInTouch}
              </Button>
            </Link>
          </div>

          <div className="mt-10 flex flex-wrap justify-center gap-2">
            {enterpriseHero.techChips.map((chip) => (
              <Badge
                key={chip}
                variant="outline"
                className="border-slate-700 bg-slate-900/50 px-3 py-1 text-xs text-gray-400"
              >
                {chip}
              </Badge>
            ))}
          </div>
        </FadeIn>
      </div>

      <div className="absolute bottom-8 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2">
        <span className="text-xs uppercase tracking-[0.2em] text-gray-500">
          Scroll to explore
        </span>
        <div className="animate-bounce">
          <div className="flex h-10 w-6 justify-center rounded-full border-2 border-[var(--hopstec-teal)]/40">
            <div className="mt-2 h-3 w-1 rounded-full bg-[var(--hopstec-teal)]/60" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
