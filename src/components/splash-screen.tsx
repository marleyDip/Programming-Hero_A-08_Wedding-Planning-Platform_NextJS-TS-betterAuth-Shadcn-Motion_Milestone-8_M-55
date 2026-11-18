"use client";

/**
 * WedPlan - 3D Splash Screen
 * Place at: components/splash-screen.tsx
 * Use: render <SplashScreen /> once in app/layout.tsx, inside <body> (e.g. next to your providers).
 *
 * - Two interlocked wedding rings built from CSS 3D, spinning and tilting with the mouse / finger.
 * - Floating petals, sparkles, letter-by-letter WedPlan wordmark, animated progress counter.
 * - Iris-close exit reveals the site. Click, tap, Enter, Space or Esc skips it.
 * - Shows once per browser session (sessionStorage). Pass once={false} to show on every load.
 * - Respects prefers-reduced-motion (no spinning, shorter). Page scroll is locked while visible.
 * - Brand colours come from your CSS variables (--logo-from, --logo-to, --gold).
 */

import {
  AnimatePresence,
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "framer-motion";
import { ArrowRight, Heart } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

const KEY = "wedplan-splash-seen";
const DURATION = 3.4; // seconds for the progress to reach 100

// 3D ring (torus approximated by discs placed around a circle)
function Ring({
  radius = 74,
  tube = 30,
  slices = 44,
  color,
  glow,
}: {
  radius?: number;
  tube?: number;
  slices?: number;
  color: string;
  glow: string;
}) {
  return (
    <div className="absolute left-1/2 top-1/2 transform-3d">
      {Array.from({ length: slices }).map((_, i) => {
        const a = (360 / slices) * i;

        return (
          <span
            key={i}
            className="absolute rounded-full"
            style={{
              width: tube,
              height: tube,
              marginLeft: -tube / 2,
              marginTop: -tube / 2,
              border: `2px solid ${color}`,
              boxShadow: `0 0 10px ${glow}, inset 0 0 8px ${glow}`,
              transform: `rotateZ(${a}deg) translateX(${radius}px) rotateX(90deg)`,
            }}
          />
        );
      })}
    </div>
  );
}

/* deterministic petals (no Math.random, so no hydration mismatch) */
const PETALS = Array.from({ length: 16 }, (_, i) => ({
  left: (i * 37 + 11) % 100,
  size: 10 + ((i * 7) % 12),
  delay: (i * 0.45) % 5,
  dur: 7 + ((i * 3) % 6),
  sway: (i % 2 ? 1 : -1) * (20 + ((i * 11) % 40)),
  hue: i % 3,
}));

export default function SplashScreen({ once = true }: { once?: boolean }) {
  const reduce = useReducedMotion();

  const [show, setShow] = useState(true);
  const [ready, setReady] = useState(false); // client mounted and decided to show
  const [pct, setPct] = useState(0);

  // pointer parallax
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 90, damping: 18 });
  const sy = useSpring(my, { stiffness: 90, damping: 18 });

  const tiltY = useTransform(sx, [-1, 1], [-28, 28]);
  const tiltX = useTransform(sy, [-1, 1], [22, -22]);

  const glowX = useTransform(sx, [-1, 1], ["35%", "65%"]);
  const glowY = useTransform(sy, [-1, 1], ["35%", "65%"]);

  const bg = useTransform(
    [glowX, glowY] as never,
    ([x, y]: string[]) =>
      `radial-gradient(60% 55% at ${x} ${y}, color-mix(in oklab, var(--logo-to, #c026d3) 55%, transparent), transparent 70%), radial-gradient(40% 40% at 80% 20%, color-mix(in oklab, var(--gold, #f5c24b) 22%, transparent), transparent 70%)`,
  );

  // decide whether to show (client only)
  useEffect(() => {
    let seen = false;

    if (once) {
      try {
        seen = sessionStorage.getItem(KEY) === "1";
      } catch {
        /* storage blocked: just show it */
      }
    }

    const timer = window.setTimeout(() => {
      if (seen) setShow(false);
      else setReady(true);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [once]);

  const close = () => {
    try {
      sessionStorage.setItem(KEY, "1");
    } catch {
      /* ignore */
    }

    setShow(false);
  };

  // progress + auto close
  useEffect(() => {
    if (!ready) return;

    const c = animate(0, 100, {
      duration: reduce ? 1 : DURATION,
      ease: [0.45, 0.05, 0.25, 1],
      onUpdate: (v) => setPct(Math.round(v)),
      onComplete: () => setTimeout(close, reduce ? 200 : 900),
    });

    return () => c.stop();
  }, [ready, reduce]);

  // lock scroll while visible + keyboard skip
  useEffect(() => {
    if (!ready || !show) return;

    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "Enter" || e.key === " ") close();
    };

    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [ready, show]);

  const letters = useMemo(() => "WedPlan".split(""), []);
  const done = pct >= 100;

  if (!ready) {
    // Until we know, cover the page so returning visitors never see a flash of content under it
    // for first-time visitors; returning visitors (show=false) render nothing.
    return show ? (
      <div
        aria-hidden
        className="fixed inset-0 z-100 bg-[oklch(0.16_0.05_300)]"
      />
    ) : null;
  }

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label="Welcome to WedPlan"
          initial={{ clipPath: "circle(150% at 50% 50%)" }}
          exit={{
            clipPath: "circle(0% at 50% 50%)",
            transition: { duration: 0.9, ease: [0.76, 0, 0.24, 1] },
          }}
          onClick={close}
          onPointerMove={(e) => {
            mx.set((e.clientX / window.innerWidth) * 2 - 1);
            my.set((e.clientY / window.innerHeight) * 2 - 1);
          }}
          className="fixed inset-0 z-100 flex cursor-pointer select-none flex-col items-center justify-center overflow-hidden bg-[oklch(0.16_0.05_300)] text-white"
        >
          {/* backdrop: moving glow + grid + petals */}
          <motion.div
            aria-hidden
            className="absolute inset-0"
            style={{
              background: bg,
            }}
          />

          <div
            aria-hidden
            className="absolute inset-0 opacity-[0.12] bg-[linear-gradient(white_1px,transparent_1px),linear-gradient(90deg,white_1px,transparent_1px)] bg-size-[56px_56px] mask-[radial-gradient(circle_at_50%_50%,black,transparent_70%)]"
          />

          {!reduce &&
            PETALS.map((p, i) => (
              <motion.span
                key={i}
                aria-hidden
                className="absolute -top-8 rounded-[60%_0_60%_0] opacity-70"
                style={{
                  left: `${p.left}%`,
                  width: p.size,
                  height: p.size * 1.3,
                  background:
                    p.hue === 0
                      ? "linear-gradient(135deg,#fff,#f9a8d4)"
                      : p.hue === 1
                        ? "linear-gradient(135deg,#fde68a,var(--gold,#f5c24b))"
                        : "linear-gradient(135deg,#f5d0fe,#c084fc)",
                }}
                animate={{
                  y: ["0vh", "112vh"],
                  x: [0, p.sway, -p.sway / 2, p.sway],
                  rotate: [0, 260, 520],
                }}
                transition={{
                  duration: p.dur,
                  delay: p.delay,
                  repeat: Infinity,
                  ease: "linear",
                }}
              />
            ))}

          {/* 3D scene */}
          <div className="relative h-68 w-68 sm:h-80 sm:w-[20rem] perspective-[1100px]">
            <motion.div
              className="absolute inset-0 transform-3d"
              style={{ rotateX: tiltX, rotateY: tiltY }}
            >
              <motion.div
                className="absolute inset-0 scale-[0.82] transform-3d sm:scale-100"
                initial={
                  reduce ? false : { scale: 0.2, opacity: 0, rotateZ: -40 }
                }
                animate={{ scale: 1, opacity: 1, rotateZ: 0 }}
                transition={{
                  type: "spring",
                  stiffness: 60,
                  damping: 14,
                  delay: 0.1,
                }}
              >
                <motion.div
                  className="absolute inset-0 transform-3d"
                  animate={reduce ? undefined : { rotateY: 360 }}
                  transition={{
                    duration: 14,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                >
                  {/* ring A: brand gradient colour */}
                  <div
                    className="absolute inset-0 transform-3d"
                    style={{ transform: "translateX(-40px) rotateY(15deg)" }}
                  >
                    <Ring
                      color="var(--logo-to, #d946ef)"
                      glow="color-mix(in oklab, var(--logo-to, #d946ef) 70%, transparent)"
                    />
                  </div>

                  {/* ring B: gold, linked through A */}
                  <div
                    className="absolute inset-0 transform-3d"
                    style={{ transform: "translateX(40px) rotateY(80deg)" }}
                  >
                    <Ring
                      color="var(--gold, #f5c24b)"
                      glow="color-mix(in oklab, var(--gold, #f5c24b) 70%, transparent)"
                    />
                  </div>
                </motion.div>

                {/* heart core, always faces the viewer */}
                <motion.div
                  className="absolute left-1/2 top-1/2 -ml-7 -mt-7 grid h-14 w-14 place-items-center rounded-full bg-white/10 shadow-[0_0_40px_var(--logo-to,#d946ef)] backdrop-blur-sm"
                  style={{ transform: "translateZ(40px)" }}
                  animate={reduce ? undefined : { scale: [1, 1.18, 1] }}
                  transition={{
                    duration: 1.4,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  <Heart className="h-7 w-7 fill-white text-white" />
                </motion.div>
              </motion.div>
            </motion.div>

            {/* sparkles */}
            {!reduce &&
              [
                { x: "8%", y: "18%", d: 0 },
                { x: "88%", y: "28%", d: 0.7 },
                { x: "78%", y: "84%", d: 1.3 },
                { x: "14%", y: "78%", d: 1.9 },
              ].map((s, i) => (
                <motion.span
                  key={i}
                  aria-hidden
                  className="absolute h-3 w-3 rotate-45 bg-white"
                  style={{
                    left: s.x,
                    top: s.y,
                    clipPath:
                      "polygon(50% 0,62% 38%,100% 50%,62% 62%,50% 100%,38% 62%,0 50%,38% 38%)",
                  }}
                  animate={{
                    scale: [0, 1.6, 0],
                    opacity: [0, 1, 0],
                    rotate: [0, 90],
                  }}
                  transition={{ duration: 2.2, delay: s.d, repeat: Infinity }}
                />
              ))}
          </div>

          {/* wordmark */}
          <h1
            className="mt-4 flex font-serif text-5xl font-semibold tracking-tight sm:text-6xl"
            aria-label="WedPlan"
          >
            {letters.map((l, i) => (
              <motion.span
                key={i}
                aria-hidden
                initial={
                  reduce
                    ? false
                    : { y: 50, opacity: 0, rotateX: -90, filter: "blur(8px)" }
                }
                animate={{ y: 0, opacity: 1, rotateX: 0, filter: "blur(0px)" }}
                transition={{
                  delay: 0.5 + i * 0.07,
                  type: "spring",
                  stiffness: 140,
                  damping: 14,
                }}
                className={
                  i >= 3
                    ? "bg-linear-to-r from-(--logo-from,#f472b6) to-(--gold,#f5c24b) bg-clip-text text-transparent"
                    : ""
                }
                style={{ display: "inline-block", transformOrigin: "50% 100%" }}
              >
                {l}
              </motion.span>
            ))}
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1 }}
            className="mt-3 px-6 text-center text-xs uppercase tracking-[0.3em] text-white/70 sm:text-sm"
          >
            Plan your perfect wedding
          </motion.p>

          {/* progress */}
          <div className="mt-10 w-64 sm:w-80">
            <div className="h-1.5 overflow-hidden rounded-full bg-white/15">
              <motion.div
                className="h-full rounded-full bg-linear-to-r from-(--logo-from,#f472b6) via-white to-(--gold,#f5c24b)"
                style={{ width: `${pct}%` }}
              />
            </div>

            <div className="mt-3 flex items-center justify-between font-mono text-xs text-white/70">
              <span>{done ? "Ready" : "Preparing your celebration…"}</span>
              <span aria-live="off">{String(pct).padStart(3, "0")}%</span>
            </div>
          </div>

          <div className="absolute bottom-8 flex flex-col items-center gap-2">
            <motion.button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                close();
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.4 }}
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.95 }}
              className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-5 py-2.5 text-sm font-semibold backdrop-blur transition-colors hover:bg-white/20"
            >
              {done ? "Enter WedPlan" : "Skip"}{" "}
              <ArrowRight className="h-4 w-4" />
            </motion.button>

            <span className="hidden text-[11px] text-white/45 sm:block">
              Move your mouse to tilt the rings
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
