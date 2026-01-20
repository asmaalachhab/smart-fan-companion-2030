# Smart Fan Companion 2030 (Option A2)

Cette version est **100% compatible** avec le frontend Figma Make (structure `src/app/...`) et ajoute :
- **Supabase Database + Auth** (email + mot de passe)
- **Email confirmation désactivée** (Option A2)
- Billetterie réelle (achat via RPC `purchase_ticket`)
- FanBot FAQ (réponses depuis la table `chatbot_faq`)

## 1) Prérequis
- Node.js 18+
- Un projet Supabase

## 2) Setup Supabase (DB + Seed)
1. Supabase → SQL Editor → exécute :
   - `supabase/migrations/0001_init.sql`
   - `supabase/seed/0002_seed.sql`
2. Supabase → Authentication → Providers → Email
   - ✅ **Enable email signup** = ON
   - ✅ **Confirm email** = OFF  (important : Option A2)
   - ✅ Password min = 6 (par défaut)
   
   Astuce : si tu ne trouves pas exactement les libellés, cherche "Confirm email" dans les réglages Auth.

## 3) Config Frontend
1. Copie `.env.example` → `.env`
2. Mets tes clés Supabase :
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

## 4) Lancer
```bash
npm install
npm run dev
```

## Pages
- Accueil
- Billetterie (achat)
- Carte (Fan zones + recommandations)
- Assistant IA (FAQ)
- Mon compte (signup / login / logout + mes billets)

---

## 🧭 Gestion de projet (Scrum)
Les artefacts Scrum (backlog, sprints, DoR/DoD, templates GitHub) sont dans : `docs/scrum/`.

"# Smart-Fan-Companion-2030-Scrum" 
