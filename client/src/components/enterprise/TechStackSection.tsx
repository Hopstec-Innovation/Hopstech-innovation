import { Suspense } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { TechConstellationScene } from "@/components/3d/TechConstellationScene";
import { FadeIn } from "@/components/animations/FadeIn";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { enterpriseTechStack } from "@/content/enterprise";

const categories = [
  { name: "Frontend", color: "bg-[var(--hopstec-teal)]", count: 4 },
  { name: "Backend", color: "bg-blue-500", count: 4 },
  { name: "Database", color: "bg-cyan-500", count: 3 },
  { name: "DevOps", color: "bg-violet-500", count: 4 },
  { name: "Tools", color: "bg-emerald-500", count: 3 },
];

const TechStackSection = () => {
  return (
    <section id="tech-stack" className="bg-slate-900/30 pb-20 pt-12 md:pb-28 md:pt-16">
      <div className="container mx-auto px-4">
        <FadeIn className="mb-12 text-center">
          <div className="mb-4 flex items-center justify-center gap-2">
            <Sparkles className="h-5 w-5 text-[var(--hopstec-teal)]" />
            <p className="text-xs font-medium uppercase tracking-[0.24em] text-[var(--hopstec-teal)]">
              {enterpriseTechStack.kicker}
            </p>
          </div>
          <h2 className="mb-4 text-3xl font-bold text-white md:text-4xl">
            {enterpriseTechStack.title}
          </h2>
          <p className="mx-auto max-w-2xl text-base leading-7 text-gray-300 md:text-lg">
            {enterpriseTechStack.intro}
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
                          <p className="text-gray-400">Loading tech stack...</p>
                        </div>
                      </div>
                    }
                  >
                    <TechConstellationScene />
                  </Suspense>
                </div>
                <div className="border-t border-slate-700 bg-slate-900/50 p-4">
                  <p className="text-center text-sm text-gray-400">
                    Drag to rotate · Scroll to zoom · Hover nodes for details
                  </p>
                </div>
              </CardContent>
            </Card>
          </FadeIn>

          <FadeIn delay={0.4} className="space-y-4">
            <Card className="border-slate-700 bg-slate-800/50">
              <CardContent className="p-6">
                <h3 className="mb-4 text-xl font-semibold text-white">Stack categories</h3>
                <div className="space-y-3">
                  {categories.map((category) => (
                    <div
                      key={category.name}
                      className="flex items-center justify-between rounded-lg border border-slate-700/80 bg-slate-900/50 p-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`h-3 w-3 rounded-full ${category.color}`} />
                        <span className="font-medium text-white">{category.name}</span>
                      </div>
                      <Badge variant="secondary" className="bg-slate-700 text-gray-300">
                        {category.count}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </FadeIn>
        </div>
      </div>
    </section>
  );
};

export default TechStackSection;
