# Workflow de travail (Scrum + Kanban board)

Même si Scrum est “time-boxed”, on utilise un board type Kanban pour suivre.

## Colonnes recommandées
- **Backlog** (trié par priorité)
- **Ready** (groomed + DoR OK)
- **In Progress**
- **In Review** (PR ouvert)
- **QA / Test**
- **Done**

## Règles
- WIP limit conseillé : **2 cartes max/dev** en “In Progress”.
- Une carte va en “In Review” seulement si : PR ouvert + description + capture si UI.
- “Done” = DoD validée + déployé (ou au moins mergé sur main + tests OK).

## Branching Git (simple)
- Branche : `feature/<ticket-id>-<slug>`
- PR vers `main`
- Rebase/squash si possible

## Convention tickets
Format : `SFC-###` (ex : SFC-012)

## Exemple de checklist PR
- [ ] Story / ticket lié (SFC-###)
- [ ] Tests passent
- [ ] Pas de secrets commités (.env)
- [ ] Validation UI (responsive basique)
