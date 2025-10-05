// Side Act sA() hooks

export const sA = (effect, depsFn = null) => {
  const eid = currentEID();             // must be called inside organ render/patch
  const inst = o.get(eid);
  if (!inst) return;

  // ensure organ ctx has a hooks map
  if (!inst.ctx.has('sA-hooks')) inst.ctx.set('sA-hooks', new Map());
  const hk = inst.ctx.get('sA-hooks');

  // unique key per call (could be improved for multiple calls)
  const key = `sA-${hk.size}`;

  const run = () => {
    tracking = run;
    const deps = depsFn ? depsFn() : [];
    tracking = null;

    const prev = hk.get(key);
    const depsChanged = !prev || deps.some((v, i) => v !== prev.deps[i]);

    if (depsChanged) {
      // run previous cleanup if any
      if (prev?.cleanup) prev.cleanup();

      // run effect and store its cleanup
      const cleanup = effect();
      hk.set(key, { deps, cleanup });

      // also register cleanup in organ-level effects for auto cleanup
      if (cleanup) inst.effects.add({ cleanup });
    }
  };

  s.add(run, eid);
};