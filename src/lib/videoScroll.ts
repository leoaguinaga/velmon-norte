import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export function initVideoScrub(triggerSelector: string, videoSelector: string) {
    const triggerEl = document.querySelector<HTMLElement>(triggerSelector);
    const video = document.querySelector<HTMLVideoElement>(videoSelector);

    if (!triggerEl || !video) return;

    const prefersReducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
    ).matches;

    if (prefersReducedMotion) {
        video.setAttribute("autoplay", "");
        video.setAttribute("loop", "");
        video.play().catch(() => {});
        return;
    }

    gsap.registerPlugin(ScrollTrigger);

    const setup = () => {
        const duration = video.duration || 4;

        ScrollTrigger.create({
            trigger: triggerEl,
            // Starts once the video is ~25-30% into the viewport. The
            // animation itself is long, so it needs to kick off early
            // rather than waiting for the element to be mostly in view.
            start: "top 75%",
            end: "bottom top",
            scrub: true,
            onUpdate: (self) => {
                video.currentTime = self.progress * duration;
            },
        });
    };

    if (video.readyState >= 1) {
        setup();
    } else {
        video.addEventListener("loadedmetadata", setup, { once: true });
    }
}
