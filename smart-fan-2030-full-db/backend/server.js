// server.js (ESM) — complet + corrigé + lit .env correctement
// ✅ Node 18+ (fetch intégré)
// ✅ Streaming NDJSON Ollama robuste (buffer)
// ✅ Timeout + AbortController
// ✅ /api/health + /api/ai/chat (JSON) + /api/ai/chat/stream (texte)
// ✅ Charge .env : import "dotenv/config"

import "dotenv/config" // ✅ IMPORTANT: charge backend/.env AVANT process.env
import express from "express"
import cors from "cors"

const app = express()
app.use(cors())
app.use(express.json()) // ✅ parenthèses

// ===============================
// ⚙️ CONFIG
// ===============================
const PORT = Number(process.env.PORT) || 8000

// IMPORTANT: utiliser 127.0.0.1 (évite bug IPv6 sous Windows)
const OLLAMA_HOST = process.env.OLLAMA_HOST || "http://127.0.0.1:11434"
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "qwen2.5:3b"

const FANBOT_SYSTEM_PROMPT = `
Tu es FanBot, assistant officiel de la Coupe du Monde 2030.
Pays hôtes: Maroc, Espagne, Portugal.

Tu aides les fans pour:
- matchs
- stades
- villes
- transports
- fan zones
- billets
- hôtels
- règles du stade

Réponds en français, clairement, avec des infos pratiques.
Si les données sont fournies dans le contexte, utilise-les.
`.trim()

// ===============================
// ✅ HEALTH
// ===============================
app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    time: new Date().toISOString(),
    ollamaHost: OLLAMA_HOST,
    model: OLLAMA_MODEL,
    supabase: false,
  })
})

function buildFinalMessages({ message, context, messages }) {
  const finalMessages = [
    { role: "system", content: FANBOT_SYSTEM_PROMPT },
    ...(context ? [{ role: "system", content: `Contexte utile:\n${String(context)}` }] : []),
  ]

  if (Array.isArray(messages) && messages.length > 0) {
    finalMessages.push(...messages)
  } else if (typeof message === "string" && message.trim()) {
    finalMessages.push({ role: "user", content: message.trim() })
  } else {
    finalMessages.push({ role: "user", content: "Bonjour" })
  }

  return finalMessages
}

async function ollamaFetch({ stream, finalMessages, timeoutMs = 120000 }) {
  const controller = new AbortController()
  const t = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const r = await fetch(`${OLLAMA_HOST}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        messages: finalMessages,
        stream,
      }),
      signal: controller.signal,
    })
    return r
  } finally {
    clearTimeout(t)
  }
}

// ===============================
// 🤖 AI CHAT (JSON - non stream)
// ===============================
app.post("/api/ai/chat", async (req, res) => {
  const startedAt = Date.now()

  try {
    const { message, context, messages } = req.body || {}
    const finalMessages = buildFinalMessages({ message, context, messages })

    const r = await ollamaFetch({ stream: false, finalMessages, timeoutMs: 120000 })

    if (!r.ok) {
      const text = await r.text().catch(() => "")
      console.error("❌ Ollama HTTP error:", r.status, text)
      return res.status(502).json({
        reply: `❌ Problème côté Ollama (HTTP_${r.status}).\n${text || ""}`,
      })
    }

    const data = await r.json()
    const reply = String(data?.message?.content ?? "").trim()

    return res.json({
      reply: reply || "Je n'ai pas reçu de réponse du modèle.",
      meta: { ms: Date.now() - startedAt, model: OLLAMA_MODEL },
    })
  } catch (e) {
    console.error("❌ Server error (ai/chat):", e?.stack || e)
    return res.status(500).json({
      reply: "❌ Problème côté serveur IA.\n" + "Détail: " + String(e?.message || e),
    })
  }
})

// ===============================
// 🤖 AI CHAT (STREAM - texte)
// ===============================
app.post("/api/ai/chat/stream", async (req, res) => {
  try {
    const { message, context, messages } = req.body || {}
    const finalMessages = buildFinalMessages({ message, context, messages })

    // Headers stream
    res.setHeader("Content-Type", "text/plain; charset=utf-8")
    res.setHeader("Cache-Control", "no-cache, no-transform")
    res.setHeader("Connection", "keep-alive")
    res.setHeader("X-Accel-Buffering", "no") // utile si reverse proxy
    if (typeof res.flushHeaders === "function") res.flushHeaders()

    const r = await ollamaFetch({ stream: true, finalMessages, timeoutMs: 120000 })

    if (!r.ok || !r.body) {
      const text = await r.text().catch(() => "")
      return res.status(502).end(text || "Ollama error")
    }

    const reader = r.body.getReader()
    const decoder = new TextDecoder()

    let buffer = ""

    while (true) {
      const { value, done } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })

      // Ollama renvoie du JSON par ligne (NDJSON)
      const lines = buffer.split("\n")
      buffer = lines.pop() || "" // garde la ligne incomplète

      for (const line of lines) {
        const s = line.trim()
        if (!s) continue

        try {
          const obj = JSON.parse(s)
          const token = obj?.message?.content || ""
          if (token) res.write(token)

          if (obj?.done) {
            res.end()
            return
          }
        } catch {
          // ignore ligne invalide (chunk coupé, etc.)
        }
      }
    }

    res.end()
  } catch (e) {
    console.error("❌ Server error (ai/chat/stream):", e?.stack || e)
    res.status(500).end("Server error")
  }
})

// ===============================
// 🔥 WARMUP
// ===============================
async function warmup() {
  try {
    console.log("🔥 Warmup Ollama...")
    const r = await ollamaFetch({
      stream: false,
      finalMessages: [{ role: "user", content: "Dis OK." }],
      timeoutMs: 20000,
    })

    if (!r.ok) {
      const t = await r.text().catch(() => "")
      console.log("⚠️ Warmup Ollama HTTP:", r.status, t)
      return
    }
    console.log("✅ Warmup terminé.")
  } catch (e) {
    console.log("⚠️ Warmup échoué:", String(e?.message || e))
  }
}

// ===============================
// 🚀 START
// ===============================
app.listen(PORT, () => {
  console.log(`✅ AI backend running on http://localhost:${PORT}`)
  console.log(`➡️  Ollama: ${OLLAMA_HOST} | Model: ${OLLAMA_MODEL}`)
  warmup()
})
