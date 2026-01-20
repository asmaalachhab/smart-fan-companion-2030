# Sprint 1 — Auth + Liste des matchs + Détails

## Sprint Goal
"Un utilisateur peut créer un compte, se connecter, voir les matchs, et ouvrir une page détail."

## Sélection de stories (recommandé)
- SFC-010 : Inscription / Connexion (UI + API)
- SFC-011 : Persistance session (token/cookie)
- SFC-020 : Liste des matchs (API + UI cards)
- SFC-021 : Page détail match (date, stade, équipes)

## Tâches techniques (exemples)
- Backend
  - routes auth `POST /api/auth/register`, `POST /api/auth/login`
  - validation inputs + messages d’erreur
  - endpoints matchs `GET /api/matches`, `GET /api/matches/:id`
- Frontend
  - pages `login`, `register`
  - state auth (context)
  - pages `matches` + `match/[id]`

## Démo Review
- Inscription + login OK
- On voit la liste des matchs
- On ouvre un match et on voit les infos
