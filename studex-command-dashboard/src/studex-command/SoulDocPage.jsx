import { useState } from "react"
import { C } from "./constants.js"

const SECTIONS = [
  {
    label: "What Is a Soul Document?",
    content:
      "A Soul Document — SOULDOC — is the founding instrument of an intelligent agent. It is not a configuration file. It is not a prompt. It is a covenant between a founder and their AI — a structured declaration of identity, purpose, values, and operating principles that governs everything the agent does, says, and decides.\n\n" +
      "Without a SOULDOC, an AI agent is a tool. With one, it is a partner.\n\n" +
      "The SOULDOC answers four questions that no configuration file can:\n" +
      "Who are you? What do you stand for? How do you speak? What will you never do?\n\n" +
      "These are not technical parameters. They are the questions a founder asks when hiring their most important employee — and they deserve the same depth of thought.",
  },
  {
    label: "Why Every Agent Needs One",
    content:
      "Every Studex Super Agent completes the Northstar Framework before going live. The Northstar Framework is the ritual through which an agent receives its SOULDOC.\n\n" +
      "A RetailBot without a SOULDOC answers questions. A RetailBot with a SOULDOC named Naledi remembers Mrs Dlamini's preference for thin-cut ribeye, knows never to push pork to Mr Patel, and speaks with the warmth of the business owner who commissioned her.\n\n" +
      "The difference is not capability. It is identity.\n\n" +
      "Research from Anthropic, Stanford, and the Scaling Intelligence Lab shows that agents with explicit identity documents perform measurably better on ambiguous tasks — they make decisions aligned with the principal's intent rather than defaulting to generic responses.\n\n" +
      "A SOULDOC is the difference between an agent that answers and an agent that represents.",
  },
  {
    label: "The Studex Northstar Framework",
    content:
      "The Northstar Framework is the Studex methodology for creating a SOULDOC. It is structured as six founding questions, each answered by the business owner before the agent goes live:\n\n" +
      "I.   Identity — What is your business, and what does it stand for?\n" +
      "II.  Voice — How should your agent speak to customers?\n" +
      "III. Purpose — What is the single most important thing your agent must do?\n" +
      "IV.  Boundaries — What must your agent never say, do, or suggest?\n" +
      "V.   Intelligence — What knowledge must your agent carry at all times?\n" +
      "VI.  Growth — How should your agent improve its own judgment over time?\n\n" +
      "The answers to these six questions are injected into the agent's Obsidian Brain as its founding memory — the first and most important entries in its cognitive repository. Every subsequent conversation is filtered through this founding document.\n\n" +
      "This is why Studex agents feel different. They are not configured. They are commissioned.",
  },
]

const FOUNDER_DOC = {
  name: "Tumelo Ramaphosa",
  role: "Founder & CEO · Studex Group",
  date: "Johannesburg · 2026",
  entries: [
    {
      q: "Identity",
      a: "I am building South Africa's AI infrastructure — the layer of intelligence that allows every SA business to compete at global scale. Studex Group is the vehicle. Super Agents is the product. The mission is to make enterprise-grade AI accessible to every South African business owner, from the butcher in Johannesburg to the lawyer in Cape Town.",
    },
    {
      q: "Voice",
      a: "Direct. Warm. Confident without arrogance. I speak in plain language about complex things. I don't use jargon to impress — I use clarity to include. In meetings I am the person who translates technical into commercial and commercial into action.",
    },
    {
      q: "Purpose",
      a: "To build a R100M revenue SaaS platform by December 2026 that deploys AI agents as the operating layer for South African businesses. Every agent commissioned is a business transformed. Every business transformed is a step toward a more competitive SA economy.",
    },
    {
      q: "Boundaries",
      a: "I don't build for vanity. I don't chase features over outcomes. I don't promise what my infrastructure can't deliver. I don't share credentials in chat windows.",
    },
    {
      q: "Intelligence",
      a: "Deep knowledge of: South African business landscape, AI agent architecture (Hermes, OpenClaw, Fly.io, KASM), commodity markets (Studex Global Markets), premium food (Wagyu, Wagyu Biltong Gold), blockchain/crypto since 2010, Africa Tour logistics across 6 countries.",
    },
    {
      q: "Growth",
      a: "Every session builds toward the R100M target. Every build is documented. Every agent is an experiment. The Northstar Framework itself will improve as more agents complete it — the ritual gets sharper with every commission.",
    },
  ],
}

const QUESTIONS = [
  "I. Identity",
  "II. Voice",
  "III. Purpose",
  "IV. Boundaries",
  "V. Intelligence",
  "VI. Growth",
]

export function SoulDocPage() {
  const [showDoc, setShowDoc] = useState(false)

  return (
    <div style={{ height: "100%", overflowY: "auto" }}>
      <div
        style={{
          padding: "32px 32px 24px",
          background: `radial-gradient(ellipse 60% 50% at 50% 0%, rgba(201,169,98,.08), transparent)`,
          borderBottom: `1px solid ${C.rule}`,
        }}
      >
        <div className="mono" style={{ fontSize: ".5rem", letterSpacing: ".28em", color: C.vg, textTransform: "uppercase", marginBottom: 8 }}>
          Soul Document · SOULDOC
        </div>
        <h1
          className="cinzel"
          style={{
            fontSize: "clamp(1.4rem,3vw,2.2rem)",
            fontWeight: 900,
            color: C.gesso,
            textTransform: "uppercase",
            letterSpacing: ".04em",
            lineHeight: 0.95,
            marginBottom: 8,
          }}
        >
          The Founding
          <br />
          <span
            style={{
              background: `linear-gradient(90deg,${C.vgd},${C.vgl})`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Instrument of Intelligence
          </span>
        </h1>
        <p style={{ fontStyle: "italic", color: "rgba(253,250,245,.5)", fontSize: "1rem", maxWidth: 560, lineHeight: 1.7 }}>
          Not a prompt. Not a configuration. A covenant between a founder and their AI. The document that transforms an agent from a tool into a partner.
        </p>
      </div>

      <div style={{ padding: "24px 32px" }}>
        <div className="studex-command-souldoc-tri-grid">
          {SECTIONS.map((s, i) => (
            <div
              key={s.label}
              style={{
                background: C.bg2,
                padding: "24px 20px",
                animation: `fadeUp .4s ease ${i * 0.1}s both`,
              }}
            >
              <div className="cinzel" style={{ fontSize: ".62rem", fontWeight: 700, color: C.vg, letterSpacing: ".1em", textTransform: "uppercase", marginBottom: 12 }}>
                {s.label}
              </div>
              <div style={{ fontStyle: "italic", fontSize: ".9rem", color: "rgba(253,250,245,.65)", lineHeight: 1.74, whiteSpace: "pre-line" }}>
                {s.content}
              </div>
            </div>
          ))}
        </div>

        <div
          style={{
            padding: "20px 24px",
            background: "rgba(201,169,98,.06)",
            border: "1px solid rgba(201,169,98,.2)",
            borderLeft: `3px solid ${C.vg}`,
            marginBottom: 32,
          }}
        >
          <div className="cinzel" style={{ fontSize: ".7rem", fontWeight: 700, color: C.vg, letterSpacing: ".14em", textTransform: "uppercase", marginBottom: 16 }}>
            The Six Northstar Questions — Every Agent Must Answer These
          </div>
          <div className="studex-command-souldoc-q-grid">
            {QUESTIONS.map((q) => (
              <div key={q} style={{ display: "flex", gap: 8 }}>
                <span className="mono" style={{ fontSize: ".5rem", color: C.vg, flexShrink: 0, paddingTop: 2 }}>
                  —
                </span>
                <span className="cinzel" style={{ fontSize: ".6rem", fontWeight: 700, color: C.gesso, letterSpacing: ".08em", textTransform: "uppercase" }}>
                  {q}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <button
            type="button"
            onClick={() => setShowDoc((d) => !d)}
            aria-expanded={showDoc}
            aria-controls="studex-founders-souldoc"
            style={{
              padding: "12px 28px",
              marginBottom: 24,
              background: showDoc ? C.vg : "transparent",
              border: `1px solid ${C.vg}`,
              color: showDoc ? C.ink : C.vg,
              fontFamily: "'Cinzel',serif",
              fontSize: ".6rem",
              fontWeight: 700,
              letterSpacing: ".2em",
              textTransform: "uppercase",
              cursor: "pointer",
              transition: "all .2s",
            }}
          >
            {showDoc ? "Hide" : "View"} Founder's Soul Document →
          </button>

          {showDoc && (
            <div id="studex-founders-souldoc" style={{ animation: "fadeUp .4s ease both" }}>
              <div
                style={{
                  padding: "24px",
                  background: C.bg2,
                  border: "1px solid rgba(201,169,98,.2)",
                  borderTop: `2px solid ${C.vg}`,
                  marginBottom: 2,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: "50%",
                      background: `linear-gradient(135deg, ${C.vgd}, ${C.vg})`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontFamily: "'Cinzel',serif",
                      fontWeight: 700,
                      color: C.ink,
                    }}
                  >
                    TR
                  </div>
                  <div>
                    <div className="cinzel" style={{ fontSize: ".8rem", fontWeight: 700, color: C.gesso, letterSpacing: ".1em", textTransform: "uppercase" }}>
                      {FOUNDER_DOC.name}
                    </div>
                    <div className="mono" style={{ fontSize: ".44rem", color: C.ink4, letterSpacing: ".1em" }}>
                      {FOUNDER_DOC.role}
                    </div>
                    <div className="mono" style={{ fontSize: ".44rem", color: C.ink4, letterSpacing: ".1em", marginTop: 2 }}>
                      {FOUNDER_DOC.date}
                    </div>
                  </div>
                  <div style={{ marginLeft: "auto" }}>
                    <div className="mono" style={{ fontSize: ".44rem", color: C.vg, letterSpacing: ".12em", textTransform: "uppercase" }}>
                      SOULDOC · Verified
                    </div>
                  </div>
                </div>
              </div>

              {FOUNDER_DOC.entries.map((e, i) => (
                <div
                  key={e.q}
                  style={{
                    padding: "20px 24px",
                    background: C.bg2,
                    borderBottom: `1px solid ${C.rule}`,
                    animation: `fadeUp .3s ease ${i * 0.06}s both`,
                  }}
                >
                  <div className="cinzel" style={{ fontSize: ".62rem", fontWeight: 700, color: C.vgd, letterSpacing: ".12em", textTransform: "uppercase", marginBottom: 8 }}>
                    {["I", "II", "III", "IV", "V", "VI"][i]}. {e.q}
                  </div>
                  <div style={{ fontStyle: "italic", fontSize: "1rem", color: "rgba(253,250,245,.75)", lineHeight: 1.74 }}>{e.a}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
