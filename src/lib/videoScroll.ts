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

    // The <video> ships with preload="none" so mobile (which never calls
    // this function) doesn't fetch it. Callers of this function do want it
    // loaded, so kick that off explicitly instead of waiting on a fetch
    // that preload="none" will otherwise never start.
    video.preload = "auto";
    video.load();

    // Safari (desktop and iOS) never paints a <video> frame until playback
    // has actually started at least once, even though metadata/dimensions
    // are already available. Priming with an immediate play+pause forces
    // that first frame to render so the scroll-scrub isn't scrubbing a
    // blank canvas. This has to wait for actual decodable data (canplay) —
    // calling play() while readyState is still 0 gets silently dropped by
    // Safari instead of queued, so the prime never happens.
    const primeFirstFrame = () => {
        video.play()
            .then(() => video.pause())
            .catch(() => {});
    };

    if (video.readyState >= 3) {
        primeFirstFrame();
    } else {
        video.addEventListener("canplay", primeFirstFrame, { once: true });
    }

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
