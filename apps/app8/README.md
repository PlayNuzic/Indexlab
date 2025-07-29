# App8 – Ear Training amb Perfils

Aquesta versió ampliada del joc d'intervals permet crear perfils d'usuari amb avatar i estadístiques. Els nivells funcionen igual que a l'app original però es poden repetir automàticament els intervals fallats en mode de pràctica.

## Usage

Serveix la carpeta amb un servidor local i obre `apps/app8/index.html`:

```bash
npx http-server
```

## Features

- Gestor de **perfils** amb cinc ranures: permet crear, esborrar i editar avatars.
- Deu nivells d'entrenament amb opcions de **pràctica** dels intervals fallats.
- Estadístiques de cada perfil i historial de respostes.
- Selecció d'**instrument** per reproduir els intervals.
- Resposta ràpida mitjançant botons i resum al final de cada nivell.

## Shared Libraries

Aquesta app utilitza `libs/ear-training`, `libs/sound` i `libs/notation` a més de l'estil comú de `libs/shared-ui`.

Run tests from the repository root with:

```bash
npm test
```
