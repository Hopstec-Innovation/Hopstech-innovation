import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Redirect, Route, Switch } from "wouter";
import AnalyticsScript from "./components/AnalyticsScript";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { ScrollProgress } from "./components/animations/ScrollProgress";

const HomePage = lazy(() => import("./pages/HomePage"));
const ContactPage = lazy(() => import("./pages/ContactPage"));
const CareersPage = lazy(() => import("./pages/CareersPage"));
const PrivacyPage = lazy(() => import("./pages/PrivacyPage"));
const TermsPage = lazy(() => import("./pages/TermsPage"));
const AquaPulsePage = lazy(() => import("./pages/AquaPulsePage"));
const ClientPortalPage = lazy(() => import("./pages/ClientPortalPage"));
const AuthVerifyPage = lazy(() => import("./pages/AuthVerifyPage"));
const ProjectsPage = lazy(() => import("./pages/ProjectsPage"));
const ClientProjectDetailPage = lazy(() => import("./pages/ClientProjectDetailPage"));
const MessagesPage = lazy(() => import("./pages/MessagesPage"));
const InvoicesPage = lazy(() => import("./pages/InvoicesPage"));
const SupportPage = lazy(() => import("./pages/SupportPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const AnalyticsPage = lazy(() => import("./pages/AnalyticsPage"));
const NotFound = lazy(() => import("./pages/NotFound"));

function RouteLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-center text-slate-400">
      Loading page...
    </div>
  );
}

function Router() {
  return (
    <Switch>
      <Route path={"/"}>{() => <HomePage />}</Route>
      <Route path={"/aquapulse"}>{() => <AquaPulsePage />}</Route>
      <Route path={"/portfolio"}>{() => <Redirect to="/" />}</Route>
      <Route path={"/portfolio/:slug"}>{() => <Redirect to="/" />}</Route>
      <Route path={"/contact"}>{() => <ContactPage />}</Route>
      <Route path={"/careers"}>{() => <CareersPage />}</Route>
      <Route path={"/privacy"}>{() => <PrivacyPage />}</Route>
      <Route path={"/terms"}>{() => <TermsPage />}</Route>
      <Route path={"/client-portal/projects/:id"}>{() => <ClientProjectDetailPage />}</Route>
      <Route path={"/client-portal/projects"}>{() => <ProjectsPage />}</Route>
      <Route path={"/client-portal/messages"}>{() => <MessagesPage />}</Route>
      <Route path={"/client-portal/invoices"}>{() => <InvoicesPage />}</Route>
      <Route path={"/client-portal/support"}>{() => <SupportPage />}</Route>
      <Route path={"/client-portal/profile"}>{() => <ProfilePage />}</Route>
      <Route path={"/client-portal/analytics"}>{() => <AnalyticsPage />}</Route>
      <Route path={"/client-portal"}>{() => <ClientPortalPage />}</Route>
      <Route path={"/auth/verify"}>{() => <AuthVerifyPage />}</Route>
      <Route path={"/404"}>{() => <NotFound />}</Route>
      <Route>{() => <NotFound />}</Route>
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="dark"
        // switchable
      >
        <TooltipProvider>
          <ScrollProgress />
          <AnalyticsScript />
          <Toaster />
          <Suspense fallback={<RouteLoader />}>
            <Router />
          </Suspense>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
