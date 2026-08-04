import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { CustomEase } from "gsap/CustomEase";

gsap.registerPlugin(ScrollTrigger, CustomEase);

type Variant = {
    hidden: Record<string, number>;
    shown: Record<string, number>;
};
type Tier = "hero" | "grid";

// Hero: content the user sees once (headings, CTAs, lead images) — can
// breathe a little longer. Grid: repeated items (cards, gallery tiles,
// list rows) — snappier and tightly staggered so they read as one cascade.
const TIER_CONFIG: Record<Tier, { duration: number; ease: string; distance: number }> = {
    hero: { duration: 0.65, ease: "hero-ease", distance: 14 },
    grid: { duration: 0.42, ease: "grid-ease", distance: 10 },
};

CustomEase.create("hero-ease", "0.16, 1, 0.3, 1");
CustomEase.create("grid-ease", "0.23, 1, 0.32, 1");

function buildVariants(distance: number): Record<string, Variant> {
    return {
        "fade-up": {
            hidden: { opacity: 0, y: distance },
            shown: { opacity: 1, y: 0 },
        },
        "fade-down": {
            hidden: { opacity: 0, y: -distance },
            shown: { opacity: 1, y: 0 },
        },
        "fade-left": {
            hidden: { opacity: 0, x: distance },
            shown: { opacity: 1, x: 0, y: 0 },
        },
        "fade-right": {
            hidden: { opacity: 0, x: -distance },
            shown: { opacity: 1, x: 0, y: 0 },
        },
        "fade": {
            hidden: { opacity: 0 },
            shown: { opacity: 1 },
        },
        "zoom-in": {
            hidden: { opacity: 0, y: distance, scale: 0.97 },
            shown: { opacity: 1, y: 0, scale: 1 },
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
                ? { opacity: variant.hidden.opacity ?? 1 }
                : variant.hidden;
            const shown = prefersReducedMotion
                ? { opacity: variant.shown.opacity ?? 1 }
                : variant.shown;

            gsap.set(el, hidden);

            ScrollTrigger.create({
                trigger: el,
                start: el.dataset.animateStart ?? "top 90%",
                onEnter: () => gsap.to(el, { ...shown, duration, delay, ease: config.ease }),
                onEnterBack: () => gsap.to(el, { ...shown, duration, delay, ease: config.ease }),
                onLeave: () => gsap.set(el, hidden),
                onLeaveBack: () => gsap.set(el, hidden),
            });
        });
    };

    // Wait for images/fonts to settle so layout shifts don't cause
    // ScrollTrigger to compute positions before the layout has settled.
    if (document.readyState === "complete") {
        setup();
    } else {
        window.addEventListener("load", setup, { once: true });
    }
}
