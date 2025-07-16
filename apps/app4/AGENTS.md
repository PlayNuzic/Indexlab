# Instruccions de Codex

Aquesta app comparteix la configuració amb l'arrel. Consulta l'arrel `AGENTS.md` per executar `setup.sh` i els tests. Trobaràs informació addicional al `README.md` d'aquest directori.
Aquesta app utilitza el mòdul compartit `libs/notation` per a dibuixar intervals en pentagrama.

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
