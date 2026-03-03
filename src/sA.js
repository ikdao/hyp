
// Side Act sA()
export const sA = (effect, depsFn = null, explicitEI = null) => {
    const ei = explicitEI ?? e.currentEI(); // fallback to currentEI
    if (!ei) return;
    const inst = o.get(ei);
    if (!inst) return;

    if (!inst.ctx.has('sA-hooks')) inst.ctx.set('sA-hooks', new Map());
    const hk = inst.ctx.get('sA-hooks');
    const key = `sA-${hk.size}`;

    const isEqualDeps = (a, b) => {
        if (!a || !b || a.length !== b.length) return false;
        for (let i = 0; i < a.length; i++) {
            if (!Object.is(a[i], b[i])) return false;
        }
        return true;
    };
    let unsubscribers = [];
    const run = () => {
        tr = run;
        const deps = depsFn ? depsFn() : [];
        tr = null;

        const prev = hk.get(key);
        const changed = !prev || !isEqualDeps(deps, prev.deps);

        if (changed) {
            // cleanup previous effect and Actor subscriptions
            prev?.clear?.();
            unsubscribers.forEach(u => u());
            unsubscribers = [];

            // run effect
            const clear = effect();
            hk.set(key, { deps, clear });
            if (clear) inst.effects.add({ clear });

            // auto re-run if any Actor deps change
            for (const d of deps) {
                if (d instanceof Actor) {
                    const unsub = d.subscribe(() => s.add(run, ei));
                    unsubscribers.push(unsub);
                    if (ei) o.addEffect(ei, unsub);
                }
            }
        }
    };
    run();
    s.add(run, ei);
};
