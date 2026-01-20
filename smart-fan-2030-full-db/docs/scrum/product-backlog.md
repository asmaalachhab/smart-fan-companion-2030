# Product Backlog — Smart Fan Companion 2030

> Vision : une plateforme web moderne (PWA) pour fans de la Coupe du Monde 2030 : matchs, billets, places, carte, FanBot.

## Échelles
- **Priorité** : P0 (critique) → P3 (nice-to-have)
- **Story Points** : 1,2,3,5,8,13

---

## EPIC 1 — Auth & Profil
### STORY A1 (P0, 5 pts) — Inscription simple
**En tant que** fan, **je veux** créer un compte (email + mot de passe) **afin de** sauvegarder mes réservations.

AC:
- Formulaire inscription : nom, email, password.
- Erreurs si email invalide / déjà utilisé.
- Après inscription : connecté + redirection Dashboard.

### STORY A2 (P0, 3 pts) — Connexion / Déconnexion
AC:
- Login valide → token/session.
- Logout → suppression session.
- State UI : bouton “Se connecter” ↔ “Mon compte”.

### STORY A3 (P1, 3 pts) — Page Profil
AC:
- Affiche nom + email.
- Liste des tickets/réservations de l’utilisateur.

---

## EPIC 2 — Catalogue Matchs
### STORY M1 (P0, 5 pts) — Liste des matchs
AC:
- Afficher cartes match (équipes, date/heure, stade, ville, prix à partir de).
- Filtres : pays/ville/date.

### STORY M2 (P1, 3 pts) — Détail match
AC:
- Page détail : infos complètes + CTA “Réserver”.

### STORY M3 (P2, 3 pts) — Admin seed data (matchs/stades)
AC:
- Script/endpoint pour injecter des données de démo.

---

## EPIC 3 — Billetterie & Places
### STORY T1 (P0, 8 pts) — Réserver un billet (flux de base)
AC:
- Choix quantité + catégorie (section).
- Calcul total.
- Réservation enregistrée en DB.

### STORY T2 (P1, 8 pts) — Plan de places (simple)
AC:
- UI de sélection de places (grille/sections).
- Places indisponibles désactivées.

### STORY T3 (P1, 5 pts) — Génération ticket (QR)
AC:
- Après réservation : ticket avec QR code.
- Page “Mes tickets” + téléchargement/affichage.

---

## EPIC 4 — Carte interactive (stades & fan zones)
### STORY MAP1 (P1, 5 pts) — Carte des stades
AC:
- Carte interactive : pins stades + popup infos.

### STORY MAP2 (P2, 3 pts) — Fan zones
AC:
- Pins fan zones + filtre ville.

---

## EPIC 5 — FanBot (Assistant IA)
### STORY AI1 (P0, 5 pts) — Chat UI + base FAQ
AC:
- Chat interface.
- Réponses à partir d’une base FAQ (JSON/DB) + fallback.

### STORY AI2 (P1, 8 pts) — Q/R sur matchs & réservation
AC:
- Intent : horaires, stades, prix, “comment réserver”.
- Récupère données match depuis API.

---

## EPIC 6 — Paiement & Notifications (mock)
### STORY P1 (P2, 3 pts) — Paiement “mock”
AC:
- Simuler paiement succès/échec (pas de vrai paiement).

### STORY N1 (P2, 3 pts) — Email/notification (mock)
AC:
- Simuler “email envoyé” + log.

---

## EPIC 7 — Non-fonctionnel
### STORY NF1 (P0, 3 pts) — Logs & gestion erreurs
### STORY NF2 (P1, 3 pts) — Performance basique (lazy loading)
### STORY NF3 (P1, 3 pts) — Sécurité minimum (rate limit + validation)

