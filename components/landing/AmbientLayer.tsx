"use client";

import { useEffect, useRef } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { landing } from "./landing-tokens";

const PARTICLES = [
  { left: "8%", top: "18%", size: 3, delay: 0 },
  { left: "18%", top: "70%", size: 2, delay: 1.2 },
  { left: "31%", top: "38%", size: 2, delay: 2.4 },
  { left: "52%", top: "14%", size: 3, delay: 0.8 },
  { left: "67%", top: "62%", size: 2, delay: 1.8 },
  { left: "83%", top: "28%", size: 3, delay: 3 },
  { left: "92%", top: "78%", size: 2, delay: 0.4 },
] as const;

export function AmbientLayer() {
  const ref = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (reducedMotion) return;
    const element = ref.current;
    if (!element) return;

    let frame = 0;
    const onPointerMove = (event: PointerEvent) => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        const x = (event.clientX / window.innerWidth) * 100;
        const y = (event.clientY / window.innerHeight) * 100;
        element.style.setProperty("--mouse-x", `${x}%`);
        element.style.setProperty("--mouse-y", `${y}%`);
        frame = 0;
      });
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [reducedMotion]);

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      style={
        {
          "--mouse-x": "50%",
          "--mouse-y": "18%",
        } as React.CSSProperties
      }
    >
      <div className="absolute inset-0 bg-[#0A0A0A]" />
      <motion.div
        animate={
          reducedMotion
            ? undefined
            : { opacity: [0.55, 0.8, 0.55], scale: [1, 1.06, 1] }
        }
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        className="absolute left-1/2 top-[-18rem] h-[42rem] w-[68rem] -translate-x-1/2 rounded-full bg-[#2563EB]/[0.09] blur-[120px]"
      />
      <div
        className="absolute inset-0 opacity-80"
        style={{
          background:
            "radial-gradient(520px circle at var(--mouse-x) var(--mouse-y), rgba(59,130,246,0.12), transparent 68%)",
        }}
      />
      <div
        className={`absolute inset-0 ${landing.grid} opacity-40 [mask-image:linear-gradient(to_bottom,black,transparent_75%)]`}
      />
      <div className="absolute left-[12%] top-[32%] h-56 w-56 rounded-full bg-[#3B82F6]/[0.05] blur-[90px]" />
      <div className="absolute right-[8%] top-[58%] h-72 w-72 rounded-full bg-[#2563EB]/[0.04] blur-[110px]" />

      {PARTICLES.map((particle) => (
        <motion.span
          key={`${particle.left}-${particle.top}`}
          className="absolute rounded-full bg-[#93C5FD]/70 shadow-[0_0_14px_rgba(147,197,253,0.65)]"
          style={{
            left: particle.left,
            top: particle.top,
            width: particle.size,
            height: particle.size,
          }}
          animate={
            reducedMotion
              ? undefined
              : { y: [0, -14, 0], opacity: [0.2, 0.75, 0.2] }
          }
          transition={{
            duration: 5 + particle.delay,
            delay: particle.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}
