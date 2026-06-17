"use client"

import { useState, useEffect, useRef, memo, useCallback } from "react"
import type { CSSProperties } from "react"
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useSpring,
  useTransform,
  useScroll,
  type MotionValue,
} from "framer-motion"
import { createPortal } from "react-dom"
import Image from "next/image"
import Link from "next/link"

// ─── Content ──────────────────────────────────────────────────────────────────

const KINETIC_WORDS = ["MARKETING", "AUTOMATION", "CREATIVITY", "GROWTH"] as const

const NAME = "HARSH SARAN"

// Rotating background identity words (large, low-opacity, slow cross-fade)
const ROLE_WORDS = ["MARKETER", "CREATOR", "STRATEGIST", "AUTOMATOR", "THINKER"] as const

// Hero statement as an editorial flow: from → to
const FLOW = [
  { from: "Ideas", to: "Attention" },
  { from: "Attention", to: "Growth" },
  { from: "Growth", to: "Systems" },
] as const

const SUPPORTING = [
  "Where creativity meets strategy,",
  "and automation turns momentum into scale.",
] as const

const PORTRAIT = "/Images/Mountain-Harsh.jpeg"

const NOISE_URI = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.82' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='400' height='400' filter='url(%23n)'/%3E%3C/svg%3E")`

const EASE_OUT = [0.22, 1, 0.36, 1] as const

// ─── Custom cursor ────────────────────────────────────────────────────────────

function CustomCursor() {
  const rawX = useMotionValue(-100)
  const rawY = useMotionValue(-100)
  // Snappy: tracks the pointer almost 1:1 with only a hint of smoothing.
  // High stiffness + overdamped (no overshoot) → ~90% accurate, ~10% smoothing.
  const spring = { stiffness: 1200, damping: 50, mass: 0.3 }
  const sx = useSpring(rawX, spring)
  const sy = useSpring(rawY, spring)
  const x = useTransform(sx, (v) => v - 10)
  const y = useTransform(sy, (v) => v - 10)

  useEffect(() => {
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches
    if (fine) document.documentElement.style.cursor = "none"
    const onMove = (e: MouseEvent) => { rawX.set(e.clientX); rawY.set(e.clientY) }
    window.addEventListener("mousemove", onMove)
    return () => {
      window.removeEventListener("mousemove", onMove)
      document.documentElement.style.cursor = ""
    }
  }, [rawX, rawY])

  return (
    <motion.div
      className="pointer-events-none fixed z-200 hidden md:block"
      style={{ x, y, top: 0, left: 0 }}
    >
      <div style={{
        position: "absolute", width: 44, height: 44, borderRadius: "50%",
        top: -12, left: -12,
        background: "radial-gradient(circle, rgba(139,92,246,0.26) 0%, rgba(99,102,241,0.08) 55%, transparent 70%)",
        filter: "blur(8px)",
      }} />
      <div style={{
        width: 20, height: 20, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(216,180,254,0.95) 0%, rgba(139,92,246,0.65) 60%, transparent 100%)",
        filter: "blur(1.5px)", boxShadow: "0 0 10px rgba(139,92,246,0.45)",
      }} />
    </motion.div>
  )
}

// ─── Shared cinematic atmosphere (grid + drifting gradients + grain) ──────────

function Atmosphere() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Drifting blue orb */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: "55vw", height: "55vw", top: "-20%", left: "-12%",
          background: "radial-gradient(circle, rgba(59,130,246,0.10) 0%, transparent 70%)",
          filter: "blur(95px)", willChange: "transform",
        }}
        animate={{ x: [0, 40, -20, 0], y: [0, 25, -30, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
      />
      {/* Drifting violet orb */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: "50vw", height: "50vw", bottom: "-18%", right: "-10%",
          background: "radial-gradient(circle, rgba(124,58,237,0.11) 0%, transparent 70%)",
          filter: "blur(105px)", willChange: "transform",
        }}
        animate={{ x: [0, -35, 20, 0], y: [0, -22, 28, 0] }}
        transition={{ duration: 27, repeat: Infinity, ease: "easeInOut", delay: 3 }}
      />
      {/* Animated grid — drift via transform (one tile) instead of backgroundPosition */}
      <motion.div
        className="absolute"
        style={{
          inset: "-120px",
          backgroundImage: [
            "linear-gradient(rgba(99,102,241,0.02) 1px, transparent 1px)",
            "linear-gradient(90deg, rgba(99,102,241,0.02) 1px, transparent 1px)",
          ].join(", "),
          backgroundSize: "78px 78px",
          willChange: "transform",
        }}
        animate={{ x: [0, 78], y: [0, 78] }}
        transition={{ duration: 24, repeat: Infinity, ease: "linear" }}
      />
      {/* Edge vignette */}
      <div className="absolute inset-0" style={{
        background: "radial-gradient(ellipse 85% 85% at 50% 50%, transparent 45%, rgba(0,0,0,0.7) 100%)",
      }} />
      {/* Film grain */}
      <motion.div
        className="absolute"
        style={{
          top: -160, right: -160, bottom: -160, left: -160,
          opacity: 0.03, backgroundImage: NOISE_URI, backgroundSize: "320px 320px",
          willChange: "transform",
        }}
        animate={{ x: [0, -64, -128, -64, 0], y: [0, -48, -96, -48, 0] }}
        transition={{ duration: 0.45, repeat: Infinity, ease: "linear" }}
      />
    </div>
  )
}

// ─── Floating particles (very low opacity, slow drift) ────────────────────────

interface Particle { left: string; top: string; size: number; drift: number; dur: number; delay: number; op: number }

const PARTICLES: Particle[] = [
  { left: "8%",  top: "22%", size: 3, drift: 24, dur: 11, delay: 0,   op: 0.10 },
  { left: "18%", top: "68%", size: 2, drift: 18, dur: 14, delay: 1.2, op: 0.08 },
  { left: "27%", top: "40%", size: 4, drift: 30, dur: 13, delay: 0.5, op: 0.07 },
  { left: "39%", top: "78%", size: 2, drift: 20, dur: 16, delay: 2.0, op: 0.09 },
  { left: "47%", top: "16%", size: 3, drift: 26, dur: 12, delay: 0.8, op: 0.08 },
  { left: "58%", top: "60%", size: 2, drift: 22, dur: 15, delay: 1.6, op: 0.07 },
  { left: "66%", top: "30%", size: 4, drift: 28, dur: 13, delay: 0.3, op: 0.10 },
  { left: "74%", top: "72%", size: 2, drift: 18, dur: 17, delay: 2.4, op: 0.06 },
  { left: "82%", top: "44%", size: 3, drift: 24, dur: 12, delay: 1.0, op: 0.09 },
  { left: "90%", top: "20%", size: 2, drift: 20, dur: 14, delay: 1.8, op: 0.07 },
  { left: "13%", top: "50%", size: 2, drift: 22, dur: 15, delay: 0.6, op: 0.08 },
  { left: "92%", top: "64%", size: 3, drift: 26, dur: 12, delay: 2.2, op: 0.08 },
]

function Particles() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0" style={{ zIndex: 4 }}>
      {PARTICLES.map((p, i) => (
        <motion.span
          key={i}
          style={{
            position: "absolute", left: p.left, top: p.top,
            width: p.size, height: p.size, borderRadius: "50%",
            background: "rgba(216,180,254,0.9)",
            boxShadow: "0 0 6px rgba(139,92,246,0.5)",
          }}
          animate={{ y: [0, -p.drift, 0], opacity: [p.op, p.op * 2.2, p.op] }}
          transition={{ duration: p.dur, delay: p.delay, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
    </div>
  )
}

// ─── Global background (one continuous immersive environment) ─────────────────

function GlobalBackground() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 overflow-hidden" style={{ zIndex: 0, background: "#0B1020" }}>
      {/* Animated blurred gradient blobs — electric blue · indigo · purple · magenta.
          Very slow (32–40s) loops, subtle, alive — spans the whole page (all sections). */}
      <motion.div className="absolute rounded-full" style={{ width: "56vw", height: "56vw", top: "-14%", left: "-12%", background: "radial-gradient(circle, rgba(79,124,255,0.16) 0%, transparent 70%)", filter: "blur(120px)", willChange: "transform" }} animate={{ x: [0, 60, -30, 0], y: [0, 40, -28, 0] }} transition={{ duration: 34, repeat: Infinity, ease: "easeInOut" }} />
      <motion.div className="absolute rounded-full" style={{ width: "50vw", height: "50vw", top: "-6%", right: "-12%", background: "radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)", filter: "blur(120px)", willChange: "transform" }} animate={{ x: [0, -50, 28, 0], y: [0, 34, -26, 0] }} transition={{ duration: 38, repeat: Infinity, ease: "easeInOut", delay: 3 }} />
      <motion.div className="absolute rounded-full" style={{ width: "48vw", height: "48vw", bottom: "-16%", left: "14%", background: "radial-gradient(circle, rgba(139,92,246,0.14) 0%, transparent 70%)", filter: "blur(120px)", willChange: "transform" }} animate={{ x: [0, 42, -24, 0], y: [0, -30, 22, 0] }} transition={{ duration: 36, repeat: Infinity, ease: "easeInOut", delay: 2 }} />
      <motion.div className="absolute rounded-full" style={{ width: "44vw", height: "44vw", top: "44%", right: "-10%", background: "radial-gradient(circle, rgba(217,70,239,0.12) 0%, transparent 70%)", filter: "blur(120px)", willChange: "transform" }} animate={{ x: [0, -36, 22, 0], y: [0, 28, -20, 0] }} transition={{ duration: 40, repeat: Infinity, ease: "easeInOut", delay: 5 }} />
      <motion.div className="absolute rounded-full" style={{ width: "40vw", height: "40vw", bottom: "-6%", right: "26%", background: "radial-gradient(circle, rgba(79,124,255,0.10) 0%, transparent 70%)", filter: "blur(120px)", willChange: "transform" }} animate={{ x: [0, 30, -18, 0], y: [0, -22, 16, 0] }} transition={{ duration: 32, repeat: Infinity, ease: "easeInOut", delay: 1 }} />

      {/* Subtle futuristic grid — very low visibility, faded toward edges */}
      <div className="absolute inset-0" style={{
        backgroundImage: [
          "linear-gradient(rgba(120,130,255,0.025) 1px, transparent 1px)",
          "linear-gradient(90deg, rgba(120,130,255,0.025) 1px, transparent 1px)",
        ].join(", "),
        backgroundSize: "80px 80px",
        maskImage: "radial-gradient(ellipse 100% 85% at 50% 38%, #000 55%, transparent 100%)",
        WebkitMaskImage: "radial-gradient(ellipse 100% 85% at 50% 38%, #000 55%, transparent 100%)",
      }} />

      {/* A few slow-moving particles for depth */}
      <Particles />

      {/* Soft top wash + edge vignette for depth and focus */}
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 90% 70% at 50% 0%, rgba(99,102,241,0.06), transparent 60%)" }} />
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 85% 85% at 50% 50%, transparent 60%, rgba(4,6,16,0.34) 100%)" }} />
    </div>
  )
}

// ─── Hero (staged cinematic reveal): name words → portrait rises → behind → content
// Stages (driven from <Home>): 1 name · 2 portrait rises · 3 name→behind · 4 content

const HERO_NAME = ["HARSH", "SARAN"] as const
const HERO_HEADLINE = ["Ideas get attention.", "Systems create growth."] as const
const HERO_SUB = "Digital Marketing • Creative Strategy • Automation Systems"
const HERO_PORTRAIT = "/Images/Harsh_Landscape.png"

// One word of the name with a premium clip-reveal (slides up out of an overflow box)
function NameWord({ text, show, delay }: { text: string; show: boolean; delay: number }) {
  return (
    <span style={{ display: "inline-block", overflow: "hidden", verticalAlign: "top", paddingBottom: "0.1em" }}>
      <motion.span
        style={{ display: "inline-block", willChange: "transform, filter, opacity" }}
        initial={false}
        animate={show ? { y: 0, opacity: 1, filter: "blur(0px)" } : { y: "120%", opacity: 0, filter: "blur(14px)" }}
        transition={{ delay: show ? delay : 0, duration: 1, ease: EASE_OUT }}
      >
        {text}
      </motion.span>
    </span>
  )
}

function HeroComposition({ stage }: { stage: number }) {
  const nameVisible = stage >= 1
  const nameBehind = stage >= 3
  const showPortrait = stage >= 2
  const content = stage >= 4

  // Mouse parallax + spotlight (premium ambience)
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const smx = useSpring(mx, { stiffness: 60, damping: 22, mass: 0.5 })
  const smy = useSpring(my, { stiffness: 60, damping: 22, mass: 0.5 })
  const spotX = useMotionValue(-1000)
  const spotY = useMotionValue(-1000)
  const sSpotX = useSpring(spotX, { stiffness: 70, damping: 30, mass: 0.6 })
  const sSpotY = useSpring(spotY, { stiffness: 70, damping: 30, mass: 0.6 })
  const spotTX = useTransform(sSpotX, (v) => v - 280)
  const spotTY = useTransform(sSpotY, (v) => v - 280)

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      mx.set(e.clientX / window.innerWidth - 0.5)
      my.set(e.clientY / window.innerHeight - 0.5)
      spotX.set(e.clientX)
      spotY.set(e.clientY)
    }
    window.addEventListener("mousemove", onMove)
    return () => window.removeEventListener("mousemove", onMove)
  }, [mx, my, spotX, spotY])

  const imgMX = useTransform(smx, (v) => v * -36)
  const imgMY = useTransform(smy, (v) => v * -36)
  const nameMX = useTransform(smx, (v) => v * -64)
  const nameMY = useTransform(smy, (v) => v * -64)

  return (
    <section id="home" className="relative flex h-screen items-center justify-center overflow-hidden">

      {/* Ambient colour comes from the shared GlobalBackground (fixed, spans the whole
          page) — no hero-local blobs, so nothing gets clipped at the section edge. */}

      {/* ── Giant name — words reveal (Stage 1), then demote to background layer (Stage 3) ── */}
      <motion.div
        className="pointer-events-none absolute inset-0 flex items-center justify-center px-4"
        style={{ x: nameMX, y: nameMY, zIndex: 1 }}
        animate={{ opacity: nameBehind ? 0.07 : 0.96 }}
        transition={{ duration: 1.1, ease: EASE_OUT }}
      >
        <h1
          style={{
            margin: 0, fontSize: "clamp(2rem, 12.5vw, 13rem)", fontWeight: 800,
            letterSpacing: "-0.04em", lineHeight: 1, whiteSpace: "nowrap",
            color: "#ffffff",
            textShadow: nameBehind ? "none" : "0 0 80px rgba(79,124,255,0.35), 0 10px 60px rgba(0,0,0,0.5)",
          }}
        >
          <NameWord text="HARSH" show={nameVisible} delay={0} />{" "}
          <NameWord text="SARAN" show={nameVisible} delay={0.42} />
        </h1>
      </motion.div>

      {/* ── Atmospheric glow that integrates the portrait into the scene (soft, no hard ellipse) ── */}
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute"
        style={{
          left: "50%", bottom: "2%", zIndex: 1,
          width: "min(72vh, 760px)", height: "min(62vh, 640px)",
          background: "radial-gradient(ellipse at 50% 58%, rgba(124,58,237,0.20), rgba(79,124,255,0.09) 45%, transparent 70%)",
          filter: "blur(64px)",
        }}
        initial={false}
        animate={showPortrait ? { x: "-50%", opacity: 1 } : { x: "-50%", opacity: 0 }}
        transition={{ duration: 1.4, ease: EASE_OUT }}
      />

      {/* ── Portrait (transparent landscape cutout) — rises from bottom, blended (no box/edges) ── */}
      <motion.div
        className="pointer-events-none absolute"
        style={{
          left: "50%", bottom: 0, zIndex: 2,
          width: "min(176vh, 1700px)", height: "min(86vh, 860px)",
          willChange: "transform, opacity",
        }}
        initial={false}
        animate={showPortrait ? { x: "-50%", y: 0, scale: 1, opacity: 1 } : { x: "-50%", y: 300, scale: 0.92, opacity: 0 }}
        transition={{ duration: 1.4, ease: EASE_OUT }}
      >
        {/* bottom-fade mask dissolves the shoulders into the page → seamless, no cutoff */}
        <motion.div
          className="absolute inset-0"
          style={{
            x: imgMX, y: imgMY,
            maskImage: "linear-gradient(to bottom, #000 68%, transparent 99%)",
            WebkitMaskImage: "linear-gradient(to bottom, #000 68%, transparent 99%)",
          }}
        >
          <Image
            src={HERO_PORTRAIT}
            alt="Harsh Saran"
            fill
            priority
            quality={90}
            sizes="100vw"
            className="object-contain object-bottom"
          />
        </motion.div>
      </motion.div>

      {/* ── Headline + subheading (Stage 4) — reads over the dark blazer ── */}
      <div className="absolute left-1/2 -translate-x-1/2 px-6 text-center" style={{ bottom: "7%", width: "min(92vw, 760px)", zIndex: 10 }}>
        <h2 style={{ margin: 0 }}>
          {HERO_HEADLINE.map((line, i) => (
            <span key={line} style={{ display: "block", overflow: "hidden", paddingBottom: "0.08em" }}>
              <motion.span
                initial={false}
                animate={content ? { y: 0 } : { y: "120%" }}
                transition={{ delay: content ? 0.1 + i * 0.12 : 0, duration: 0.9, ease: EASE_OUT }}
                style={{
                  display: "block",
                  fontSize: "clamp(1.7rem, 4.4vw, 3.3rem)", fontWeight: 600, lineHeight: 1.12,
                  letterSpacing: "-0.03em", color: i === 1 ? "rgba(255,255,255,0.55)" : "#ffffff",
                  textShadow: "0 6px 40px rgba(0,0,0,0.7)",
                }}
              >
                {line}
              </motion.span>
            </span>
          ))}
        </h2>
        <motion.p
          initial={false}
          animate={content ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
          transition={{ delay: content ? 0.42 : 0, duration: 0.9, ease: EASE_OUT }}
          style={{
            margin: "1.4rem auto 0", maxWidth: 560, fontSize: "clamp(0.82rem, 1.15vw, 0.98rem)",
            fontWeight: 500, letterSpacing: "0.06em", textTransform: "uppercase" as const,
            background: "linear-gradient(100deg, #4F7CFF, #8B5CF6, #D946EF)",
            WebkitBackgroundClip: "text", backgroundClip: "text", WebkitTextFillColor: "transparent", color: "transparent",
          }}
        >
          {HERO_SUB}
        </motion.p>
      </div>

      {/* ── Mouse-follow spotlight (subtle, not behind the portrait) ── */}
      <motion.div
        className="pointer-events-none fixed hidden md:block"
        style={{
          top: 0, left: 0, x: spotTX, y: spotTY, width: 540, height: 540, borderRadius: "50%",
          zIndex: 5, mixBlendMode: "screen", willChange: "transform",
          background: "radial-gradient(circle, rgba(79,124,255,0.04) 0%, rgba(217,70,239,0.02) 45%, transparent 70%)",
          filter: "blur(24px)",
        }}
      />

      {/* ── Scroll cue (appears with the content) ── */}
      <motion.div
        className="absolute bottom-7 left-1/2 flex flex-col items-center"
        style={{ x: "-50%", zIndex: 10 }}
        initial={false}
        animate={content ? { opacity: 1 } : { opacity: 0 }}
        transition={{ delay: content ? 0.7 : 0, duration: 0.8 }}
      >
        <motion.div
          style={{ width: 1, height: 26, background: "linear-gradient(180deg, rgba(255,255,255,0.3), transparent)" }}
          animate={{ scaleY: [0.4, 1, 0.4], opacity: [0.3, 0.8, 0.3] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />
      </motion.div>

    </section>
  )
}

// ─── About section (interactive curiosity wall) ───────────────────────────────

const ABOUT_HEADING = [
  "I ask a lot of questions.",
  "Marketing happened somewhere in between.",
] as const

const QUESTIONS = [
  "Why do some campaigns work while others disappear?",
  "Why do certain brands stay in your head?",
  "Why do people stop scrolling for one thing and ignore another?",
  "Why do some ideas grow while others fade away?",
  "Why does good design feel effortless?",
  "Why do users behave the way they do?",
] as const

// Scattered anchor points (percent of the network box) + parallax depth + float
const Q_POS = [
  { x: 14, y: 19, depth: 22, dur: 5.0, w: 215 },
  { x: 82, y: 15, depth: 30, dur: 6.0, w: 200 },
  { x: 27, y: 79, depth: 26, dur: 5.5, w: 240 },
  { x: 74, y: 80, depth: 34, dur: 6.5, w: 210 },
  { x: 9,  y: 52, depth: 20, dur: 5.2, w: 185 },
  { x: 91, y: 49, depth: 28, dur: 6.2, w: 195 },
] as const

const EDGES: [number, number][] = [[0, 4], [4, 2], [2, 3], [3, 5], [5, 1], [1, 0], [0, 3], [1, 2]]

const ABOUT_STORY = [
  "Today I spend my time creating digital experiences that combine strategy, creativity, automation and user experience.",
  "I enjoy experimenting with ideas, improving systems and building things that feel modern, useful and memorable.",
] as const

const ABOUT_ENDING = [
  "Still curious.",
  "Still experimenting.",
  "Just with slightly better tools now.",
] as const

function TypeCursor() {
  return (
    <motion.span
      aria-hidden="true"
      style={{ display: "inline-block", width: "0.5em", marginLeft: 1, color: "rgba(201,186,255,0.95)" }}
      animate={{ opacity: [1, 1, 0, 0] }}
      transition={{ duration: 1, repeat: Infinity, times: [0, 0.5, 0.5, 1], ease: "linear" }}
    >
      |
    </motion.span>
  )
}

const glassCard: CSSProperties = {
  background: "rgba(18,16,28,0.55)", border: "1px solid rgba(255,255,255,0.09)",
  backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
  boxShadow: "0 14px 40px -22px rgba(0,0,0,0.8), 0 0 26px rgba(124,58,237,0.1)",
}

const MSG_LEAD = "That curiosity pulled me into "
const MSG_ACCENT = "digital marketing, design, branding and automation."

// Each card types ITS OWN text locally → only the active card re-renders per
// keystroke (the parent re-renders just ~6× total, once per advance).
function useTyper(q: string, typing: boolean, onDone: () => void) {
  const [text, setText] = useState("")
  useEffect(() => {
    if (!typing) return
    if (text === q) {
      const t = setTimeout(onDone, 300)
      return () => clearTimeout(t)
    }
    // Reveal a few chars per tick — reads as fast typing while keeping renders low
    const t = setTimeout(() => setText(q.slice(0, Math.min(q.length, text.length + 3))), 30)
    return () => clearTimeout(t)
  }, [typing, text, q, onDone])
  return text
}

const QuestionCard = memo(function QuestionCard({
  q, index, turn, started, pos, smx, smy, onDone,
}: {
  q: string; index: number; turn: number; started: boolean
  pos: (typeof Q_POS)[number]
  smx: MotionValue<number>; smy: MotionValue<number>; onDone: () => void
}) {
  const typing = started && turn === index
  const visible = started && turn >= index
  const text = useTyper(q, typing, onDone)
  const px = useTransform(smx, (v) => v * pos.depth)
  const py = useTransform(smy, (v) => v * pos.depth)
  return (
    <motion.div
      className="absolute"
      style={{ left: `${pos.x}%`, top: `${pos.y}%`, x: px, y: py, width: pos.w, marginLeft: -pos.w / 2, marginTop: -34, zIndex: 2 }}
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: visible ? 1 : 0, scale: visible ? 1 : 0.96 }}
      transition={{ duration: 0.5, ease: EASE_OUT }}
    >
      {/* Layer A — infinite gentle float (nothing else touches y here, so it never stops) */}
      <motion.div
        animate={{ y: [0, -5, 0] }}
        transition={{ duration: pos.dur, repeat: Infinity, repeatType: "loop", ease: "easeInOut" }}
        style={{ willChange: "transform" }}
      >
        {/* Layer B — hover only (scale + glow); returns to base cleanly on hover end */}
        <motion.div
          initial={false}
          whileHover={{ scale: 1.06, boxShadow: "0 20px 50px -20px rgba(0,0,0,0.85), 0 0 42px rgba(124,58,237,0.32)" }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          style={{ ...glassCard, borderRadius: 14, padding: "11px 15px" }}
        >
          <p style={{ margin: 0, fontSize: 12.5, fontWeight: 400, lineHeight: 1.45, color: "rgba(255,255,255,0.78)" }}>
            {text}{typing && <TypeCursor />}
          </p>
        </motion.div>
      </motion.div>
    </motion.div>
  )
})

const MobileQuestion = memo(function MobileQuestion({
  q, index, turn, started, onDone,
}: {
  q: string; index: number; turn: number; started: boolean; onDone: () => void
}) {
  const typing = started && turn === index
  const visible = started && turn >= index
  const text = useTyper(q, typing, onDone)
  if (!visible) return null
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} style={{ ...glassCard, borderRadius: 12, padding: "11px 14px" }}>
      <p style={{ margin: 0, fontSize: 13, fontWeight: 400, lineHeight: 1.4, color: "rgba(255,255,255,0.78)" }}>
        {text}{typing && <TypeCursor />}
      </p>
    </motion.div>
  )
})

function CuriosityMessage({ big }: { big: boolean }) {
  return (
    <p style={{ margin: 0, fontSize: big ? "clamp(1.6rem, 2.9vw, 2.3rem)" : "clamp(1.25rem, 4vw, 1.5rem)", fontWeight: 500, lineHeight: 1.5, letterSpacing: "-0.02em", color: "rgba(255,255,255,0.95)", textShadow: "0 0 36px rgba(139,92,246,0.32)" }}>
      {MSG_LEAD}
      <span style={{ background: "linear-gradient(100deg, #a78bfa, #60a5fa)", WebkitBackgroundClip: "text", backgroundClip: "text", WebkitTextFillColor: "transparent", color: "transparent" }}>
        {MSG_ACCENT}
      </span>
    </p>
  )
}

function CuriosityWall() {
  const [turn, setTurn] = useState(0)
  const [started, setStarted] = useState(false)
  const [isDesktop, setIsDesktop] = useState(true)
  const done = turn >= QUESTIONS.length
  const advance = useCallback(() => setTurn((t) => t + 1), [])

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)")
    const update = () => setIsDesktop(mq.matches)
    update()
    mq.addEventListener("change", update)
    return () => mq.removeEventListener("change", update)
  }, [])

  // Mouse parallax (motion values → no re-renders)
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const smx = useSpring(mx, { stiffness: 60, damping: 22, mass: 0.5 })
  const smy = useSpring(my, { stiffness: 60, damping: 22, mass: 0.5 })
  useEffect(() => {
    const onMove = (e: MouseEvent) => { mx.set(e.clientX / window.innerWidth - 0.5); my.set(e.clientY / window.innerHeight - 0.5) }
    window.addEventListener("mousemove", onMove)
    return () => window.removeEventListener("mousemove", onMove)
  }, [mx, my])
  const lineX = useTransform(smx, (v) => v * 14)
  const lineY = useTransform(smy, (v) => v * 14)

  return (
    <div className="relative">
      {/* start trigger */}
      <motion.div onViewportEnter={() => setStarted(true)} viewport={{ once: true, amount: 0.3 }} style={{ position: "absolute", inset: 0, pointerEvents: "none" }} />

      {isDesktop ? (
        <div className="relative" style={{ height: "clamp(440px, 52vh, 540px)" }}>
          {/* connection network */}
          <motion.svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ x: lineX, y: lineY, zIndex: 1, overflow: "visible" }}>
            {EDGES.map(([a, b], i) => (
              <motion.line
                key={i}
                x1={Q_POS[a].x} y1={Q_POS[a].y} x2={Q_POS[b].x} y2={Q_POS[b].y}
                stroke="rgba(139,92,246,0.32)" strokeWidth={1} strokeLinecap="round" vectorEffect="non-scaling-stroke"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={done ? { pathLength: 1, opacity: [0.5, 0.95, 0.5] } : { pathLength: 0, opacity: 0 }}
                transition={{
                  pathLength: { duration: 0.8, delay: i * 0.1, ease: EASE_OUT },
                  // after drawing, opacity breathes forever (varied per line → evolving network)
                  opacity: done
                    ? { duration: 3 + (i % 3) * 0.7, repeat: Infinity, ease: "easeInOut", delay: 0.8 }
                    : { duration: 0.4 },
                }}
              />
            ))}
          </motion.svg>

          {QUESTIONS.map((q, i) => (
            <QuestionCard key={i} q={q} index={i} turn={turn} started={started} pos={Q_POS[i]} smx={smx} smy={smy} onDone={advance} />
          ))}

          {/* center message — the conclusion emerging from the questions */}
          <motion.div
            className="absolute"
            style={{ left: "50%", top: "48%", x: "-50%", width: "min(88%, 560px)", textAlign: "center", zIndex: 3 }}
            initial={{ opacity: 0, filter: "blur(10px)", y: "-40%" }}
            animate={done ? { opacity: 1, filter: "blur(0px)", y: "-50%" } : { opacity: 0, filter: "blur(10px)", y: "-40%" }}
            transition={{ duration: 1, delay: 0.3, ease: EASE_OUT }}
          >
            <CuriosityMessage big />
          </motion.div>
        </div>
      ) : (
        <div style={{ marginTop: "1.5rem" }}>
          <div className="flex flex-col" style={{ gap: 12 }}>
            {QUESTIONS.map((q, i) => (
              <MobileQuestion key={i} q={q} index={i} turn={turn} started={started} onDone={advance} />
            ))}
          </div>
          <motion.div style={{ marginTop: "1.6rem" }} initial={{ opacity: 0, y: 10 }} animate={done ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }} transition={{ duration: 0.8, delay: 0.2, ease: EASE_OUT }}>
            <CuriosityMessage big={false} />
          </motion.div>
        </div>
      )}
    </div>
  )
}

function AboutSection() {
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] })
  const whyY = useTransform(scrollYProgress, [0, 1], ["6%", "-12%"])

  return (
    <section ref={ref} className="relative overflow-hidden px-8 pt-28 pb-24 lg:px-24 lg:pt-32 lg:pb-28">

      {/* Background WHY? — oversized, extremely faint */}
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center"
        style={{ y: whyY, zIndex: 0, willChange: "transform" }}
      >
        {["WHY?", "WHY?", "WHY?"].map((w, i) => (
          <span key={i} style={{ fontSize: "clamp(7rem, 30vw, 26rem)", fontWeight: 700, lineHeight: 0.86, letterSpacing: "-0.05em", color: "rgba(180,165,255,0.013)" }}>
            {w}
          </span>
        ))}
      </motion.div>

      <div className="relative mx-auto w-full text-center" style={{ zIndex: 10, maxWidth: 1080 }}>

        {/* Label */}
        <motion.span
          className="inline-flex items-center"
          style={{ gap: 12, fontSize: "0.72rem", fontWeight: 500, letterSpacing: "0.34em", textTransform: "uppercase" as const, color: "rgba(196,181,253,0.8)" }}
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 0.7, ease: EASE_OUT }}
        >
          <span style={{ width: 28, height: 1, background: "rgba(196,181,253,0.4)" }} />
          About
          <span style={{ width: 28, height: 1, background: "rgba(196,181,253,0.4)" }} />
        </motion.span>

        {/* Heading — hero statement */}
        <h2 className="mx-auto" style={{ margin: "1.6rem auto 0", maxWidth: 760 }}>
          {ABOUT_HEADING.map((line, i) => (
            <motion.span
              key={line}
              style={{ display: "block", overflow: "hidden", paddingBottom: "0.08em" }}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.4 }}
            >
              <motion.span
                variants={{ hidden: { y: "115%" }, show: { y: 0 } }}
                transition={{ delay: 0.06 + i * 0.14, duration: 0.95, ease: EASE_OUT }}
                style={{ display: "block", fontSize: "clamp(1.8rem, 4.2vw, 3.4rem)", fontWeight: 500, lineHeight: 1.12, letterSpacing: "-0.03em", color: i === 0 ? "#ffffff" : "rgba(255,255,255,0.42)" }}
              >
                {line}
              </motion.span>
            </motion.span>
          ))}
        </h2>

        {/* Curiosity network */}
        <div style={{ marginTop: "clamp(2rem, 4vw, 3rem)" }}>
          <CuriosityWall />
        </div>

        {/* Story — concise */}
        <motion.div
          className="mx-auto"
          style={{ marginTop: "clamp(1.5rem, 4vw, 3rem)", maxWidth: 600 }}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.8, ease: EASE_OUT }}
        >
          {ABOUT_STORY.map((para, i) => (
            <p key={i} style={{ margin: i === 0 ? 0 : "1rem 0 0", fontSize: "clamp(0.92rem, 1.3vw, 1.05rem)", fontWeight: 300, lineHeight: 1.7, color: "rgba(255,255,255,0.5)" }}>
              {para}
            </p>
          ))}
        </motion.div>

        {/* Ending — mic-drop */}
        <div className="mx-auto" style={{ marginTop: "clamp(2.5rem, 5vw, 4rem)", maxWidth: 760 }}>
          {ABOUT_ENDING.map((line, i) => (
            <motion.span
              key={line}
              style={{ display: "block", overflow: "hidden", paddingBottom: "0.06em" }}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.5 }}
            >
              <motion.span
                variants={{ hidden: { y: "115%" }, show: { y: 0 } }}
                transition={{ delay: i * 0.1, duration: 0.85, ease: EASE_OUT }}
                style={{ display: "block", fontSize: "clamp(2rem, 4.6vw, 3.4rem)", fontWeight: 600, lineHeight: 1.1, letterSpacing: "-0.03em", color: i === 2 ? "rgba(201,186,255,0.95)" : "#ffffff" }}
              >
                {line}
              </motion.span>
            </motion.span>
          ))}
        </div>

      </div>
    </section>
  )
}

// ─── Selected Work ────────────────────────────────────────────────────────────

interface Work {
  num: string
  img: string
  title: string
  badge: string
  desc: string
  role: string
  tools: string[]
}

const WORK: Work[] = [
  {
    num: "01",
    img: "/Images/Hero-Sect-Desktop.png",
    title: "SassyStitch",
    badge: "Fashion Commerce",
    desc: "Built and managed a fashion e-commerce experience focused on storytelling, product presentation and customer engagement — from storefront design to campaign execution, every detail made browsing feel effortless and premium.",
    role: "Brand & Storefront, Campaigns",
    tools: ["Shopify", "Branding", "Meta Ads", "Email"],
  },
  {
    num: "02",
    img: "/Images/Hero-Section-KB.png",
    title: "Kaushal Bazaar",
    badge: "Marketplace Ecosystem",
    desc: "Shaped the digital experience of a multi-sector marketplace connecting products, services and skilled entrepreneurs — clearer user journeys and marketing assets that simplified a complex ecosystem.",
    role: "UX & Marketing Design",
    tools: ["Figma", "UI Design", "Strategy", "Content"],
  },
  {
    num: "03",
    img: "/Images/Hero-section-CLMS.png",
    title: "CLMS",
    badge: "Campus Platform",
    desc: "Worked on digital assets and platform presentation for a campus lifecycle solution covering admissions, academics, examinations, placements and operations through one connected ecosystem.",
    role: "Platform Presentation",
    tools: ["Figma", "SaaS UI", "Web", "Decks"],
  },
  {
    num: "04",
    img: "/Images/Automation.png",
    title: "Candidate Journey Automation",
    badge: "AI Automation",
    desc: "Designed an automated workflow connecting payment tracking, candidate records and WhatsApp communication — cutting manual follow-ups across the entire candidate journey.",
    role: "Automation Design",
    tools: ["n8n", "WhatsApp API", "Google Sheets", "AI"],
  },
]

const tagPill: CSSProperties = {
  fontSize: 10.5, fontWeight: 500, letterSpacing: "0.04em",
  color: "rgba(255,255,255,0.6)", padding: "5px 11px", borderRadius: 100,
  border: "1px solid rgba(255,255,255,0.1)", background: "rgba(14,12,24,0.6)",
  whiteSpace: "nowrap",
}

const frameBadge: CSSProperties = {
  display: "inline-block", padding: "3px 9px", borderRadius: 100,
  border: "1px solid rgba(139,92,246,0.3)", background: "rgba(139,92,246,0.1)",
  fontSize: 9, fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase",
  color: "rgba(196,181,253,0.92)",
}

// A single artwork suspended from the cable: hook → rod → glass frame.
function HangingProject({ w, index, onOpen }: { w: Work; index: number; onOpen: () => void }) {
  const [hover, setHover] = useState(false)
  const swing = 1 + (index % 2) * 0.6          // 1–1.6° idle sway
  const dur = 4.2 + index * 0.5
  const rod = 22 + (index % 3) * 16            // staggered hang heights

  return (
    <motion.div
      className="relative flex shrink-0 flex-col items-center"
      style={{ width: "clamp(172px, 22vw, 250px)" }}
      initial={{ opacity: 0, y: -26 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.6, delay: 0.7 + index * 0.18, ease: EASE_OUT }}
    >
      {/* hook on the cable */}
      <div style={{ width: 9, height: 9, borderRadius: "50%", background: "rgba(167,139,250,0.95)", boxShadow: "0 0 12px rgba(139,92,246,0.85)", zIndex: 2 }} />

      {/* swinging unit — pivots at the hook like a hanging frame */}
      <motion.div
        className="flex w-full flex-col items-center"
        style={{ transformOrigin: "top center", willChange: "transform" }}
        animate={hover ? { rotate: 0, y: -8 } : { rotate: [-swing, swing, -swing], y: [0, -4, 0] }}
        transition={hover
          ? { type: "spring", stiffness: 160, damping: 14 }
          : { rotate: { duration: dur, repeat: Infinity, ease: "easeInOut" }, y: { duration: dur * 0.8, repeat: Infinity, ease: "easeInOut" } }}
      >
        {/* rod */}
        <motion.div
          style={{ width: 1.5, height: rod, transformOrigin: "top", background: "linear-gradient(180deg, rgba(167,139,250,0.65), rgba(255,255,255,0.07))" }}
          initial={{ scaleY: 0 }}
          whileInView={{ scaleY: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.55 + index * 0.18, ease: EASE_OUT }}
        />

        {/* frame — hover stays INSIDE the card (no outer aura) */}
        <motion.button
          type="button"
          onClick={onOpen}
          onHoverStart={() => setHover(true)}
          onHoverEnd={() => setHover(false)}
          className="relative w-full overflow-hidden text-left"
          animate={{
            // premium neutral drop shadow only — no coloured glow spilling outside
            boxShadow: hover
              ? "0 28px 58px -24px rgba(0,0,0,0.9)"
              : "0 16px 42px -26px rgba(0,0,0,0.7)",
          }}
          transition={{ type: "spring", stiffness: 220, damping: 22 }}
          style={{
            borderRadius: 18, border: "1px solid rgba(255,255,255,0.1)",
            background: "rgba(18,16,28,0.5)", backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)",
            cursor: "pointer", padding: 0,
          }}
        >
          <motion.div layoutId={`work-img-${index}`} style={{ position: "relative", width: "100%", aspectRatio: "4 / 5", overflow: "hidden", borderRadius: "18px 18px 0 0" }}>
            <motion.div style={{ position: "absolute", inset: 0 }} animate={{ scale: hover ? 1.03 : 1 }} transition={{ duration: 0.6, ease: EASE_OUT }}>
              <Image src={w.img} alt={w.title} fill sizes="(max-width: 1024px) 60vw, 24vw" className="object-cover object-top" />
            </motion.div>
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, transparent 45%, rgba(5,8,22,0.85))" }} />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, rgba(99,102,241,0.05), transparent 45%, rgba(124,58,237,0.08))" }} />
          </motion.div>
          <div style={{ padding: "12px 14px 14px" }}>
            <span style={frameBadge}>{w.badge}</span>
            <h3 style={{ margin: "9px 0 0", fontSize: "0.95rem", fontWeight: 600, letterSpacing: "-0.01em", color: "#ffffff" }}>{w.title}</h3>
          </div>

          {/* subtle border glow (inset → never leaves the card) */}
          <motion.div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{ borderRadius: 18, border: "1px solid rgba(139,92,246,0.55)", boxShadow: "inset 0 0 22px rgba(124,58,237,0.16)" }}
            animate={{ opacity: hover ? 1 : 0 }}
            transition={{ duration: 0.35, ease: EASE_OUT }}
          />

          {/* reflection sweep — light passes across once on hover, clipped to the card */}
          <motion.div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0"
            style={{
              width: "55%", skewX: -18,
              background: "linear-gradient(105deg, transparent 35%, rgba(255,255,255,0.14) 50%, transparent 65%)",
            }}
            initial={false}
            animate={{ x: hover ? "260%" : "-140%" }}
            transition={{ duration: hover ? 0.9 : 0, ease: "easeInOut" }}
          />
        </motion.button>
      </motion.div>
    </motion.div>
  )
}

// The clicked artwork "unhooks" and expands into a featured showcase.
function Showcase({ index, setSelected }: { index: number; setSelected: (i: number | null) => void }) {
  const w = WORK[index]
  return (
    <motion.div
      className="relative"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Huge background number */}
      <span aria-hidden="true" style={{
        position: "absolute", right: "1%", top: "-8%", zIndex: 0, pointerEvents: "none",
        fontSize: "clamp(12rem, 34vw, 30rem)", fontWeight: 800, lineHeight: 1, letterSpacing: "-0.05em",
        color: "rgba(180,165,255,0.035)",
      }}>
        {w.num}
      </span>

      {/* Back */}
      <motion.button
        type="button"
        onClick={() => setSelected(null)}
        className="relative inline-flex items-center"
        whileHover={{ x: -4 }}
        transition={{ type: "spring", stiffness: 300, damping: 22 }}
        style={{ zIndex: 2, gap: 8, marginBottom: 28, background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.6)", fontSize: 13, fontWeight: 500 }}
      >
        <span style={{ color: "rgba(167,139,250,0.95)" }}>←</span> Back to gallery
      </motion.button>

      <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center lg:gap-12" style={{ zIndex: 1 }}>
        {/* Morphing image */}
        <motion.div
          layoutId={`work-img-${index}`}
          className="w-full lg:flex-[1.25]"
          style={{
            position: "relative", aspectRatio: "16 / 10", overflow: "hidden", borderRadius: 22,
            border: "1px solid rgba(255,255,255,0.1)",
            boxShadow: "0 40px 90px -30px rgba(0,0,0,0.85), 0 0 60px rgba(124,58,237,0.22)",
          }}
        >
          <Image src={w.img} alt={w.title} fill sizes="(max-width: 1024px) 92vw, 60vw" className="object-cover object-top" priority />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, rgba(99,102,241,0.06), transparent 45%, rgba(124,58,237,0.1))" }} />
        </motion.div>

        {/* Details */}
        <motion.div
          className="w-full lg:flex-[0.9]"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15, ease: EASE_OUT }}
        >
          <span style={frameBadge}>{w.badge}</span>
          <h3 style={{ margin: "1rem 0 0", fontSize: "clamp(1.8rem, 3.4vw, 2.8rem)", fontWeight: 600, lineHeight: 1.05, letterSpacing: "-0.03em", color: "#ffffff" }}>
            {w.title}
          </h3>
          <p style={{ margin: "1.1rem 0 0", maxWidth: 480, fontSize: "clamp(0.92rem, 1.2vw, 1.02rem)", fontWeight: 300, lineHeight: 1.7, color: "rgba(255,255,255,0.5)" }}>
            {w.desc}
          </p>

          <div className="mt-6 flex flex-wrap" style={{ gap: 28 }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)" }}>Role</div>
              <div style={{ marginTop: 6, fontSize: 14, fontWeight: 400, color: "rgba(255,255,255,0.8)" }}>{w.role}</div>
            </div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)" }}>Tools</div>
              <div className="mt-1.5 flex flex-wrap" style={{ gap: 7 }}>
                {w.tools.map((t) => <span key={t} style={tagPill}>{t}</span>)}
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap items-center" style={{ gap: 14 }}>
            <motion.button
              whileHover={{ scale: 1.04, boxShadow: "0 10px 30px rgba(124,58,237,0.5)" }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: "spring", stiffness: 380, damping: 22 }}
              style={{ padding: "12px 26px", borderRadius: 100, background: "linear-gradient(100deg, #7c3aed, #3b82f6)", color: "#fff", fontSize: 13, fontWeight: 600, border: "none", cursor: "pointer" }}
            >
              View Project →
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.04, background: "rgba(255,255,255,0.07)" }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: "spring", stiffness: 380, damping: 22 }}
              style={{ padding: "12px 24px", borderRadius: 100, background: "transparent", color: "rgba(255,255,255,0.8)", fontSize: 13, fontWeight: 500, border: "1px solid rgba(255,255,255,0.18)", cursor: "pointer" }}
            >
              Case Study
            </motion.button>
          </div>
        </motion.div>
      </div>

      {/* Other works — faded, click to switch */}
      <motion.div
        className="relative mt-12 flex flex-wrap items-center"
        style={{ zIndex: 1, gap: 14 }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <span style={{ fontSize: 10, fontWeight: 500, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)" }}>More</span>
        {WORK.map((o, i) =>
          i === index ? null : (
            <button
              key={o.num}
              type="button"
              onClick={() => setSelected(i)}
              className="inline-flex items-center transition-opacity hover:opacity-100"
              style={{ gap: 8, opacity: 0.5, background: "none", border: "none", cursor: "pointer" }}
            >
              <span style={{ fontFamily: "var(--font-mono, monospace)", fontSize: 11, color: "rgba(167,139,250,0.8)" }}>{o.num}</span>
              <span style={{ fontSize: 13, fontWeight: 500, color: "rgba(255,255,255,0.7)", whiteSpace: "nowrap" }}>{o.title}</span>
            </button>
          ),
        )}
      </motion.div>
    </motion.div>
  )
}

function SelectedWork() {
  const [selected, setSelected] = useState<number | null>(null)

  return (
    <section id="work" className="relative flex min-h-screen flex-col justify-center overflow-hidden px-8 py-24 lg:px-24" style={{ scrollMarginTop: 100 }}>

      {/* Soft installation lighting */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0" style={{ zIndex: 0 }}>
        <div style={{ position: "absolute", top: "8%", left: "10%", width: "42vw", height: "42vw", background: "radial-gradient(circle, rgba(124,58,237,0.12), transparent 70%)", filter: "blur(120px)" }} />
        <div style={{ position: "absolute", bottom: "4%", right: "8%", width: "38vw", height: "38vw", background: "radial-gradient(circle, rgba(59,130,246,0.10), transparent 70%)", filter: "blur(120px)" }} />
      </div>

      <div className="relative mx-auto w-full" style={{ zIndex: 10, maxWidth: 1180 }}>

        {/* Header */}
        <div className="mx-auto text-center" style={{ maxWidth: 720 }}>
          <motion.span
            className="inline-flex items-center"
            style={{
              gap: 12, fontSize: "0.72rem", fontWeight: 500, letterSpacing: "0.34em",
              textTransform: "uppercase" as const, color: "rgba(196,181,253,0.8)",
            }}
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ duration: 0.7, ease: EASE_OUT }}
          >
            <span style={{ width: 28, height: 1, background: "rgba(196,181,253,0.4)" }} />
            Selected Work
            <span style={{ width: 28, height: 1, background: "rgba(196,181,253,0.4)" }} />
          </motion.span>

          <motion.h2
            style={{
              margin: "1.6rem auto 0", maxWidth: 700,
              fontSize: "clamp(1.9rem, 4.4vw, 3.4rem)",
              fontWeight: 500, lineHeight: 1.12, letterSpacing: "-0.03em", color: "#ffffff",
            }}
            initial={{ opacity: 0, y: 22 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.85, ease: EASE_OUT }}
          >
            Ideas are easy.<br />
            Making them work is the{" "}
            <span style={{
              background: "linear-gradient(100deg, #a78bfa, #60a5fa)",
              WebkitBackgroundClip: "text", backgroundClip: "text",
              WebkitTextFillColor: "transparent", color: "transparent",
            }}>
              interesting part.
            </span>
          </motion.h2>

          <motion.p
            style={{
              margin: "1.5rem auto 0", maxWidth: 560,
              fontSize: "clamp(0.9rem, 1.25vw, 1.05rem)",
              fontWeight: 300, lineHeight: 1.7, color: "rgba(255,255,255,0.42)",
            }}
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.85, delay: 0.1, ease: EASE_OUT }}
          >
            A collection of projects where strategy, design, marketing and automation
            came together to solve real problems.
          </motion.p>
        </div>

        {/* Hanging gallery ⇄ featured showcase */}
        <div className="relative" style={{ marginTop: "clamp(2.5rem, 5vw, 4rem)" }}>
          <AnimatePresence initial={false}>
            {selected === null ? (
              <motion.div key="gallery" exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
                <div className="relative" style={{ minHeight: "clamp(440px, 58vh, 600px)" }}>
                  {/* glowing cable */}
                  <motion.div
                    className="absolute"
                    style={{
                      top: 26, left: "3%", right: "3%", height: 2, transformOrigin: "center",
                      background: "linear-gradient(90deg, transparent, rgba(167,139,250,0.5) 14%, rgba(96,165,250,0.5) 86%, transparent)",
                      boxShadow: "0 0 14px rgba(139,92,246,0.4)",
                    }}
                    initial={{ scaleX: 0, opacity: 0 }}
                    whileInView={{ scaleX: 1, opacity: 1 }}
                    viewport={{ once: true, amount: 0.4 }}
                    transition={{ duration: 0.8, ease: EASE_OUT }}
                  />
                  {/* suspended frames */}
                  <div
                    className="absolute inset-x-0 flex justify-start overflow-x-auto lg:justify-center"
                    style={{ top: 26, gap: "clamp(14px, 3vw, 36px)", paddingInline: "3%", paddingBottom: 16 }}
                  >
                    {WORK.map((w, i) => (
                      <HangingProject key={w.num} w={w} index={i} onOpen={() => setSelected(i)} />
                    ))}
                  </div>
                </div>
              </motion.div>
            ) : (
              <Showcase key="showcase" index={selected} setSelected={setSelected} />
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  )
}

// ─── How I Work ───────────────────────────────────────────────────────────────

// Rotating phrases for the typed second heading line
const HIW_PHRASES = [
  "Great marketing survives execution.",
  "Great marketing survives testing.",
  "Great marketing survives iteration.",
  "Great marketing survives reality.",
  "Great marketing survives bad ideas.",
] as const

function TypingLine() {
  const [i, setI] = useState(0)
  const [text, setText] = useState("")
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const full = HIW_PHRASES[i]
    // Pause when a phrase is fully typed, then start deleting
    if (!deleting && text === full) {
      const t = setTimeout(() => setDeleting(true), 1500)
      return () => clearTimeout(t)
    }
    // When fully deleted, advance to the next phrase
    if (deleting && text === "") {
      const t = setTimeout(() => { setDeleting(false); setI((v) => (v + 1) % HIW_PHRASES.length) }, 250)
      return () => clearTimeout(t)
    }
    const t = setTimeout(() => {
      setText((prev) => (deleting ? full.slice(0, prev.length - 1) : full.slice(0, prev.length + 1)))
    }, deleting ? 34 : 58)
    return () => clearTimeout(t)
  }, [text, deleting, i])

  return (
    <span>
      <span style={{
        background: "linear-gradient(100deg, #a78bfa, #60a5fa)",
        WebkitBackgroundClip: "text", backgroundClip: "text",
        WebkitTextFillColor: "transparent", color: "transparent",
      }}>
        {text}
      </span>
      <motion.span
        aria-hidden="true"
        style={{ display: "inline-block", marginLeft: 3, color: "rgba(167,139,250,0.95)", WebkitTextFillColor: "rgba(167,139,250,0.95)" }}
        animate={{ opacity: [1, 1, 0, 0] }}
        transition={{ duration: 1, repeat: Infinity, times: [0, 0.5, 0.5, 1], ease: "linear" }}
      >
        |
      </motion.span>
    </span>
  )
}

function ProcessIcon({ name }: { name: string }) {
  switch (name) {
    case "search":
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
          <circle cx="10.5" cy="10.5" r="6.5" /><line x1="15.5" y1="15.5" x2="20" y2="20" />
        </svg>
      )
    case "pencil":
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 20l1-3.5L15.5 6l3 3L8 19.5 4 20z" /><path d="M14 7.5l3 3" />
        </svg>
      )
    case "chart":
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
          <line x1="4" y1="20.5" x2="21" y2="20.5" /><line x1="6.5" y1="20" x2="6.5" y2="14" /><line x1="12" y1="20" x2="12" y2="8" /><line x1="17.5" y1="20" x2="17.5" y2="16" />
        </svg>
      )
    default: // bolt
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M13 2 L5 13 h5 l-1 9 l10 -13 h-6 z" />
        </svg>
      )
  }
}

interface HoverWord { text: string; top: string; left: string; size?: string }
interface Step {
  num: string
  title: string
  icon: string
  text: string[]
  caption: string
  words: HoverWord[]
}

const STEPS: Step[] = [
  {
    num: "01", title: "Research", icon: "search",
    text: ["Ask better questions.", "The answers usually follow."],
    caption: "Understanding the problem before chasing the solution.",
    words: [
      { text: "WHY?", top: "14%", left: "54%" },
      { text: "WHY?", top: "52%", left: "10%" },
      { text: "WHY?", top: "68%", left: "58%" },
      { text: "WHY?", top: "34%", left: "30%" },
    ],
  },
  {
    num: "02", title: "Create", icon: "pencil",
    text: ["Ideas are cheap.", "Execution is expensive."],
    caption: "Turning concepts into experiences people actually notice.",
    words: [
      { text: "IDEA", top: "16%", left: "12%" },
      { text: "SKETCH", top: "58%", left: "52%" },
      { text: "DRAFT", top: "40%", left: "30%" },
      { text: "VERSION 12", top: "74%", left: "8%", size: "clamp(0.75rem, 1.7vw, 1.1rem)" },
      { text: "FINAL?", top: "26%", left: "60%" },
    ],
  },
  {
    num: "03", title: "Optimize", icon: "chart",
    text: ["Guessing is fun.", "Data is useful."],
    caption: "Testing, refining and improving what already exists.",
    words: [
      { text: "A/B", top: "16%", left: "20%" },
      { text: "A/B", top: "44%", left: "58%" },
      { text: "A/B", top: "66%", left: "26%" },
      { text: "A/B", top: "32%", left: "70%" },
    ],
  },
  {
    num: "04", title: "Automate", icon: "bolt",
    text: ["If I repeat it twice,", "I start thinking about automation."],
    caption: "Removing repetitive work so more time goes into thinking.",
    words: [
      { text: "IF", top: "18%", left: "22%" },
      { text: "THEN", top: "44%", left: "48%" },
      { text: "ELSE", top: "70%", left: "28%" },
    ],
  },
]

function ProcessCard({ s, index }: { s: Step; index: number }) {
  return (
    <motion.div
      className="h-full"
      initial={{ opacity: 0, y: 30, filter: "blur(8px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.7, delay: index * 0.15, ease: EASE_OUT }}
    >
      {/* Hover controller + glass card */}
      <motion.div
        initial="rest"
        animate="rest"
        whileHover="hover"
        variants={{ rest: { y: 0 }, hover: { y: -8 } }}
        transition={{ duration: 0.4, ease: EASE_OUT }}
        className="relative flex h-full flex-col overflow-hidden"
        style={{
          minHeight: 360,
          background: "rgba(18,16,28,0.55)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 22,
          backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
          boxShadow: "0 22px 55px -28px rgba(0,0,0,0.85)",
          padding: "26px 24px",
        }}
      >
        {/* Glow — strengthens on hover */}
        <motion.div
          aria-hidden="true"
          variants={{ rest: { opacity: 0.3 }, hover: { opacity: 1 } }}
          transition={{ duration: 0.45 }}
          style={{ position: "absolute", inset: 0, borderRadius: 22, pointerEvents: "none", boxShadow: "inset 0 0 40px rgba(99,102,241,0.10), 0 0 38px rgba(124,58,237,0.15)" }}
        />
        {/* Border brighten on hover */}
        <motion.div
          aria-hidden="true"
          variants={{ rest: { opacity: 0 }, hover: { opacity: 1 } }}
          transition={{ duration: 0.45 }}
          style={{ position: "absolute", inset: 0, borderRadius: 22, pointerEvents: "none", border: "1px solid rgba(139,92,246,0.35)" }}
        />

        {/* Huge background number */}
        <motion.span
          aria-hidden="true"
          variants={{ rest: { opacity: 0.05 }, hover: { opacity: 0.09 } }}
          transition={{ duration: 0.45 }}
          style={{
            position: "absolute", right: 4, bottom: -22, zIndex: 0, pointerEvents: "none",
            fontSize: "clamp(7rem, 11vw, 10rem)", fontWeight: 800, lineHeight: 1,
            letterSpacing: "-0.05em", color: "#ffffff",
          }}
        >
          {s.num}
        </motion.span>

        {/* Hover background words */}
        <motion.div
          aria-hidden="true"
          className="absolute inset-0 overflow-hidden"
          style={{ zIndex: 1, pointerEvents: "none" }}
          variants={{ rest: {}, hover: { transition: { staggerChildren: 0.12, delayChildren: 0.05 } } }}
        >
          {s.words.map((w, wi) => (
            <motion.span
              key={wi}
              variants={{
                rest: { opacity: 0, y: 0 },
                hover: { opacity: 0.16, y: [0, -7, 0], transition: { y: { repeat: Infinity, duration: 3.2, ease: "easeInOut" }, opacity: { duration: 0.55 } } },
              }}
              style={{
                position: "absolute", top: w.top, left: w.left,
                fontSize: w.size || "clamp(0.9rem, 2.2vw, 1.5rem)",
                fontWeight: 700, letterSpacing: "0.02em", color: "rgba(167,139,250,0.9)", whiteSpace: "nowrap",
              }}
            >
              {w.text}
            </motion.span>
          ))}
        </motion.div>

        {/* Content */}
        <div className="relative flex h-full flex-col" style={{ zIndex: 2 }}>
          <motion.div
            variants={{ rest: { rotate: 0, scale: 1 }, hover: { rotate: -8, scale: 1.08 } }}
            transition={{ type: "spring", stiffness: 300, damping: 18 }}
            style={{
              width: 48, height: 48, borderRadius: 14, display: "flex",
              alignItems: "center", justifyContent: "center",
              background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.2)",
              color: "rgba(201,186,255,0.95)",
            }}
          >
            <ProcessIcon name={s.icon} />
          </motion.div>

          <h3 style={{ margin: "18px 0 0", fontSize: "1.3rem", fontWeight: 600, letterSpacing: "-0.02em", color: "#ffffff" }}>
            {s.title}
          </h3>

          <div style={{ marginTop: 12 }}>
            {s.text.map((t, ti) => (
              <p key={ti} style={{ margin: ti === 0 ? 0 : "2px 0 0", fontSize: "0.95rem", lineHeight: 1.5, color: "rgba(255,255,255,0.7)" }}>
                {t}
              </p>
            ))}
          </div>

          <div style={{ flex: 1, minHeight: 14 }} />

          <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.55, color: "rgba(255,255,255,0.4)" }}>
            {s.caption}
          </p>
        </div>
      </motion.div>
    </motion.div>
  )
}

function HowIWork() {
  return (
    <section className="relative overflow-hidden px-8 pb-28 pt-20 lg:px-24 lg:pb-32 lg:pt-24">

      <div className="relative mx-auto w-full" style={{ zIndex: 10, maxWidth: 1240 }}>

        {/* Header */}
        <div className="mx-auto text-center" style={{ maxWidth: 840 }}>
          <motion.span
            className="inline-flex items-center"
            style={{
              gap: 12, fontSize: "0.72rem", fontWeight: 500, letterSpacing: "0.34em",
              textTransform: "uppercase" as const, color: "rgba(196,181,253,0.8)",
            }}
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ duration: 0.7, ease: EASE_OUT }}
          >
            <span style={{ width: 28, height: 1, background: "rgba(196,181,253,0.4)" }} />
            How I Work
            <span style={{ width: 28, height: 1, background: "rgba(196,181,253,0.4)" }} />
          </motion.span>

          <h2 style={{ margin: "1.6rem auto 0", maxWidth: 820 }}>
            {/* Line 1 — static */}
            <motion.span
              style={{
                display: "block",
                fontSize: "clamp(1.5rem, 3.2vw, 2.5rem)",
                fontWeight: 500, lineHeight: 1.16, letterSpacing: "-0.03em", color: "#ffffff",
              }}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.8, ease: EASE_OUT }}
            >
              Good marketing starts with curiosity.
            </motion.span>
            {/* Line 2 — typing (reserved height keeps layout stable) */}
            <motion.span
              style={{
                display: "block", minHeight: "2.5em",
                fontSize: "clamp(1.5rem, 3.2vw, 2.5rem)",
                fontWeight: 500, lineHeight: 1.16, letterSpacing: "-0.03em",
              }}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.8, delay: 0.15, ease: EASE_OUT }}
            >
              <TypingLine />
            </motion.span>
          </h2>

          <motion.p
            style={{
              margin: "1rem auto 0", maxWidth: 560,
              fontSize: "clamp(0.9rem, 1.25vw, 1.05rem)",
              fontWeight: 300, lineHeight: 1.7, color: "rgba(255,255,255,0.42)",
            }}
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.85, delay: 0.1, ease: EASE_OUT }}
          >
            My process usually starts with questions,<br />
            gets messy somewhere in the middle,<br />
            and ends with something that actually works.
          </motion.p>
        </div>

        {/* Cards + connecting line */}
        <div className="relative mt-12 lg:mt-16">
          {/* Connecting line with a travelling pulse (desktop only) */}
          <div
            aria-hidden="true"
            className="absolute hidden lg:block"
            style={{
              left: "8%", right: "8%", top: "50%", height: 1, zIndex: 0,
              background: "linear-gradient(90deg, transparent, rgba(139,92,246,0.28) 12%, rgba(96,165,250,0.28) 88%, transparent)",
            }}
          >
            <motion.div
              style={{
                position: "absolute", top: -2.5, width: 56, height: 6, borderRadius: 99,
                background: "radial-gradient(closest-side, rgba(167,139,250,0.85), transparent)",
                filter: "blur(1px)", willChange: "left",
              }}
              animate={{ left: ["-6%", "100%"] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", repeatDelay: 1.2 }}
            />
          </div>

          {/* 4 / 2 / 1 columns */}
          <div className="relative grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6" style={{ zIndex: 1 }}>
            {STEPS.map((s, i) => (
              <ProcessCard key={s.title} s={s} index={i} />
            ))}
          </div>
        </div>

      </div>
    </section>
  )
}

// ─── Tools & Capabilities ─────────────────────────────────────────────────────

type ToolCat = "marketing" | "design" | "automation" | "web"

const CAT_COLOR: Record<ToolCat, string> = {
  marketing: "rgba(96,165,250,0.9)",
  design: "rgba(167,139,250,0.9)",
  automation: "rgba(52,211,153,0.85)",
  web: "rgba(251,191,114,0.85)",
}

interface Tool { name: string; size: "lg" | "md" | "sm"; cat: ToolCat }

// Interleaved order → varied sizes/categories cluster + a pleasant stagger
const TOOLS: Tool[] = [
  { name: "Google Ads", size: "lg", cat: "marketing" },
  { name: "ChatGPT", size: "lg", cat: "automation" },
  { name: "Figma", size: "lg", cat: "design" },
  { name: "n8n", size: "lg", cat: "automation" },
  { name: "Meta Ads", size: "md", cat: "marketing" },
  { name: "Canva", size: "md", cat: "design" },
  { name: "Claude", size: "md", cat: "automation" },
  { name: "WordPress", size: "md", cat: "web" },
  { name: "Photoshop", size: "md", cat: "design" },
  { name: "Shopify", size: "md", cat: "web" },
  { name: "Google Sheets", size: "md", cat: "automation" },
  { name: "GA4", size: "sm", cat: "marketing" },
  { name: "Zapier", size: "sm", cat: "automation" },
  { name: "CapCut", size: "sm", cat: "design" },
  { name: "Looker Studio", size: "sm", cat: "marketing" },
  { name: "Google Search Console", size: "sm", cat: "marketing" },
  { name: "AiSensy", size: "sm", cat: "automation" },
  { name: "InVideo", size: "sm", cat: "design" },
  { name: "WooCommerce", size: "sm", cat: "web" },
]

const PILL_SIZE = {
  lg: { fontSize: "clamp(0.95rem, 1.3vw, 1.1rem)", padding: "11px 22px", dot: 7 },
  md: { fontSize: "clamp(0.85rem, 1.1vw, 0.95rem)", padding: "9px 17px", dot: 6 },
  sm: { fontSize: "clamp(0.75rem, 1vw, 0.82rem)", padding: "7px 14px", dot: 5 },
} as const

function ToolPill({ t, index }: { t: Tool; index: number }) {
  const sz = PILL_SIZE[t.size]
  const dot = CAT_COLOR[t.cat]
  // Deterministic (SSR-safe) float + scatter params from the index
  const floatY = 3 + (index % 3)
  const rot = (index % 2 ? 1 : -1) * (1 + (index % 2))
  const dur = 4 + (index % 4) * 0.6
  const scatter = ((index % 4) - 1.5) * 10

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.6, delay: index * 0.08, ease: EASE_OUT }}
      style={{ marginTop: scatter }}
    >
      {/* Slow living-ecosystem float */}
      <motion.div
        animate={{ y: [0, -floatY, 0], rotate: [0, rot, 0] }}
        transition={{ duration: dur, repeat: Infinity, ease: "easeInOut" }}
        style={{ willChange: "transform" }}
      >
        {/* Hover lift */}
        <motion.div
          initial="rest"
          animate="rest"
          whileHover="hover"
          variants={{ rest: { y: 0 }, hover: { y: -4 } }}
          transition={{ duration: 0.3, ease: EASE_OUT }}
          className="relative inline-flex items-center"
          style={{
            gap: 9, padding: sz.padding, borderRadius: 100, cursor: "default",
            background: "rgba(20,18,30,0.55)", border: "1px solid rgba(255,255,255,0.09)",
            backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)",
            boxShadow: "0 10px 30px -16px rgba(0,0,0,0.8)", whiteSpace: "nowrap",
          }}
        >
          {/* Glow + brighter border on hover */}
          <motion.span
            aria-hidden="true"
            variants={{ rest: { opacity: 0 }, hover: { opacity: 1 } }}
            transition={{ duration: 0.35 }}
            style={{
              position: "absolute", inset: 0, borderRadius: 100, pointerEvents: "none",
              boxShadow: "0 0 22px rgba(139,92,246,0.3)", border: "1px solid rgba(139,92,246,0.4)",
            }}
          />
          <span style={{ width: sz.dot, height: sz.dot, borderRadius: "50%", background: dot, boxShadow: `0 0 8px ${dot}`, flexShrink: 0 }} />
          <span style={{ fontSize: sz.fontSize, fontWeight: 500, letterSpacing: "0.01em", color: "rgba(255,255,255,0.82)" }}>
            {t.name}
          </span>
        </motion.div>
      </motion.div>
    </motion.div>
  )
}

const CAPABILITIES: { title: string; desc: string }[] = [
  { title: "Content Strategy", desc: "Turning ideas into content people actually care about." },
  { title: "Brand Positioning", desc: "Helping brands find a voice instead of simply making noise." },
  { title: "Copywriting", desc: "Writing that guides attention and encourages action." },
  { title: "Creative Direction", desc: "Connecting visuals, messaging and goals into one experience." },
  { title: "Performance Marketing", desc: "Using data to improve campaigns, not just report on them." },
  { title: "Social Media Marketing", desc: "Creating content and campaigns designed for engagement and growth." },
  { title: "Landing Pages", desc: "Designing experiences that communicate clearly and convert effectively." },
  { title: "AI Automation", desc: "Reducing repetitive work through smart workflows and automation systems." },
]

function CapabilityCard({ title, desc, index }: { title: string; desc: string; index: number }) {
  return (
    <motion.div
      className="h-full"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.6, delay: index * 0.08, ease: EASE_OUT }}
    >
      <motion.div
        initial="rest"
        animate="rest"
        whileHover="hover"
        variants={{ rest: { y: 0 }, hover: { y: -6 } }}
        transition={{ duration: 0.35, ease: EASE_OUT }}
        className="relative flex h-full flex-col overflow-hidden"
        style={{
          background: "rgba(18,16,28,0.5)", border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 18, backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)",
          boxShadow: "0 18px 45px -26px rgba(0,0,0,0.8)", padding: "22px 20px",
        }}
      >
        <motion.div
          aria-hidden="true"
          variants={{ rest: { opacity: 0.22 }, hover: { opacity: 1 } }}
          transition={{ duration: 0.4 }}
          style={{ position: "absolute", inset: 0, borderRadius: 18, pointerEvents: "none", boxShadow: "inset 0 0 30px rgba(99,102,241,0.10), 0 0 30px rgba(124,58,237,0.13)" }}
        />

        <span style={{ fontFamily: "var(--font-mono, monospace)", fontSize: 11, fontWeight: 500, letterSpacing: "0.1em", color: "rgba(167,139,250,0.55)" }}>
          0{index + 1}
        </span>

        {/* Title gains a subtle gradient on hover (gradient copy fades over the white) */}
        <div style={{ position: "relative", marginTop: 12 }}>
          <h4 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 600, lineHeight: 1.2, letterSpacing: "-0.01em", color: "#ffffff" }}>
            {title}
          </h4>
          <motion.span
            aria-hidden="true"
            variants={{ rest: { opacity: 0 }, hover: { opacity: 1 } }}
            transition={{ duration: 0.4 }}
            style={{
              position: "absolute", inset: 0, pointerEvents: "none",
              fontSize: "1.05rem", fontWeight: 600, lineHeight: 1.2, letterSpacing: "-0.01em",
              background: "linear-gradient(100deg, #a78bfa, #60a5fa)",
              WebkitBackgroundClip: "text", backgroundClip: "text", WebkitTextFillColor: "transparent", color: "transparent",
            }}
          >
            {title}
          </motion.span>
        </div>

        <p style={{ margin: "10px 0 0", fontSize: 13, lineHeight: 1.6, color: "rgba(255,255,255,0.45)" }}>
          {desc}
        </p>
      </motion.div>
    </motion.div>
  )
}

function ToolsCapabilities() {
  return (
    <section className="relative overflow-hidden px-8 pb-28 pt-20 lg:px-24 lg:pb-32 lg:pt-24">

      <div className="relative mx-auto w-full" style={{ zIndex: 10, maxWidth: 1180 }}>

        {/* ── Header ── */}
        <div className="mx-auto text-center" style={{ maxWidth: 820 }}>
          <motion.span
            style={{
              display: "inline-block",
              fontSize: "0.68rem", fontWeight: 500, letterSpacing: "0.26em",
              textTransform: "uppercase" as const, color: "rgba(196,181,253,0.8)",
            }}
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ duration: 0.7, ease: EASE_OUT }}
          >
            Tools, Tactics &amp; a Few Things I Obsess Over
          </motion.span>

          <h2 style={{ margin: "1.4rem auto 0", maxWidth: 720 }}>
            {["The tools change.", "The curiosity stays the same."].map((line, i) => (
              <motion.span
                key={line}
                style={{
                  display: "block",
                  fontSize: "clamp(1.6rem, 3.6vw, 2.8rem)",
                  fontWeight: 500, lineHeight: 1.14, letterSpacing: "-0.03em",
                  color: i === 0 ? "#ffffff" : "rgba(255,255,255,0.45)",
                }}
                initial={{ opacity: 0, y: 22 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ duration: 0.8, delay: 0.05 + i * 0.14, ease: EASE_OUT }}
              >
                {line}
              </motion.span>
            ))}
          </h2>

          <motion.p
            style={{
              margin: "1.4rem auto 0", maxWidth: 580,
              fontSize: "clamp(0.9rem, 1.25vw, 1.05rem)",
              fontWeight: 300, lineHeight: 1.7, color: "rgba(255,255,255,0.42)",
            }}
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.85, delay: 0.1, ease: EASE_OUT }}
          >
            A collection of platforms, workflows and capabilities that help me build,
            market, optimize and automate digital experiences.
          </motion.p>
        </div>

        {/* ── PART 1 · Floating tool wall ── */}
        <div className="mx-auto mt-12 flex flex-wrap items-center justify-center lg:mt-16" style={{ gap: "14px 12px", maxWidth: 880 }}>
          {TOOLS.map((t, i) => (
            <ToolPill key={t.name} t={t} index={i} />
          ))}
        </div>

        {/* ── PART 2 · Capabilities ── */}
        <div className="mx-auto text-center" style={{ marginTop: "clamp(5rem, 9vw, 7.5rem)", maxWidth: 640 }}>
          <motion.h3
            style={{ margin: 0, fontSize: "clamp(1.5rem, 3.2vw, 2.4rem)", fontWeight: 500, lineHeight: 1.15, letterSpacing: "-0.03em", color: "#ffffff" }}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.8, ease: EASE_OUT }}
          >
            What I Bring To The Table
          </motion.h3>
          <motion.p
            style={{ margin: "1.2rem auto 0", maxWidth: 520, fontSize: "clamp(0.9rem, 1.2vw, 1rem)", fontWeight: 300, lineHeight: 1.7, color: "rgba(255,255,255,0.42)" }}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.85, delay: 0.1, ease: EASE_OUT }}
          >
            Tools are useful. Knowing how to combine them is where things get interesting.
          </motion.p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:mt-14 lg:grid-cols-4 lg:gap-5">
          {CAPABILITIES.map((c, i) => (
            <CapabilityCard key={c.title} title={c.title} desc={c.desc} index={i} />
          ))}
        </div>

      </div>
    </section>
  )
}

// ─── Services (bento grid → conversion CTA) ──────────────────────────────────

interface Service {
  num: string
  title: string
  punch: string[]
  desc: string
  keywords: string[]
  cta: string
  span: string   // lg bento column span
  minH: number
  emphasis?: boolean
}

const SERVICES: Service[] = [
  {
    num: "01", title: "Growth Marketing",
    punch: ["Attention is easy.", "Growth is harder."],
    desc: "Campaign strategy, audience targeting, funnel optimization and performance-focused marketing designed to turn attention into measurable growth.",
    keywords: ["Meta Ads", "Google Ads", "Funnels", "Analytics"],
    cta: "Explore Service", span: "lg:col-span-4", minH: 300, emphasis: true,
  },
  {
    num: "02", title: "Website & Landing Pages",
    punch: ["First impressions happen fast."],
    desc: "Business websites, portfolio websites and landing pages designed to communicate clearly, engage visitors and support business goals.",
    keywords: ["WordPress", "Landing Pages", "UX", "Conversion"],
    cta: "Explore Service", span: "lg:col-span-2", minH: 300,
  },
  {
    num: "03", title: "E-Commerce Solutions",
    punch: ["Shopping should feel effortless."],
    desc: "Helping brands create online shopping experiences focused on customer journeys, trust and conversion.",
    keywords: ["Shopify", "WooCommerce", "Customer Journey", "Storefront Design"],
    cta: "Explore Service", span: "lg:col-span-2", minH: 300,
  },
  {
    num: "04", title: "Marketing Automation",
    punch: ["Manual work doesn't scale."],
    desc: "Automating repetitive tasks, customer communication and workflows using tools like n8n, WhatsApp automation and AI-powered systems.",
    keywords: ["n8n", "Zapier", "AiSensy", "Automation"],
    cta: "Explore Service", span: "lg:col-span-4", minH: 300, emphasis: true,
  },
  {
    num: "05", title: "Creative Content & Campaigns",
    punch: ["Ideas deserve attention."],
    desc: "Creating marketing assets, videos and campaign creatives designed to communicate messages clearly and capture attention.",
    keywords: ["Canva", "CapCut", "InVideo", "Creative Strategy"],
    cta: "Explore Service", span: "sm:col-span-2 lg:col-span-6", minH: 210,
  },
  {
    num: "06", title: "Product & UI Experience",
    punch: ["Good design removes friction."],
    desc: "Designing user flows, app concepts and digital experiences that make products easier to understand and use.",
    keywords: ["Figma", "UX", "UI Design", "Wireframes"],
    cta: "Explore Service", span: "lg:col-span-3", minH: 250,
  },
  {
    num: "07", title: "Custom Digital Solutions",
    punch: ["Some ideas need bigger systems."],
    desc: "For larger requirements such as portals, dashboards, web applications and custom digital platforms, I collaborate with trusted development partners to bring ideas to life.",
    keywords: ["Portals", "Dashboards", "Web Apps", "Custom Platforms"],
    cta: "Let's Discuss", span: "lg:col-span-3", minH: 250,
  },
]

function ServiceCard({ s, index }: { s: Service; index: number }) {
  return (
    <motion.div
      className={`h-full ${s.span}`}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.7, delay: index * 0.12, ease: EASE_OUT }}
    >
      <motion.div
        initial="rest"
        animate="rest"
        whileHover="hover"
        variants={{ rest: { y: 0 }, hover: { y: -8 } }}
        transition={{ duration: 0.4, ease: EASE_OUT }}
        className="relative flex h-full flex-col overflow-hidden"
        style={{
          minHeight: s.minH,
          background: "rgba(18,16,28,0.5)", border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 22, backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
          boxShadow: "0 22px 55px -28px rgba(0,0,0,0.85)", padding: "28px 26px",
        }}
      >
        {/* Background gradient shift on hover */}
        <motion.div
          aria-hidden="true"
          variants={{ rest: { opacity: 0.4 }, hover: { opacity: 1 } }}
          transition={{ duration: 0.5 }}
          style={{
            position: "absolute", inset: 0, borderRadius: 22, pointerEvents: "none",
            background: "radial-gradient(120% 120% at 0% 0%, rgba(99,102,241,0.10), transparent 50%), radial-gradient(120% 120% at 100% 100%, rgba(124,58,237,0.12), transparent 55%)",
          }}
        />
        {/* Border glow on hover */}
        <motion.div
          aria-hidden="true"
          variants={{ rest: { opacity: 0 }, hover: { opacity: 1 } }}
          transition={{ duration: 0.45 }}
          style={{ position: "absolute", inset: 0, borderRadius: 22, pointerEvents: "none", boxShadow: "0 0 40px rgba(124,58,237,0.18)", border: "1px solid rgba(139,92,246,0.35)" }}
        />
        {/* Large background number */}
        <motion.span
          aria-hidden="true"
          variants={{ rest: { opacity: 0.05 }, hover: { opacity: 0.1 } }}
          transition={{ duration: 0.45 }}
          style={{
            position: "absolute", right: 8, bottom: -26, zIndex: 0, pointerEvents: "none",
            fontSize: "clamp(7rem, 12vw, 11rem)", fontWeight: 800, lineHeight: 1, letterSpacing: "-0.05em", color: "#ffffff",
          }}
        >
          {s.num}
        </motion.span>

        {/* Content */}
        <div className="relative flex h-full flex-col" style={{ zIndex: 1 }}>
          {s.emphasis && (
            <span style={{
              alignSelf: "flex-start", marginBottom: 14, padding: "4px 11px", borderRadius: 100,
              border: "1px solid rgba(139,92,246,0.3)", background: "rgba(139,92,246,0.08)",
              fontSize: 9.5, fontWeight: 500, letterSpacing: "0.14em", textTransform: "uppercase" as const,
              color: "rgba(196,181,253,0.9)",
            }}>
              Core focus
            </span>
          )}

          <h3 style={{
            margin: 0,
            fontSize: s.emphasis ? "clamp(1.5rem, 2.6vw, 2rem)" : "clamp(1.25rem, 2vw, 1.55rem)",
            fontWeight: 600, lineHeight: 1.1, letterSpacing: "-0.025em", color: "#ffffff",
          }}>
            {s.title}
          </h3>

          <div style={{ marginTop: 10 }}>
            {s.punch.map((line, i) => (
              <p key={i} style={{ margin: 0, fontSize: "0.98rem", fontWeight: 400, lineHeight: 1.35, color: "rgba(201,186,255,0.85)" }}>
                {line}
              </p>
            ))}
          </div>

          <p style={{ margin: "14px 0 0", maxWidth: 460, fontSize: 13.5, lineHeight: 1.65, color: "rgba(255,255,255,0.46)" }}>
            {s.desc}
          </p>

          <div style={{ flex: 1, minHeight: 18 }} />

          {/* Hover keywords (reserved space → no layout shift) */}
          <motion.div
            className="flex flex-wrap"
            style={{ gap: 7 }}
            variants={{ rest: {}, hover: { transition: { staggerChildren: 0.05 } } }}
          >
            {s.keywords.map((k) => (
              <motion.span
                key={k}
                style={tagPill}
                variants={{ rest: { opacity: 0, y: 4 }, hover: { opacity: 1, y: 0 } }}
                transition={{ duration: 0.3, ease: EASE_OUT }}
              >
                {k}
              </motion.span>
            ))}
          </motion.div>

          {/* CTA — slides right on hover */}
          <motion.div
            className="inline-flex items-center"
            variants={{ rest: { x: 0 }, hover: { x: 6 } }}
            transition={{ type: "spring", stiffness: 300, damping: 22 }}
            style={{ marginTop: 18, gap: 8, fontSize: 12.5, fontWeight: 500, letterSpacing: "0.03em", color: "rgba(255,255,255,0.85)", cursor: "pointer" }}
          >
            {s.cta}
            <span style={{ color: "rgba(167,139,250,0.95)" }}>→</span>
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ─── Contact modal (premium glassmorphism) ──────────────────────────────────

// ⚠️ Placeholder WhatsApp number — replace with the real one later.
// International format, digits only, no "+" or spaces (e.g. 919876543210).
const CONTACT_WHATSAPP = "918595998828"
const CONTACT_WA_MESSAGE = "Hi Harsh, I saw your portfolio and would like to discuss a project."

const PROJECT_TYPES = [
  "Website Design",
  "Digital Marketing",
  "Meta Ads",
  "Branding",
  "AI Automation",
  "Other",
] as const

const BUDGET_RANGES = [
  "Under ₹25K",
  "₹25K – ₹50K",
  "₹50K – ₹1L",
  "₹1L+",
] as const

function IconClose({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
      <line x1="6" y1="6" x2="18" y2="18" /><line x1="18" y1="6" x2="6" y2="18" />
    </svg>
  )
}

function IconWhatsApp({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12.04 2c-5.46 0-9.9 4.44-9.9 9.9 0 1.75.46 3.45 1.32 4.95L2 22l5.3-1.39a9.86 9.86 0 0 0 4.73 1.2h.01c5.46 0 9.9-4.44 9.9-9.9 0-2.64-1.03-5.13-2.9-7A9.82 9.82 0 0 0 12.04 2zm0 1.8a8.1 8.1 0 0 1 5.76 13.83 8.1 8.1 0 0 1-9.74 1.27l-.35-.2-3.14.82.84-3.06-.23-.36a8.1 8.1 0 0 1 6.86-12.43zm-3.1 4.3c-.16 0-.41.06-.63.29-.22.23-.84.82-.84 2s.86 2.32 1 2.48c.13.16 1.69 2.58 4.1 3.62.57.25 1.02.4 1.37.5.57.18 1.1.16 1.51.1.46-.07 1.42-.58 1.62-1.14.2-.56.2-1.04.14-1.14-.06-.1-.22-.16-.46-.28-.24-.12-1.42-.7-1.64-.78-.22-.08-.38-.12-.54.12-.16.23-.62.78-.76.94-.14.16-.28.18-.52.06-.24-.12-1.01-.37-1.93-1.19-.71-.64-1.19-1.42-1.33-1.66-.14-.24-.01-.37.1-.49.11-.11.24-.28.36-.42.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.54-1.3-.74-1.78-.2-.47-.4-.4-.54-.41h-.46z" />
    </svg>
  )
}

function ContactModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [sending, setSending] = useState(false)
  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const formRef = useRef<HTMLFormElement>(null)
  // Portal target only exists in the browser — gate rendering until mounted.
  const [mounted, setMounted] = useState(false)
  // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time SSR mount flag
  useEffect(() => setMounted(true), [])

  // ESC to close + lock body scroll while open
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    window.addEventListener("keydown", onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      window.removeEventListener("keydown", onKey)
      document.body.style.overflow = prev
    }
  }, [open, onClose])

  // Auto-dismiss the toast
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 4500)
    return () => clearTimeout(t)
  }, [toast])

  const waHref = `https://wa.me/${CONTACT_WHATSAPP}?text=${encodeURIComponent(CONTACT_WA_MESSAGE)}`

  // Submit the form to the /api/contact route, which sends the email via Resend.
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (sending) return
    const form = e.currentTarget
    const fd = new FormData(form)
    const payload = {
      name: fd.get("name"),
      email: fd.get("email"),
      company: fd.get("company"),
      projectType: fd.get("projectType"),
      budget: fd.get("budget"),
      message: fd.get("message"),
    }

    setSending(true)
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error("Request failed")

      setToast({ type: "success", text: "Thanks for reaching out. I'll get back to you shortly." })
      form.reset()                          // clear the fields
      setTimeout(() => onClose(), 1400)     // close the modal after a short delay
    } catch {
      setToast({ type: "error", text: "Something went wrong. Please try again." })
    } finally {
      setSending(false)
    }
  }

  if (!mounted) return null

  return createPortal(
    <>
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 flex items-center justify-center"
          style={{
            zIndex: 100, padding: "clamp(14px, 4vw, 28px)",
            background: "rgba(4,6,16,0.62)",
            backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)",
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: EASE_OUT }}
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-label="Contact Harsh"
        >
          <motion.div
            className="relative w-full"
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.94, y: 14 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            transition={{ duration: 0.38, ease: EASE_OUT }}
            style={{
              maxWidth: 540, maxHeight: "calc(100vh - clamp(28px, 8vw, 56px))",
              overflowY: "auto", WebkitOverflowScrolling: "touch",
              borderRadius: 24, border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(16,14,26,0.86)",
              backdropFilter: "blur(22px)", WebkitBackdropFilter: "blur(22px)",
              boxShadow: "0 40px 90px -30px rgba(0,0,0,0.9), 0 0 60px rgba(124,58,237,0.22)",
              padding: "clamp(1.4rem, 4.5vw, 2.4rem)",
            }}
          >
            {/* Scoped field styling */}
            <style>{`
              .cm-field {
                width: 100%; padding: 11px 14px; border-radius: 12px;
                background: rgba(10,9,20,0.6); border: 1px solid rgba(255,255,255,0.1);
                color: rgba(255,255,255,0.92); font-size: 14px; outline: none;
                font-family: inherit; transition: border-color .2s, box-shadow .2s;
              }
              .cm-field::placeholder { color: rgba(255,255,255,0.34); }
              .cm-field:focus {
                border-color: rgba(139,92,246,0.65);
                box-shadow: 0 0 0 3px rgba(139,92,246,0.16);
              }
              .cm-field option { background: #13111f; color: #fff; }
              select.cm-field {
                appearance: none; -webkit-appearance: none; -moz-appearance: none;
                padding-right: 38px; cursor: pointer;
                background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8' fill='none'%3E%3Cpath d='M1 1.5L6 6.5L11 1.5' stroke='%23b8a5ff' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
                background-repeat: no-repeat; background-position: right 14px center;
              }
              .cm-label {
                display: block; font-size: 11px; font-weight: 500; letter-spacing: 0.08em;
                text-transform: uppercase; color: rgba(196,181,253,0.75); margin-bottom: 7px;
              }
            `}</style>

            {/* Ambient blue/purple glow */}
            <div aria-hidden="true" className="pointer-events-none absolute inset-0" style={{
              borderRadius: 24, overflow: "hidden",
            }}>
              <div style={{ position: "absolute", top: "-30%", left: "-15%", width: "60%", height: "60%", background: "radial-gradient(circle, rgba(99,102,241,0.18), transparent 70%)", filter: "blur(50px)" }} />
              <div style={{ position: "absolute", bottom: "-30%", right: "-15%", width: "60%", height: "60%", background: "radial-gradient(circle, rgba(124,58,237,0.18), transparent 70%)", filter: "blur(50px)" }} />
            </div>

            {/* Close button */}
            <motion.button
              type="button"
              onClick={onClose}
              aria-label="Close"
              whileHover={{ scale: 1.08, background: "rgba(255,255,255,0.1)" }}
              whileTap={{ scale: 0.94 }}
              transition={{ type: "spring", stiffness: 380, damping: 22 }}
              className="absolute"
              style={{
                top: 16, right: 16, zIndex: 2,
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                width: 34, height: 34, borderRadius: "50%",
                background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)",
                color: "rgba(255,255,255,0.7)", cursor: "pointer",
              }}
            >
              <IconClose />
            </motion.button>

            <div className="relative" style={{ zIndex: 1 }}>
              <>
                  {/* Heading */}
                  <h3 style={{ margin: "0 40px 0 0", fontSize: "clamp(1.5rem, 4vw, 2rem)", fontWeight: 600, lineHeight: 1.12, letterSpacing: "-0.03em", color: "#ffffff" }}>
                    Let&apos;s Build Something{" "}
                    <span style={{
                      background: "linear-gradient(100deg, #a78bfa, #60a5fa)",
                      WebkitBackgroundClip: "text", backgroundClip: "text",
                      WebkitTextFillColor: "transparent", color: "transparent",
                    }}>
                      Great
                    </span>
                  </h3>
                  <p style={{ margin: "0.6rem 0 0", fontSize: "clamp(0.85rem, 1.2vw, 0.95rem)", lineHeight: 1.6, color: "rgba(255,255,255,0.5)" }}>
                    Tell me about your project and I&apos;ll get back to you.
                  </p>

                  {/* Form */}
                  <form
                    ref={formRef}
                    onSubmit={handleSubmit}
                    className="grid grid-cols-1 sm:grid-cols-2"
                    style={{ gap: "16px 16px", marginTop: "clamp(1.4rem, 3vw, 1.8rem)" }}
                  >
                    <div>
                      <label className="cm-label" htmlFor="cm-name">Full Name</label>
                      <input id="cm-name" name="name" type="text" required className="cm-field" placeholder="Your name" />
                    </div>
                    <div>
                      <label className="cm-label" htmlFor="cm-email">Email Address</label>
                      <input id="cm-email" name="email" type="email" required className="cm-field" placeholder="you@email.com" />
                    </div>
                    <div>
                      <label className="cm-label" htmlFor="cm-company">Company <span style={{ textTransform: "none", letterSpacing: 0, color: "rgba(255,255,255,0.35)" }}>(Optional)</span></label>
                      <input id="cm-company" name="company" type="text" className="cm-field" placeholder="Company name" />
                    </div>
                    <div>
                      <label className="cm-label" htmlFor="cm-type">Project Type</label>
                      <select id="cm-type" name="projectType" required defaultValue="" className="cm-field">
                        <option value="" disabled>Select a type</option>
                        {PROJECT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="cm-label" htmlFor="cm-budget">Budget Range</label>
                      <select id="cm-budget" name="budget" required defaultValue="" className="cm-field">
                        <option value="" disabled>Select a range</option>
                        {BUDGET_RANGES.map((b) => <option key={b} value={b}>{b}</option>)}
                      </select>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="cm-label" htmlFor="cm-message">Message</label>
                      <textarea id="cm-message" name="message" required rows={4} className="cm-field" placeholder="Tell me about your project..." style={{ resize: "vertical", minHeight: 96 }} />
                    </div>

                    {/* Buttons */}
                    <div className="sm:col-span-2 flex flex-col sm:flex-row" style={{ gap: 12, marginTop: 4 }}>
                      <motion.button
                        type="submit"
                        disabled={sending}
                        whileHover={sending ? undefined : { scale: 1.02, boxShadow: "0 10px 30px rgba(124,58,237,0.5)" }}
                        whileTap={sending ? undefined : { scale: 0.98 }}
                        transition={{ type: "spring", stiffness: 380, damping: 22 }}
                        className="inline-flex items-center justify-center"
                        style={{
                          flex: 1, gap: 8, padding: "13px 26px", borderRadius: 100, border: "none",
                          cursor: sending ? "wait" : "pointer", opacity: sending ? 0.75 : 1,
                          background: "linear-gradient(100deg, #7c3aed, #3b82f6)", color: "#fff",
                          fontSize: 13.5, fontWeight: 600, letterSpacing: "0.01em",
                        }}
                      >
                        {sending ? (
                          <>
                            <motion.span
                              aria-hidden="true"
                              animate={{ rotate: 360 }}
                              transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                              style={{
                                width: 15, height: 15, borderRadius: "50%",
                                border: "2px solid rgba(255,255,255,0.35)", borderTopColor: "#fff",
                              }}
                            />
                            Sending...
                          </>
                        ) : (
                          "Send Inquiry →"
                        )}
                      </motion.button>
                      <motion.a
                        href={waHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        whileHover={{ scale: 1.02, background: "rgba(37,211,102,0.18)" }}
                        whileTap={{ scale: 0.98 }}
                        transition={{ type: "spring", stiffness: 380, damping: 22 }}
                        className="inline-flex items-center justify-center"
                        style={{
                          flex: 1, gap: 9, padding: "13px 24px", borderRadius: 100, textDecoration: "none",
                          background: "rgba(37,211,102,0.1)", border: "1px solid rgba(37,211,102,0.4)",
                          color: "rgba(134,239,172,0.95)", fontSize: 13.5, fontWeight: 600,
                        }}
                      >
                        <IconWhatsApp /> WhatsApp Me
                      </motion.a>
                    </div>
                  </form>
              </>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>

    {/* Toast — fixed to the viewport so it stays visible after the modal closes */}
    <AnimatePresence>
      {toast && (
        <motion.div
          className="fixed left-1/2"
          initial={{ opacity: 0, y: 24, x: "-50%" }}
          animate={{ opacity: 1, y: 0, x: "-50%" }}
          exit={{ opacity: 0, y: 24, x: "-50%" }}
          transition={{ duration: 0.35, ease: EASE_OUT }}
          style={{
            bottom: "clamp(18px, 5vw, 32px)", zIndex: 110,
            width: "min(92vw, 420px)",
            display: "flex", alignItems: "center", gap: 12,
            padding: "14px 18px", borderRadius: 16,
            background: "rgba(16,14,26,0.9)",
            backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
            border: `1px solid ${toast.type === "success" ? "rgba(52,211,153,0.4)" : "rgba(248,113,113,0.4)"}`,
            boxShadow: `0 24px 60px -24px rgba(0,0,0,0.85), 0 0 30px ${toast.type === "success" ? "rgba(52,211,153,0.18)" : "rgba(248,113,113,0.18)"}`,
          }}
          role="status"
          aria-live="polite"
        >
          <span style={{
            flexShrink: 0, display: "inline-flex", alignItems: "center", justifyContent: "center",
            width: 26, height: 26, borderRadius: "50%",
            background: toast.type === "success" ? "rgba(52,211,153,0.16)" : "rgba(248,113,113,0.16)",
            color: toast.type === "success" ? "rgba(110,231,183,0.95)" : "rgba(252,165,165,0.95)",
          }}>
            {toast.type === "success" ? (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
            ) : (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="8" x2="12" y2="13" /><line x1="12" y1="16.5" x2="12" y2="16.6" /></svg>
            )}
          </span>
          <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.45, color: "rgba(255,255,255,0.88)" }}>
            {toast.text}
          </p>
        </motion.div>
      )}
    </AnimatePresence>
    </>,
    document.body,
  )
}

function ServicesSection() {
  const [contactOpen, setContactOpen] = useState(false)
  return (
    <section id="services" className="relative overflow-hidden px-8 pb-28 pt-20 lg:px-24 lg:pb-32 lg:pt-24" style={{ scrollMarginTop: 100 }}>

      <div className="relative mx-auto w-full" style={{ zIndex: 10, maxWidth: 1180 }}>

        {/* Header */}
        <div className="mx-auto text-center" style={{ maxWidth: 760 }}>
          <motion.span
            className="inline-flex items-center"
            style={{
              gap: 12, fontSize: "0.72rem", fontWeight: 500, letterSpacing: "0.34em",
              textTransform: "uppercase" as const, color: "rgba(196,181,253,0.8)",
            }}
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ duration: 0.7, ease: EASE_OUT }}
          >
            <span style={{ width: 28, height: 1, background: "rgba(196,181,253,0.4)" }} />
            Services
            <span style={{ width: 28, height: 1, background: "rgba(196,181,253,0.4)" }} />
          </motion.span>

          <motion.h2
            style={{
              margin: "1.5rem auto 0", maxWidth: 640,
              fontSize: "clamp(1.9rem, 4.4vw, 3.4rem)",
              fontWeight: 500, lineHeight: 1.1, letterSpacing: "-0.03em", color: "#ffffff",
            }}
            initial={{ opacity: 0, y: 22 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.85, ease: EASE_OUT }}
          >
            More than just marketing.
          </motion.h2>

          <motion.p
            style={{
              margin: "1.4rem auto 0", maxWidth: 600,
              fontSize: "clamp(0.9rem, 1.25vw, 1.05rem)",
              fontWeight: 300, lineHeight: 1.7, color: "rgba(255,255,255,0.42)",
            }}
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.85, delay: 0.1, ease: EASE_OUT }}
          >
            A combination of strategy, creativity, automation and digital experiences
            designed to help businesses grow, communicate and operate more effectively.
          </motion.p>
        </div>

        {/* Bento grid */}
        <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:mt-16 lg:grid-cols-6 lg:gap-5">
          {SERVICES.map((s, i) => (
            <ServiceCard key={s.num} s={s} index={i} />
          ))}
        </div>

        {/* Bottom conversion panel */}
        <motion.div
          id="contact"
          className="relative mt-8 overflow-hidden lg:mt-10"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.8, ease: EASE_OUT }}
          style={{
            scrollMarginTop: 120,
            borderRadius: 26, border: "1px solid rgba(255,255,255,0.1)",
            background: "rgba(20,18,30,0.55)", backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)",
            boxShadow: "0 30px 70px -30px rgba(0,0,0,0.85)",
            padding: "clamp(2rem, 4vw, 3.4rem)",
          }}
        >
          <div aria-hidden="true" style={{
            position: "absolute", inset: 0, borderRadius: 26, pointerEvents: "none",
            background: "radial-gradient(90% 140% at 15% 0%, rgba(99,102,241,0.14), transparent 55%), radial-gradient(90% 140% at 100% 100%, rgba(124,58,237,0.16), transparent 55%)",
          }} />
          <div className="relative flex flex-col items-center gap-7 text-center lg:flex-row lg:justify-between lg:text-left" style={{ zIndex: 1 }}>
            <div style={{ maxWidth: 560 }}>
              <h3 style={{ margin: 0, fontSize: "clamp(1.5rem, 3vw, 2.2rem)", fontWeight: 500, lineHeight: 1.12, letterSpacing: "-0.03em", color: "#ffffff" }}>
                Need something custom?
              </h3>
              <p style={{ margin: "1rem 0 0", fontSize: "clamp(0.9rem, 1.2vw, 1rem)", fontWeight: 300, lineHeight: 1.7, color: "rgba(255,255,255,0.5)" }}>
                From marketing and automation to websites and digital platforms,
                I&apos;m always open to discussing new ideas and challenges.
              </p>
            </div>

            <div className="flex shrink-0 flex-wrap items-center justify-center gap-4">
              <motion.button
                type="button"
                onClick={() => setContactOpen(true)}
                whileHover={{ scale: 1.04, boxShadow: "0 0 30px rgba(255,255,255,0.16)" }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: "spring", stiffness: 380, damping: 22 }}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  padding: "14px 30px", borderRadius: 100, background: "#ffffff", color: "#000000",
                  fontSize: 13, fontWeight: 600, letterSpacing: "0.02em", border: "none", outline: "none", cursor: "pointer",
                }}
              >
                Let&apos;s Talk →
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.04, background: "rgba(255,255,255,0.07)" }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: "spring", stiffness: 380, damping: 22 }}
                style={{
                  padding: "14px 28px", borderRadius: 100, background: "transparent", color: "rgba(255,255,255,0.8)",
                  fontSize: 13, fontWeight: 500, letterSpacing: "0.02em", border: "1px solid rgba(255,255,255,0.18)", outline: "none", cursor: "pointer",
                }}
              >
                View Resume
              </motion.button>
            </div>
          </div>
        </motion.div>

      </div>

      <ContactModal open={contactOpen} onClose={() => setContactOpen(false)} />
    </section>
  )
}

// ─── Floating navbar ──────────────────────────────────────────────────────────

const NAV_LINKS = [
  { label: "Home", id: "home", href: "/" },
  { label: "Work", id: "work", href: "/work" },
  { label: "Services", id: "services", href: "/#services" },
  { label: "Contact", id: "contact", href: "/#contact" },
] as const

const RESUME_URL = "/resume/harsh-saran-cv-2026.pdf"

function IconDownload({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v12" /><path d="M7 11l5 5 5-5" /><path d="M5 21h14" />
    </svg>
  )
}

function IconEye({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" /><circle cx="12" cy="12" r="3" />
    </svg>
  )
}

// Gradient Resume pill: click = view PDF; desktop hover reveals View / Download menu.
function ResumeMenu() {
  const [open, setOpen] = useState(false)
  return (
    <div className="relative" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <motion.a
        href={RESUME_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center"
        initial="rest"
        animate="rest"
        whileHover="hover"
        variants={{ rest: { y: 0, boxShadow: "0 6px 20px rgba(124,58,237,0.35)" }, hover: { y: -2, boxShadow: "0 10px 28px rgba(124,58,237,0.5)" } }}
        whileTap={{ scale: 0.97 }}
        transition={{ type: "spring", stiffness: 380, damping: 22 }}
        style={{
          gap: 7, padding: "10px 20px", borderRadius: 100,
          background: "linear-gradient(100deg, #7c3aed, #3b82f6)", color: "#ffffff",
          fontSize: 13, fontWeight: 600, letterSpacing: "0.01em", textDecoration: "none", whiteSpace: "nowrap",
        }}
      >
        Resume
        <motion.span
          variants={{ rest: { y: 0 }, hover: { y: 2 } }}
          transition={{ type: "spring", stiffness: 400, damping: 16 }}
          style={{ display: "inline-flex" }}
        >
          <IconDownload />
        </motion.span>
      </motion.a>

      {/* Hover menu (desktop). Touch users still get "view" from the pill tap. */}
      <AnimatePresence>
        {open && (
          <motion.div
            className="absolute right-0 hidden md:block"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: EASE_OUT }}
            // top:100% (touching the pill) + transparent paddingTop bridges the gap,
            // so moving down to the menu never triggers onMouseLeave.
            style={{ top: "100%", paddingTop: 10, zIndex: 5, minWidth: 188 }}
          >
            <div
              style={{
                padding: 8, borderRadius: 16,
                background: "rgba(10,10,20,0.9)", border: "1px solid rgba(255,255,255,0.1)",
                backdropFilter: "blur(22px)", WebkitBackdropFilter: "blur(22px)",
                boxShadow: "0 22px 55px -25px rgba(0,0,0,0.85)",
              }}
            >
              <a
                href={RESUME_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-[13px] font-medium text-white/75 transition-colors hover:bg-white/5 hover:text-white"
                style={{ textDecoration: "none" }}
              >
                <IconEye /> View Resume
              </a>
              <a
                href={RESUME_URL}
                download
                className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-[13px] font-medium text-white/75 transition-colors hover:bg-white/5 hover:text-white"
                style={{ textDecoration: "none" }}
              >
                <IconDownload /> Download Resume
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function Navbar({ show }: { show: boolean }) {
  const [scrolled, setScrolled] = useState(false)
  const [active, setActive] = useState("home")
  const [open, setOpen] = useState(false)

  // Scroll spy + glass strength (state only flips at thresholds → cheap)
  useEffect(() => {
    const ids = NAV_LINKS.map((l) => l.id)
    const onScroll = () => {
      setScrolled(window.scrollY > 30)
      const y = window.scrollY + 140
      let cur = ids[0]
      for (const id of ids) {
        const el = document.getElementById(id)
        // getBoundingClientRect → absolute doc position (offsetTop is relative to
        // the offsetParent, which is wrong for nested/positioned targets like #contact)
        if (el && el.getBoundingClientRect().top + window.scrollY <= y) cur = id
      }
      setActive(cur)
    }
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <motion.nav
      className="fixed z-40"
      style={{ top: 20, left: "50%", width: "min(94vw, 980px)" }}
      initial={{ opacity: 0, y: -20, x: "-50%" }}
      animate={show ? { opacity: 1, y: 0, x: "-50%" } : { opacity: 0, y: -20, x: "-50%" }}
      transition={{ duration: 0.8, ease: "easeOut" }}
    >
      <motion.div
        className="relative flex items-center justify-between"
        animate={{
          backgroundColor: scrolled ? "rgba(10,10,20,0.72)" : "rgba(10,10,20,0.45)",
          boxShadow: scrolled
            ? "0 18px 50px -20px rgba(0,0,0,0.7), 0 0 42px rgba(124,58,237,0.14)"
            : "0 14px 40px -22px rgba(0,0,0,0.55), 0 0 26px rgba(124,58,237,0.08)",
        }}
        transition={{ duration: 0.4, ease: EASE_OUT }}
        style={{
          height: 66, borderRadius: 24, padding: "0 14px 0 16px",
          border: `1px solid ${scrolled ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.08)"}`,
          backdropFilter: `blur(${scrolled ? 24 : 18}px)`, WebkitBackdropFilter: `blur(${scrolled ? 24 : 18}px)`,
        }}
      >
        {/* Ambient light reflection sweeping across the glass (clipped to the bar */}
        {/* only — the bar itself isn't overflow-hidden, so dropdowns aren't clipped) */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden" style={{ borderRadius: 24, zIndex: 0 }}>
          <motion.div
            className="absolute"
            style={{
              top: 0, bottom: 0, width: "45%", mixBlendMode: "screen",
              background: "radial-gradient(circle at center, rgba(139,92,246,0.18), transparent 70%)",
              filter: "blur(6px)", willChange: "left",
            }}
            animate={{ left: ["-25%", "100%"] }}
            transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>

        {/* Left — monogram */}
        <motion.a
          href="#home"
          onClick={() => setOpen(false)}
          className="relative flex items-center justify-center"
          style={{
            zIndex: 1, width: 44, height: 44, borderRadius: "50%",
            background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)",
            color: "#ffffff", fontWeight: 600, fontSize: 18, textDecoration: "none",
            boxShadow: "0 0 18px rgba(139,92,246,0.25)", flexShrink: 0,
          }}
          whileHover={{ scale: 1.07, boxShadow: "0 0 26px rgba(139,92,246,0.55)" }}
          transition={{ type: "spring", stiffness: 300, damping: 18 }}
        >
          H
        </motion.a>

        {/* Center — links (desktop) */}
        <div className="absolute left-1/2 hidden -translate-x-1/2 items-center md:flex" style={{ zIndex: 1, gap: 38 }}>
          {NAV_LINKS.map((l) => (
            <Link
              key={l.id}
              href={l.href}
              className={`relative pb-1.5 text-sm font-medium transition-colors ${active === l.id ? "text-white" : "text-white/55 hover:text-white"}`}
              style={{ textDecoration: "none" }}
            >
              {l.label}
              {active === l.id && (
                <motion.span
                  layoutId="navActiveDot"
                  style={{
                    position: "absolute", left: "50%", bottom: 0, x: "-50%",
                    width: 5, height: 5, borderRadius: "50%",
                    background: "linear-gradient(90deg, #a78bfa, #60a5fa)",
                    boxShadow: "0 0 8px rgba(139,92,246,0.85)",
                  }}
                />
              )}
            </Link>
          ))}
        </div>

        {/* Right — resume + hamburger */}
        <div className="relative flex items-center" style={{ zIndex: 1, gap: 10 }}>
          <ResumeMenu />

          {/* Hamburger (mobile) */}
          <button
            type="button"
            aria-label="Toggle menu"
            onClick={() => setOpen((o) => !o)}
            className="relative md:hidden"
            style={{ width: 40, height: 40, background: "none", border: "none", cursor: "pointer", flexShrink: 0 }}
          >
            <motion.span
              animate={open ? { rotate: 45, y: 0 } : { rotate: 0, y: -4 }}
              transition={{ duration: 0.3, ease: EASE_OUT }}
              style={{ position: "absolute", left: 11, right: 11, top: "50%", height: 1.6, borderRadius: 2, background: "rgba(255,255,255,0.85)" }}
            />
            <motion.span
              animate={open ? { rotate: -45, y: 0 } : { rotate: 0, y: 4 }}
              transition={{ duration: 0.3, ease: EASE_OUT }}
              style={{ position: "absolute", left: 11, right: 11, top: "50%", height: 1.6, borderRadius: 2, background: "rgba(255,255,255,0.85)" }}
            />
          </button>
        </div>

      </motion.div>

      {/* Mobile dropdown — sibling of the bar so the bar's overflow:hidden doesn't clip it */}
      <AnimatePresence>
        {open && (
          <motion.div
            className="absolute left-0 right-0 md:hidden"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: EASE_OUT }}
            style={{
              top: "calc(100% + 10px)", zIndex: 2, padding: 12, borderRadius: 20,
              background: "rgba(10,10,20,0.85)", border: "1px solid rgba(255,255,255,0.1)",
              backdropFilter: "blur(22px)", WebkitBackdropFilter: "blur(22px)",
              boxShadow: "0 22px 55px -25px rgba(0,0,0,0.85)",
            }}
          >
            {NAV_LINKS.map((l) => (
              <Link
                key={l.id}
                href={l.href}
                onClick={() => setOpen(false)}
                className={`block rounded-xl px-4 py-3 text-sm font-medium transition-colors ${active === l.id ? "bg-white/5 text-white" : "text-white/60 hover:text-white"}`}
                style={{ textDecoration: "none" }}
              >
                {l.label}
              </Link>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  )
}

// ─── Page: kinetic words → hero story → about ─────────────────────────────────

export default function Home() {
  const [wordIndex, setWordIndex] = useState(0)
  const [introVisible, setIntroVisible] = useState(true)
  const [ready, setReady] = useState(false)
  // Hero choreography (after loader): 1 name · 2 portrait rises · 3 name→behind · 4 content+navbar
  const [heroStage, setHeroStage] = useState(0)

  useEffect(() => {
    if (!ready) return
    setHeroStage(1)
    const t2 = setTimeout(() => setHeroStage(2), 1500) // portrait rises after the name lands
    const t3 = setTimeout(() => setHeroStage(3), 3100) // name slips behind once it settles
    const t4 = setTimeout(() => setHeroStage(4), 3800) // navbar + hero content
    return () => { clearTimeout(t2); clearTimeout(t3); clearTimeout(t4) }
  }, [ready])

  useEffect(() => {
    if (!introVisible) return
    const isLast = wordIndex === KINETIC_WORDS.length - 1
    const t = setTimeout(
      () => (isLast ? setIntroVisible(false) : setWordIndex((i) => i + 1)),
      isLast ? 850 : 680,
    )
    return () => clearTimeout(t)
  }, [wordIndex, introVisible])

  return (
    <>
      <GlobalBackground />
      <CustomCursor />
      <Navbar show={heroStage >= 4} />

      {/* Mounted from the start so the portrait preloads; revealed when ready */}
      <main className="relative" style={{ zIndex: 1 }}>
        <HeroComposition stage={heroStage} />
        <AboutSection />
        <SelectedWork />
        <HowIWork />
        <ToolsCapabilities />
        <ServicesSection />
      </main>

      {/* ── Kinetic word intro overlay ── */}
      <AnimatePresence onExitComplete={() => setReady(true)}>
        {introVisible && (
          <motion.div
            key="intro"
            className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-black"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 1.0, ease: [0.43, 0.13, 0.23, 0.96] } }}
          >
            <Atmosphere />
            <div className="pointer-events-none absolute inset-x-0 top-0" style={{
              height: "45%",
              background: "linear-gradient(180deg, rgba(99,102,241,0.05) 0%, transparent 100%)",
            }} />
            <AnimatePresence>
              <motion.h1
                key={wordIndex}
                className="absolute inset-0 flex select-none items-center justify-center px-8 text-center font-thin uppercase leading-none text-white"
                style={{
                  fontSize: "clamp(2rem, 7vw, 7rem)",
                  letterSpacing: "0.28em",
                  textShadow: "0 0 80px rgba(255,255,255,0.2), 0 0 30px rgba(139,92,246,0.1)",
                }}
                initial={{ opacity: 0, filter: "blur(22px)", scale: 1.04 }}
                animate={{ opacity: 1, filter: "blur(0px)", scale: 1, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } }}
                exit={{ opacity: 0, filter: "blur(14px)", scale: 0.98, transition: { duration: 0.34, ease: [0.55, 0, 1, 0.45] } }}
              >
                {KINETIC_WORDS[wordIndex]}
              </motion.h1>
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
