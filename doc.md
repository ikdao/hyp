# HYP UI Framework Documentation

**License:** Zero One One License - [011sl](https://legal/ikdao.org/license/011sl)
**Author:** Hemang Tewari

---

## Overview

The **HYP UI Framework** is a lightweight, hyperscript-driven UI framework that emphasizes declarative construction, reactive state management, and lifecycle organization. It is structured around the **HYP Triad Architectural Pattern**:

1. **Scheduler (s)** — Temporal layer for efficient task queuing and execution.
2. **Organiser (o)** — Structural layer for managing component identities, lifecycles, and contexts.
3. **Executor (e)** — Execution layer for rendering, updating, and unmounting components.

---

## Core Modules

### 1. Hyperscript Function — `h()`

```js
h(ty, prp, ...chd)
```

Creates a virtual node (VNode) representation of a UI element. Similar in concept to React's `createElement`.

**Parameters:**

* `ty` — Element type or functional component.
* `prp` — Properties (attributes, event handlers, styles, refs).
* `...chd` — Children (strings, numbers, arrays, other VNodes, or Actors).

**Returns:**
A virtual node object or component output.

**Behavior:**

* Normalizes properties and children.
* Supports nested arrays and function-based children.
* If `ty` is a function, executes it as a component.

---

### 2. Scheduler — `s`

Responsible for queuing and flushing asynchronous tasks efficiently using `queueMicrotask`.

**API:**

```js
s.add(fn, ei)
s.flush()
s.clear(ei)
```

**Usage:**

* Schedules lifecycle hooks, updates, and reactivity changes.
* Clears scheduled tasks for destroyed components.

---

### 3. Organiser — `o`

Manages **Organs**, the internal representation of component instances. Each organ maintains its state, lifecycle hooks, and effects.

**API:**

```js
o.create(hi, body)
o.addLifecycle(ei, phase, fn)
o.runLifecycle(ei, phase, bodyRef)
o.addEffect(ei, clear)
o.destroy(ei)
o.get(ei)
o.isAlive(ei)
```

**Lifecycle Phases:**

* `willMount`, `didMount`
* `willUpdate`, `didUpdate`
* `willUnmount`, `didUnmount`

**Responsibilities:**

* Assigns unique execution identities (`ei`).
* Tracks lifecycles and effects.
* Cleans up resources upon destruction.

---

### 4. Executor — `e`

Handles rendering, updating, and unmounting of components.

**API:**

```js
e.render(vnode, body)
e.patch(dom, oldVNode, newVNode, ei)
e.unmount(vnode, ei)
```

**Core Functions:**

* `render()` — Creates DOM from virtual nodes.
* `patch()` — Efficiently updates DOM trees.
* `unmount()` — Safely removes elements and triggers cleanup.

**Utilities:**

* `pushEI()`, `popEI()`, `currentEI()` for managing execution context.

---

### 5. Actor — `a()` and `Actor` class

Reactive primitive for state management. Similar to signals or observables.

**Example:**

```js
const count = a(0);
count.subscribe(() => console.log(count.get()));
count.set(1);
```

**Methods:**

* `get()` — Returns current value.
* `set(next)` — Updates value and triggers subscriptions.
* `subscribe(fn)` — Registers reactive listeners.

---

### 6. Derived Actor — `dA()`

Creates computed signals that reactively derive from other actors.

**Example:**

```js
const first = a('John');
const last = a('Doe');
const fullName = dA(() => `${first.get()} ${last.get()}`);
```

Automatically re-evaluates when dependencies change.

---

### 7. Side Actor — `sA()`

Manages reactive side effects (similar to `useEffect` in React).

**Usage:**

```js
sA(() => {
  console.log('Effect ran');
  return () => console.log('Cleanup');
}, () => [someActor]);
```

**Features:**

* Dependency-based re-execution.
* Automatic cleanup.
* Tied to component lifecycle.

---

## Design Pattern — HYP Triad

| Layer      | Name              | Role                                       |
| ---------- | ----------------- | ------------------------------------------ |
| Temporal   | **Scheduler (s)** | Queues and executes microtasks efficiently |
| Structural | **Organiser (o)** | Manages organs, lifecycles, and effects    |
| Execution  | **Executor (e)**  | Handles rendering, patching, and teardown  |

---

## Example Usage

```js
import HYP, { h, e, a, dA, sA } from './hyp.js';

function Counter() {
  const count = a(0);
  const double = dA(() => count.get() * 2);

  sA(() => {
    console.log('Mounted');
    return () => console.log('Unmounted');
  }, []);

  return h('div', {},
    h('h1', {}, 'Count: ', count),
    h('p', {}, 'Double: ', double),
    h('button', { onClick: () => count.set(count.get() + 1) }, 'Increment')
  );
}

e.render(h(Counter), document.body);
```

---

## Key Features

* **Declarative Virtual DOM** — Hyperscript-based structure for UI creation.
* **Reactive Core** — Lightweight Actor model for state.
* **Lifecycle Management** — Fine-grained mount/update/unmount hooks.
* **Scheduler Optimization** — Microtask-based async task management.
* **Composable Effects** — Derived and side actors for complex reactivity.

---

## License

Licensed under the **Zero One One License (011sl)** — see [legal/ikdao.org/license/011sl](https://legal/ikdao.org/license/011sl).
