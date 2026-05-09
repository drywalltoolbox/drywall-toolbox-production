import TrendingProducts from '../components/catalog/TrendingProducts';
import FeatureSection from '../components/ui/FeatureSection';
import HeroSection from '../components/ui/HeroSection';
import tapeTechLogo from '/brands/TapeTech/tapetech_logo.svg';
import columbiaLogo from '/brands/Columbia/columbia_logo_white.svg';
import surproLogo from '/brands/SurPro/surpro_logo.svg';
import asgardLogo from '/brands/Asgard/asgard_logo.svg';
import platinumLogo from '/brands/Platinum/platinum_logo_white.svg';
import level5Logo from '/brands/Level5/Level5.svg';
import SEOHead from '../components/shared/SEOHead';
import { buildOrganizationSchema, buildSiteLinksSearchBoxSchema } from '../utils/schema';
import { Truck, Shield, Phone, Wrench } from 'lucide-react';

const brandLogos = [
  { name: 'TapeTech', src: tapeTechLogo, to: '/products?brand=TapeTech' },
  { name: 'Columbia', src: columbiaLogo, to: '/products?brand=Columbia%20Taping%20Tools' },
  { name: 'Level5', src: level5Logo, to: '/products?brand=Level5' },
  { name: 'Platinum Drywall Tools', src: platinumLogo, to: '/products?brand=Platinum%20Drywall%20Tools' },
  { name: 'Asgard', src: asgardLogo, to: '/products?brand=Asgard' },
  { name: 'SurPro', src: surproLogo, to: '/products?brand=SurPro' },
];

const HOME_FEATURES = [
  { icon: Truck, title: 'Free Shipping', description: 'On all qualifying orders $75+ to the contiguous USA.' },
  { icon: Shield, title: 'Warranty Covered', description: 'Full manufacturer coverage. We handle all claims for you.' },
  { icon: Wrench, title: 'Repair Services', description: 'Professional tool repair by industry-trained technicians.' },
  { icon: Phone, title: 'Expert Support', description: 'Real help from real drywall pros — not a call center.' },
];

export default function Home() {
  return (
    <>
      <SEOHead
        title="Professional Drywall Tools & Equipment"
        description="Top trusted one-stop shop for professional drywall tools. Get production-grade tools and parts at unbeatable prices with lightning-fast shipping."
        canonical="https://drywalltoolbox.com/"
        schema={[buildOrganizationSchema(), buildSiteLinksSearchBoxSchema()]}
      />

      <div className="page-wrapper dtb-home-page">
        <HeroSection
          titleLines={["The Pro Standard", "in Drywall."]}
          subtitle="Premium tools for every drywall job — unbeatable prices, lightning-fast shipping."
          brands={brandLogos}
        />

        <div className="dtb-feature-strip" aria-label="Key features">
          <FeatureSection
            features={HOME_FEATURES}
            style={{
              padding: 'clamp(1.5rem, 3vw, 2.5rem) clamp(1.5rem, 5vw, 3rem)',
              background: 'white'
            }}
          />
        </div>

        <TrendingProducts />
      </div>
    </>
  );
}
