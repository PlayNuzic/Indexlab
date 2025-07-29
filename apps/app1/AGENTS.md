# Instruccions de Codex

Aquesta app comparteix la configuració amb l'arrel. Consulta l'arrel `AGENTS.md` per executar `setup.sh` i els tests.
Aquesta app només depèn de l'estil compartit a `libs/shared-ui` i no utilitza altres mòduls.

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

A continuació obre l'URL indicat pel servidor i navega fins `apps/app1`.
