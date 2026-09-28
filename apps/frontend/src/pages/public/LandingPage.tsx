import HeroSection from '@/components/landing/HeroSection';
import StatusSection from '@/components/landing/StatusSection';
import ProcessSection from '@/components/landing/ProcessSection';
import TrustSection from '@/components/landing/TrustSection';
import CTASection from '@/components/landing/CTASection';
import Seo from '@/components/shared/Seo';

export default function LandingPage() {
  return (
    <div>
      <Seo title="Si Ketuk Pintu — Permohonan Kunjungan Tamu Kabupaten Tapin" />
      <HeroSection />
      <TrustSection />
      <StatusSection />
      <ProcessSection />
      <CTASection />
    </div>
  );
}
