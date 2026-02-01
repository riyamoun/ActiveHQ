import {
  SimpleNavbar,
  LiveDashboardHero,
  InteractiveGymGallery,
  MemberTablePreview,
  GymTypesGrid,
  OperationalFacts,
  LocalPricing,
  SimpleFooter,
} from './components';

export function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950">
      {/* Navigation */}
      <SimpleNavbar />

      {/* Main content */}
      <main>
        {/* Section 1: Live Dashboard Preview - THE HERO */}
        <LiveDashboardHero />

        {/* Section 2: Interactive Gym Photos with One-liner */}
        <InteractiveGymGallery />

        {/* Section 3: Real Gym Operations - Member Table + Payment Modal */}
        <MemberTablePreview />

        {/* Section 4: Gym Types We Support */}
        <GymTypesGrid />

        {/* Section 5: Trust Through Facts */}
        <OperationalFacts />

        {/* Section 6: Pricing - Indian Style */}
        <section id="demo">
          <LocalPricing />
        </section>
      </main>

      {/* Footer */}
      <SimpleFooter />
    </div>
  );
}

export default LandingPage;
