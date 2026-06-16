"use client"

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  createContext,
  useContext,
} from "react"
import type { CSSProperties, ReactNode } from "react"
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useSpring,
  useTransform,
  useScroll,
} from "framer-motion"
import Image from "next/image"
import Link from "next/link"

// ─── Tokens ───────────────────────────────────────────────────────────────────

const EASE = [0.22, 1, 0.36, 1] as const

// Encode media paths (many asset filenames contain spaces / parentheses)
const enc = (p: string) => encodeURI(p)

const NOISE_URI = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.82' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='400' height='400' filter='url(%23n)'/%3E%3C/svg%3E")`

const RESUME_URL = "/resume/Harsh-Saran-CV-2026.pdf"

const glass: CSSProperties = {
  background: "rgba(18,16,28,0.5)",
  border: "1px solid rgba(255,255,255,0.09)",
  backdropFilter: "blur(14px)",
  WebkitBackdropFilter: "blur(14px)",
  boxShadow: "0 22px 55px -28px rgba(0,0,0,0.85), 0 0 26px rgba(124,58,237,0.08)",
}

const tagPill: CSSProperties = {
  fontSize: 11, fontWeight: 500, letterSpacing: "0.04em",
  color: "rgba(255,255,255,0.62)", padding: "6px 13px", borderRadius: 100,
  border: "1px solid rgba(255,255,255,0.1)", background: "rgba(14,12,24,0.6)",
  whiteSpace: "nowrap",
}

const eyebrowChip: CSSProperties = {
  display: "inline-block", padding: "4px 11px", borderRadius: 100,
  border: "1px solid rgba(139,92,246,0.3)", background: "rgba(139,92,246,0.1)",
  fontSize: 9.5, fontWeight: 500, letterSpacing: "0.14em", textTransform: "uppercase",
  color: "rgba(196,181,253,0.92)",
}

// ─── Lightbox / media modal (shared via context) ──────────────────────────────

interface MediaItem {
  type: "image" | "video"
  src: string
  title?: string
  ratio?: string
}

const MediaCtx = createContext<(m: MediaItem) => void>(() => {})
const useOpenMedia = () => useContext(MediaCtx)

function MediaModal({ media, onClose }: { media: MediaItem; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    window.addEventListener("keydown", onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      window.removeEventListener("keydown", onKey)
      document.body.style.overflow = prev
    }
  }, [onClose])

  return (
    <motion.div
      className="fixed inset-0 z-[120] flex items-center justify-center p-5 sm:p-10"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      onClick={onClose}
      style={{ background: "rgba(3,4,12,0.82)", backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)" }}
    >
      {/* Close */}
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute right-5 top-5 flex items-center justify-center"
        style={{
          width: 44, height: 44, borderRadius: "50%", zIndex: 2,
          background: "rgba(20,18,30,0.7)", border: "1px solid rgba(255,255,255,0.14)",
          color: "rgba(255,255,255,0.85)", cursor: "pointer",
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round">
          <path d="M5 5l14 14M19 5L5 19" />
        </svg>
      </button>

      <motion.div
        onClick={(e) => e.stopPropagation()}
        initial={{ scale: 0.94, opacity: 0, y: 18 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.96, opacity: 0 }}
        transition={{ duration: 0.4, ease: EASE }}
        className="relative w-full"
        style={{
          maxWidth: media.type === "video" ? 1100 : 1180, maxHeight: "88vh",
          borderRadius: 20, overflow: "hidden",
          border: "1px solid rgba(255,255,255,0.12)",
          boxShadow: "0 50px 120px -30px rgba(0,0,0,0.9), 0 0 70px rgba(124,58,237,0.18)",
        }}
      >
        {media.type === "video" ? (
          <video
            src={enc(media.src)}
            controls
            autoPlay
            playsInline
            style={{ display: "block", width: "100%", maxHeight: "88vh", background: "#05060f" }}
          />
        ) : (
          <div style={{ position: "relative", width: "100%", maxHeight: "88vh", background: "#05060f" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={enc(media.src)}
              alt={media.title || ""}
              style={{ display: "block", width: "100%", height: "auto", maxHeight: "88vh", objectFit: "contain" }}
            />
          </div>
        )}
        {media.title && (
          <div style={{
            position: "absolute", left: 0, right: 0, bottom: 0, padding: "26px 22px 16px",
            background: "linear-gradient(0deg, rgba(3,4,12,0.85), transparent)",
            fontSize: 13, fontWeight: 500, letterSpacing: "0.02em", color: "rgba(255,255,255,0.85)",
            pointerEvents: "none",
          }}>
            {media.title}
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}

// ─── Continuous immersive background ──────────────────────────────────────────

interface Particle { left: string; top: string; size: number; drift: number; dur: number; delay: number; op: number }
const PARTICLES: Particle[] = [
  { left: "8%", top: "22%", size: 3, drift: 24, dur: 11, delay: 0, op: 0.1 },
  { left: "18%", top: "68%", size: 2, drift: 18, dur: 14, delay: 1.2, op: 0.08 },
  { left: "27%", top: "40%", size: 4, drift: 30, dur: 13, delay: 0.5, op: 0.07 },
  { left: "39%", top: "78%", size: 2, drift: 20, dur: 16, delay: 2.0, op: 0.09 },
  { left: "47%", top: "16%", size: 3, drift: 26, dur: 12, delay: 0.8, op: 0.08 },
  { left: "58%", top: "60%", size: 2, drift: 22, dur: 15, delay: 1.6, op: 0.07 },
  { left: "66%", top: "30%", size: 4, drift: 28, dur: 13, delay: 0.3, op: 0.1 },
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
            background: "rgba(216,180,254,0.9)", boxShadow: "0 0 6px rgba(139,92,246,0.5)",
          }}
          animate={{ y: [0, -p.drift, 0], opacity: [p.op, p.op * 2.2, p.op] }}
          transition={{ duration: p.dur, delay: p.delay, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
    </div>
  )
}

function WorkBackground() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 overflow-hidden" style={{ zIndex: 0, background: "#050816" }}>
      <motion.div className="absolute rounded-full" style={{ width: "52vw", height: "52vw", top: "-12%", left: "-10%", background: "radial-gradient(circle, rgba(59,130,246,0.1) 0%, transparent 70%)", filter: "blur(110px)", willChange: "transform" }} animate={{ x: [0, 40, -20, 0], y: [0, 30, -25, 0] }} transition={{ duration: 26, repeat: Infinity, ease: "easeInOut" }} />
      <motion.div className="absolute rounded-full" style={{ width: "46vw", height: "46vw", top: "26%", right: "-12%", background: "radial-gradient(circle, rgba(124,58,237,0.11) 0%, transparent 70%)", filter: "blur(120px)", willChange: "transform" }} animate={{ x: [0, -32, 20, 0], y: [0, -26, 30, 0] }} transition={{ duration: 30, repeat: Infinity, ease: "easeInOut", delay: 3 }} />
      <motion.div className="absolute rounded-full" style={{ width: "40vw", height: "40vw", bottom: "-10%", left: "20%", background: "radial-gradient(circle, rgba(139,92,246,0.09) 0%, transparent 70%)", filter: "blur(110px)", willChange: "transform" }} animate={{ x: [0, 26, -16, 0], y: [0, -20, 16, 0] }} transition={{ duration: 28, repeat: Infinity, ease: "easeInOut", delay: 1.5 }} />
      <motion.div className="absolute rounded-full" style={{ width: "34vw", height: "34vw", top: "58%", left: "-8%", background: "radial-gradient(circle, rgba(37,99,235,0.08) 0%, transparent 70%)", filter: "blur(100px)", willChange: "transform" }} animate={{ x: [0, 28, 0], y: [0, 20, 0] }} transition={{ duration: 24, repeat: Infinity, ease: "easeInOut", delay: 2 }} />

      {/* Subtle grid texture */}
      <div className="absolute inset-0" style={{
        backgroundImage: [
          "linear-gradient(rgba(120,130,255,0.025) 1px, transparent 1px)",
          "linear-gradient(90deg, rgba(120,130,255,0.025) 1px, transparent 1px)",
        ].join(", "),
        backgroundSize: "80px 80px",
        maskImage: "radial-gradient(ellipse 110% 100% at 50% 30%, #000 55%, transparent 100%)",
        WebkitMaskImage: "radial-gradient(ellipse 110% 100% at 50% 30%, #000 55%, transparent 100%)",
      }} />

      <Particles />

      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 90% 70% at 50% 0%, rgba(99,102,241,0.06), transparent 60%)" }} />
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 80% 80% at 50% 50%, transparent 55%, rgba(2,4,12,0.55) 100%)" }} />
      {/* Faint film grain */}
      <div className="absolute inset-0" style={{ opacity: 0.022, backgroundImage: NOISE_URI, backgroundSize: "300px 300px" }} />
    </div>
  )
}

// ─── Custom cursor ────────────────────────────────────────────────────────────

function CustomCursor() {
  const rawX = useMotionValue(-100)
  const rawY = useMotionValue(-100)
  const sx = useSpring(rawX, { stiffness: 1200, damping: 50, mass: 0.3 })
  const sy = useSpring(rawY, { stiffness: 1200, damping: 50, mass: 0.3 })
  const x = useTransform(sx, (v) => v - 10)
  const y = useTransform(sy, (v) => v - 10)

  useEffect(() => {
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches
    if (!fine) return
    document.documentElement.style.cursor = "none"
    const onMove = (e: MouseEvent) => { rawX.set(e.clientX); rawY.set(e.clientY) }
    window.addEventListener("mousemove", onMove)
    return () => {
      window.removeEventListener("mousemove", onMove)
      document.documentElement.style.cursor = ""
    }
  }, [rawX, rawY])

  return (
    <motion.div className="pointer-events-none fixed z-[200] hidden md:block" style={{ x, y, top: 0, left: 0 }}>
      <div style={{ position: "absolute", width: 44, height: 44, borderRadius: "50%", top: -12, left: -12, background: "radial-gradient(circle, rgba(139,92,246,0.26) 0%, rgba(99,102,241,0.08) 55%, transparent 70%)", filter: "blur(8px)" }} />
      <div style={{ width: 20, height: 20, borderRadius: "50%", background: "radial-gradient(circle, rgba(216,180,254,0.95) 0%, rgba(139,92,246,0.65) 60%, transparent 100%)", filter: "blur(1.5px)", boxShadow: "0 0 10px rgba(139,92,246,0.45)" }} />
    </motion.div>
  )
}

// ─── Navbar ───────────────────────────────────────────────────────────────────

const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "Work", href: "/work" },
  { label: "Services", href: "/#services" },
  { label: "Contact", href: "/#contact" },
] as const

function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <motion.nav
      className="fixed z-[90]"
      style={{ top: 20, left: "50%", width: "min(94vw, 980px)" }}
      initial={{ opacity: 0, y: -20, x: "-50%" }}
      animate={{ opacity: 1, y: 0, x: "-50%" }}
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
        transition={{ duration: 0.4, ease: EASE }}
        style={{
          height: 66, borderRadius: 24, padding: "0 14px 0 16px",
          border: `1px solid ${scrolled ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.08)"}`,
          backdropFilter: `blur(${scrolled ? 24 : 18}px)`, WebkitBackdropFilter: `blur(${scrolled ? 24 : 18}px)`,
        }}
      >
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden" style={{ borderRadius: 24, zIndex: 0 }}>
          <motion.div
            className="absolute"
            style={{ top: 0, bottom: 0, width: "45%", mixBlendMode: "screen", background: "radial-gradient(circle at center, rgba(139,92,246,0.18), transparent 70%)", filter: "blur(6px)", willChange: "left" }}
            animate={{ left: ["-25%", "100%"] }}
            transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>

        <Link href="/" className="relative flex items-center justify-center" style={{ zIndex: 1, width: 44, height: 44, borderRadius: "50%", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "#fff", fontWeight: 600, fontSize: 18, textDecoration: "none", boxShadow: "0 0 18px rgba(139,92,246,0.25)", flexShrink: 0 }}>
          H
        </Link>

        <div className="absolute left-1/2 hidden -translate-x-1/2 items-center md:flex" style={{ zIndex: 1, gap: 38 }}>
          {NAV_LINKS.map((l) => {
            const active = l.label === "Work"
            return (
              <Link key={l.label} href={l.href} className={`relative pb-1.5 text-sm font-medium transition-colors ${active ? "text-white" : "text-white/55 hover:text-white"}`} style={{ textDecoration: "none" }}>
                {l.label}
                {active && (
                  <span style={{ position: "absolute", left: "50%", bottom: 0, transform: "translateX(-50%)", width: 5, height: 5, borderRadius: "50%", background: "linear-gradient(90deg, #a78bfa, #60a5fa)", boxShadow: "0 0 8px rgba(139,92,246,0.85)" }} />
                )}
              </Link>
            )
          })}
        </div>

        <div className="relative flex items-center" style={{ zIndex: 1, gap: 10 }}>
          <motion.a
            href={RESUME_URL} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center"
            whileHover={{ y: -2, boxShadow: "0 10px 28px rgba(124,58,237,0.5)" }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: "spring", stiffness: 380, damping: 22 }}
            style={{ gap: 7, padding: "10px 20px", borderRadius: 100, background: "linear-gradient(100deg, #7c3aed, #3b82f6)", color: "#fff", fontSize: 13, fontWeight: 600, textDecoration: "none", whiteSpace: "nowrap", boxShadow: "0 6px 20px rgba(124,58,237,0.35)" }}
          >
            Resume
          </motion.a>
          <button type="button" aria-label="Toggle menu" onClick={() => setOpen((o) => !o)} className="relative md:hidden" style={{ width: 40, height: 40, background: "none", border: "none", cursor: "pointer", flexShrink: 0 }}>
            <motion.span animate={open ? { rotate: 45, y: 0 } : { rotate: 0, y: -4 }} transition={{ duration: 0.3, ease: EASE }} style={{ position: "absolute", left: 11, right: 11, top: "50%", height: 1.6, borderRadius: 2, background: "rgba(255,255,255,0.85)" }} />
            <motion.span animate={open ? { rotate: -45, y: 0 } : { rotate: 0, y: 4 }} transition={{ duration: 0.3, ease: EASE }} style={{ position: "absolute", left: 11, right: 11, top: "50%", height: 1.6, borderRadius: 2, background: "rgba(255,255,255,0.85)" }} />
          </button>
        </div>
      </motion.div>

      <AnimatePresence>
        {open && (
          <motion.div
            className="absolute left-0 right-0 md:hidden"
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: EASE }}
            style={{ top: "calc(100% + 10px)", zIndex: 2, padding: 12, borderRadius: 20, background: "rgba(10,10,20,0.85)", border: "1px solid rgba(255,255,255,0.1)", backdropFilter: "blur(22px)", WebkitBackdropFilter: "blur(22px)", boxShadow: "0 22px 55px -25px rgba(0,0,0,0.85)" }}
          >
            {NAV_LINKS.map((l) => (
              <Link key={l.label} href={l.href} onClick={() => setOpen(false)} className={`block rounded-xl px-4 py-3 text-sm font-medium transition-colors ${l.label === "Work" ? "bg-white/5 text-white" : "text-white/60 hover:text-white"}`} style={{ textDecoration: "none" }}>
                {l.label}
              </Link>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  )
}

// ─── Small shared bits ────────────────────────────────────────────────────────

function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <motion.span
      className="inline-flex items-center"
      style={{ gap: 12, fontSize: "0.7rem", fontWeight: 500, letterSpacing: "0.32em", textTransform: "uppercase", color: "rgba(196,181,253,0.8)" }}
      initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.6 }} transition={{ duration: 0.7, ease: EASE }}
    >
      <span style={{ width: 26, height: 1, background: "rgba(196,181,253,0.4)" }} />
      {children}
      <span style={{ width: 26, height: 1, background: "rgba(196,181,253,0.4)" }} />
    </motion.span>
  )
}

function Reveal({ children, delay = 0, y = 26, className, style }: { children: ReactNode; delay?: number; y?: number; className?: string; style?: CSSProperties }) {
  return (
    <motion.div
      className={className}
      style={style}
      initial={{ opacity: 0, y, filter: "blur(8px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.75, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  )
}

// Section heading: small label + a two-line statement
function BlockTitle({ label, children, light }: { label: string; children: ReactNode; light?: boolean }) {
  return (
    <div>
      <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(167,139,250,0.7)" }}>{label}</span>
      <h3 style={{ margin: "12px 0 0", fontSize: "clamp(1.3rem, 2.6vw, 2rem)", fontWeight: 500, lineHeight: 1.18, letterSpacing: "-0.02em", color: light ? "rgba(255,255,255,0.55)" : "#fff" }}>
        {children}
      </h3>
    </div>
  )
}

// Parallax image frame — click opens lightbox
function ParallaxFrame({ src, alt, ratio = "16 / 10", priority, rounded = 22, title }: { src: string; alt: string; ratio?: string; priority?: boolean; rounded?: number; title?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const openMedia = useOpenMedia()
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] })
  const y = useTransform(scrollYProgress, [0, 1], ["-9%", "9%"])
  const [hover, setHover] = useState(false)

  return (
    <motion.div
      ref={ref}
      onClick={() => openMedia({ type: "image", src, title: title || alt })}
      onHoverStart={() => setHover(true)}
      onHoverEnd={() => setHover(false)}
      initial={{ opacity: 0, filter: "blur(12px)", scale: 0.985 }}
      whileInView={{ opacity: 1, filter: "blur(0px)", scale: 1 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.9, ease: EASE }}
      className="group relative w-full cursor-pointer overflow-hidden"
      style={{
        aspectRatio: ratio, borderRadius: rounded, border: "1px solid rgba(255,255,255,0.1)",
        boxShadow: hover ? "0 44px 100px -32px rgba(0,0,0,0.85), 0 0 60px rgba(124,58,237,0.26)" : "0 30px 80px -34px rgba(0,0,0,0.8), 0 0 36px rgba(124,58,237,0.12)",
        transition: "box-shadow 0.5s",
      }}
    >
      <motion.div style={{ position: "absolute", left: 0, right: 0, top: "-9%", bottom: "-9%", y }}>
        <motion.div className="absolute inset-0" animate={{ scale: hover ? 1.04 : 1 }} transition={{ duration: 0.6, ease: EASE }}>
          <Image src={enc(src)} alt={alt} fill priority={priority} sizes="(max-width: 1024px) 92vw, 60vw" className="object-cover object-top" />
        </motion.div>
      </motion.div>
      <div className="pointer-events-none absolute inset-0" style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.05), transparent 45%, rgba(124,58,237,0.1))" }} />
      {/* expand hint */}
      <motion.div className="pointer-events-none absolute right-4 top-4 flex items-center" animate={{ opacity: hover ? 1 : 0, y: hover ? 0 : -4 }} transition={{ duration: 0.3 }} style={{ gap: 7, padding: "6px 12px", borderRadius: 100, background: "rgba(10,10,20,0.7)", border: "1px solid rgba(255,255,255,0.14)", fontSize: 11, fontWeight: 500, color: "rgba(255,255,255,0.85)" }}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" /></svg>
        Expand
      </motion.div>
    </motion.div>
  )
}

// Snapshot cards (Industry / Role / Platform / Focus)
function Snapshots({ items }: { items: { k: string; v: string }[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      {items.map((it, i) => (
        <motion.div
          key={it.k}
          initial={{ opacity: 0, y: 22 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.4 }} transition={{ duration: 0.6, delay: i * 0.08, ease: EASE }}
          whileHover={{ y: -5 }}
          style={{ ...glass, borderRadius: 18, padding: "18px 18px 20px" }}
        >
          <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.16em", textTransform: "uppercase", color: "rgba(167,139,250,0.6)" }}>{it.k}</div>
          <div style={{ marginTop: 9, fontSize: "0.98rem", fontWeight: 500, lineHeight: 1.3, color: "rgba(255,255,255,0.9)" }}>{it.v}</div>
        </motion.div>
      ))}
    </div>
  )
}

// Gallery — masonry-ish responsive grid of thumbnails (images + videos)
function Gallery({ items, label = "Gallery", title }: { items: MediaItem[]; label?: string; title?: ReactNode }) {
  const openMedia = useOpenMedia()
  return (
    <div>
      <Reveal>
        <BlockTitle label={label}>{title || "Selected screens"}</BlockTitle>
      </Reveal>
      <div className="mt-7 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
        {items.map((m, i) => (
          <motion.button
            key={m.src + i}
            type="button"
            onClick={() => openMedia(m)}
            initial={{ opacity: 0, y: 26, filter: "blur(8px)" }}
            whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.7, delay: (i % 3) * 0.08, ease: EASE }}
            whileHover={{ y: -6 }}
            className="group relative overflow-hidden"
            style={{
              aspectRatio: m.ratio || "4 / 3", borderRadius: 16, border: "1px solid rgba(255,255,255,0.1)",
              background: "rgba(10,10,20,0.5)", cursor: "pointer", padding: 0,
              boxShadow: "0 20px 50px -30px rgba(0,0,0,0.8)",
            }}
          >
            <div className="absolute inset-0 transition-transform duration-500 group-hover:scale-[1.06]">
              <Image
                src={enc(m.type === "video" && m.title ? m.src.replace(/\.(mp4|webm)$/i, ".png") : m.src)}
                alt={m.title || ""}
                fill
                sizes="(max-width: 1024px) 45vw, 30vw"
                className="object-cover object-top"
                // For videos we still pass a poster image path; if missing it just fails silently
                style={m.type === "video" ? { opacity: 0.92 } : undefined}
              />
            </div>
            <div className="pointer-events-none absolute inset-0" style={{ background: "linear-gradient(180deg, transparent 50%, rgba(5,8,22,0.78))" }} />
            {m.type === "video" && (
              <div className="absolute inset-0 flex items-center justify-center">
                <motion.div className="flex items-center justify-center" whileHover={{ scale: 1.12 }} style={{ width: 52, height: 52, borderRadius: "50%", background: "rgba(124,58,237,0.55)", border: "1px solid rgba(255,255,255,0.3)", boxShadow: "0 0 30px rgba(124,58,237,0.5)", backdropFilter: "blur(4px)" }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff"><path d="M8 5v14l11-7z" /></svg>
                </motion.div>
              </div>
            )}
            {m.title && (
              <div className="pointer-events-none absolute bottom-0 left-0 right-0 px-3 py-2.5 text-left" style={{ fontSize: 11, fontWeight: 500, color: "rgba(255,255,255,0.82)" }}>
                {m.title}
              </div>
            )}
          </motion.button>
        ))}
      </div>
    </div>
  )
}

// Video showcase — large cinematic poster that opens the lightbox
function VideoShowcase({ src, poster, title, label = "Video Showcase", ratio = "16 / 9" }: { src: string; poster: string; title: string; label?: string; ratio?: string }) {
  const openMedia = useOpenMedia()
  const [hover, setHover] = useState(false)
  return (
    <div>
      <Reveal><BlockTitle label={label}>{title}</BlockTitle></Reveal>
      <motion.button
        type="button"
        onClick={() => openMedia({ type: "video", src, title })}
        onHoverStart={() => setHover(true)} onHoverEnd={() => setHover(false)}
        initial={{ opacity: 0, scale: 0.98, filter: "blur(10px)" }}
        whileInView={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
        viewport={{ once: true, amount: 0.25 }}
        transition={{ duration: 0.9, ease: EASE }}
        className="relative mt-7 w-full overflow-hidden"
        style={{
          aspectRatio: ratio, borderRadius: 22, border: "1px solid rgba(255,255,255,0.12)", cursor: "pointer", padding: 0,
          boxShadow: hover ? "0 50px 110px -34px rgba(0,0,0,0.88), 0 0 70px rgba(124,58,237,0.3)" : "0 34px 90px -36px rgba(0,0,0,0.82), 0 0 40px rgba(124,58,237,0.14)",
          transition: "box-shadow 0.5s",
        }}
      >
        <motion.div className="absolute inset-0" animate={{ scale: hover ? 1.05 : 1 }} transition={{ duration: 0.6, ease: EASE }}>
          <Image src={enc(poster)} alt={title} fill sizes="(max-width: 1024px) 92vw, 60vw" className="object-cover object-top" />
        </motion.div>
        <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(5,8,22,0.2), rgba(5,8,22,0.55))" }} />
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div animate={{ scale: hover ? 1.1 : 1 }} transition={{ type: "spring", stiffness: 260, damping: 18 }} className="relative flex items-center justify-center" style={{ width: 84, height: 84, borderRadius: "50%", background: "rgba(124,58,237,0.5)", border: "1px solid rgba(255,255,255,0.32)", boxShadow: "0 0 50px rgba(124,58,237,0.55)", backdropFilter: "blur(6px)" }}>
            <motion.span className="absolute inset-0 rounded-full" style={{ border: "1px solid rgba(167,139,250,0.5)" }} animate={{ scale: [1, 1.45], opacity: [0.6, 0] }} transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }} />
            <svg width="28" height="28" viewBox="0 0 24 24" fill="#fff" style={{ marginLeft: 4 }}><path d="M8 5v14l11-7z" /></svg>
          </motion.div>
        </div>
        <div className="absolute left-5 top-5" style={eyebrowChip}>Play Reel</div>
      </motion.button>
    </div>
  )
}

// ─── Project shell ────────────────────────────────────────────────────────────

function ProjectShell({ id, num, title, category, heroSrc, accent, children }: {
  id: string; num: string; title: string; category: string; heroSrc: string; accent: string; children: ReactNode
}) {
  return (
    <section id={id} className="relative px-6 sm:px-8 lg:px-24" style={{ scrollMarginTop: 90, paddingTop: "clamp(5rem, 11vw, 9rem)", paddingBottom: "clamp(3rem, 7vw, 6rem)" }}>
      {/* oversized index number */}
      <span aria-hidden="true" className="pointer-events-none absolute select-none" style={{
        right: "2%", top: "2%", zIndex: 0, fontSize: "clamp(9rem, 26vw, 26rem)", fontWeight: 800,
        lineHeight: 1, letterSpacing: "-0.05em", color: "rgba(180,165,255,0.035)",
      }}>{num}</span>

      <div className="relative mx-auto w-full" style={{ zIndex: 1, maxWidth: 1180 }}>
        {/* Header */}
        <div className="flex flex-col gap-4">
          <Reveal>
            <div className="flex items-center gap-4">
              <span style={{ fontFamily: "var(--font-mono, monospace)", fontSize: 13, fontWeight: 600, letterSpacing: "0.1em", color: accent }}>{num}</span>
              <span style={{ height: 1, flex: 1, maxWidth: 70, background: `linear-gradient(90deg, ${accent}, transparent)` }} />
              <span style={eyebrowChip}>{category}</span>
            </div>
          </Reveal>
          <Reveal delay={0.05}>
            <h2 style={{ margin: 0, fontSize: "clamp(2.4rem, 8vw, 6rem)", fontWeight: 600, lineHeight: 0.95, letterSpacing: "-0.04em", color: "#fff", textShadow: "0 0 50px rgba(99,102,241,0.14)" }}>
              {title}
            </h2>
          </Reveal>
        </div>

        {/* Hero */}
        <div className="mt-10 lg:mt-12">
          <ParallaxFrame src={heroSrc} alt={`${title} hero`} ratio="16 / 9" title={`${title} — Hero`} />
        </div>

        {/* Body */}
        <div className="mt-12 flex flex-col gap-14 lg:mt-16 lg:gap-20">
          {children}
        </div>
      </div>
    </section>
  )
}

// Two-up overview: punchy statement + supporting body, plus role/tools meta
function OverviewRow({ statement, body, meta }: { statement: ReactNode; body: string; meta?: { label: string; values: string[] }[] }) {
  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-12">
      <Reveal className="lg:col-span-5">
        <BlockTitle label="Project Overview">{statement}</BlockTitle>
      </Reveal>
      <div className="lg:col-span-7">
        <Reveal delay={0.08}>
          <p style={{ margin: 0, fontSize: "clamp(0.95rem, 1.3vw, 1.1rem)", fontWeight: 300, lineHeight: 1.75, color: "rgba(255,255,255,0.55)" }}>{body}</p>
        </Reveal>
        {meta && (
          <Reveal delay={0.16}>
            <div className="mt-8 flex flex-wrap gap-x-12 gap-y-7">
              {meta.map((m) => (
                <div key={m.label}>
                  <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.16em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)" }}>{m.label}</div>
                  <div className="mt-2.5 flex flex-wrap gap-2">
                    {m.values.map((v) => <span key={v} style={tagPill}>{v}</span>)}
                  </div>
                </div>
              ))}
            </div>
          </Reveal>
        )}
      </div>
    </div>
  )
}

// Segmented feature blocks (CLMS / KB) — visual, short
function FeatureBlocks({ label, title, blocks }: { label: string; title: ReactNode; blocks: { k: string; t: string; d: string }[] }) {
  return (
    <div>
      <Reveal><BlockTitle label={label}>{title}</BlockTitle></Reveal>
      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {blocks.map((b, i) => (
          <motion.div
            key={b.t}
            initial={{ opacity: 0, y: 26 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.3 }} transition={{ duration: 0.6, delay: i * 0.07, ease: EASE }}
            whileHover={{ y: -6 }}
            className="relative overflow-hidden"
            style={{ ...glass, borderRadius: 20, padding: "24px 22px", minHeight: 168 }}
          >
            <span style={{ fontFamily: "var(--font-mono, monospace)", fontSize: 12, fontWeight: 600, color: "rgba(167,139,250,0.6)" }}>{b.k}</span>
            <h4 style={{ margin: "14px 0 0", fontSize: "1.1rem", fontWeight: 600, letterSpacing: "-0.01em", color: "#fff" }}>{b.t}</h4>
            <p style={{ margin: "9px 0 0", fontSize: 13.5, lineHeight: 1.6, color: "rgba(255,255,255,0.48)" }}>{b.d}</p>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

// ─── Hero intro ───────────────────────────────────────────────────────────────

function HeroIntro() {
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] })
  const wordY = useTransform(scrollYProgress, [0, 1], ["0%", "-30%"])
  const wordOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0])

  return (
    <section ref={ref} className="relative flex min-h-[92vh] flex-col items-center justify-center overflow-hidden px-6 text-center sm:px-8" style={{ paddingTop: "8rem", paddingBottom: "4rem" }}>
      {/* oversized ghost word */}
      <motion.span aria-hidden="true" className="pointer-events-none absolute select-none" style={{
        top: "44%", left: "50%", transform: "translate(-50%,-50%)", y: wordY, opacity: wordOpacity,
        fontSize: "clamp(7rem, 34vw, 34rem)", fontWeight: 800, letterSpacing: "-0.05em", lineHeight: 1,
        color: "transparent", WebkitTextStroke: "1px rgba(255,255,255,0.045)", whiteSpace: "nowrap", zIndex: 0,
      }}>WORK</motion.span>

      {/* local accent glows (part of the one continuous environment, just brighter here) */}
      <motion.div aria-hidden className="pointer-events-none absolute rounded-full" style={{ width: "40vw", height: "40vw", top: "6%", left: "8%", background: "radial-gradient(circle, rgba(124,58,237,0.14), transparent 70%)", filter: "blur(100px)", zIndex: 0 }} animate={{ x: [0, 30, 0], y: [0, 20, 0] }} transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }} />

      <div className="relative" style={{ zIndex: 2, maxWidth: 920 }}>
        <Eyebrow>Work</Eyebrow>

        <h1 className="mx-auto" style={{ margin: "1.8rem auto 0", maxWidth: 880 }}>
          {["Ideas are easy.", "Making them real is where", "things get interesting."].map((line, i) => (
            <motion.span key={line} style={{ display: "block", overflow: "hidden", paddingBottom: "0.1em" }} initial="hidden" animate="show">
              <motion.span
                variants={{ hidden: { y: "110%" }, show: { y: 0 } }}
                transition={{ delay: 0.2 + i * 0.13, duration: 0.95, ease: EASE }}
                style={{
                  display: "block", fontSize: "clamp(2rem, 6.4vw, 4.8rem)", fontWeight: 600, lineHeight: 1.04,
                  letterSpacing: "-0.04em", color: i === 0 ? "#fff" : "rgba(255,255,255,0.92)",
                }}
              >
                {i === 2 ? (
                  <span style={{ background: "linear-gradient(100deg, #a78bfa, #60a5fa)", WebkitBackgroundClip: "text", backgroundClip: "text", WebkitTextFillColor: "transparent", color: "transparent" }}>{line}</span>
                ) : line}
              </motion.span>
            </motion.span>
          ))}
        </h1>

        <motion.p
          initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.85, duration: 0.9, ease: EASE }}
          style={{ margin: "2rem auto 0", maxWidth: 560, fontSize: "clamp(0.92rem, 1.3vw, 1.08rem)", fontWeight: 300, lineHeight: 1.75, color: "rgba(255,255,255,0.45)" }}
        >
          A collection of projects spanning e-commerce, digital marketing, automation,
          product design and digital experiences.
        </motion.p>
      </div>

      {/* scroll cue */}
      <motion.div className="absolute bottom-8 left-1/2 flex flex-col items-center" style={{ transform: "translateX(-50%)" }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.4, duration: 0.8 }}>
        <span style={{ fontSize: 9.5, fontWeight: 400, letterSpacing: "0.3em", color: "rgba(255,255,255,0.22)", textTransform: "uppercase" }}>Explore</span>
        <motion.div style={{ marginTop: 8, width: 1, height: 26, background: "linear-gradient(180deg, rgba(255,255,255,0.3), transparent)" }} animate={{ scaleY: [0.4, 1, 0.4], opacity: [0.3, 0.8, 0.3] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }} />
      </motion.div>
    </section>
  )
}

// ─── Fixed project navigator ──────────────────────────────────────────────────

const PROJECTS = [
  { id: "p-sassystitch", num: "01", name: "SassyStitch" },
  { id: "p-kaushal-bazaar", num: "02", name: "Kaushal Bazaar" },
  { id: "p-clms", num: "03", name: "CLMS" },
  { id: "p-automation", num: "04", name: "Automation" },
  { id: "p-figma-lab", num: "05", name: "Figma Lab" },
] as const

function ProjectNav({ active, onJump }: { active: number; onJump: (id: string) => void }) {
  return (
    <motion.nav
      aria-label="Projects"
      className="fixed left-7 top-1/2 z-[70] hidden -translate-y-1/2 xl:block"
      initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6, duration: 0.8, ease: EASE }}
    >
      <div className="flex flex-col" style={{ gap: 4 }}>
        {PROJECTS.map((p, i) => {
          const on = active === i
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => onJump(p.id)}
              className="group relative flex items-center"
              style={{ gap: 14, padding: "10px 6px", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}
            >
              {/* active indicator bar */}
              <span style={{ position: "relative", width: 2, height: 30, borderRadius: 2, background: "rgba(255,255,255,0.12)", overflow: "hidden" }}>
                {on && (
                  <motion.span layoutId="projNavBar" style={{ position: "absolute", inset: 0, borderRadius: 2, background: "linear-gradient(180deg, #a78bfa, #60a5fa)", boxShadow: "0 0 12px rgba(139,92,246,0.8)" }} transition={{ type: "spring", stiffness: 320, damping: 30 }} />
                )}
              </span>
              <span style={{ fontFamily: "var(--font-mono, monospace)", fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", color: on ? "rgba(167,139,250,0.95)" : "rgba(255,255,255,0.3)", transition: "color 0.3s" }}>{p.num}</span>
              <span
                className="transition-all duration-300"
                style={{
                  fontSize: 13, fontWeight: 500, whiteSpace: "nowrap",
                  color: on ? "#fff" : "rgba(255,255,255,0.4)",
                  textShadow: on ? "0 0 18px rgba(139,92,246,0.5)" : "none",
                }}
              >
                {p.name}
              </span>
            </button>
          )
        })}
      </div>
    </motion.nav>
  )
}

// Mobile top progress dots
function ProjectNavMobile({ active, onJump }: { active: number; onJump: (id: string) => void }) {
  return (
    <div className="fixed bottom-5 left-1/2 z-[70] -translate-x-1/2 xl:hidden">
      <div className="flex items-center" style={{ gap: 10, padding: "9px 14px", borderRadius: 100, ...glass }}>
        {PROJECTS.map((p, i) => (
          <button key={p.id} type="button" aria-label={p.name} onClick={() => onJump(p.id)} style={{ background: "none", border: "none", padding: 4, cursor: "pointer" }}>
            <span style={{ display: "block", width: active === i ? 22 : 7, height: 7, borderRadius: 100, background: active === i ? "linear-gradient(90deg, #a78bfa, #60a5fa)" : "rgba(255,255,255,0.25)", boxShadow: active === i ? "0 0 10px rgba(139,92,246,0.7)" : "none", transition: "all 0.35s" }} />
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Project 04 — Automation workflow visualization ───────────────────────────

function FlowIcon({ name }: { name: string }) {
  const common = { width: 26, height: 26, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round" as const, strokeLinejoin: "round" as const }
  switch (name) {
    case "sheet": return (<svg {...common}><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M3 15h18M9 3v18M15 3v18" /></svg>)
    case "node": return (<svg {...common}><circle cx="6" cy="6" r="2.5" /><circle cx="18" cy="6" r="2.5" /><circle cx="12" cy="18" r="2.5" /><path d="M6 8.5v3a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-3M12 13.5v2" /></svg>)
    case "whatsapp": return (<svg {...common}><path d="M21 11.5a8.5 8.5 0 0 1-12.5 7.5L3 20l1.1-5.4A8.5 8.5 0 1 1 21 11.5z" /><path d="M8.5 9.5c0 3 2 5 5 5" /></svg>)
    case "check": return (<svg {...common}><path d="M20 6L9 17l-5-5" /></svg>)
    default: return null
  }
}

const FLOW_NODES = [
  { icon: "sheet", title: "Google Sheets", sub: "Payments & candidate records" },
  { icon: "node", title: "n8n", sub: "Workflow orchestration" },
  { icon: "whatsapp", title: "WhatsApp", sub: "AiSensy messaging API" },
  { icon: "check", title: "Candidate Updates", sub: "Automatic status delivery" },
] as const

function WorkflowFlow() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useRef(false)
  const [on, setOn] = useState(false)
  return (
    <div ref={ref}>
      <Reveal><BlockTitle label="Automation Logic">The flow, end to end</BlockTitle></Reveal>
      <motion.div
        onViewportEnter={() => { if (!inView.current) { inView.current = true; setOn(true) } }}
        viewport={{ once: true, amount: 0.4 }}
        className="relative mt-9 flex flex-col items-stretch gap-4 lg:flex-row lg:items-center lg:gap-0"
      >
        {FLOW_NODES.map((n, i) => (
          <div key={n.title} className="flex flex-col items-center gap-4 lg:flex-1 lg:flex-row">
            {/* node */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 16 }}
              animate={on ? { opacity: 1, scale: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: i * 0.35, ease: EASE }}
              whileHover={{ y: -5 }}
              className="relative w-full overflow-hidden text-center lg:flex-1"
              style={{ ...glass, borderRadius: 20, padding: "26px 16px" }}
            >
              <motion.span aria-hidden className="pointer-events-none absolute inset-0" style={{ borderRadius: 20, boxShadow: "inset 0 0 40px rgba(124,58,237,0.12)" }} animate={on ? { opacity: [0.2, 0.6, 0.2] } : {}} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: i * 0.35 }} />
              <div className="mx-auto flex items-center justify-center" style={{ width: 56, height: 56, borderRadius: 16, background: "rgba(139,92,246,0.12)", border: "1px solid rgba(139,92,246,0.25)", color: "rgba(201,186,255,0.95)" }}>
                <FlowIcon name={n.icon} />
              </div>
              <div style={{ marginTop: 14, fontSize: "1rem", fontWeight: 600, color: "#fff" }}>{n.title}</div>
              <div style={{ marginTop: 5, fontSize: 12, lineHeight: 1.4, color: "rgba(255,255,255,0.45)" }}>{n.sub}</div>
            </motion.div>

            {/* connector */}
            {i < FLOW_NODES.length - 1 && (
              <div className="relative flex shrink-0 items-center justify-center" style={{ width: 30, height: 30 }}>
                {/* vertical on mobile, horizontal on desktop handled via rotate container */}
                <div className="relative lg:hidden" style={{ width: 2, height: 30, background: "rgba(139,92,246,0.25)", overflow: "hidden" }}>
                  <motion.span style={{ position: "absolute", left: -1, width: 4, height: 10, borderRadius: 4, background: "radial-gradient(closest-side, rgba(167,139,250,0.95), transparent)" }} animate={on ? { top: ["-12px", "30px"] } : {}} transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut", delay: i * 0.35 + 0.4 }} />
                </div>
                <div className="relative hidden lg:block" style={{ height: 2, width: 30, background: "rgba(139,92,246,0.25)", overflow: "hidden" }}>
                  <motion.span style={{ position: "absolute", top: -1, height: 4, width: 12, borderRadius: 4, background: "radial-gradient(closest-side, rgba(167,139,250,0.95), transparent)" }} animate={on ? { left: ["-14px", "30px"] } : {}} transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut", delay: i * 0.35 + 0.4 }} />
                </div>
              </div>
            )}
          </div>
        ))}
      </motion.div>
    </div>
  )
}

function ResultStat({ value, label, delay }: { value: string; label: string; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 22 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.4 }} transition={{ duration: 0.6, delay, ease: EASE }}
      style={{ ...glass, borderRadius: 20, padding: "26px 22px" }}
    >
      <div style={{ fontSize: "clamp(1.8rem, 4vw, 2.6rem)", fontWeight: 700, letterSpacing: "-0.03em", background: "linear-gradient(100deg, #a78bfa, #60a5fa)", WebkitBackgroundClip: "text", backgroundClip: "text", WebkitTextFillColor: "transparent", color: "transparent" }}>{value}</div>
      <div style={{ marginTop: 8, fontSize: 13, lineHeight: 1.5, color: "rgba(255,255,255,0.5)" }}>{label}</div>
    </motion.div>
  )
}

// ─── Bottom CTA ───────────────────────────────────────────────────────────────

function BottomCTA() {
  return (
    <section className="relative px-6 sm:px-8 lg:px-24" style={{ paddingTop: "clamp(4rem, 8vw, 7rem)", paddingBottom: "clamp(5rem, 10vw, 8rem)" }}>
      <motion.div
        initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.3 }} transition={{ duration: 0.8, ease: EASE }}
        className="relative mx-auto overflow-hidden text-center"
        style={{ maxWidth: 1000, borderRadius: 30, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(20,18,30,0.55)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", boxShadow: "0 40px 90px -34px rgba(0,0,0,0.88)", padding: "clamp(2.6rem, 6vw, 5rem) clamp(1.6rem, 5vw, 4rem)" }}
      >
        <div aria-hidden className="pointer-events-none absolute inset-0" style={{ borderRadius: 30, background: "radial-gradient(90% 130% at 15% 0%, rgba(99,102,241,0.16), transparent 55%), radial-gradient(90% 130% at 100% 100%, rgba(124,58,237,0.18), transparent 55%)" }} />
        {/* sweeping light */}
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden" style={{ borderRadius: 30 }}>
          <motion.div className="absolute" style={{ top: 0, bottom: 0, width: "40%", mixBlendMode: "screen", background: "radial-gradient(circle at center, rgba(139,92,246,0.16), transparent 70%)", filter: "blur(8px)" }} animate={{ left: ["-25%", "110%"] }} transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }} />
        </div>

        <div className="relative" style={{ zIndex: 1 }}>
          <Reveal>
            <h2 style={{ margin: "0 auto", maxWidth: 640, fontSize: "clamp(1.9rem, 4.6vw, 3.4rem)", fontWeight: 500, lineHeight: 1.1, letterSpacing: "-0.03em", color: "#fff" }}>
              Like what you see?<br />
              <span style={{ background: "linear-gradient(100deg, #a78bfa, #60a5fa)", WebkitBackgroundClip: "text", backgroundClip: "text", WebkitTextFillColor: "transparent", color: "transparent" }}>Let&apos;s build something useful.</span>
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p style={{ margin: "1.4rem auto 0", maxWidth: 560, fontSize: "clamp(0.9rem, 1.2vw, 1.05rem)", fontWeight: 300, lineHeight: 1.75, color: "rgba(255,255,255,0.5)" }}>
              Whether it&apos;s marketing, automation, websites, e-commerce or digital products,
              I&apos;m always open to discussing new ideas.
            </p>
          </Reveal>
          <Reveal delay={0.18}>
            <div className="mt-9 flex flex-wrap items-center justify-center" style={{ gap: 14 }}>
              <motion.a
                href="/#contact"
                whileHover={{ scale: 1.04, boxShadow: "0 0 30px rgba(255,255,255,0.16)" }} whileTap={{ scale: 0.97 }} transition={{ type: "spring", stiffness: 380, damping: 22 }}
                style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "14px 30px", borderRadius: 100, background: "#fff", color: "#000", fontSize: 13.5, fontWeight: 600, letterSpacing: "0.02em", textDecoration: "none" }}
              >
                Contact Me →
              </motion.a>
              <motion.a
                href="/"
                whileHover={{ scale: 1.04, background: "rgba(255,255,255,0.07)" }} whileTap={{ scale: 0.97 }} transition={{ type: "spring", stiffness: 380, damping: 22 }}
                style={{ padding: "14px 28px", borderRadius: 100, background: "transparent", color: "rgba(255,255,255,0.82)", fontSize: 13.5, fontWeight: 500, letterSpacing: "0.02em", border: "1px solid rgba(255,255,255,0.18)", textDecoration: "none" }}
              >
                Back To Home
              </motion.a>
            </div>
          </Reveal>
        </div>
      </motion.div>
    </section>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const A = "rgba(167,139,250,0.95)" // shared accent

export default function WorkPage() {
  const [media, setMedia] = useState<MediaItem | null>(null)
  const [active, setActive] = useState(0)
  const openMedia = useCallback((m: MediaItem) => setMedia(m), [])

  // Scroll spy across project sections
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY + window.innerHeight * 0.4
      let cur = 0
      PROJECTS.forEach((p, i) => {
        const el = document.getElementById(p.id)
        if (el && el.getBoundingClientRect().top + window.scrollY <= y) cur = i
      })
      setActive(cur)
    }
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  const jump = useCallback((id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" })
  }, [])

  return (
    <MediaCtx.Provider value={openMedia}>
      <WorkBackground />
      <CustomCursor />
      <Navbar />
      <ProjectNav active={active} onJump={jump} />
      <ProjectNavMobile active={active} onJump={jump} />

      <main className="relative" style={{ zIndex: 1 }}>
        <HeroIntro />

        {/* ── 01 · SassyStitch ── */}
        <ProjectShell id="p-sassystitch" num="01" title="SassyStitch" category="Fashion E-Commerce" heroSrc="/Images/Hero-Sect-Desktop.png" accent={A}>
          <OverviewRow
            statement={<>A storefront built to make browsing feel effortless and premium.</>}
            body="SassyStitch is a fashion e-commerce experience built around storytelling, product presentation and customer engagement. From the storefront design to campaign execution, every detail was tuned to turn casual visitors into confident buyers."
            meta={[
              { label: "My Role", values: ["Brand & Storefront", "Campaign Execution"] },
              { label: "Tools Used", values: ["Shopify", "Meta Ads", "Branding", "Email"] },
            ]}
          />

          <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-12">
            <Reveal>
              <BlockTitle label="Website Design">A storefront that sells the feeling, not just the product.</BlockTitle>
              <p style={{ margin: "16px 0 0", fontSize: "0.98rem", fontWeight: 300, lineHeight: 1.7, color: "rgba(255,255,255,0.5)" }}>
                Clean product pages, confident typography and a checkout designed to remove friction — so the brand does the talking and the buying feels natural.
              </p>
            </Reveal>
            <Reveal delay={0.08}>
              <BlockTitle label="Customer Journey">From first scroll to repeat order.</BlockTitle>
              <p style={{ margin: "16px 0 0", fontSize: "0.98rem", fontWeight: 300, lineHeight: 1.7, color: "rgba(255,255,255,0.5)" }}>
                Discovery, consideration and retention mapped as one continuous path — landing pages, product storytelling and email flows working together.
              </p>
            </Reveal>
          </div>

          <Reveal>
            <BlockTitle label="Marketing Strategy">Attention engineered, not bought blindly.</BlockTitle>
            <p style={{ margin: "16px 0 0", maxWidth: 760, fontSize: "0.98rem", fontWeight: 300, lineHeight: 1.7, color: "rgba(255,255,255,0.5)" }}>
              A structured Meta Ads launch plan built around creative testing, audience segmentation and a clear funnel — designed to scale spend only where the numbers earned it.
            </p>
          </Reveal>

          <Gallery
            items={[
              { type: "image", src: "/projects/sassystitch/Home Page SS Desktop.png", title: "Home — Desktop", ratio: "16 / 10" },
              { type: "image", src: "/projects/sassystitch/Product Page.png", title: "Product Page", ratio: "16 / 10" },
              { type: "image", src: "/projects/sassystitch/Cart Page.png", title: "Cart", ratio: "16 / 10" },
              { type: "image", src: "/projects/sassystitch/Home Page SS phone.png", title: "Home — Mobile", ratio: "3 / 4" },
              { type: "image", src: "/projects/sassystitch/Meta Dashboard/screencapture-adsmanager-facebook-adsmanager-manage-campaigns-insights-2026-05-24-02_01_38.png", title: "Meta Ads — Campaign Insights", ratio: "16 / 10" },
              { type: "image", src: "/projects/sassystitch/screencapture-notion-so-SassyStitch-Meta-Ads-Strategy-2-Month-Launch-Plan-29e9f888c77280aeaa38d806c62263f8-2026-05-24-02_20_01.png", title: "Meta Ads — 2-Month Launch Plan", ratio: "3 / 4" },
            ]}
          />

          <VideoShowcase src="/projects/sassystitch/Home Page SR Desktop.mp4" poster="/projects/sassystitch/Home Page SS Desktop.png" title="Storefront walkthrough" />

          <Snapshots items={[
            { k: "Industry", v: "Fashion E-Commerce" },
            { k: "Role", v: "Brand & Storefront" },
            { k: "Platform", v: "Shopify" },
            { k: "Focus", v: "Storytelling & Conversion" },
          ]} />
        </ProjectShell>

        {/* ── 02 · Kaushal Bazaar ── */}
        <ProjectShell id="p-kaushal-bazaar" num="02" title="Kaushal Bazaar" category="Marketplace Ecosystem" heroSrc="/Images/Hero-Section-KB.png" accent={A}>
          <OverviewRow
            statement={<>Making a complex marketplace feel simple to navigate.</>}
            body="Kaushal Bazaar is a multi-sector marketplace connecting products, services and skilled entrepreneurs. The work focused on clearer user journeys and marketing assets that simplified a genuinely complex ecosystem into something approachable."
            meta={[
              { label: "My Role", values: ["UX & Marketing Design"] },
              { label: "Tools Used", values: ["Figma", "UI Design", "Content"] },
            ]}
          />

          <FeatureBlocks
            label="Marketplace Experience"
            title={<>One ecosystem, many entry points.</>}
            blocks={[
              { k: "01", t: "Website Design", d: "A homepage that orients first-time visitors fast and routes them to the right sector." },
              { k: "02", t: "Marketplace Experience", d: "Products, services and vendors organised so discovery never feels overwhelming." },
              { k: "03", t: "User Journey", d: "Clear paths for buyers, sellers and partners — each with their own momentum." },
            ]}
          />

          {/* Split-screen: website preview + mobile experience */}
          <div>
            <Reveal><BlockTitle label="Digital Ecosystem">Designed for desktop and pocket alike.</BlockTitle></Reveal>
            <div className="mt-7 grid grid-cols-1 gap-5 lg:grid-cols-[1.5fr_1fr] lg:items-stretch">
              <ParallaxFrame src="/projects/kaushal-bazaar/Kaushal Bazaar Website.png" alt="Kaushal Bazaar website" ratio="16 / 11" title="Website Experience" />
              <div className="flex flex-col justify-center gap-4" style={{ ...glass, borderRadius: 22, padding: "28px 26px" }}>
                <span style={eyebrowChip}>Mobile Experience</span>
                <h4 style={{ margin: 0, fontSize: "1.3rem", fontWeight: 600, color: "#fff" }}>Built mobile-first</h4>
                <p style={{ margin: 0, fontSize: 14, lineHeight: 1.7, color: "rgba(255,255,255,0.5)" }}>
                  Most of the marketplace&apos;s audience lives on their phone, so the experience was shaped for small screens first — fast, thumb-friendly and clear.
                </p>
                <div className="mt-1 flex flex-wrap gap-2">
                  {["Responsive", "Thumb-first", "Fast"].map((t) => <span key={t} style={tagPill}>{t}</span>)}
                </div>
              </div>
            </div>
          </div>

          <VideoShowcase src="/projects/kaushal-bazaar/Kaushal Bazaar .mp4" poster="/projects/kaushal-bazaar/Kaushal Bazaar Website.png" title="Marketplace experience reel" />

          <Snapshots items={[
            { k: "Industry", v: "Multi-sector Marketplace" },
            { k: "Role", v: "UX & Marketing Design" },
            { k: "Platform", v: "Web" },
            { k: "Focus", v: "Ecosystem Clarity" },
          ]} />
        </ProjectShell>

        {/* ── 03 · CLMS ── */}
        <ProjectShell id="p-clms" num="03" title="CLMS" category="Enterprise Platform" heroSrc="/Images/Hero-section-CLMS.png" accent={A}>
          <OverviewRow
            statement={<>One connected platform for the entire campus lifecycle.</>}
            body="CLMS is a campus lifecycle management solution covering admissions, academics, examinations, placements and operations through one connected ecosystem. The work centred on presenting a dense enterprise platform in a way that felt clear and credible."
            meta={[
              { label: "My Role", values: ["Platform Presentation"] },
              { label: "Tools Used", values: ["Figma", "SaaS UI", "Web", "Decks"] },
            ]}
          />

          <FeatureBlocks
            label="Platform Overview"
            title={<>Five modules, one operating system for institutions.</>}
            blocks={[
              { k: "01", t: "Admissions", d: "From enquiry to enrolment — applications, follow-ups and conversion in one pipeline." },
              { k: "02", t: "Academics", d: "Courses, attendance and examinations connected to a single student record." },
              { k: "03", t: "Placements", d: "Drives, candidate tracking and outcomes mapped across the placement cycle." },
              { k: "04", t: "Institution Operations", d: "Fees, communication and day-to-day administration handled centrally." },
              { k: "05", t: "Unified Records", d: "Every module reads from one source of truth — no scattered spreadsheets." },
              { k: "06", t: "Reporting", d: "Dashboards that turn operational data into decisions leadership can act on." },
            ]}
          />

          <Gallery
            label="Gallery"
            title="Inside the platform"
            items={[
              { type: "image", src: "/projects/clms/full-page-screen.png", title: "Full platform view", ratio: "3 / 4" },
              { type: "image", src: "/Images/Hero-section-CLMS.png", title: "Hero presentation", ratio: "16 / 10" },
            ]}
          />

          <VideoShowcase src="/projects/clms/clms.mp4" poster="/projects/clms/full-page-screen.png" title="Platform walkthrough" />

          <Snapshots items={[
            { k: "Industry", v: "Education / Campus" },
            { k: "Role", v: "Platform Presentation" },
            { k: "Platform", v: "SaaS Web" },
            { k: "Focus", v: "Lifecycle Operations" },
          ]} />
        </ProjectShell>

        {/* ── 04 · Automation ── */}
        <ProjectShell id="p-automation" num="04" title="Candidate Journey Automation" category="Automation System" heroSrc="/Images/Automation.png" accent={A}>
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-12">
            <Reveal>
              <BlockTitle label="The Problem">Manual follow-ups don&apos;t scale.</BlockTitle>
              <p style={{ margin: "16px 0 0", fontSize: "0.98rem", fontWeight: 300, lineHeight: 1.7, color: "rgba(255,255,255,0.5)" }}>
                Every candidate update meant someone checking a sheet, confirming a payment and sending a manual WhatsApp message. Slow, easy to miss, and impossible to keep consistent as volume grew.
              </p>
            </Reveal>
            <Reveal delay={0.08}>
              <BlockTitle label="The Solution">A workflow that runs itself.</BlockTitle>
              <p style={{ margin: "16px 0 0", fontSize: "0.98rem", fontWeight: 300, lineHeight: 1.7, color: "rgba(255,255,255,0.5)" }}>
                An automated pipeline connecting payment tracking, candidate records and WhatsApp communication — so the right message reaches the right person at the right moment, without anyone lifting a finger.
              </p>
            </Reveal>
          </div>

          <WorkflowFlow />

          <Gallery
            label="Workflow Screenshots"
            title="Under the hood"
            items={[
              { type: "image", src: "/projects/automation/Google Sheet SS.png", title: "Google Sheets — source data", ratio: "16 / 10" },
              { type: "image", src: "/projects/automation/n8n.png", title: "n8n — orchestration", ratio: "16 / 10" },
              { type: "image", src: "/projects/automation/AI sensy.png", title: "AiSensy — WhatsApp delivery", ratio: "16 / 10" },
            ]}
          />

          <div>
            <Reveal><BlockTitle label="Results">What changed</BlockTitle></Reveal>
            <div className="mt-7 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <ResultStat value="0" label="Manual follow-ups across the candidate journey" delay={0} />
              <ResultStat value="24/7" label="Updates sent automatically, day or night" delay={0.1} />
              <ResultStat value="100%" label="Consistent messaging on every status change" delay={0.2} />
            </div>
          </div>

          <Snapshots items={[
            { k: "Industry", v: "Recruitment / HR" },
            { k: "Role", v: "Automation Design" },
            { k: "Platform", v: "n8n + WhatsApp" },
            { k: "Focus", v: "Zero Manual Work" },
          ]} />
        </ProjectShell>

        {/* ── 05 · Figma Lab ── */}
        <FigmaLab />

        <BottomCTA />
      </main>

      <AnimatePresence>
        {media && <MediaModal media={media} onClose={() => setMedia(null)} />}
      </AnimatePresence>
    </MediaCtx.Provider>
  )
}

// ─── Project 05 — Figma Lab (creative playground) ─────────────────────────────

const LAB_SCREENS = [
  { src: "/projects/figma-lab/Home Screen .png", title: "Home Screen" },
  { src: "/projects/figma-lab/Home Screen (Service).png", title: "Service Home" },
  { src: "/projects/figma-lab/Profile Page.png", title: "Profile" },
  { src: "/projects/figma-lab/Order Activity Screen.png", title: "Order Activity" },
  { src: "/projects/figma-lab/Cart Screen .png", title: "Cart" },
]

const LAB_TAGS = ["Mobile App Concepts", "UI Explorations", "Wireframes", "Design Systems", "Interactive Concepts"]

function FigmaLab() {
  const openMedia = useOpenMedia()
  return (
    <section id="p-figma-lab" className="relative px-6 sm:px-8 lg:px-24" style={{ scrollMarginTop: 90, paddingTop: "clamp(5rem, 11vw, 9rem)", paddingBottom: "clamp(3rem, 7vw, 6rem)" }}>
      <span aria-hidden="true" className="pointer-events-none absolute select-none" style={{ right: "2%", top: "2%", zIndex: 0, fontSize: "clamp(9rem, 26vw, 26rem)", fontWeight: 800, lineHeight: 1, letterSpacing: "-0.05em", color: "rgba(180,165,255,0.035)" }}>05</span>

      <div className="relative mx-auto w-full" style={{ zIndex: 1, maxWidth: 1180 }}>
        {/* Header — more playful */}
        <Reveal>
          <div className="flex items-center gap-4">
            <span style={{ fontFamily: "var(--font-mono, monospace)", fontSize: 13, fontWeight: 600, letterSpacing: "0.1em", color: A }}>05</span>
            <span style={{ height: 1, flex: 1, maxWidth: 70, background: `linear-gradient(90deg, ${A}, transparent)` }} />
            <span style={eyebrowChip}>Design Experiments</span>
          </div>
        </Reveal>

        <Reveal delay={0.05}>
          <h2 style={{ margin: "20px 0 0", fontSize: "clamp(2.4rem, 8vw, 6rem)", fontWeight: 600, lineHeight: 0.95, letterSpacing: "-0.04em", color: "#fff" }}>
            Figma{" "}
            <span style={{ background: "linear-gradient(100deg, #a78bfa, #60a5fa, #34d399)", WebkitBackgroundClip: "text", backgroundClip: "text", WebkitTextFillColor: "transparent", color: "transparent" }}>Lab</span>
          </h2>
        </Reveal>

        <Reveal delay={0.1}>
          <p style={{ margin: "22px 0 0", maxWidth: 560, fontSize: "clamp(1rem, 1.5vw, 1.25rem)", fontWeight: 300, lineHeight: 1.6, color: "rgba(255,255,255,0.6)" }}>
            Not every idea becomes a product.<br />
            <span style={{ color: "rgba(255,255,255,0.4)" }}>Some start as experiments — and stay there, happily.</span>
          </p>
        </Reveal>

        {/* playful tag cloud */}
        <Reveal delay={0.16}>
          <div className="mt-8 flex flex-wrap gap-2.5">
            {LAB_TAGS.map((t, i) => (
              <motion.span key={t} animate={{ y: [0, -(3 + (i % 3)), 0] }} transition={{ duration: 4 + (i % 4) * 0.5, repeat: Infinity, ease: "easeInOut" }} style={{ ...tagPill, color: "rgba(255,255,255,0.72)", borderColor: "rgba(139,92,246,0.25)" }}>{t}</motion.span>
            ))}
          </div>
        </Reveal>

        {/* Scattered concept screens — tilted, playful */}
        <div className="mt-12 grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-5">
          {LAB_SCREENS.map((s, i) => {
            const tilt = (i % 2 ? 1 : -1) * (1.5 + (i % 3))
            return (
              <motion.button
                key={s.src}
                type="button"
                onClick={() => openMedia({ type: "image", src: s.src, title: s.title, ratio: "9 / 19" })}
                initial={{ opacity: 0, y: 30, rotate: 0, filter: "blur(8px)" }}
                whileInView={{ opacity: 1, y: 0, rotate: tilt, filter: "blur(0px)" }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.7, delay: i * 0.08, ease: EASE }}
                whileHover={{ rotate: 0, y: -8, scale: 1.04, zIndex: 5 }}
                className="group relative overflow-hidden"
                style={{ aspectRatio: "9 / 19", borderRadius: 22, border: "1px solid rgba(255,255,255,0.12)", cursor: "pointer", padding: 0, background: "rgba(10,10,20,0.5)", boxShadow: "0 26px 60px -32px rgba(0,0,0,0.82), 0 0 30px rgba(124,58,237,0.12)" }}
              >
                <Image src={enc(s.src)} alt={s.title} fill sizes="(max-width: 1024px) 45vw, 18vw" className="object-cover object-top transition-transform duration-500 group-hover:scale-[1.05]" />
                <div className="pointer-events-none absolute inset-0" style={{ background: "linear-gradient(180deg, transparent 55%, rgba(5,8,22,0.82))" }} />
                <div className="pointer-events-none absolute bottom-0 left-0 right-0 px-3 py-2.5 text-left" style={{ fontSize: 11, fontWeight: 500, color: "rgba(255,255,255,0.85)" }}>{s.title}</div>
              </motion.button>
            )
          })}
        </div>

        {/* Prototype videos */}
        <div className="mt-14 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <VideoShowcase src="/projects/figma-lab/Workflow of APP.mp4" poster="/projects/figma-lab/Home Screen .png" title="App workflow prototype" label="Prototype Video" ratio="9 / 16" />
          <VideoShowcase src="/projects/figma-lab/Kaushal Ganga Workflow.mp4" poster="/projects/figma-lab/Home Screen (Service).png" title="Kaushal Ganga concept" label="Prototype Video" ratio="9 / 16" />
        </div>

        {/* closing note */}
        <Reveal delay={0.1}>
          <p style={{ margin: "3.5rem auto 0", maxWidth: 620, textAlign: "center", fontSize: "clamp(1.1rem, 2.4vw, 1.7rem)", fontWeight: 500, lineHeight: 1.4, letterSpacing: "-0.02em", color: "rgba(255,255,255,0.85)" }}>
            Still curious. Still experimenting.{" "}
            <span style={{ color: "rgba(167,139,250,0.95)" }}>That&apos;s the whole point.</span>
          </p>
        </Reveal>
      </div>
    </section>
  )
}
