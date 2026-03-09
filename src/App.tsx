import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ErrorBoundary from "@/components/common/ErrorBoundary";
import ProtectedRoute from "@/components/common/ProtectedRoute";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import EnterpriseOnboarding from "./pages/EnterpriseOnboarding";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import DashboardOverview from "./pages/DashboardOverview";
import AgentsPage from "./pages/AgentsPage";
import AgentDetailPage from "./pages/AgentDetailPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import SettingsPage from "./pages/SettingsPage";
import TeamPage from "./pages/TeamPage";
import IntelligencePage from "./pages/IntelligencePage";
import DecisionsPage from "./pages/DecisionsPage";
import FeedbackPipelinePage from "./pages/FeedbackPipelinePage";
import NetworkMetricsPage from "./pages/NetworkMetricsPage";
import ScaleNetworkPage from "./pages/ScaleNetworkPage";
import TransactionsPage from "./pages/TransactionsPage";
import KnowledgeGraphPage from "./pages/KnowledgeGraphPage";
import PilotCompaniesPage from "./pages/PilotCompaniesPage";
import NetworkEffectPage from "./pages/NetworkEffectPage";
import MarketplacePage from "./pages/MarketplacePage";
import PayLaterrPage from "./pages/PayLaterrPage";
import ApiDashboardPage from "./pages/ApiDashboardPage";
import WebhooksPage from "./pages/WebhooksPage";
import PlatformPage from "./pages/PlatformPage";
import DocsPage from "./pages/DocsPage";
import PricingPage from "./pages/PricingPage";
import BlogPage from "./pages/BlogPage";
import AboutPage from "./pages/AboutPage";
import TermsPage from "./pages/TermsPage";
import PrivacyPage from "./pages/PrivacyPage";
import WhitepaperPage from "./pages/WhitepaperPage";
import RoadmapPage from "./pages/RoadmapPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <ErrorBoundary>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/start-building" element={<EnterpriseOnboarding />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/platform" element={<PlatformPage />} />
              <Route path="/docs" element={<DocsPage />} />
              <Route path="/pricing" element={<PricingPage />} />
              <Route path="/blog" element={<BlogPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/terms" element={<TermsPage />} />
              <Route path="/privacy" element={<PrivacyPage />} />
              <Route path="/whitepaper" element={<WhitepaperPage />} />
              <Route path="/roadmap" element={<RoadmapPage />} />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <DashboardLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<DashboardOverview />} />
                <Route path="transactions" element={<TransactionsPage />} />
                <Route path="pilots" element={<PilotCompaniesPage />} />
                <Route path="knowledge-graph" element={<KnowledgeGraphPage />} />
                <Route path="agents" element={<AgentsPage />} />
                <Route path="agents/:agentId" element={<AgentDetailPage />} />
                <Route path="intelligence" element={<IntelligencePage />} />
                <Route path="decisions" element={<DecisionsPage />} />
                <Route path="feedback" element={<FeedbackPipelinePage />} />
                <Route path="metrics" element={<NetworkMetricsPage />} />
                <Route path="network-effect" element={<NetworkEffectPage />} />
                <Route path="marketplace" element={<MarketplacePage />} />
                <Route path="scale" element={<ScaleNetworkPage />} />
                <Route path="paylaterr" element={<PayLaterrPage />} />
                <Route path="api" element={<ApiDashboardPage />} />
                <Route path="webhooks" element={<WebhooksPage />} />
                <Route path="analytics" element={<AnalyticsPage />} />
                <Route path="teams" element={<TeamPage />} />
                <Route path="settings" element={<SettingsPage />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </ErrorBoundary>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
