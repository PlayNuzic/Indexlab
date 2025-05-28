## Entorn OpenAI Codex

Es pot fer push directament des de l’entorn de Codex:

1. A **Settings → Environments** (del teu repo de GitHub) crea un entorn i afegeix el secret `GITHUB_TOKEN` amb permisos **repo**.
2. Usa el `setup.sh` del repo per preparar Git, Node i enganxar el token.
3. Cada sessió de Codex quedarà llesta per a `git add`, `git commit` i `git push` (via HTTPS amb PAT).

> **Atenció**: un cop acaba el `setup.sh`, la sessió perd accés a Internet; per tant, totes les dependències han d’estar instal·lades dins del `setup.sh`.
