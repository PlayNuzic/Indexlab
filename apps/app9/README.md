# App9 – Permutacions i Rotacions d'Acords

Aquesta aplicació genera acords a partir d'una entrada numèrica **eA** o **Ac** i mostra totes les permutacions i rotacions possibles. Els acords es poden visualitzar com a cartes i en pentagrama.

## Ús

Serveix la carpeta amb un servidor local i obre `apps/app9/index.html`:

```bash
npx http-server
```

Introdueix els intervals o notes al camp de text i utilitza els botons **Rotació** i **Permutació** per canviar la visualització de les opcions.

En seleccionar un pentagrama petit es manté l'ordre dels components d'aquella permutació. Només en prémer el botó **Generar** es reordenen de nou a l'ordre alfabètic (a b c d...).

### Features

- Selector d'escala amb rotacions i arrel.
- Seqüències **eA** o **Ac** amb transposició global i botó **Generar**.
- Modes **Rotació** i **Permutació** per explorar diferents disposicions d'acords.
- Cartes drag & drop amb botons per duplicar i transposar.
- Pentagrama opcional amb detecció de l'arrel, classificació Forte i colors d'intervals.
- Presets locals per guardar configuracions (descarregar/carregar en JSON).
