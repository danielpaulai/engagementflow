"use client";

import { useEffect } from "react";

export default function ScrollRevealInit() {
  useEffect(() => {
    // Intersection Observer for reveal-on-scroll
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
          }
        });
      },
      { threshold: 0.1 }
    );

    document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));

    // Cursor-follow for glow buttons
    const handleMouseMove = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest(".glow-button");
      if (!target) return;
      const rect = target.getBoundingClientRect();
      (target as HTMLElement).style.setProperty("--x", `${e.clientX - rect.left}px`);
      (target as HTMLElement).style.setProperty("--y", `${e.clientY - rect.top}px`);
    };

    document.addEventListener("mousemove", handleMouseMove);

    // Re-observe on DOM changes for dynamically added elements
    const mutationObserver = new MutationObserver(() => {
      document.querySelectorAll(".reveal:not(.is-visible)").forEach((el) => observer.observe(el));
    });
    mutationObserver.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      mutationObserver.disconnect();
      document.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  return null;
}
