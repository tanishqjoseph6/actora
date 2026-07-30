"use client";

import { LANDING_FEATURE_SECTIONS } from "./landing-data";
import { FeatureMockup } from "./FeatureMockup";
import { FadeUp } from "./motion";
import { landing } from "./landing-tokens";

export function FeatureShowcaseSection() {
  return (
    <section id="features" className={`scroll-mt-24 ${landing.section}`}>
      <div className={landing.container}>
        <FadeUp className="mx-auto mb-16 max-w-2xl text-center sm:mb-20">
          <p className="mb-4 text-xs font-medium uppercase tracking-[0.14em] text-[#2563EB]">
            Features
          </p>
          <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl lg:text-[2.75rem]">
            One workspace. Every tool you need.
          </h2>
          <p className="mt-4 text-base text-[#A1A1AA] sm:text-lg">
            Eight integrated surfaces — designed so conversations become outcomes.
          </p>
        </FadeUp>

        <div className="space-y-24 sm:space-y-32 lg:space-y-40">
          {LANDING_FEATURE_SECTIONS.map((feature, index) => {
            const reversed = index % 2 === 1;
            return (
              <article
                key={feature.id}
                id={feature.id}
                className="scroll-mt-28"
              >
                <div
                  className={`grid items-center gap-10 lg:grid-cols-2 lg:gap-16 ${
                    reversed ? "lg:[direction:rtl]" : ""
                  }`}
                >
                  <FadeUp
                    className={reversed ? "lg:[direction:ltr]" : ""}
                    delay={0.05}
                  >
                    <FeatureMockup featureId={feature.id} />
                  </FadeUp>

                  <FadeUp
                    className={reversed ? "lg:[direction:ltr]" : ""}
                    delay={0.12}
                  >
                    <p className="text-xs font-medium uppercase tracking-[0.14em] text-[#2563EB]">
                      {feature.title}
                    </p>
                    <h3 className="mt-3 text-2xl font-semibold tracking-tight text-white sm:text-3xl lg:text-4xl">
                      {feature.headline}
                    </h3>
                    <p className="mt-4 text-base leading-relaxed text-[#A1A1AA] sm:text-lg">
                      {feature.description}
                    </p>
                  </FadeUp>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
