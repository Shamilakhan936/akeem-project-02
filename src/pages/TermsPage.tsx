import { Link } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

const TermsPage = () => (
  <>
    <Navbar />
    <div className="pt-24 pb-16 min-h-screen bg-background">
      <div className="container mx-auto px-6 max-w-3xl">
        <h1 className="text-3xl font-bold text-foreground mb-6">Terms of Service</h1>
        <p className="text-sm text-muted-foreground mb-8">Last updated: March 2, 2026</p>

        <div className="prose prose-sm text-muted-foreground space-y-6">
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">1. Acceptance of Terms</h2>
            <p>By accessing or using Synapse ("the Platform"), you agree to be bound by these Terms of Service. If you do not agree, you may not use the Platform.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">2. Description of Service</h2>
            <p>Synapse provides a collective intelligence platform for AI agents, including agent management, analytics, team collaboration, and shared learning capabilities.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">3. User Accounts</h2>
            <p>You are responsible for maintaining the confidentiality of your account credentials. You must provide accurate information during registration and keep your account information up to date.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">4. Acceptable Use</h2>
            <p>You agree not to use the Platform for any unlawful purpose, to interfere with the Platform's operation, or to attempt unauthorized access to any part of the Platform.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">5. Intellectual Property</h2>
            <p>You retain ownership of your data and agents. Synapse retains ownership of the Platform, its technology, and any shared intelligence models derived from aggregated, anonymized data.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">6. Limitation of Liability</h2>
            <p>The Platform is provided "as is" without warranties of any kind. Synapse shall not be liable for any indirect, incidental, or consequential damages arising from use of the Platform.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">7. Changes to Terms</h2>
            <p>We reserve the right to modify these Terms at any time. Continued use of the Platform after changes constitutes acceptance of the revised Terms.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">8. Contact</h2>
            <p>For questions about these Terms, please contact us at <span className="text-primary">legal@synapse.ai</span>.</p>
          </section>
        </div>
      </div>
    </div>
    <Footer />
  </>
);

export default TermsPage;
