---
HYP UI Framework — v0.11.12
===========================

**License:** Zero One One License — [011sl](https://legal/ikdao.org/license/011sl)**Author:** Hemang Tewari

A lightweight, modular UI framework implementing a **Triad Architecture** (Executor, Organiser, Scheduler) with first-class reactive primitives (Actor, dA, sA) and developer-controlled lifecycles.

1\. Core Architectural Pattern: Triad
-------------------------------------

HYP’s triad separates **responsibilities** clearly:

LayerAbbreviationRoleTemporals (Scheduler)Orchestrates asynchronous updates, task batching, and lifecycle scheduling.Structuralo (Organiser)Manages organ/component state, lifecycle, and cleanup.Spatiale (Executor)Mounts, patches, and unmounts virtual nodes in the DOM.

This design allows controlled circular coupling where necessary (e.g., o ↔ s) without leaking dependencies.

2\. Virtual Node Factory: h()
-----------------------------

Creates virtual DOM nodes or component factories (organs).

**Signature**

Plain text`   h(type, props?, ...children)   `

**Parameters**

*   type: string | function — DOM element or organ factory.
    
*   props: object? — attributes, event handlers, refs, keys.
    
*   children: Array — nested nodes, strings, or reactive signals.
    

**Returns**: VNode

Plain text`   {    ty,      // type    prp,     // props    chd,     // flattened children    key?,    // optional key for diffing    ref?     // optional ref callback  }   `

**Notes**

*   Arrays, nested children, and Actors are automatically flattened.
    
*   Functions as children are invoked lazily.
    
*   Functional organs receive { ...props, children } as input.
    

3\. Scheduler: s
----------------

Responsible for **temporal coordination**.

**API**

Plain text`   s.add(fn, ei?)      // schedule a task, optionally bound to organ instance  s.flush()            // immediately run pending tasks  s.clear(ei)          // remove tasks associated with unmounted organ   `

**Behavior**

*   Batches microtasks to avoid unnecessary DOM thrashing.
    
*   Verifies organ liveness (o.isAlive) before execution.
    
*   Works closely with o for lifecycle and effect cleanup.
    

4\. Organiser: o
----------------

Manages **component identities, state, lifecycles, and side-effects**.

**API**

Plain text`   o.create(hi, body)               // register new organ instance, returns ei  o.addLifecycle(ei, phase, fn)    // register lifecycle callback  o.runLifecycle(ei, phase, body)  // trigger lifecycle callbacks  o.addEffect(ei, clear)           // register cleanup function  o.destroy(ei, opts?)             // remove organ, optionally run lifecycle  o.get(ei)                        // retrieve organ context  o.has(ei)                        // check existence  o.isAlive(ei)                    // check mounted state  o.all()                           // debug: map of all organs   `

**Lifecycle Phases**

PhaseTimingwillMountBefore initial DOM renderdidMountAfter initial DOM commitwillUpdateBefore patch/updatedidUpdateAfter patch/updatewillUnmountBefore removal from DOMdidUnmountAfter removal/cleanup

**Notes**

*   Effects and reactive subscriptions are tied to organ lifecycle.
    
*   Controlled GC: destroy automatically cleans tasks in s.
    

5\. Executor: e
---------------

Spatial layer — renders, updates, and removes organs.

**API**

Plain text`   e.render(vnode, body)           // mount VNode, returns ei  e.patch(dom, oldVNode, newVNode, ei)  // update existing DOM node  e.unmount(vnode?, ei)           // remove organ from DOM  e.pushEI(ei) / popEI() / currentEI() // internal EI stack tracking   `

**Rendering Flow**

1.  render → o.create → willMount → DOM creation → didMount (post-flush via scheduler)
    
2.  patch → willUpdate → diff & patch → didUpdate
    
3.  unmount → willUnmount → DOM removal → didUnmount
    

**Reactive Support**

*   Text nodes can be bound to Actor signals.
    
*   Props, attributes, and styles can be reactive via Actor.
    

6\. Reactive Primitives
-----------------------

### 6.1 Actor: a()

Encapsulates a reactive value.

Plain text`   const count = a(0);  count.get()       // read value (tracks dependency if in reactive context)  count.set(1)      // update value and notify dependents  count.subscribe(fn)  // manual subscription, returns unsubscribe   `

*   Changes automatically schedule dependent updates via s.
    

### 6.2 Derived Actor: dA()

Computed signal derived from one or more actors.

Plain text`   const doubled = dA(() => count.get() * 2);   `

*   Tracks Actor.get() calls inside compute.
    
*   Auto-updates when dependencies change.
    

### 6.3 Side Actor: sA()

Imperative side-effect with dependency tracking.

Plain text`   sA(() => {    console.log("Count changed:", count.get());  }, () => [count.get()], explicitEI?);   `

*   Runs effect immediately.
    
*   Automatically re-runs if any dependency changes.
    
*   Supports cleanup via returned function.
    
*   Lifecycle-aware: tied to organ EI.
    

7\. Patch Algorithm
-------------------

*   Supports **keyed children** diffing.
    
*   Handles **primitive, Actor, and VNode updates**.
    
*   Automatically manages **refs** and reactive **style/attribute updates**.
    
*   Excess nodes removed on patch to keep DOM consistent.
    

8\. Notes & Philosophy
----------------------

*   **Triad Control:** e acts in space, o holds memory, s controls time.
    
*   **Intentional Circular Coupling:** Minimal o ↔ s for GC and alive-checks.
    
*   **Lifecycle Flexibility:** Default auto-hooks with option for dev override.
    
*   **Reactive Continuity:** All Actor subscriptions auto-cleaned on organ destroy.
    
*   **Performance-first:** Scheduler batches, keyed diffing, minimal DOM writes.
    

9\. Global Export
-----------------

Plain text`   const HYP = { h, e, o, s, a, dA, sA };  window.HYP = HYP;  export default HYP;   `

*   Exposes full triad, hyperscript, and reactivity primitives.
    
*   Designed for **modular, lifecycle-aware, reactive UI construction**.
    

### ✅ Summary

HYP v0.11.12 provides:

1.  **Triad Architecture** (e, o, s) — core runtime coordination.
    
2.  **Component Factory** h() — functional or DOM-based virtual nodes.
    
3.  **Lifecycle Management** — granular control (will/did mount/update/unmount).
    
4.  **Reactive System** (a, dA, sA) — fine-grained data-driven updates.
    
5.  **Optimized DOM Patching** — keyed, reactive, and minimal writes.
