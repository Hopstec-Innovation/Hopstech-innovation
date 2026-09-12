import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { DevOpsPipelineScene } from "@/components/3d/DevOpsPipelineScene";
import { FadeIn } from "@/components/animations/FadeIn";
import { Card, CardContent } from "@/components/ui/card";
import { enterpriseHowWeShip } from "@/content/enterprise";

const HowWeShipSection = () => {
  return (
    <section
      id="how-we-ship"
      className="border-t border-white/5 bg-slate-900/30 pb-24 pt-20 md:pb-32 md:pt-24"
    >
      <div className="container mx-auto px-4">
        <FadeIn className="mx-auto mb-12 max-w-3xl text-center">
          <p className="mb-3 text-xs font-medium uppercase tracking-[0.24em] text-[var(--hopstec-teal)]">
            {enterpriseHowWeShip.kicker}
          </p>
          <h2 className="mb-4 text-3xl font-bold text-white md:text-4xl">
            {enterpriseHowWeShip.title}
          </h2>
          <p className="text-base leading-7 text-gray-300 md:text-lg">
            {enterpriseHowWeShip.intro}
          </p>
        </FadeIn>

        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 lg:grid-cols-3">
          <FadeIn delay={0.2} className="lg:col-span-2">
            <Card className="overflow-hidden border-slate-700 bg-slate-800/50">
              <CardContent className="p-0">
                <div className="relative h-[420px] md:h-[500px]">
                  <Suspense
                    fallback={
                      <div className="flex h-full items-center justify-center bg-slate-900/50">
                        <div className="text-center">
                          <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-[var(--hopstec-teal)]" />
                          <p className="text-gray-400">Loading pipeline...</p>
                        </div>
                      </div>
                    }
                  >
                    <DevOpsPipelineScene />
                  </Suspense>
                </div>
                <div className="border-t border-slate-700 bg-slate-900/50 p-4">
                  <p className="text-center text-sm text-gray-400">
                    Interactive 3D pipeline. Drag to explore our delivery workflow.
                  </p>
                </div>
              </CardContent>
            </Card>
          </FadeIn>

          <FadeIn delay={0.4} className="space-y-3">
            {enterpriseHowWeShip.stages.map((stage, index) => (
              <div
                key={stage.name}
                className="flex items-start gap-3 rounded-lg border border-slate-700/80 bg-slate-900/50 p-4 transition-colors hover:border-[var(--hopstec-teal)]/30"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--hopstec-teal)]/10 text-sm font-bold text-[var(--hopstec-teal)]">
                  {index + 1}
                </span>
                <div>
                  <p className="font-medium text-white">{stage.name}</p>
                  <p className="text-sm text-gray-400">{stage.desc}</p>
                </div>
              </div>
            ))}
          </FadeIn>
        </div>
      </div>
    </section>
  );
};

export default HowWeShipSection;
