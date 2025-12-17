import { a } from "https://cdn.jsdelivr.net/gh/ikdao/hyp@main/a.js";

/* -------------------------------------------------------
   Utilities
------------------------------------------------------- */

function parseQuery(search) {
  return Object.fromEntries(new URLSearchParams(search || ""));
}

function compileMatcher(pattern) {
  const keys = [];
  const regex = new RegExp(
    "^" +
      pattern
        .replace(/\/+$/, "")
        .replace(/:([^/]+)/g, (_, k) => {
          keys.push(k);
          return "([^/]+)";
        }) +
      "$"
  );

  return (path) => {
    const m = path.replace(/\/+$/, "").match(regex);
    if (!m) return null;
    const params = {};
    keys.forEach((k, i) => (params[k] = decodeURIComponent(m[i + 1])));
    return params;
  };
}

/* -------------------------------------------------------
   Navigator factory (SSR-safe)
------------------------------------------------------- */

export function createNavigator({
  url = null,
  historyEnabled = true
} = {}) {
  const initialURL = url
    ? new URL(url, "http://localhost")
    : typeof window !== "undefined"
      ? window.location
      : { pathname: "/", search: "" };

  const path = a(initialURL.pathname);
  const query = a(parseQuery(initialURL.search));
  const params = a({});

  const routes = [];
  let beforeEach = null;

  function syncFromLocation() {
    if (typeof window === "undefined") return;
    path.set(window.location.pathname);
    query.set(parseQuery(window.location.search));
    matchRoutes();
  }

  function matchRoutes() {
    for (const r of routes) {
      const res = r.match(path.get());
      if (res) {
        params.set(res);
        return r;
      }
    }
    params.set({});
    return null;
  }

  async function navigate(to, replace = false) {
    const from = path.get();

    if (beforeEach) {
      const result = await beforeEach(to, from);
      if (result === false) return;
      if (typeof result === "string") {
        return navigate(result, true);
      }
    }

    if (typeof window !== "undefined" && historyEnabled) {
      if (replace) history.replaceState(null, "", to);
      else history.pushState(null, "", to);
    }

    path.set(to);
    matchRoutes();
  }

  if (typeof window !== "undefined" && historyEnabled) {
    window.addEventListener("popstate", syncFromLocation);
  }

  return {
    /* Reactive state */
    path,
    query,
    params,

    /* Routing table */
    route(pattern, view) {
      routes.push({
        pattern,
        view,
        match: compileMatcher(pattern)
      });
    },

    /* Navigation */
    go(to) {
      return navigate(to, false);
    },

    replace(to) {
      return navigate(to, true);
    },

    back() {
      if (typeof window !== "undefined") history.back();
    },

    forward() {
      if (typeof window !== "undefined") history.forward();
    },

    /* Guards */
    beforeEach(fn) {
      beforeEach = fn;
    },

    /* Resolve view */
    resolve() {
      const r = matchRoutes();
      return r ? r.view : null;
    }
  };
}

/* -------------------------------------------------------
   Default singleton (client)
------------------------------------------------------- */

export const n = createNavigator();
