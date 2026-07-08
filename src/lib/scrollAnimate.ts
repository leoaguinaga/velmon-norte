import { animate, inView } from "motion";

const EASE = [0.22, 1, 0.36, 1];

const VARIANTS: Record<string, { hidden: Record<string, string>; shown: Record<string, string> }> = {
    "fade-up": {
        hidden: { opacity: "0", transform: "translateY(28px)" },
        shown: { opacity: "1", transform: "translateY(0px)" },
    },
    "fade-down": {
        hidden: { opacity: "0", transform: "translateY(-28px)" },
        shown: { opacity: "1", transform: "translateY(0px)" },
    },
    "fade-left": {
        hidden: { opacity: "0", transform: "translateX(28px)" },
        shown: { opacity: "1", transform: "translateY(0px) translateX(0px)" },
    },
    "fade-right": {
        hidden: { opacity: "0", transform: "translateX(-28px)" },
        shown: { opacity: "1", transform: "translateY(0px) translateX(0px)" },
    },
    "fade": {
        hidden: { opacity: "0" },
        shown: { opacity: "1" },
    },
    "zoom-in": {
        hidden: { opacity: "0", transform: "scale(0.92)" },
        shown: { opacity: "1", transform: "scale(1)" },
    },
};

export function initScrollAnimations(root: ParentNode = document) {
    const setup = () => {
        const elements = root.querySelectorAll<HTMLElement>("[data-animate]");

        elements.forEach((el) => {
            const variant = VARIANTS[el.dataset.animate ?? "fade-up"] ?? VARIANTS["fade-up"];
            const duration = Number(el.dataset.animateDuration ?? 0.6);
            const delay = Number(el.dataset.animateDelay ?? 0);

            Object.assign(el.style, variant.hidden);

            inView(
                el,
                () => {
                    animate(el, variant.shown, { duration, delay, easing: EASE });

                    return () => {
                        animate(el, variant.hidden, { duration: 0 });
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
