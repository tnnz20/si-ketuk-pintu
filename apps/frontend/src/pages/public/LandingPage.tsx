import HeroSection from '../../components/landing/HeroSection';
import StatusSection from '../../components/landing/StatusSection';
import ProcessSection from '../../components/landing/ProcessSection';
import TrustSection from '../../components/landing/TrustSection';
import CTASection from '../../components/landing/CTASection';

export default function LandingPage() {
  return (
    <div>
      <HeroSection />
      <TrustSection />
      <StatusSection />
      <ProcessSection />
      <CTASection />
    </div>
  );
}
