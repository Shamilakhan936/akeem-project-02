import Navbar from "@/components/layout/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import FeaturesSection from "@/components/landing/FeaturesSection";
import SharedIntelligenceSection from "@/components/landing/SharedIntelligenceSection";
import FeedbackLoopSection from "@/components/landing/FeedbackLoopSection";
import KnowledgeGraphSection from "@/components/landing/KnowledgeGraphSection";
import ArchitectureSection from "@/components/landing/ArchitectureSection";
// import FlywheelSection from "@/components/landing/FlywheelSection";
import CrossIndustrySection from "@/components/landing/CrossIndustrySection";
import CTASection from "@/components/landing/CTASection";
import Footer from "@/components/layout/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />
      <FeaturesSection />
      <SharedIntelligenceSection />
      <FeedbackLoopSection />
      <KnowledgeGraphSection />
      <ArchitectureSection />
      {/* <FlywheelSection /> */}
      <CrossIndustrySection />
      <CTASection />
      <Footer />
    </div>
  );
};

export default Index;
