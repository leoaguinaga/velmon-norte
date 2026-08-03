import { animate, inView } from "motion";

type Variant = { hidden: Record<string, string>; shown: Record<string, string> };
type Tier = "hero" | "grid";

// Hero: content the user sees once (headings, CTAs, lead images) — can
// breathe a little longer. Grid: repeated items (cards, gallery tiles,
// list rows) — snappier and tightly staggered so they read as one cascade.
const TIER_CONFIG: Record<Tier, { duration: number; easing: number[]; distance: string }> = {
    hero: { duration: 0.65, easing: [0.16, 1, 0.3, 1], distance: "14px" },
    grid: { duration: 0.42, easing: [0.23, 1, 0.32, 1], distance: "10px" },
};

function buildVariants(distance: string): Record<string, Variant> {
    return {
        "fade-up": {
            hidden: { opacity: "0", transform: `translateY(${distance})` },
            shown: { opacity: "1", transform: "translateY(0px)" },
        },
        "fade-down": {
            hidden: { opacity: "0", transform: `translateY(-${distance})` },
            shown: { opacity: "1", transform: "translateY(0px)" },
        },
        "fade-left": {
            hidden: { opacity: "0", transform: `translateX(${distance})` },
            shown: { opacity: "1", transform: "translateY(0px) translateX(0px)" },
        },
        "fade-right": {
            hidden: { opacity: "0", transform: `translateX(-${distance})` },
            shown: { opacity: "1", transform: "translateY(0px) translateX(0px)" },
        },
        "fade": {
            hidden: { opacity: "0" },
            shown: { opacity: "1" },
        },
        "zoom-in": {
            hidden: { opacity: "0", transform: `translateY(${distance}) scale(0.97)` },
            shown: { opacity: "1", transform: "translateY(0px) scale(1)" },
        },
    };
}

const VARIANTS_BY_TIER: Record<Tier, Record<string, Variant>> = {
    hero: buildVariants(TIER_CONFIG.hero.distance),
    grid: buildVariants(TIER_CONFIG.grid.distance),
};

export function initScrollAnimations(root: ParentNode = document) {
    const prefersReducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
    ).matches;

    const setup = () => {
        const elements = root.querySelectorAll<HTMLElement>("[data-animate]");

        elements.forEach((el) => {
            const tier: Tier = el.dataset.animateTier === "grid" ? "grid" : "hero";
            const config = TIER_CONFIG[tier];
            const variants = VARIANTS_BY_TIER[tier];
            const variant = variants[el.dataset.animate ?? "fade-up"] ?? variants["fade-up"];
            const duration = Number(el.dataset.animateDuration ?? config.duration);
            const delay = Number(el.dataset.animateDelay ?? 0);

            // Reduced motion: keep the opacity fade (it aids comprehension of
            // content appearing) but drop the transform-based movement.
            const hidden = prefersReducedMotion
                ? { opacity: variant.hidden.opacity ?? "1" }
                : variant.hidden;
            const shown = prefersReducedMotion
                ? { opacity: variant.shown.opacity ?? "1" }
                : variant.shown;

            Object.assign(el.style, hidden);

            inView(
                el,
                () => {
                    animate(el, shown, { duration, delay, easing: config.easing });

                    return () => {
                        animate(el, hidden, { duration: 0 });
                    };
                },
                { margin: "0px 0px -10% 0px" },
            );
        });
    };

    // Wait for images/fonts to settle so layout shifts don't cause the
    // IntersectionObserver to fire a spurious leave right after entering.
    if (document.readyState === "complete") {
        setup();
    } else {
        window.addEventListener("load", setup, { once: true });
    }
}
