import { useEffect } from 'react';

/**
 * Reveals every element marked with [data-reveal] once it scrolls into view.
 * Re-scans on DOM mutations so filtered product grids and route changes are covered.
 */
export default function useScrollReveal() {
  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduceMotion || typeof IntersectionObserver === 'undefined') {
      document.querySelectorAll('[data-reveal]').forEach((element) => element.classList.add('is-revealed'));
      return undefined;
    }

    const tracked = new WeakSet();
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-revealed');
        observer.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -7% 0px', threshold: 0.08 });

    function scan() {
      document.querySelectorAll('[data-reveal]:not(.is-revealed)').forEach((element) => {
        if (tracked.has(element)) return;
        tracked.add(element);
        observer.observe(element);
      });
    }

    scan();
    const mutations = new MutationObserver(scan);
    mutations.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      mutations.disconnect();
    };
  }, []);
}
