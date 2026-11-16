'use client';

import { useLayoutEffect, useRef } from 'react';
import Link from 'next/link';
import gsap from 'gsap';
import { useDropCountdown } from '../components/useDropCountdown';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const A = '/gta-vi';

/** Hero mask start/end per viewport, matching the original breakpoints. */
function maskSettings() {
  if (window.matchMedia('(max-width: 768px)').matches) {
    return { initialMaskPos: '50% -1500vh', initialMaskSize: '3100% 3100%', maskPos: '50% 7vh', maskSize: '50% 50%' };
  }
  if (window.matchMedia('(max-width: 1024px)').matches) {
    return { initialMaskPos: '50% -1700vh', initialMaskSize: '3500% 3500%', maskPos: '50% 17vh', maskSize: '30% 30%' };
  }
  return { initialMaskPos: '50% 22%', initialMaskSize: '3500% 3500%', maskPos: '50% 22%', maskSize: '20% 20%' };
}

/** Scrub a video's playhead with the timeline once its duration is known. */
function scrubVideo(tl: gsap.core.Timeline, video: HTMLVideoElement | null) {
  if (!video) return;
  const add = () =>
    tl.to(video, { currentTime: video.duration, duration: 3, ease: 'power1.inOut' }, '<');
  if (video.readyState >= 1) add();
  else video.addEventListener('loadedmetadata', add, { once: true });
}

/**
 * Port of the JSM GTA VI landing page: one GSAP context sets up every
 * section's ScrollTriggers in page order, and reverts them all on leave.
 */
export function GtaLanding() {
  const root = useRef<HTMLElement>(null);
  const countdown = useDropCountdown();
  const firstVd = useRef<HTMLVideoElement>(null);
  const secondVd = useRef<HTMLVideoElement>(null);
  const finalVd = useRef<HTMLVideoElement>(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      /* Hero: the background shrinks into the VI logo mask. */
      const { initialMaskPos, initialMaskSize, maskSize } = maskSettings();
      gsap.set('.mask-wrapper', { maskPosition: initialMaskPos, maskSize: initialMaskSize });
      gsap.set('.mask-logo', { marginTop: '-100vh', opacity: 0 });
      gsap.set('.entrance-message', { marginTop: '0vh' });

      gsap
        .timeline({ scrollTrigger: { trigger: '.hero-section', start: 'top top', scrub: 2.5, end: '+=200%', pin: true } })
        .to('.fade-out', { opacity: 0, ease: 'power1.inOut' })
        .to('.scale-out', { scale: 1, ease: 'power1.inOut' })
        .to('.mask-wrapper', { maskSize, ease: 'power1.inOut' }, '<')
        .to('.mask-wrapper', { opacity: 0 })
        .to('.overlay-logo', { opacity: 1, onComplete: () => { gsap.to('.overlay-logo', { opacity: 0 }); } }, '<')
        .to('.entrance-message', {
          duration: 1,
          ease: 'power1.inOut',
          maskImage: 'radial-gradient(circle at 50% 0vh, black 50%, transparent 100%)',
        }, '<');

      /* First video. */
      gsap.set('.first-vd-wrapper', { marginTop: '-150vh', opacity: 0 });
      const firstTl = gsap.timeline({
        scrollTrigger: { trigger: '.first-vd-wrapper', start: 'top top', end: '+=200% top', scrub: true, pin: true },
      });
      firstTl.to('.hero-section', { delay: 0.5, opacity: 0, ease: 'power1.inOut' });
      firstTl.to('.first-vd-wrapper', { opacity: 1, duration: 2, ease: 'power1.inOut' });
      scrubVideo(firstTl, firstVd.current);

      /* Jason. */
      gsap.set('.jason', { marginTop: '-80vh' });
      gsap
        .timeline({ scrollTrigger: { trigger: '.jason', start: 'top 90%', end: '10% center', scrub: 2 } })
        .to('.first-vd', { opacity: 0, duration: 1, ease: 'power1.inOut' });
      gsap.to('.jason .img-box', {
        scrollTrigger: { trigger: '.jason', start: 'top center', end: '80% center', scrub: 2 },
        y: -300, duration: 1, ease: 'power1.inOut',
      });

      /* Second video. */
      gsap.set('.lucia', { marginTop: '-60vh', opacity: 0 });
      const secondTl = gsap.timeline({
        scrollTrigger: { trigger: '.lucia', start: 'top top', end: 'bottom top', scrub: 2, pin: true },
      });
      secondTl.to('.lucia', { opacity: 1, duration: 1, ease: 'power1.inOut' });
      scrubVideo(secondTl, secondVd.current);

      /* Lucia. */
      gsap.set('.lucia-life', { marginTop: '-80vh' });
      gsap
        .timeline({ scrollTrigger: { trigger: '.lucia-life', start: 'top 80%', end: '10% center', scrub: 2 } })
        .to('.second-vd', { opacity: 0, duration: 1, ease: 'power1.inOut' });
      gsap.to('.lucia-life .img-box', {
        scrollTrigger: { trigger: '.lucia-life', start: 'top center', end: '80% center', scrub: 2 },
        y: -200, duration: 1, ease: 'power1.inOut',
      });

      /* Final video. */
      gsap.set('.final-content', { opacity: 0 });
      gsap.timeline({ scrollTrigger: { trigger: '.final', start: 'top top', end: '90% top', scrub: true, pin: true } });
      const finalTl = gsap.timeline({
        scrollTrigger: { trigger: '.final', start: 'top 80%', end: '90% top', scrub: true },
      });
      finalTl.to('.final-content', { opacity: 1, duration: 1, scale: 1, ease: 'power1.inOut' });
      scrubVideo(finalTl, finalVd.current);

      /* Outro. */
      gsap.set('.final-message', { marginTop: '-100vh', opacity: 0 });
      const outroTl = gsap.timeline({
        scrollTrigger: { trigger: '.final-message', start: 'top 30%', end: 'top 10%', scrub: true },
      });
      outroTl.to('.final-content', { opacity: 0, duration: 1, ease: 'power1.inOut' });
      outroTl.to('.final-message', { opacity: 1, duration: 1, ease: 'power1.inOut' });
    }, root);

    /* Images change section heights as they arrive; re-measure once loaded. */
    const refresh = () => ScrollTrigger.refresh();
    window.addEventListener('load', refresh);

    return () => {
      window.removeEventListener('load', refresh);
      ctx.revert();
    };
  }, []);

  const comingSoon = (
    <>
      <p className="presents">Zculture presents</p>
    </>
  );

  return (
    <main ref={root} className="gta">
      <nav className="gta-nav">
        <Link href="/" aria-label="ZzzCulture home">
          <img src={`${A}/images/z-logo.svg`} alt="ZzzCulture" className="gta-nav-logo" />
        </Link>
        <Link href="/#lineup" aria-label="Back to ZzzCulture">
          <img src={`${A}/images/menu.svg`} alt="" className="gta-nav-menu" />
        </Link>
      </nav>

      <section className="hero-section">
        <div className="mask-wrapper">
          <img src={`${A}/images/hero-bg.webp`} alt="background" className="scale-out" />
          <img src={`${A}/images/hero-text.webp`} alt="hero-logo" className="title-logo fade-out" />
        </div>

        <div>
          <img src={`${A}/images/big-hero-text.svg`} alt="logo" className="mask-logo" />
        </div>

        <div className="fake-logo-wrapper">
          <img src={`${A}/images/big-hero-text.svg`} alt="" className="overlay-logo" />
        </div>

        <section className="entrance-message">
          <div className="col-center">
            <img src={`${A}/images/logo.webp`} alt="logo" className="entrance-logo" />
            <div className="text-wrapper">{comingSoon}</div>
            <img src={`${A}/images/casio-logo.svg`} alt="Casio" className="casio-logo" />
          </div>
        </section>
      </section>

      <section className="first-vd-wrapper">
        <div className="vd-frame">
          <video ref={firstVd} muted playsInline preload="auto" src={`${A}/videos/output1.mp4`} className="first-vd" />
        </div>
      </section>

      <section className="jason">
        <div className="jason-content">
          <h1>Jason Duval</h1>
          <h2>Jason wants an easy life, but things just keep getting harder.</h2>
          <p>Jason grew up around grifters and crooks. After a stint in the Army trying to shake off his troubled teens, he found himself in the Keys doing what he knows best, working for local drug runners. It might be time to try something new.</p>
          <div className="jason-2">
            <img src={`${A}/images/jason-2.webp`} alt="" />
          </div>
        </div>

        <div className="img-box">
          <div className="jason-1">
            <img src={`${A}/images/jason-1.webp`} alt="" />
          </div>
          <div className="jason-3">
            <img src={`${A}/images/jason-3.webp`} alt="" />
          </div>
        </div>
      </section>

      <section className="lucia">
        <div className="vd-frame">
          <video ref={secondVd} muted playsInline preload="auto" src={`${A}/videos/output2.mp4`} className="second-vd" />
        </div>
      </section>

      <section className="lucia-life">
        <div className="img-box">
          <div className="lucia-1">
            <img src={`${A}/images/lucia-1.webp`} alt="" />
          </div>
          <div className="lucia-3">
            <img src={`${A}/images/lucia-3.webp`} alt="" />
          </div>
        </div>

        <div className="lucia-life-content">
          <div className="lucia-copy">
            <h1>Lucia Caminos</h1>
            <h2>Lucia’s father taught her to fight as soon as she could walk.</h2>
            <p>Life has been coming at her swinging ever since. Fighting for her family landed her in the Leonida Penitentiary. Sheer luck got her out. Lucia’s learned her lesson — only smart moves from here.</p>
          </div>
          <div className="lucia-2">
            <img src={`${A}/images/lucia-2.webp`} alt="" />
          </div>
          <p className="lucia-copy lucia-tail">More than anything, Lucia wants the good life her mom has dreamed of since their days in Liberty City — but instead of half-baked fantasies, Lucia is prepared to take matters into her own hands.</p>
        </div>
      </section>

      <section className="final">
        <div className="final-content">
          <video ref={finalVd} muted playsInline preload="auto" src={`${A}/videos/output3.mp4`} />
        </div>
      </section>

      <section className="final-message">
        <div className="col-center">
          <img src={`${A}/images/logo.webp`} alt="logo" className="outro-logo" />
          <div>{comingSoon}</div>
          <img src={`${A}/images/casio-logo.svg`} alt="Casio" className="casio-logo" />
          <div className="gta-timer" role="timer" aria-label="Time until the drop">
            {countdown.done ? (
              <p className="gta-timer-done">Out now</p>
            ) : (
              countdown.parts.map((p) => (
                <div key={p.label} className="gta-timer-unit">
                  <span className="gta-timer-value">{p.value}</span>
                  <span className="gta-timer-label">{p.label}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
