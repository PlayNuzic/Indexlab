# Instruccions de Codex

Aquesta app comparteix la configuració amb l'arrel. Consulta l'arrel `AGENTS.md` per executar `setup.sh` i els tests.
Aquesta app utilitza `libs/notation` per al pentagrama i `libs/sound` per a l'àudio. La lògica de manipulació de targetes es documenta a `docs/cards-transformations.md`.

## Tests
Des del directori arrel executa:

```bash
npm test
```

## Desenvolupament local
Cal servir `index.html` des d'un servidor HTTP, per exemple:

```bash
npx http-server
```

A continuació obre l'URL indicat pel servidor i navega fins `apps/app5`.
