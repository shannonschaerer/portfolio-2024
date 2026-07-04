"use client";

import { useState, useRef, useEffect, memo } from 'react';
import type { Testimonial } from '@/lib/types';
import styles from './Testimonials.module.css';

type TestimonialsProps = {
  testimonials: Testimonial[];
};

// ── Module-level helpers — no React deps, safe to call from useEffect ─

function getCardsVisible(): number {
  if (window.matchMedia('(min-width: 1025px)').matches) return 2.5;
  if (window.matchMedia('(min-width: 641px)').matches) return 1.5;
  return 1.2;
}

function measureStep(track: HTMLElement): number {
  const { children } = track;
  if (children.length < 2) return 0;
  return (children[1] as HTMLElement).offsetLeft
       - (children[0] as HTMLElement).offsetLeft;
}

// ── Shared slide content ──────────────────────────────────────────────

function SlideContent({ testimonial }: { testimonial: Testimonial }) {
  return (
    <blockquote className={styles.blockquote}>
      <p className={styles.quote}>{testimonial.Quote}</p>
      {testimonial.Translated && (
        <p className={styles.translationNote}>Originally in German</p>
      )}
      <footer className={styles.attribution}>
        <cite className={styles.author}>{testimonial.Author}</cite>
        {(testimonial.Role || testimonial.Company) && (
          <span className={styles.attributionDetail}>
            {[testimonial.Role, testimonial.Company].filter(Boolean).join(', ')}
          </span>
        )}
        {testimonial.Year && (
          <span className={styles.year}>{testimonial.Year}</span>
        )}
      </footer>
    </blockquote>
  );
}

// ── Slides — memo'd so React never re-reconciles this subtree ─────────
//    DOM recycling (appendChild) reorders slides imperatively. When the
//    parent re-renders due to isTransitioning / livePolite state changes,
//    React would otherwise diff the slide list and undo any reordering.
//    memo() bails out when testimonials prop is unchanged, leaving the
//    DOM nodes exactly where appendChild put them.

const Slides = memo(function Slides({
  testimonials,
}: {
  testimonials: Testimonial[];
}) {
  const total = testimonials.length;
  return (
    <>
      {testimonials.map((t, i) => (
        <div
          key={t.id}
          className={styles.slide}
          role="group"
          aria-roledescription="slide"
          aria-label={`${i + 1} of ${total}`}
        >
          <SlideContent testimonial={t} />
        </div>
      ))}
    </>
  );
});

// ── Component ─────────────────────────────────────────────────────────

export default function Testimonials({ testimonials }: TestimonialsProps) {
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [livePolite, setLivePolite] = useState(true);

  const trackRef = useRef<HTMLDivElement>(null);
  const showMoreRef = useRef<HTMLButtonElement>(null);
  const stepCountRef = useRef(0);
  const initialOffsetRef = useRef(0);

  const total = testimonials.length;

  useEffect(() => {
    function snap() {
      const track = trackRef.current;
      const button = showMoreRef.current;
      if (!track || !button) return;

      // 1 — measure 3fr column left edge from the button's screen position
      const initialOffset = button.getBoundingClientRect().left;
      initialOffsetRef.current = initialOffset;

      // 2 — card width: N_visible cards + their gaps fill viewport right of the column
      const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
      const visibleWidth = window.innerWidth - initialOffset;
      const cv = getCardsVisible();
      const cardWidth = (visibleWidth - Math.floor(cv) * gap) / cv;

      // 3 — apply width to every slide (covers recycled DOM order too)
      Array.from(track.children).forEach((slide) => {
        (slide as HTMLElement).style.width = `${cardWidth}px`;
      });

      // 4 — reposition at current logical step (no animation)
      const step = cardWidth + gap;
      track.style.transition = 'none';
      track.style.transform =
        `translateX(${initialOffset - stepCountRef.current * step}px)`;
      track.style.visibility = 'visible';
    }

    snap();
    window.addEventListener('resize', snap);
    return () => window.removeEventListener('resize', snap);
  }, [total]);

  if (total === 0) return null;

  function advance() {
    if (isTransitioning) return;

    setIsTransitioning(true);
    setLivePolite(false);

    const track = trackRef.current!;
    const step = measureStep(track);
    stepCountRef.current += 1;

    track.style.transition = 'transform 0.45s ease-in-out';
    track.style.transform =
      `translateX(${initialOffsetRef.current - stepCountRef.current * step}px)`;
  }

  function handleTransitionEnd(e: React.TransitionEvent<HTMLDivElement>) {
    if (e.propertyName !== 'transform') return;
    setIsTransitioning(false);
    setLivePolite(true);

    const track = trackRef.current!;

    // Recycle any slides whose right edge has passed the viewport left (x=0).
    // A slide fully off screen left is teleported to the track's right end.
    // Mandatory ordering: transition disabled before transform is adjusted,
    // otherwise the compensating translateX would animate and cause a jump.
    while (track.children.length > 1) {
      const first = track.children[0] as HTMLElement;
      if (first.getBoundingClientRect().right >= 0) break;

      track.appendChild(first);          // teleport off-screen card to end

      track.style.transition = 'none';   // 1 — kill animation before touching transform
      stepCountRef.current -= 1;         // 2 — decrement logical position
      track.style.transform = `translateX(${   // 3 — recompute and apply
        initialOffsetRef.current - stepCountRef.current * measureStep(track)
      }px)`;
    }
  }

  return (
    <section
      id="testimonials"
      className={styles.section}
      aria-labelledby="testimonials-heading"
    >

      {/* ── Row 1: Label ──────────────────────────────────────── */}
      <div className={styles.headerRow}>
        <h2 id="testimonials-heading" className={styles.label}>
          Testimonials
        </h2>
        <div aria-hidden="true" />
      </div>

      {/* ── Row 2: Full-bleed carousel ────────────────────────── */}
      <div className={styles.trackWrapper}>
        <div
          className={styles.carousel}
          aria-roledescription="carousel"
          aria-label="Testimonials"
          onMouseEnter={() => setLivePolite(true)}
          onFocus={() => setLivePolite(true)}
        >
          <div
            id="testimonials-live"
            className={styles.liveRegion}
            aria-live={livePolite ? 'polite' : 'off'}
            aria-atomic="false"
          >
            <div
              ref={trackRef}
              className={styles.track}
              onTransitionEnd={handleTransitionEnd}
            >
              <Slides testimonials={testimonials} />
            </div>
          </div>
        </div>
      </div>

      {/* ── Row 3: Controls ───────────────────────────────────── */}
      <div className={styles.controlsRow}>
        <div aria-hidden="true" />
        <button
          ref={showMoreRef}
          type="button"
          className={styles.showMoreButton}
          aria-label="Show next testimonial"
          aria-controls="testimonials-live"
          disabled={isTransitioning}
          onClick={advance}
        >
          Show more
        </button>
      </div>

      {/* ── Static grid (prefers-reduced-motion only) ─────────── */}
      <div className={styles.staticWrapper}>
        <div aria-hidden="true" />
        <ul className={styles.staticGrid}>
          {testimonials.map((t) => (
            <li key={t.id} className={styles.staticCard}>
              <SlideContent testimonial={t} />
            </li>
          ))}
        </ul>
      </div>

    </section>
  );
}
