import { useEffect, useRef, ReactNode } from 'react';

type Variant = 'up' | 'right' | 'scale' | 'fade';

type RevealProps = {
  children: ReactNode;
  variant?: Variant;
  delay?: number; // ms
  className?: string;
  as?: keyof JSX.IntrinsicElements;
  once?: boolean;
};

/**
 * Scroll-reveal wrapper.
 * Uses IntersectionObserver + a data-attribute hook driven by index.css.
 * Cheap, no dependencies, respects prefers-reduced-motion.
 */
export function Reveal({
  children,
  variant = 'up',
  delay = 0,
  className,
  as: Tag = 'div',
  once = true,
}: RevealProps) {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    if (typeof IntersectionObserver === 'undefined') {
      node.setAttribute('data-revealed', 'true');
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            (entry.target as HTMLElement).setAttribute('data-revealed', 'true');
            if (once) io.unobserve(entry.target);
          } else if (!once) {
            (entry.target as HTMLElement).removeAttribute('data-revealed');
          }
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -10% 0px' },
    );

    io.observe(node);
    return () => io.disconnect();
  }, [once]);

  const style = delay
    ? { animationDelay: `${delay}ms`, ['--reveal-delay' as any]: `${delay}ms` }
    : undefined;

  const Component = Tag as any;
  return (
    <Component
      ref={ref as any}
      data-reveal={variant}
      className={className}
      style={style}
    >
      {children}
    </Component>
  );
}
