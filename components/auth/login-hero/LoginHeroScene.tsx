'use client';

import { GreenLensLogo } from '@/components/auth/GreenLensLogo';
import { LOGIN_HERO_ASSETS } from '@/lib/constants/loginHeroAssets';
import { Playfair_Display } from 'next/font/google';
import Script from 'next/script';
import { useCallback, useEffect, useRef, useState } from 'react';
import './login-hero.css';

const playfair = Playfair_Display({
  subsets: ['latin', 'vietnamese'],
  variable: '--font-playfair',
  display: 'swap',
  weight: ['700', '800'],
  style: ['italic'],
});

const PLANT_DURATIONS = [5, 7, 6, 8, 5.5, 6.5, 9, 11, 10];

export function LoginHeroScene({ className }: { className?: string }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const plantsFgRef = useRef<HTMLDivElement>(null);
  const plantsBgRef = useRef<HTMLDivElement>(null);
  const leavesBgRef = useRef<HTMLDivElement>(null);
  const bubblesRef = useRef<HTMLDivElement>(null);

  const [modelViewerReady, setModelViewerReady] = useState(false);
  const rafRef = useRef<number>(0);
  const bubbleIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const mouseRef = useRef({ x: 0, y: 0, px: 0, py: 0 });
  const currentMouseRef = useRef({ x: 0, y: 0 });

  const createBubble = useCallback(() => {
    const container = bubblesRef.current;
    if (!container) return;

    const bubble = document.createElement('img');
    bubble.src = LOGIN_HERO_ASSETS.bubblePng;
    bubble.alt = '';
    bubble.className = 'login-hero-bubble';
    bubble.setAttribute('aria-hidden', 'true');

    const size = `${Math.random() * 20 + 10}px`;
    bubble.style.width = size;
    bubble.style.height = 'auto';
    bubble.style.left = `${Math.random() * 100}%`;
    bubble.style.bottom = '-50px';
    bubble.style.opacity = String(Math.random() * 0.4 + 0.2);

    const duration = Math.random() * 6 + 4;
    bubble.style.animation = `lh-float-up ${duration}s linear forwards`;

    container.appendChild(bubble);
    window.setTimeout(() => bubble.remove(), duration * 1000);
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const onMouseMove = (e: MouseEvent) => {
      mouseRef.current = {
        x: e.clientX / window.innerWidth - 0.5,
        y: e.clientY / window.innerHeight - 0.5,
        px: e.clientX,
        py: e.clientY,
      };
    };

    window.addEventListener('mousemove', onMouseMove);

    const animate = () => {
      const time = Date.now() * 0.001;
      const mouse = mouseRef.current;
      const current = currentMouseRef.current;

      current.x += (mouse.x - current.x) * 0.05;
      current.y += (mouse.y - current.y) * 0.05;

      if (plantsFgRef.current) {
        plantsFgRef.current.style.transform = `translate(${current.x * 60}px, ${current.y * 60}px)`;
      }
      if (plantsBgRef.current) {
        plantsBgRef.current.style.transform = `translate(${current.x * -30}px, ${current.y * -30}px)`;
      }
      if (leavesBgRef.current) {
        leavesBgRef.current.style.transform = `translate(${current.x * -15}px, ${current.y * -15}px)`;
      }

      root.querySelectorAll('.login-hero-plant').forEach((plant, i) => {
        const el = plant as HTMLElement;
        if (!el.dataset.angle) {
          el.dataset.rx = '0';
          el.dataset.ry = '0';
          el.dataset.angle = String(Math.random() * 360);
          el.dataset.baseX = '0';
          el.dataset.baseY = '0';
        }

        const rect = el.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        const diffX = mouse.px - centerX;
        const diffY = mouse.py - centerY;
        const distance = Math.sqrt(diffX * diffX + diffY * diffY);

        let targetRx = 0;
        let targetRy = 0;
        let speedMult = 1;

        if (distance < 400 && distance > 0) {
          const force = (400 - distance) / 400;
          targetRx = (diffX / distance) * force * -80;
          targetRy = (diffY / distance) * force * -80;
          speedMult = 1 + force * 5;
        }

        let rx = parseFloat(el.dataset.rx || '0');
        let ry = parseFloat(el.dataset.ry || '0');
        let angle = parseFloat(el.dataset.angle || '0');
        const baseX = parseFloat(el.dataset.baseX || '0');
        const baseY = parseFloat(el.dataset.baseY || '0');

        rx += (targetRx - rx) * 0.1;
        ry += (targetRy - ry) * 0.1;
        angle += 0.2 * speedMult;

        el.dataset.rx = String(rx);
        el.dataset.ry = String(ry);
        el.dataset.angle = String(angle);

        const dur = PLANT_DURATIONS[i % PLANT_DURATIONS.length] ?? 6;
        const phase = (time + i * 0.7) * ((Math.PI * 2) / dur);
        const floatY = Math.sin(phase) * 18;
        const floatAngle = Math.cos(phase) * 8;

        el.style.transform = `translate(calc(${rx + baseX}px), calc(${ry + baseY}px + ${floatY}px)) rotate(calc(${angle}deg + ${floatAngle}deg))`;
      });

      root.querySelectorAll('.login-hero-leaf').forEach((leaf, i) => {
        const el = leaf as HTMLElement;
        const dur = 10 + i * 2;
        const phase = (time + i * 1.2) * ((Math.PI * 2) / dur);
        const floatY = Math.sin(phase) * 22;
        const floatX = Math.cos(phase * 0.5) * 18;
        const floatAngle = Math.sin(phase * 0.3) * 18;
        el.style.transform = `translate(${floatX}px, ${floatY}px) rotate(${floatAngle}deg)`;
      });

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);
    bubbleIntervalRef.current = setInterval(createBubble, 400);
    createBubble();

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      cancelAnimationFrame(rafRef.current);
      if (bubbleIntervalRef.current) clearInterval(bubbleIntervalRef.current);
    };
  }, [createBubble]);

  const leavesGlb = LOGIN_HERO_ASSETS.leavesGlb;

  return (
    <>
      <Script
        src="https://unpkg.com/@google/model-viewer/dist/model-viewer.min.js"
        type="module"
        strategy="afterInteractive"
        onLoad={() => setModelViewerReady(true)}
      />

      <div
        ref={rootRef}
        className={`login-hero-root ${playfair.variable} ${className ?? ''}`}
        aria-hidden
      >
        <div ref={bubblesRef} className="login-hero-bubbles" />

        <header className="login-hero-header">
          <div className="login-hero-brand">
            <GreenLensLogo variant="onImage" className="text-2xl sm:text-3xl" />
            <p className="login-hero-desc">
              Nền tảng crowdsourcing báo cáo ô nhiễm môi trường — minh bạch, nhanh chóng, vì một môi
              trường xanh hơn.
            </p>
          </div>
          <span className="login-hero-badge">SU26SE049</span>
        </header>

        <main className="login-hero-main">
          <div className="login-hero-content">
            <div ref={leavesBgRef} className="login-hero-leaves-bg">
              {modelViewerReady &&
                (['lh-l1', 'lh-l2', 'lh-l3', 'lh-l4'] as const).map((cls, i) => (
                  <model-viewer
                    key={cls}
                    className={`login-hero-leaf ${cls}`}
                    src={leavesGlb}
                    environment-image="neutral"
                    exposure="1"
                    interaction-prompt="none"
                    camera-orbit={`${45 + i * 30}deg 75deg 105%`}
                  />
                ))}
            </div>

            <div className="login-hero-left">
              <h2 className="login-hero-side-title">
                <span className="login-hero-side-title-line">Hành động</span>
                <span className="login-hero-side-title-line">vì môi trường</span>
              </h2>
              <p className="login-hero-footer">
                © {new Date().getFullYear()} GreenLens · SU26SE049
              </p>
            </div>

            <div ref={plantsBgRef} className="login-hero-plants-bg">
              {modelViewerReady &&
                (['lh-p7', 'lh-p8', 'lh-p9'] as const).map((cls, i) => (
                  <model-viewer
                    key={cls}
                    className={`login-hero-plant ${cls}`}
                    src={leavesGlb}
                    environment-image="neutral"
                    exposure="1"
                    interaction-prompt="none"
                    camera-orbit={`${-20 + i * 90}deg 110deg 105%`}
                  />
                ))}
            </div>

            <div ref={plantsFgRef} className="login-hero-plants-fg">
              {modelViewerReady &&
                (['lh-p1', 'lh-p2', 'lh-p3', 'lh-p4', 'lh-p5', 'lh-p6'] as const).map((cls, i) => (
                  <model-viewer
                    key={cls}
                    className={`login-hero-plant ${cls}`}
                    src={leavesGlb}
                    environment-image="neutral"
                    exposure="1.2"
                    interaction-prompt="none"
                    camera-orbit={`${45 + i * 40}deg 120deg 105%`}
                  />
                ))}
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
