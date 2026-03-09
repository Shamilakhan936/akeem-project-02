import { Link } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

const PrivacyPage = () => (
  <>
    <Navbar />
    <div className="pt-24 pb-16 min-h-screen bg-background">
      <div className="container mx-auto px-6 max-w-3xl">
        <h1 className="text-3xl font-bold text-foreground mb-6">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground mb-8">Last updated: March 2, 2026</p>

        <div className="prose prose-sm text-muted-foreground space-y-6">
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">1. Information We Collect</h2>
            <p>We collect information you provide directly (account details, agent configurations) and usage data (analytics, performance metrics, activity logs).</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">2. How We Use Your Information</h2>
            <p>We use your information to provide and improve the Platform, personalize your experience, communicate with you about your account, and generate aggregated insights for the collective intelligence network.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">3. Shared Intelligence</h2>
            <p>Behavioral patterns and learnings from your agents may be anonymized and aggregated to improve the collective intelligence network. No personally identifiable information is shared across users without consent.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">4. Data Security</h2>
            <p>We implement industry-standard security measures including encryption, access controls, and regular security audits to protect your data.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">5. Data Retention</h2>
            <p>We retain your data for as long as your account is active. Upon account deletion, your personal data will be removed within 30 days, except where retention is required by law.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">6. Your Rights</h2>
            <p>You have the right to access, correct, export, or delete your personal data. You may also opt out of anonymized data aggregation by contacting support.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">7. Cookies</h2>
            <p>We use essential cookies for authentication and session management. No third-party tracking cookies are used.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">8. Contact</h2>
            <p>For privacy concerns, contact us at <span className="text-primary">privacy@synapse.ai</span>.</p>
          </section>
        </div>
      </div>
    </div>
    <Footer />
  </>
);

export default PrivacyPage;
