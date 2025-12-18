Hyp UI Framework(in dev)
================

**Hyp** (by [ikdao](https://ikdao.org)) is an **Indie Indic UI/UX/IX Framework** built to experiment with minimal functional UI design patterns, inspired by hyperscript, reactive state, and virtual DOM execution.

*   **Lightweight**: Pure JS, minimal abstractions.
    
*   **Reactive**: Built-in Actor/state, derived Act, and side Act.
    
*   **Composable**: Functions are the building blocks.
    
*   **Experimental**: Targets SPA, SVG, AR/VR, and beyond.
    

HYP Core and Essentials 
----------

## h() — Hyperscript

The h() function structure organs, organelles **virtual DOM node (VNode)**.

Plain text
`   import { h } from "hyp";  const vnode = h("div", { class: "box" }, "Hello Hyp");   `

*   ty → element type (string tag or component function)
    
*   prp → props (attributes, events, class, style, etc.)
    
*   chd → children (string, number, VNode, or array)

## Triad E,O,S - living interface
-----
### Orchestrater & Directors

**o (Organiser)** - identity and spatial manager, for awaring
create and organise organs

### e() — Executor - behaviour and renderer
render, redo organs(vDOM)

**s (Scheduler)** - Temporal Manager, for attending
run, clear organs, actors lifecycle 

Hyp States  

Hyp Actors/Reactor/Interactor  

a() 
actors are active primitive

dA()/r()  
derived Actor that act in response to act  

sA()/i() 
side actor that act in relation to act  

n()  
navigator that match path/query param and route to navigate or for navigating app  


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
