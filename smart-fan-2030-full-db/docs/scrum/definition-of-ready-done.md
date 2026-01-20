# Definition of Ready (DoR) & Definition of Done (DoD)

## DoR — une STORY est “Ready” si
- Objectif clair + valeur utilisateur.
- **Acceptance Criteria** listés et testables.
- Maquette / écran concerné identifié (ou description UI).
- Données/API nécessaires identifiées (ou “mock” assumé).
- Dépendances connues (et pas bloquantes).
- Estimée en Story Points.

## DoD — une STORY est “Done” si
- Code livré (front/back/db) + pas d’erreurs console.
- Tests minimum :
  - ✅ cas nominal
  - ✅ 1–2 cas d’erreur
- UI cohérente (responsive basique) + texte lisible.
- Logs d’erreur utiles côté backend.
- Migration/SQL versionnée si DB modifiée.
- PR (ou commit) avec description + screenshots (si UI).
- La fonctionnalité est **démontrable** en Sprint Review.

## Qualité “minimum pro”
- Pas de secrets dans Git (`.env` seulement).
- Validation des inputs côté backend.
- Messages d’erreur compréhensibles.
- Temps de chargement correct (loading states).

