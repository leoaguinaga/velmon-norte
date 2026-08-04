import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export function initRotateOnView(selector: string) {
    const elements = document.querySelectorAll<HTMLElement>(selector);
    if (!elements.length) return;

    const prefersReducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
    ).matches;
    if (prefersReducedMotion) return;

    gsap.registerPlugin(ScrollTrigger);

    // Each element gets its own trigger tied to its own position, so they
    // rotate one at a time as the user scrolls past them — not all at once.
    elements.forEach((el) => {
        const restRotation = gsap.getProperty(el, "rotation") as number;
        const activeRotation = restRotation + 8;

        ScrollTrigger.create({
            trigger: el,
            start: "top 50%",
            onEnter: () =>
                gsap.to(el, { rotate: activeRotation, duration: 0.5, ease: "power2.out" }),
            onLeaveBack: () =>
                gsap.to(el, { rotate: restRotation, duration: 0.5, ease: "power2.out" }),
        });
    });
}
