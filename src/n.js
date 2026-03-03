import { a } from "https://cdn.jsdelivr.net/gh/ikdao/hyp@main/a.js";

/* ---- Utilities -------------------------------- */

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

/* ---- Navigator factory (SSR-Support) -------------- */

export function createNavigator({
  url = null,
  historyEnabled = true
} = {}) {
  const initialURL = url
    ? new URL(url, "http://localhost")
    : typeof window !== "undefined"
      ? window.location
      : { pathname: "/", search: "" };

  /* path is ALWAYS a string */
  const path = a(String(initialURL.pathname));
  const query = a(parseQuery(initialURL.search));
  const params = a({});

  /* async state */
  const loading = a(false);
  const error = a(null);

  const routes = [];
  let beforeEach = null;

  /* canonical path setter */
  function setPath(next) {
    if (typeof next !== "string") {
      console.warn("[navigator] path must be string, got:", next);
      next = String(next);
    }
    path.set(next);
  }

  function syncFromLocation() {
    if (typeof window === "undefined") return;
    setPath(window.location.pathname);
    query.set(parseQuery(window.location.search));
    matchRoutes();
  }

  function matchRoutes() {
    const p = path.get();
    for (const r of routes) {
      const res = r.match(p);
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
    const target = String(to);

    /* Guards */
    if (beforeEach) {
      const result = await beforeEach(target, from);
      if (result === false) return;
      if (typeof result === "string") {
        return navigate(result, true);
      }
    }

    if (typeof window !== "undefined" && historyEnabled) {
      if (replace) history.replaceState(null, "", target);
      else history.pushState(null, "", target);
    }

    setPath(target);
    matchRoutes();
  }

  if (typeof window !== "undefined" && historyEnabled) {
    window.addEventListener("popstate", syncFromLocation);
  }

  /* -------- 4: async resolve ---------------- */

  async function resolveAsync() {
    loading.set(true);
    error.set(null);

    try {
      const r = matchRoutes();
      if (!r) {
        loading.set(false);
        return null;
      }

      let view = r.view;

      // Allow lazy / async route views
      if (typeof view === "function") {
        const res = view();
        view = res instanceof Promise ? await res : res;
      }

      loading.set(false);
      return view;
    } catch (err) {
      error.set(err);
      loading.set(false);
      throw err;
    }
  }

  return {
    /* Reactive state */
    path,
    query,
    params,
    loading,
    error,

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

    /* Sync resolve (unchanged) */
    resolve() {
      const r = matchRoutes();
      return r ? r.view : null;
    },

    /* Async resolve (NEW) */
    resolveAsync
  };
}

export const n = createNavigator();
