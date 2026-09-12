import { useEffect } from 'react';
import PageLayout from '../components/PageLayout';
import HeroSection from '../components/enterprise/HeroSection';
import LogoStrip from '../components/enterprise/LogoStrip';
import AboutSection from '../components/enterprise/AboutSection';
import CircuitDivider from '../components/enterprise/CircuitDivider';
import ProductsSpotlightSection from '../components/enterprise/ProductsSpotlightSection';
import ServicesSection from '../components/enterprise/ServicesSection';
import CaseStudiesSection from '../components/enterprise/CaseStudiesSection';
import TestimonialsSection from '../components/enterprise/TestimonialsSection';
import CraftChapterIntro from '../components/enterprise/CraftChapterIntro';
import TechStackSection from '../components/enterprise/TechStackSection';
import HowWeShipSection from '../components/enterprise/HowWeShipSection';
import ClientVisibilitySection from '../components/enterprise/ClientVisibilitySection';
import FounderSection from '../components/enterprise/FounderSection';
import CtaBandSection from '../components/enterprise/CtaBandSection';
import SectionNav from '../components/enterprise/SectionNav';
import { scrollToSection } from '../lib/scrollToSection';

const HomePage = () => {
  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (hash) {
      const timer = window.setTimeout(() => scrollToSection(hash), 100);
      return () => window.clearTimeout(timer);
    }
  }, []);

  return (
    <PageLayout>
      <SectionNav />
      <HeroSection />
      <LogoStrip />
      <AboutSection />
      <CircuitDivider />
      <ProductsSpotlightSection />
      <ServicesSection />
      <CircuitDivider />
      <CaseStudiesSection />
      <TestimonialsSection />
      <CraftChapterIntro />
      <TechStackSection />
      <HowWeShipSection />
      <CircuitDivider />
      <ClientVisibilitySection />
      <FounderSection />
      <CtaBandSection />
    </PageLayout>
  );
};

export default HomePage;
