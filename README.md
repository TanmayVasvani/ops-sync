# Ops sync

Offline logs from two phones and a laptop. Quantities add. A split advance is a conflict.

**Author:** Tanmay Vaswani

## What it does

Each device keeps its own log and a vector clock. While offline, a phone can log good quantity or advance a batch. Sync exchanges the ops.

- Two logs on the same batch and stage add. 200 from one phone and 150 from the other is 350.
- Two advances that never saw each other are flagged. The batch is not silently moved.
- An advance made after a sync is ordered, so it is not a conflict.

## Run

```bash
npm install
npm test
npm run dev
npm run build
```

## Stack

TypeScript, Vite, React. The replica, the clock and the merge are in `src/lib/sync.ts`.

## License

MIT
