import { ArrowUpRight } from "lucide-react";
import { AnimatedCounter } from "@/components/animations/AnimatedCounter";
import {
  enterpriseMetrics,
  enterpriseSocialProof,
  type SocialProofItem,
} from "@/content/enterprise";
import "./proof.css";

function ProofCard({ item }: { item: SocialProofItem }) {
  if (item.kind === "quote") {
    return (
      <article className="proof-card proof-card-featured">
        <div>
          <div className="proof-card-eyebrow">
            <strong>Client voice</strong>
            <span>{item.project}</span>
          </div>
          <blockquote className="proof-quote">{item.quote}</blockquote>
        </div>
        <div className="proof-attribution">
          <span className="proof-attribution-name">{item.name}</span>
          <span className="proof-attribution-role">
            {item.role}, {item.company}
          </span>
          {item.projectHref ? (
            <a
              href={item.projectHref}
              target="_blank"
              rel="noopener noreferrer"
              className="proof-attribution-project"
            >
              View project
              <ArrowUpRight className="h-3.5 w-3.5" />
            </a>
          ) : null}
        </div>
      </article>
    );
  }

  return (
    <article className="proof-card">
      <div className="proof-card-eyebrow">
        <strong>Outcome</strong>
        <span>{item.project}</span>
      </div>
      <p className="proof-outcome-result">{item.result}</p>
      <p className="proof-outcome-detail">{item.detail}</p>
      <div className="proof-outcome-meta">
        <span className="proof-status">{item.status}</span>
        {item.projectHref ? (
          <a
            href={item.projectHref}
            target="_blank"
            rel="noopener noreferrer"
            className="proof-attribution-project"
          >
            Visit
            <ArrowUpRight className="h-3.5 w-3.5" />
          </a>
        ) : null}
      </div>
    </article>
  );
}

const TestimonialsSection = () => {
  const quoteItems = enterpriseSocialProof.items.filter((item) => item.kind === "quote");
  const outcomeItems = enterpriseSocialProof.items.filter((item) => item.kind === "outcome");

  return (
    <section id="testimonials" className="proof-section" aria-labelledby="proof-heading">
      <div className="proof-container">
        <div className="proof-kicker">
          <span>
            <i aria-hidden="true" />
            {enterpriseSocialProof.kicker}
          </span>
          <span>01 / Trust</span>
        </div>

        <div className="proof-heading-row">
          <h2 id="proof-heading">
            {enterpriseSocialProof.titleLead}{" "}
            <em>{enterpriseSocialProof.titleEm}</em> {enterpriseSocialProof.titleTrail}
          </h2>
          <p>{enterpriseSocialProof.intro}</p>
        </div>

        <div className="proof-grid">
          {quoteItems.map((item) => (
            <ProofCard key={item.id} item={item} />
          ))}
          {outcomeItems.map((item) => (
            <ProofCard key={item.id} item={item} />
          ))}
        </div>
      </div>

      <div className="proof-metrics" aria-label="Company metrics">
        <div className="proof-metrics-inner">
          {enterpriseMetrics.map((metric) => (
            <div key={metric.label} className="proof-metric">
              <p className="proof-metric-value">
                {"static" in metric && metric.static ? (
                  metric.value
                ) : (
                  <AnimatedCounter
                    end={metric.value as number}
                    suffix={"suffix" in metric ? metric.suffix : ""}
                    duration={1.8}
                  />
                )}
              </p>
              <p className="proof-metric-label">{metric.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
