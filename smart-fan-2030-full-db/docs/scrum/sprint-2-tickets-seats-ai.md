# Sprint 2 — Billetterie + Places + FanBot (2 semaines)

## Sprint Goal
Permettre de **réserver un billet** avec **sélection de section/place** et poser des questions au **FanBot**.

## Stories sélectionnées
- SFC-020: Afficher sections d’un stade + prix (3)
- SFC-021: Réserver billet (création ticket) (5)
- SFC-022: Générer QR / page ticket (3)
- SFC-023: Choix de place (simple : section + rang + siège) (5)
- SFC-024: FanBot FAQ (réponses à questions Coupe du Monde 2030) (3)

## Tâches techniques (exemples)
- DB : `tickets`, `ticket_items` / `seats` selon ton schéma
- API : `POST /api/tickets`, `GET /api/tickets/:id`
- UI : page `/checkout` / `/ticket/:id`
- IA : endpoint simple `POST /api/ai/chat` (rule-based ou LLM selon ton choix)

## Démo attendue
- Choisir un match → sélectionner une section/siège → créer ticket
- Ouvrir ticket et voir QR
- Poser une question FanBot (ex : “où est le stade ?”) et obtenir une réponse
