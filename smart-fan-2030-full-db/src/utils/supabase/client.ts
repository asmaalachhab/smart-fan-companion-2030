import { createClient } from "@supabase/supabase-js"

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

if (!url || !anon) {
  // Ne pas casser le build: l'UI affichera un message d'erreur.
  console.warn("Supabase env missing: VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY")
}

export const supabase = createClient(url ?? "", anon ?? "")
