import PageLayout from "@/components/PageLayout";
import { FadeIn } from "@/components/animations/FadeIn";
import type { LegalDocument } from "@/content/legal";
import "@/components/enterprise/page-surface.css";

type LegalDocumentPageProps = {
  document: LegalDocument;
};

const LegalDocumentPage = ({ document }: LegalDocumentPageProps) => {
  return (
    <PageLayout>
      <div className="page-surface">
        <section className="page-surface-hero">
          <div className="page-surface-container page-surface-legal">
            <FadeIn>
              <p className="page-surface-kicker">
                <i aria-hidden="true" />
                {document.kicker}
              </p>
              <h1 className="page-surface-title">{document.title}</h1>
              <p className="page-surface-legal-updated">
                Last updated: {document.updated}
              </p>
              <p className="page-surface-lede">{document.intro}</p>
            </FadeIn>
          </div>
        </section>

        <section className="page-surface-body">
          <div className="page-surface-container page-surface-legal">
            <FadeIn>
              <div className="page-surface-legal-sections">
                {document.sections.map((section) => (
                  <article key={section.heading} className="page-surface-legal-section">
                    <h2>{section.heading}</h2>
                    {section.paragraphs.map((paragraph, index) => (
                      <p key={`${section.heading}-p-${index}`}>{paragraph}</p>
                    ))}
                    {section.bullets ? (
                      <ul>
                        {section.bullets.map((item, index) => (
                          <li key={`${section.heading}-b-${index}`}>{item}</li>
                        ))}
                      </ul>
                    ) : null}
                  </article>
                ))}
              </div>
            </FadeIn>
          </div>
        </section>
      </div>
    </PageLayout>
  );
};

export default LegalDocumentPage;
