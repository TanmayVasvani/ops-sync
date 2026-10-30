import { useState } from "react";
import { Shell } from "./components/shell";
import { advance, logWork, merge, replica, syncInto, type Replica } from "./lib/sync";

const BATCHES = ["B-0708-01", "B-0706-02"];
const STAGES = ["molding", "tufting", "trimming", "packing", "done"];

export function App() {
  const [devices, setDevices] = useState<Replica[]>(() => [
    replica("phone-a"),
    replica("phone-b"),
    replica("laptop"),
  ]);
  const merged = merge(devices);

  function update(i: number, fn: (r: Replica) => void) {
    setDevices((prev) => {
      const next = prev.map((r) => ({ ...r, clock: { ...r.clock }, ops: [...r.ops] }));
      fn(next[i] as Replica);
      return next;
    });
  }

  function syncAll() {
    setDevices((prev) => {
      const next = prev.map((r) => ({ ...r, clock: { ...r.clock }, ops: [...r.ops] }));
      for (const a of next) for (const b of next) syncInto(a, b);
      return next;
    });
  }

  return (
    <Shell project="Ops sync">
      <header className="max-w-3xl">
        <p className="text-xs tracking-widest text-teal uppercase">Offline first · two phones, one laptop</p>
        <h1 className="mt-2 text-4xl md:text-5xl">Log offline. Sync. Keep both quantities. Flag a split advance.</h1>
        <p className="mt-4 text-muted md:text-lg">
          Quantities on the same batch add. Two advances that never saw each other are a conflict. An advance after a sync is not.
        </p>
      </header>
      <button className="mt-6 border border-ink bg-ink px-4 py-2 text-paper" onClick={syncAll}>
        Sync all
      </button>
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        {devices.map((d, i) => (
          <Device key={d.device} r={d} onLog={(b, s, q) => update(i, (r) => logWork(r, b, s, q))} onAdvance={(b, s) => update(i, (r) => advance(r, b, s))} />
        ))}
      </div>
      <section className="mt-8 border border-line p-4">
        <h2 className="text-2xl">Merged</h2>
        <ul className="mt-3 text-sm">
          {merged.totals.map((t) => (
            <li key={`${t.batch}-${t.stage}`} className="border-t border-line py-2">
              {t.batch} · {t.stage} · {t.qty} ok
            </li>
          ))}
          {merged.stages.map((s) => (
            <li key={s.batch} className="border-t border-line py-2">
              {s.batch} stage → {s.stage}
            </li>
          ))}
        </ul>
        {merged.conflicts.length ? (
          <p className="mt-3 text-rust">
            Conflict on {merged.conflicts[0]?.batch}: {merged.conflicts[0]?.reason}
          </p>
        ) : (
          <p className="mt-3 text-muted">No conflicts.</p>
        )}
      </section>
    </Shell>
  );
}

function Device({
  r,
  onLog,
  onAdvance,
}: {
  r: Replica;
  onLog: (batch: string, stage: string, qty: number) => void;
  onAdvance: (batch: string, stage: string) => void;
}) {
  const [batch, setBatch] = useState(BATCHES[0] as string);
  const [stage, setStage] = useState("packing");
  const [qty, setQty] = useState(100);
  return (
    <section className="border border-line p-4">
      <h2 className="text-2xl">{r.device}</h2>
      <p className="text-sm text-muted">{r.ops.length} local ops</p>
      <label className="mt-3 block text-sm">
        Batch
        <select className="mt-1 w-full border border-line bg-paper p-2" value={batch} onChange={(e) => setBatch(e.target.value)}>
          {BATCHES.map((b) => <option key={b}>{b}</option>)}
        </select>
      </label>
      <label className="mt-2 block text-sm">
        Stage
        <select className="mt-1 w-full border border-line bg-paper p-2" value={stage} onChange={(e) => setStage(e.target.value)}>
          {STAGES.map((s) => <option key={s}>{s}</option>)}
        </select>
      </label>
      <label className="mt-2 block text-sm">
        Qty
        <input className="mt-1 w-full border border-line bg-paper p-2" type="number" value={qty} onChange={(e) => setQty(Number(e.target.value))} />
      </label>
      <div className="mt-3 flex gap-2">
        <button className="border border-line px-3 py-2 text-sm" onClick={() => onLog(batch, stage, qty)}>Log</button>
        <button className="border border-line px-3 py-2 text-sm" onClick={() => onAdvance(batch, stage)}>Advance</button>
      </div>
    </section>
  );
}
