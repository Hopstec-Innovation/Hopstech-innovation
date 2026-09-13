import { Link } from "wouter";
import { ArrowUpRight, Linkedin } from "lucide-react";
import { BrandLogo } from "./BrandLogo";
import { enterpriseFooter } from "@/content/enterprise";
import { handleSectionLink } from "@/lib/scrollToSection";
import frenchTechGrandParisLogo from "@/assets/Logo_FT_GrandParis_FondBlanc.png";
import "./enterprise/footer.css";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const handleNavClick = (
    event: React.MouseEvent<HTMLAnchorElement>,
    href: string
  ) => {
    if (handleSectionLink(href)) {
      event.preventDefault();
    }
  };

  const renderLink = (link: {
    label: string;
    href: string;
    external?: boolean;
  }) => {
    if (link.external || link.href.startsWith("http")) {
      return (
        <a href={link.href} target="_blank" rel="noopener noreferrer">
          {link.label}
          <ArrowUpRight className="h-3.5 w-3.5 opacity-60" />
        </a>
      );
    }

    if (link.href.startsWith("/#")) {
      return (
        <a href={link.href} onClick={(event) => handleNavClick(event, link.href)}>
          {link.label}
        </a>
      );
    }

    return (
      <Link href={link.href}>
        <a>{link.label}</a>
      </Link>
    );
  };

  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <div className="site-footer-top">
          <div className="site-footer-brand">
            <Link href="/">
              <a className="site-footer-brand-link">
                <BrandLogo size="md" showRing={false} />
                <span className="site-footer-brand-name">
                  {enterpriseFooter.companyName}
                </span>
              </a>
            </Link>
            <p className="site-footer-tagline">{enterpriseFooter.tagline}</p>
            <div className="site-footer-contact">
              <span>{enterpriseFooter.address}</span>
              <a href={`mailto:${enterpriseFooter.email}`}>
                {enterpriseFooter.email}
              </a>
              <a href={enterpriseFooter.phoneHref}>{enterpriseFooter.phone}</a>
            </div>
          </div>

          <div>
            <h3 className="site-footer-col-title">Company</h3>
            <ul className="site-footer-list">
              {enterpriseFooter.companyLinks.map((link) => (
                <li key={link.label}>{renderLink(link)}</li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="site-footer-col-title">Work</h3>
            <ul className="site-footer-list">
              {enterpriseFooter.workLinks.map((link) => (
                <li key={link.label}>{renderLink(link)}</li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="site-footer-col-title">Clients</h3>
            <ul className="site-footer-list">
              {enterpriseFooter.clientLinks.map((link) => (
                <li key={link.label}>{renderLink(link)}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="site-footer-trust">
          <a
            href={enterpriseFooter.frenchTech.href}
            target="_blank"
            rel="noopener noreferrer"
            className="site-footer-french-tech"
            aria-label={enterpriseFooter.frenchTech.label}
          >
            <img
              src={frenchTechGrandParisLogo}
              alt="La French Tech Grand Paris"
            />
            <span>{enterpriseFooter.frenchTech.label}</span>
          </a>
          <p className="site-footer-trust-line">{enterpriseFooter.trustLine}</p>
        </div>

        <div className="site-footer-bottom">
          <p className="site-footer-copy">
            © {currentYear} {enterpriseFooter.companyName}. All rights reserved.
          </p>
          <nav className="site-footer-legal" aria-label="Legal">
            {enterpriseFooter.legalLinks.map((link) => (
              <Link key={link.label} href={link.href}>
                <a>{link.label}</a>
              </Link>
            ))}
          </nav>
          <div className="site-footer-social">
            {enterpriseFooter.socialLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={link.label}
              >
                {link.network === "linkedin" ? (
                  <Linkedin className="h-4 w-4" />
                ) : null}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
