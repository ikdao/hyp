export async function loadRoutes(navigator, modules) {
  for (const path in modules) {
    const mod = modules[path];

    // normalize path
    let routePath = path
      .replace(/^\.\/routes/, "")
      .replace(/\.js$/, "")
      .replace(/\/index$/, "/")
      .replace(/\[([^\]]+)\]/g, ":$1");

    if (routePath === "") routePath = "/";

    navigator.route(routePath, async () => {
      const m = await mod();
      return m.default;
    });
  }
}
