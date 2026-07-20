import { useEffect, useRef, useState } from 'react';

interface Options extends IntersectionObserverInit {
  freezeOnceVisible?: boolean; // once true, never goes back to false
}

/**
 * Intersection Observer hook.
 * Returns [ref, isIntersecting] — attach ref to any DOM element.
 *
 * Usage (infinite scroll trigger):
 *   const [loaderRef, isVisible] = useIntersectionObserver({ threshold: 0.1 });
 *   useEffect(() => {
 *     if (isVisible && hasNextPage) fetchNextPage();
 *   }, [isVisible]);
 */
export function useIntersectionObserver(
  options: Options = {}
): [React.RefObject<HTMLDivElement | null>, boolean] {
  const { threshold = 0, root = null, rootMargin = '0px', freezeOnceVisible = false } = options;
  const ref = useRef<HTMLDivElement | null>(null);
  const [isIntersecting, setIsIntersecting] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (freezeOnceVisible && isIntersecting) return; // already visible — done

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
      },
      { threshold, root, rootMargin }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold, root, rootMargin, freezeOnceVisible, isIntersecting]);

  return [ref, isIntersecting];
}
