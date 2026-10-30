export type Clock = Record<string, number>;

export type Op =
  | { kind: "log"; id: string; device: string; clock: Clock; batch: string; stage: string; qty: number }
  | { kind: "advance"; id: string; device: string; clock: Clock; batch: string; to: string };

export type Replica = {
  device: string;
  clock: Clock;
  ops: Op[];
};

export function replica(device: string): Replica {
  return { device, clock: { [device]: 0 }, ops: [] };
}

export function tick(r: Replica): Clock {
  r.clock[r.device] = (r.clock[r.device] ?? 0) + 1;
  return { ...r.clock };
}

export function logWork(r: Replica, batch: string, stage: string, qty: number): Op {
  const op: Op = {
    kind: "log",
    id: `${r.device}-${r.clock[r.device] ?? 0 + 1}`,
    device: r.device,
    clock: tick(r),
    batch,
    stage,
    qty,
  };
  op.id = `${r.device}-${op.clock[r.device]}`;
  r.ops.push(op);
  return op;
}

export function advance(r: Replica, batch: string, to: string): Op {
  const op: Op = {
    kind: "advance",
    id: "",
    device: r.device,
    clock: tick(r),
    batch,
    to,
  };
  op.id = `${r.device}-${op.clock[r.device]}`;
  r.ops.push(op);
  return op;
}

export function happensBefore(a: Clock, b: Clock): boolean {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  let strict = false;
  for (const k of keys) {
    const av = a[k] ?? 0;
    const bv = b[k] ?? 0;
    if (av > bv) return false;
    if (av < bv) strict = true;
  }
  return strict;
}

export type Conflict = { batch: string; left: Op; right: Op; reason: string };

export type Merged = {
  ops: Op[];
  totals: { batch: string; stage: string; qty: number }[];
  stages: { batch: string; stage: string }[];
  conflicts: Conflict[];
};

export function merge(replicas: Replica[]): Merged {
  const seen = new Set<string>();
  const ops: Op[] = [];
  for (const r of replicas) {
    for (const op of r.ops) {
      if (seen.has(op.id)) continue;
      seen.add(op.id);
      ops.push(op);
    }
  }
  ops.sort((a, b) => sum(a.clock) - sum(b.clock));

  const totals = new Map<string, number>();
  const advances = new Map<string, Op[]>();
  for (const op of ops) {
    if (op.kind === "log") {
      const key = `${op.batch}|${op.stage}`;
      totals.set(key, (totals.get(key) ?? 0) + op.qty);
    } else {
      const list = advances.get(op.batch) ?? [];
      list.push(op);
      advances.set(op.batch, list);
    }
  }

  const conflicts: Conflict[] = [];
  const stages: { batch: string; stage: string }[] = [];
  for (const [batch, list] of advances) {
    for (let i = 0; i < list.length; i++) {
      for (let j = i + 1; j < list.length; j++) {
        const a = list[i] as Op;
        const b = list[j] as Op;
        if (a.kind !== "advance" || b.kind !== "advance" || a.to === b.to) continue;
        if (!happensBefore(a.clock, b.clock) && !happensBefore(b.clock, a.clock)) {
          conflicts.push({ batch, left: a, right: b, reason: "two devices advanced the batch without seeing each other" });
        }
      }
    }
    const winner = list[list.length - 1];
    if (winner && winner.kind === "advance") stages.push({ batch, stage: winner.to });
  }

  return {
    ops,
    totals: [...totals.entries()].map(([key, qty]) => {
      const [batch, stage] = key.split("|");
      return { batch: batch as string, stage: stage as string, qty };
    }),
    stages,
    conflicts,
  };
}

function sum(c: Clock): number {
  return Object.values(c).reduce((s, n) => s + n, 0);
}

export function syncInto(target: Replica, from: Replica): void {
  const have = new Set(target.ops.map((o) => o.id));
  for (const op of from.ops) {
    if (!have.has(op.id)) target.ops.push(op);
  }
  for (const [k, v] of Object.entries(from.clock)) {
    target.clock[k] = Math.max(target.clock[k] ?? 0, v);
  }
}
