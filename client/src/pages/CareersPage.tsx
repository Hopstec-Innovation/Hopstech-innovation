import { Link } from "wouter";
import { ArrowRight, MapPin } from "lucide-react";
import PageLayout from "@/components/PageLayout";
import { FadeIn } from "@/components/animations/FadeIn";
import { Button } from "@/components/ui/button";
import { enterpriseCareers, enterpriseFooter } from "@/content/enterprise";
import "@/components/enterprise/page-surface.css";

const CareersPage = () => {
  return (
    <PageLayout>
      <div className="page-surface">
        <section className="page-surface-hero">
          <div className="page-surface-container">
            <FadeIn>
              <p className="page-surface-kicker">
                <i aria-hidden="true" />
                {enterpriseCareers.kicker}
              </p>
              <h1 className="page-surface-title">
                Build software that ships in the <em>real world</em>
              </h1>
              <p className="page-surface-lede">{enterpriseCareers.intro}</p>
              <div className="page-surface-meta">
                <MapPin className="h-4 w-4" />
                {enterpriseFooter.address}
              </div>
            </FadeIn>
          </div>
        </section>

        <section className="page-surface-body">
          <div className="page-surface-container">
            <FadeIn>
              <h2 className="page-surface-section-title">
                {enterpriseCareers.pathsTitle}
              </h2>
              <p className="page-surface-section-intro">
                {enterpriseCareers.pathsIntro}
              </p>
            </FadeIn>

            <div className="page-surface-paths">
              {enterpriseCareers.paths.map((path, index) => (
                <FadeIn key={path.title} delay={index * 0.06}>
                  <article className="page-surface-path">
                    <h3>{path.title}</h3>
                    <p>{path.description}</p>
                  </article>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>

        <section className="page-surface-band">
          <div className="page-surface-container">
            <FadeIn className="page-surface-band-panel">
              <h2 className="page-surface-section-title">
                {enterpriseCareers.openRolesTitle}
              </h2>
              <p className="page-surface-section-intro">
                {enterpriseCareers.openRolesIntro}
              </p>
              <div className="page-surface-band-box">
                <p>{enterpriseCareers.openRolesNote}</p>
                <p>{enterpriseCareers.ctaHint}</p>
                <Link href={enterpriseCareers.ctaHref}>
                  <Button className="bg-[var(--hopstec-teal)] text-slate-950 hover:bg-[var(--hopstec-teal)]/90">
                    {enterpriseCareers.cta}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </FadeIn>
          </div>
        </section>
      </div>
    </PageLayout>
  );
};

export default CareersPage;
