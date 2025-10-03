# Hyp UI Framework Documentation (v0.11.x)

---

## Table of Contents

1. [Introduction](#introduction)
2. [Core Concepts](#core-concepts)

   * [Hyperscript (`h`)](#hyperscript-h)
   * [Scheduler (`s`)](#scheduler-s)
   * [Organiser (`o`)](#organiser-o)
   * [Actors (`a`)](#actors-a)
   * [Derived Actors (`dA`)](#derived-actors-da)
   * [Side Effects (`sA`)](#side-effects-sa)
   * [Executor (`e`)](#executor-e)
3. [Components](#components)

   * [Function Components](#function-components)
   * [Class Modules (`c`)](#class-modules-c)
4. [Reactivity Scoping](#reactivity-scoping)
5. [Example Usage](#example-usage)
6. [Notes](#notes)

---

## Introduction

Hyp UI Framework (Hyp) is a lightweight reactive UI framework inspired by modern frontend frameworks. It provides **reactive state management**, **derived computations**, **side effects**, and a **virtual DOM with diffing** for efficient rendering.

License: [Zero One One License - 011sl](https://legal.ikdao.org/license/011sl)

---

## Core Concepts

### Hyperscript (`h`)

Create virtual DOM nodes:

```js
const vnode = h('div', { className: 'container' },
  h('p', {}, 'Hello World'),
  h(MyComponent, { prop: 'value' })
);
```

* `ty`: string tag name or component function/class.
* `prp`: props object.
* `chd`: children array (flattened internally).
* `key` / `ref`: optional.

### Scheduler (`s`)

Schedules tasks and avoids redundant renders:

```js
s.add(() => {
  // any reactive update
});
```

* Uses `queueMicrotask` for batching.

### Organiser (`o`)

Tracks **component contexts** for hooks and derived states.

* Each component has a unique ID.
* Stores hook states (`hk`) and effect indices (`ei`).

### Actors (`a`)

Reactive state container:

```js
const counter = a(0);
counter.get(); // read
counter.set(1); // update and notify subscribers
```

* `subscribe(fn)`: optional manual subscription.

### Derived Actors (`dA`)

Create a reactive computed state per component instance:

```js
const sum = dA(() => counterA.get() + counterB.get());
```

* Automatically tracks dependencies.
* Updates when dependent actors change.
* Scoped per component instance.

### Side Effects (`sA`)

Run effects with optional dependencies:

```js
sA(() => {
  console.log('Sum changed:', sum.get());
}, () => [sum.get()]);
```

* Supports cleanup by returning a function.
* Runs only when dependencies change.
* Scheduled via the framework scheduler.

### Executor (`e`)

Renders a virtual DOM node into a container:

```js
e(h(App, {}), document.getElementById('app'));
```

* Supports function components, class modules, and standard DOM nodes.
* Diffing algorithm ensures minimal DOM updates.
* Handles keyed elements, props, and events.

---

## Components

### Function Components

```js
function Counters() {
  const value = counter.get();
  return h('div', {}, `Counter: ${value}`);
}
```

* Each invocation gets its own reactive context.
* Use `dA` and `sA` for scoped state and effects.

### Class Modules (`c`)

```js
const MyModule = c(Object, {
  state: () => ({ count: 0 }),
  render() { return h('p', {}, `Count: ${this.state.count}`); }
});
```

* Supports `setState` for reactivity.
* Lifecycle hooks: `componentWillMount`, `componentDidMount`, `componentDidUpdate`, `componentWillUnmount`.

---

## Reactivity Scoping

* Actors created **outside** components are **shared** across all instances.
* Actors or derived actors created **inside** components are **scoped per instance**.

**Example (per-instance counters):**

```js
function Counters() {
  const local = dA(() => ({ a: a(0), b: a(0) }));
  const state = local.get();
  return h('div', {}, state.a.get(), state.b.get());
}
```

* Each `Counters` instance maintains its own `a` and `b`.

---

## Example Usage

```js
const appContainer = document.getElementById('app');
const rF = () => e(h(App, {}), appContainer);
rF();
```

* Supports multiple component instances.
* Automatic reactive updates without manual DOM manipulation.

---

## Notes

* All `dA` and `sA` hooks **must be called inside a component context**.
* Avoid sharing actors unless intentionally global.
* DOM diffing ensures minimal updates, keyed children prevent unnecessary re-renders.
* Scheduler ensures batched updates for efficiency.

---
