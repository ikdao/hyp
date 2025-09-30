Hyp UI Framework
================

**Hyp** (by [ikdao](https://ikdao.org)) is an **Indie Indic UI Framework** built to experiment with minimal functional UI design patterns, inspired by hyperscript, reactive state, and virtual DOM execution.

*   **Lightweight**: Pure JS, minimal abstractions.
    
*   **Reactive**: Built-in state, derived state, and side-effects.
    
*   **Composable**: Functions are the building blocks.
    
*   **Experimental**: Targets SPA, SVG, AR/VR, and beyond.
    

Essentials
----------

### h() — Hyperscript

The h() function creates a **virtual DOM node (VNode)**.

Plain text
`   import { h } from "hyp";  const vnode = h("div", { class: "box" }, "Hello Hyp");   `

*   ty → element type (string tag or component function)
    
*   prp → props (attributes, events, class, style, etc.)
    
*   chd → children (string, number, VNode, or array)
    

### e() — Executor

The e() function renders or updates the VDOM into the real DOM.

Plain text
`   import { h, e } from "hyp";  const App = () => h("h1", null, "Hello World");  e(h(App), document.getElementById("root"));   `

Handles:

*   Mounting / unmounting components
    
*   Props & event binding
    
*   Child diffing (keyed + index-based)
    
*   SVG namespace support
    

Necessaries
-----------

These are the **core reactive orchestration primitives**.

### Orchestrater

*   **o (Organiser)** → spatial mapping context (per component instance)
    
*   **s (Scheduler)** → async microtask queue for updates
    

### Directors

*   const counter = a(0);console.log(counter.get()); // 0counter.set(1);
    
*   const double = dA(() => counter.get() \* 2);
    
*   sA(() => { console.log("Counter updated:", counter.get());}, () => \[counter.get()\]);
    

Future Possibilities
--------------------

The roadmap includes evolving Hyp into a **full SPA framework**:

*   **m()** → custom class modules / extensible components
    
*   **n()** → navigator actor for routing
    
*   **hX() / eX()** → AR/VR (XR) support
    
*   **SVG rendering** → already supported in e()
    

Example Counter App
-------------------

Plain text
`   import HYP from "hyp";  const { h, e, a, sA } = HYP;  const Counter = () => {    const count = a(0);    return h("div", { class: "counter" },      h("h1", null, () => "Count: " + count.get()),      h("button", { onClick: () => count.set(count.get() + 1) }, "+"),      h("button", { onClick: () => count.set(count.get() - 1) }, "-")    );  };  e(h(Counter), document.getElementById("root"));   `

Support Development
-------------------

*   **UPI**: hemangtewari@upi
    
*   **ETH**: 0x43ffd7C1Ea8AAfdc768c0883F35b2AE433EE4726
    
*   **BTC**: bc1qgk84f0dfddqfcww58ftse832udksf2wslnd3cd
    
*   **SOL**: DQr1t5uSriiwdu1NwTigJdbNg6WVHSFHijmyHFV27VC1
    
*   **DOGE**: DLjkz6u5byBzX6Dd68hJVTmxTWeiTZt7em
    

License
-------

**Open Source** under [Zero One One Self License - 011sl](https://legal.ikdao.org/license/011sl)

Plain text
`   Hyp UI Framework - Hemang Tewari  License: 011sl   `
