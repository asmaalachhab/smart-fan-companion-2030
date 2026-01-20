# Sprint 1 — MVP Auth + Matchs (2 semaines)

## Sprint Goal
Permettre à un utilisateur de **créer un compte / se connecter** et de **consulter la liste des matchs**.

## Stories sélectionnées
- SFC-010: Inscription (UI + API + DB) (3)
- SFC-011: Connexion (UI + API) (3)
- SFC-012: Sessions / token persist (2)
- SFC-013: Liste des matchs (UI) (3)
- SFC-014: Détails match (page) (2)
- SFC-015: Filtre par ville / date (3)

## Tâches techniques (exemples)
- Endpoints : `POST /api/auth/register`, `POST /api/auth/login`
- UI : page `/login` et `/register`
- UI : page `/matches` + `MatchCard`
- Tests : auth (au minimum happy path)

## Démo attendue
- Un utilisateur peut s’inscrire puis se connecter
- Il peut voir les matchs et ouvrir la page détails
