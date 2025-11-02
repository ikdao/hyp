//  ORGANISER (o)    
//  Structural Layer — Organise Organs, keep identities and map

export const o = (function () {
    const organs = new Map();
    let nextEi = 1;

    function newEi() { return "ei_" + nextEi++; }

    return {
        create(hi, body) {
            const ei = newEi();
            organs.set(ei, {
                hi,
                body,
                ctx: new Map(),
                mounted: true,
                lifecycles: {
                    willMount: [], didMount: [],
                    willUpdate: [], didUpdate: [],
                    willUnmount: [], didUnmount: []
                },
                effects: new Set()
            });
            return ei;
        },
        addLifecycle(ei, phase, fn) {
            const inst = organs.get(ei);
            if (inst) inst.lifecycles[phase].push(fn);
        },
        runLifecycle(ei, phase, bodyRef) {
            const inst = organs.get(ei);
            if (!inst) return;
            const list = inst.lifecycles[phase];
            if (!list) return;
            for (const fn of list)
                s.add(() => fn(bodyRef), ei);
        },
        addEffect(ei, clear) {
            const inst = organs.get(ei);
            if (inst) inst.effects.add({ clear });
        },
        destroy(ei, { runLifecycle = true } = {}) {
            const inst = organs.get(ei);
            if (!inst) return;

            inst.mounted = false;

            if (runLifecycle) {
                this.runLifecycle(ei, "willUnmount");
                s.add(() => this.runLifecycle(ei, "didUnmount"), ei);
            }

            if (inst.effects) {
                for (const ef of inst.effects)
                    if (typeof ef.clear === "function") {
                        try { ef.clear(); }
                        catch (err) { console.error("Effect clear error:", err); }
                    }
            }
            organs.delete(ei);
            s.clear(ei);
        },
        get(ei) { return organs.get(ei); },
        has(ei) { return organs.has(ei); },
        isAlive(ei) {
            const inst = organs.get(ei);
            return inst ? inst.mounted : false;
        },
        all() { return organs; }
    };
})();

