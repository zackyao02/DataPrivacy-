# Data Privacy Irony Game

H5 Canvas / React prototype for the data privacy irony game. This branch contains the current Program B logic framework plus the AI Studio preview app.

## Program B Entry Points

- `src/game/index.js`: public game-logic API for Program A UI integration.
- `src/data/mockContent.js`: mock data source for Program C content replacement.
- `test/`: pure logic tests for packaging, day loop, and save/load.

## Run Locally

Prerequisite: Node.js

```bash
npm install
npm test
npm run dev
```

Default local URL:

```text
http://localhost:3000/
```
