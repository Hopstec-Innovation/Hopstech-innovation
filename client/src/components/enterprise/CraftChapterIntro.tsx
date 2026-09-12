import { FadeIn } from "@/components/animations/FadeIn";
import { enterpriseCraft } from "@/content/enterprise";

const CraftChapterIntro = () => {
  return (
    <section
      id="craft"
      className="border-t border-white/5 bg-slate-950 pt-20 pb-4 md:pt-28"
      aria-labelledby="craft-heading"
    >
      <div className="container mx-auto px-4">
        <FadeIn className="mx-auto max-w-3xl text-center">
          <p className="mb-3 text-xs font-medium uppercase tracking-[0.28em] text-[var(--hopstec-teal)]">
            {enterpriseCraft.kicker}
          </p>
          <h2
            id="craft-heading"
            className="mb-4 text-3xl font-bold text-white md:text-4xl"
          >
            {enterpriseCraft.title}
          </h2>
          <p className="text-base leading-7 text-gray-300 md:text-lg">
            {enterpriseCraft.intro}
          </p>
        </FadeIn>
      </div>
    </section>
  );
};

export default CraftChapterIntro;
