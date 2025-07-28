# Instruccions de Codex

Aquesta app comparteix la configuració amb l'arrel. Consulta l'arrel `AGENTS.md` per executar `setup.sh` i els tests. Aquesta app utilitza els mòduls compartits `libs/notation` i `shared/cards.js`.
S'ha incorporat el mòdul de presets compartit (`shared/presets.js`) juntament amb un `snapshotUtils.js` propi per gestionar `app9Snapshots`.

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
A continuació obre l'URL indicat pel servidor i navega fins `apps/app9`.
