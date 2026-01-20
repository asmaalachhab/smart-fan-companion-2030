import { useEffect, useMemo, useRef, useState } from "react"
import { Toaster } from "./components/ui/sonner"
import { Navigation } from "./components/Navigation"
import { HomePage } from "./components/HomePage"
import { TicketingPage } from "./components/TicketingPage"
import { AIAssistantPage } from "./components/AIAssistantPage"
import { AccountPage } from "./components/AccountPage"
import { MapPage } from "./components/MapPage"

import type { Match, Stadium, FanZone, Recommendation, Ticket, Profile } from "./data/types"
import {
  clearUserCache,
  envReady,
  fetchChatFaq,
  fetchFanZones,
  fetchMatches,
  fetchMyTickets,
  fetchRecommendations,
  fetchStadiums,
  getProfile,
  purchaseTicket,
} from "./data/supabaseRepo"

import { supabase } from "../utils/supabase/client"
import { toast } from "sonner"

// ✅ source unique du type Page (utilisé par Navigation/HomePage/etc)
export type Page = "home" | "ticketing" | "map" | "assistant" | "account"

function withTimeout<T>(p: Promise<T>, ms = 12000): Promise<T> {
  return Promise.race<T>([
    p,
    new Promise<T>((_, rej) => setTimeout(() => rej(new Error(`TIMEOUT_${ms}ms`)), ms)),
  ])
}

async function pingSupabaseRest(
  ms = 12000
): Promise<{ ok: true } | { ok: false; status: number; body: string }> {
  const url = String(import.meta.env.VITE_SUPABASE_URL || "").replace(/\/$/, "")
  const key = String(import.meta.env.VITE_SUPABASE_ANON_KEY || "")
  const endpoint = `${url}/rest/v1/stadiums?select=id&limit=1`

  const controller = new AbortController()
  const t = setTimeout(() => controller.abort(), ms)

  try {
    const res = await fetch(endpoint, {
      method: "GET",
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      signal: controller.signal,
    })

    const body = await res.text().catch(() => "")
    if (!res.ok) return { ok: false, status: res.status, body }
    return { ok: true }
  } catch (e: any) {
    const msg = String(e?.name || e?.message || "fetch failed")
    return { ok: false, status: 0, body: msg }
  } finally {
    clearTimeout(t)
  }
}

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>("home")

  const [profile, setProfile] = useState<Profile | null>(null)
  const [tickets, setTickets] = useState<Ticket[]>([])

  const [stadiums, setStadiums] = useState<Stadium[]>([])
  const [matches, setMatches] = useState<Match[]>([])
  const [fanZones, setFanZones] = useState<FanZone[]>([])
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [faq, setFaq] = useState<Record<string, string>>({})

  const [isLoading, setIsLoading] = useState<boolean>(true)

  const isAuthenticated = !!profile

  // ✅ Empêche double load en dev (StrictMode)
  const loadedRef = useRef(false)

  // ✅ Empêche refreshAuthBoundData en parallèle
  const inFlightAuthRef = useRef<Promise<void> | null>(null)

  const onNavigate = (page: Page) => setCurrentPage(page)

  const stadiumById = useMemo(() => {
    const m = new Map<string, Stadium>()
    for (const s of stadiums) m.set(s.id, s)
    return m
  }, [stadiums])

  const matchesWithStadiumName = useMemo(() => {
    return matches.map((match: any) => {
      if (match.stadium) return match
      const st = stadiumById.get(match.stadiumId ?? match.stadium_id)
      return { ...match, stadium: st?.name ?? match.stadium }
    })
  }, [matches, stadiumById])

  const ticketsWithMatch = useMemo(() => {
    const byId = new Map(matchesWithStadiumName.map((m: any) => [m.id, m]))
    return tickets.map((t: any) => ({ ...t, match: byId.get(t.matchId ?? t.match_id) }))
  }, [tickets, matchesWithStadiumName])

  async function refreshAuthBoundData() {
    if (inFlightAuthRef.current) return inFlightAuthRef.current

    const run = (async () => {
      try {
        const p = await withTimeout(getProfile(), 12000)
        setProfile(p)

        if (p) {
          const my = await withTimeout(fetchMyTickets(), 12000)
          setTickets(my)
        } else {
          setTickets([])
        }
      } catch {
        setProfile(null)
        setTickets([])
      } finally {
        inFlightAuthRef.current = null
      }
    })()

    inFlightAuthRef.current = run
    return run
  }

  useEffect(() => {
    let isMounted = true

    if (loadedRef.current) return
    loadedRef.current = true

    async function loadAll() {
      if (!envReady()) {
        if (isMounted) setIsLoading(false)
        toast.error("Configuration Supabase manquante (.env)")
        return
      }

      try {
        if (isMounted) setIsLoading(true)

        // Ping REST: alerte mais ne bloque pas l'app
        const ping = await pingSupabaseRest(8000)
        if (!ping.ok) {
          if (ping.status === 0) toast.error(`Réseau/Timeout Supabase (${ping.body})`)
          else toast.error(`Supabase REST HTTP ${ping.status}: ${ping.body || "Erreur"}`)
        }

        const [s, m, fz, rec, faqRows] = await Promise.all([
          withTimeout(fetchStadiums(), 20000),
          withTimeout(fetchMatches(), 20000),
          withTimeout(fetchFanZones(), 20000),
          withTimeout(fetchRecommendations(), 20000),
          withTimeout(fetchChatFaq(), 20000),
        ])

        if (!isMounted) return

        setStadiums(s)
        setMatches(m)
        setFanZones(fz)
        setRecommendations(rec)
        setFaq(faqRows)

        await refreshAuthBoundData()
      } catch (err: any) {
        console.error(err)
        const msg = String(err?.message || "Erreur de chargement")

        if (msg.toLowerCase().includes("does not exist") || msg.toLowerCase().includes("relation")) {
          toast.error("Base Supabase non initialisée (tables manquantes). Lance le SQL de création des tables.")
        } else if (msg.toLowerCase().includes("timeout")) {
          toast.error("Timeout: Supabase ne répond pas (URL/clé/réseau).")
        } else {
          toast.error(msg)
        }
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    loadAll()

    const { data: sub } = supabase.auth.onAuthStateChange(async () => {
      clearUserCache()
      await refreshAuthBoundData()
    })

    return () => {
      isMounted = false
      sub?.subscription?.unsubscribe()
    }
  }, [])

  const handlePurchaseTicket = async (match: Match, section: string, seat: string) => {
    if (!isAuthenticated) return

    const parts = seat.split("-")
    const row = parts[1] || "A"
    const seatNo = parts[2] || "1"

    try {
      await withTimeout(
        purchaseTicket({
          matchId: match.id,
          section,
          row,
          seat: seatNo,
        }),
        20000
      )

      const [m, my] = await Promise.all([
        withTimeout(fetchMatches(), 20000),
        withTimeout(fetchMyTickets(), 20000),
      ])
      setMatches(m)
      setTickets(my)
    } catch (err: any) {
      if (String(err?.message || "").toLowerCase().includes("sold_out")) {
        toast.error("Désolé, ce match est complet.")
        return
      }
      toast.error(err?.message ?? "Achat impossible")
    }
  }

  const renderPage = () => {
    if (!envReady()) {
      return (
        <div className="max-w-3xl mx-auto px-4 py-16">
          <div className="p-6 rounded-xl border bg-white">
            <h2 className="text-2xl font-bold mb-2">Configuration Supabase requise</h2>
            <p className="text-gray-600 mb-4">
              Ajoute <code className="px-1 bg-gray-100 rounded">VITE_SUPABASE_URL</code> et{" "}
              <code className="px-1 bg-gray-100 rounded">VITE_SUPABASE_ANON_KEY</code> dans ton fichier{" "}
              <code className="px-1 bg-gray-100 rounded">.env</code>.
            </p>
            <p className="text-gray-600">Tu trouveras les clés dans Supabase → Project Settings → API.</p>
          </div>
        </div>
      )
    }

    if (isLoading) {
      return (
        <div className="max-w-3xl mx-auto px-4 py-16">
          <div className="p-6 rounded-xl border bg-white">Chargement…</div>
        </div>
      )
    }

    switch (currentPage) {
      case "home":
        return <HomePage onNavigate={onNavigate} matches={matchesWithStadiumName as any} />
      case "ticketing":
        return (
          <TicketingPage
            isAuthenticated={isAuthenticated}
            matches={matchesWithStadiumName as any}
            stadiums={stadiums}
            onPurchaseTicket={handlePurchaseTicket}
          />
        )
      case "map":
        return <MapPage recommendations={recommendations} fanZones={fanZones} stadiums={stadiums} />
      case "assistant":
        return <AIAssistantPage faq={faq} />
      case "account":
        return (
          <AccountPage
            profile={profile}
            tickets={ticketsWithMatch as any}
            onAuthChanged={async () => {
              clearUserCache()
              await refreshAuthBoundData()
            }}
          />
        )
      default:
        return <HomePage onNavigate={onNavigate} matches={matchesWithStadiumName as any} />
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <Navigation currentPage={currentPage} onNavigate={onNavigate} />
      <div className="pt-16 pb-20 md:pb-0">{renderPage()}</div>
      <Toaster position="top-center" />
    </div>
  )
}
