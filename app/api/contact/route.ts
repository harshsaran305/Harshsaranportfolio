import { NextResponse } from "next/server"
import { Resend } from "resend"

// ─────────────────────────────────────────────────────────────────────────────
// Contact form API route — sends inquiry emails via Resend.
//
// 🔑 RESEND API KEY
//   The key lives in an environment variable named RESEND_API_KEY.
//   • Local dev:  add it to `.env.local` in the project root (see .env.local.example):
//                   RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxx
//                 Get a key at https://resend.com/api-keys
//   • Production: add the same variable in your host's dashboard
//                 (e.g. Vercel → Project → Settings → Environment Variables).
//   Never commit the real key — `.env*` files are already gitignored.
//
// 📬 CHANGING THE DESTINATION EMAIL
//   Edit TO_EMAIL below. That's the inbox that receives every inquiry.
//
// 📤 ABOUT THE "from" ADDRESS
//   Until you verify your own domain in Resend, you must send from
//   `onboarding@resend.dev` (Resend's shared test sender). Once your domain is
//   verified (https://resend.com/domains), change FROM_EMAIL to something like
//   "Portfolio <contact@yourdomain.com>" so it lands reliably and looks branded.
//
// 🧪 TESTING LOCALLY
//   1. Put RESEND_API_KEY in `.env.local`.
//   2. Run `npm run dev`.
//   3. Open the site, click "Let's Talk", fill the form, hit "Send Inquiry".
//   4. The email arrives at TO_EMAIL. With the test sender (onboarding@resend.dev)
//      Resend only delivers to the email tied to your Resend account, so for the
//      very first test set TO_EMAIL to your own Resend signup address, or verify a
//      domain first. Check the Resend dashboard "Logs" tab to see each send.
// ─────────────────────────────────────────────────────────────────────────────

// 📬 Destination inbox — change this to route inquiries elsewhere.
const TO_EMAIL = "harshsaran305@gmail.com"

// 📤 Sender — Resend's verified test address. Swap for your own verified domain later.
const FROM_EMAIL = "Portfolio Inquiry <onboarding@resend.dev>"

interface ContactPayload {
  name: string
  email: string
  company?: string
  projectType: string
  budget: string
  message: string
}

// Trim + coerce an unknown field to a string (guards against missing/non-string input)
function str(value: unknown): string {
  return typeof value === "string" ? value.trim() : ""
}

export async function POST(request: Request) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    // Misconfiguration — surface clearly in the server logs, stay generic to the client.
    console.error("RESEND_API_KEY is not set. Add it to .env.local (see route comments).")
    return NextResponse.json({ error: "Email service is not configured." }, { status: 500 })
  }

  let body: Partial<ContactPayload>
  try {
    body = (await request.json()) as Partial<ContactPayload>
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 })
  }

  const name = str(body.name)
  const email = str(body.email)
  const company = str(body.company)
  const projectType = str(body.projectType)
  const budget = str(body.budget)
  const message = str(body.message)

  // Required-field validation (company is optional)
  if (!name || !email || !projectType || !budget || !message) {
    return NextResponse.json({ error: "Please fill in all required fields." }, { status: 400 })
  }

  // Basic email shape check
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 })
  }

  const submittedAt = new Date().toLocaleString("en-IN", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  })

  // Plain-text body (matches the requested format)
  const text = [
    "New Inquiry Received",
    "",
    "Name:",
    name,
    "",
    "Email:",
    email,
    "",
    "Company:",
    company || "—",
    "",
    "Project Type:",
    projectType,
    "",
    "Budget:",
    budget,
    "",
    "Message:",
    message,
    "",
    "Submitted:",
    submittedAt,
  ].join("\n")

  // Lightweight HTML version for nicer inbox rendering
  const esc = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
  const row = (label: string, value: string) =>
    `<p style="margin:0 0 14px"><strong style="display:block;color:#7c3aed;font-size:12px;letter-spacing:0.04em;text-transform:uppercase">${label}</strong><span style="color:#111;font-size:15px;white-space:pre-wrap">${esc(value)}</span></p>`
  const html = `
    <div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;background:#f7f7fb;border-radius:12px">
      <h2 style="margin:0 0 20px;color:#111;font-size:20px">New Inquiry Received</h2>
      ${row("Name", name)}
      ${row("Email", email)}
      ${row("Company", company || "—")}
      ${row("Project Type", projectType)}
      ${row("Budget", budget)}
      ${row("Message", message)}
      ${row("Submitted", submittedAt)}
    </div>`

  try {
    const resend = new Resend(apiKey)
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: TO_EMAIL,
      replyTo: email, // hitting "Reply" responds to the person who filled the form
      subject: `🚀 New Portfolio Inquiry - ${projectType}`,
      text,
      html,
    })

    if (error) {
      console.error("Resend send error:", error)
      return NextResponse.json({ error: "Failed to send email." }, { status: 502 })
    }

    return NextResponse.json({ ok: true, id: data?.id }, { status: 200 })
  } catch (err) {
    console.error("Unexpected error sending email:", err)
    return NextResponse.json({ error: "Failed to send email." }, { status: 500 })
  }
}
