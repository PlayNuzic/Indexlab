# Instruccions de Codex

Aquesta app comparteix la configuració amb l'arrel. Consulta l'arrel `AGENTS.md` per executar `setup.sh` i els tests. Trobaràs informació addicional al `README.md` d'aquest directori.
Aquesta app utilitza `libs/notation` per dibuixar pentagrames i `libs/sound` per a l'àudio. Consulta el README per a la resta de detalls.

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

A continuació obre l'URL indicat pel servidor i navega fins `apps/app4`.
