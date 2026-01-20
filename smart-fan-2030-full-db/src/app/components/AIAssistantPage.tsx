import { useEffect, useMemo, useRef, useState } from "react"
import { Bot, Clock, Info, MapPin, Send, Sparkles, Ticket, User as UserIcon } from "lucide-react"

import { Badge } from "./ui/badge"
import { Button } from "./ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Input } from "./ui/input"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

interface AIAssistantPageProps {
  /** Table `chatbot_faq` chargée depuis Supabase: { key: response } */
  faq: Record<string, string>
}

type Mode = "faq" | "ai"

function withTimeout<T>(p: Promise<T>, ms = 15000): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, rej) => setTimeout(() => rej(new Error(`TIMEOUT_${ms}ms`)), ms)),
  ])
}

/**
 * Stream depuis backend: /api/ai/chat/stream
 * Le backend renvoie du texte brut (token par token).
 */
async function askBackendAIStream(
  userText: string,
  onToken: (t: string) => void,
  opts?: { signal?: AbortSignal }
) {
  const res = await fetch("/api/ai/chat/stream", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages: [{ role: "user", content: userText }],
    }),
    signal: opts?.signal,
  })

  if (!res.ok) {
    const text = await res.text().catch(() => "")
    throw new Error(`HTTP_${res.status}${text ? `: ${text}` : ""}`)
  }

  if (!res.body) throw new Error("NO_BODY_STREAM")

  const reader = res.body.getReader()
  const decoder = new TextDecoder()

  while (true) {
    const { value, done } = await reader.read()
    if (done) break
    const chunk = decoder.decode(value, { stream: true })
    if (chunk) onToken(chunk)
  }
}

export function AIAssistantPage({ faq }: AIAssistantPageProps) {
  // ✅ defaultMessage recalculé quand faq change
  const defaultMessage = useMemo(() => {
    return (
      faq.default ||
      "Je suis FanBot, votre assistant personnel pour la Coupe du Monde 2030! Posez-moi une question (horaires, parking, transports, billetterie, règles du stade, etc.)."
    )
  }, [faq])

  const [mode, setMode] = useState<Mode>("faq")

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: defaultMessage,
      timestamp: new Date(),
    },
  ])

  // ✅ Si la FAQ arrive après (chargement async), on met à jour le 1er message uniquement
  useEffect(() => {
    setMessages((prev) => {
      if (prev.length === 0) return prev
      const first = prev[0]
      if (first.role !== "assistant") return prev
      if (first.id !== "1") return prev
      return [{ ...first, content: defaultMessage }, ...prev.slice(1)]
    })
  }, [defaultMessage])

  const [input, setInput] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Pour annuler un stream si l’utilisateur renvoie un message vite
  const streamAbortRef = useRef<AbortController | null>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const quickQuestions = [
    { icon: Clock, text: "Horaires des matchs", key: "horaires" },
    { icon: MapPin, text: "Où me garer ?", key: "parking" },
    { icon: Ticket, text: "Comment acheter un billet ?", key: "billetterie" },
    { icon: Info, text: "Règles du stade", key: "règles" },
  ]

  // --- FAQ: match response from DB
  const findFaqResponse = (userMessage: string): string => {
    const lower = userMessage.toLowerCase()

    for (const [key, response] of Object.entries(faq)) {
      if (key === "default") continue
      if (lower.includes(key.toLowerCase())) return response
    }

    if (/(hôtel|hotel|logement)/i.test(userMessage)) return faq.hotels || defaultMessage
    if (/(transport|navette|métro|metro|bus)/i.test(userMessage)) return faq.transport || defaultMessage
    if (/(billet|acheter|prix|paiement)/i.test(userMessage)) return faq.billetterie || defaultMessage
    if (/(manger|restaurant|nourriture)/i.test(userMessage)) return faq.nourriture || defaultMessage
    if (/(accessibilit|pmr)/i.test(userMessage)) return faq.accessibilité || defaultMessage
    if (/(météo|meteo|température|temperature)/i.test(userMessage)) return faq.météo || defaultMessage

    return defaultMessage
  }

  const handleSend = async (messageText?: string) => {
    const textToSend = (messageText ?? input).trim()
    if (!textToSend) return
    if (isTyping) return // ✅ évite double envoi

    // ✅ annule un stream précédent si existant
    if (streamAbortRef.current) {
      streamAbortRef.current.abort()
      streamAbortRef.current = null
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: textToSend,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsTyping(true)

    try {
      if (mode === "faq") {
        const response = findFaqResponse(textToSend)

        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: response,
          timestamp: new Date(),
        }

        setMessages((prev) => [...prev, assistantMessage])
        return
      }

      // ==========================
      // MODE AI: STREAMING
      // ==========================
      const assistantId = (Date.now() + 1).toString()
      const startedAt = new Date()

      // on ajoute un message assistant vide qu’on va remplir
      setMessages((prev) => [
        ...prev,
        { id: assistantId, role: "assistant", content: "", timestamp: startedAt },
      ])

      const controller = new AbortController()
      streamAbortRef.current = controller

      let acc = ""

      await withTimeout(
        askBackendAIStream(
          textToSend,
          (token) => {
            acc += token
            // Mise à jour du message assistant en place
            setMessages((prev) =>
              prev.map((m) => (m.id === assistantId ? { ...m, content: acc } : m))
            )
          },
          { signal: controller.signal }
        ),
        120000
      )

      streamAbortRef.current = null

      // Si jamais Ollama a renvoyé vide
      if (!acc.trim()) {
        setMessages((prev) =>
          prev.map((m) => (m.id === assistantId ? { ...m, content: defaultMessage } : m))
        )
      }
    } catch (err: any) {
      const msg = String(err?.message || err || "")

      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 2).toString(),
          role: "assistant",
          content:
            mode === "ai"
              ? `❌ Erreur IA (backend).\nAssure-toi que le serveur backend tourne sur le port 8000.\n\nDétail: ${msg}`
              : `❌ Erreur FAQ.\n\nDétail: ${msg}`,
          timestamp: new Date(),
        },
      ])
    } finally {
      setIsTyping(false)
    }
  }

  const badgeText = mode === "faq" ? "FAQ DB" : "IA backend (stream)"

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white py-12">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="bg-white/20 p-3 rounded-full">
              <Sparkles className="size-8" />
            </div>
            <h1 className="text-4xl font-bold">FanBot Assistant</h1>
          </div>
          <p className="text-lg text-purple-100">
            {mode === "faq"
              ? "FAQ depuis la base de données."
              : "IA via backend (stream) — stable & centralisée."}
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Mode Switch */}
        <div className="flex gap-3 mb-6">
          <Button variant={mode === "faq" ? "default" : "outline"} onClick={() => setMode("faq")}>
            FAQ DB
          </Button>
          <Button
            variant={mode === "ai" ? "default" : "outline"}
            onClick={() => setMode("ai")}
            className={mode === "ai" ? "bg-green-600 hover:bg-green-700 text-white" : ""}
          >
            IA backend
          </Button>
        </div>

        {/* Quick Questions */}
        {messages.length <= 1 && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-600 mb-3">Questions fréquentes</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {quickQuestions.map((question) => {
                const Icon = question.icon
                return (
                  <Button
                    key={question.key}
                    variant="outline"
                    className="h-auto py-4 flex-col gap-2 hover:bg-purple-50 hover:border-purple-300"
                    onClick={() => handleSend(question.text)}
                  >
                    <Icon className="size-5 text-purple-600" />
                    <span className="text-xs text-center">{question.text}</span>
                  </Button>
                )
              })}
            </div>
          </div>
        )}

        {/* Chat Area */}
        <Card className="mb-4 shadow-lg">
          <CardHeader className="border-b">
            <CardTitle className="flex items-center gap-2">
              <Bot className="size-5 text-purple-600" />
              Conversation
              <Badge className="ml-2">{badgeText}</Badge>
            </CardTitle>
          </CardHeader>

          <CardContent className="p-0">
            <div className="h-[500px] overflow-y-auto p-6 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${message.role === "user" ? "flex-row-reverse" : "flex-row"}`}
                >
                  <div
                    className={`flex-shrink-0 size-10 rounded-full flex items-center justify-center ${
                      message.role === "user" ? "bg-blue-600" : "bg-gradient-to-br from-purple-600 to-pink-600"
                    }`}
                  >
                    {message.role === "user" ? (
                      <UserIcon className="size-5 text-white" />
                    ) : (
                      <Bot className="size-5 text-white" />
                    )}
                  </div>

                  <div className={`flex-1 ${message.role === "user" ? "flex justify-end" : ""}`}>
                    <div
                      className={`inline-block max-w-[80%] rounded-2xl px-4 py-3 ${
                        message.role === "user" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-900"
                      }`}
                    >
                      <p className="text-sm leading-relaxed whitespace-pre-line">{message.content}</p>
                      <span
                        className={`text-xs mt-1 block ${
                          message.role === "user" ? "text-blue-100" : "text-gray-500"
                        }`}
                      >
                        {message.timestamp.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  </div>
                </div>
              ))}

              {isTyping && mode === "faq" && (
                <div className="flex gap-3">
                  <div className="flex-shrink-0 size-10 rounded-full flex items-center justify-center bg-gradient-to-br from-purple-600 to-pink-600">
                    <Bot className="size-5 text-white" />
                  </div>
                  <div className="bg-gray-100 rounded-2xl px-4 py-3">
                    <div className="flex gap-1">
                      <div className="size-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <div className="size-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <div className="size-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </CardContent>
        </Card>

        {/* Input Area */}
        <Card className="shadow-lg">
          <CardContent className="p-4">
            <div className="flex gap-2">
              <Input
                placeholder={mode === "faq" ? "Question (FAQ)…" : "Question (IA backend)…"}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                className="flex-1"
              />
              <Button onClick={() => handleSend()} className="gap-2 bg-gradient-to-r from-purple-600 to-pink-600">
                <Send className="size-4" />
                Envoyer
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
