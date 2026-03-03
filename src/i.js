// Interactor i()/Side Act sA()
// Self License - 01SL
// HYP UI Framework 
// Author: Hemang Tewari

export const i = (effect, explicitEI = null) => {
  const ei = explicitEI ?? e.currentEI();
  if (!ei) return;
  let cleanup; // Track previous effect cleanup
  const run = () => {
    if (cleanup) {
      try { cleanup(); } catch (err) { console.error("i cleanup error:", err); }
    }
    tr = run;
    cleanup = effect();
    tr = null;
    if (cleanup) o.addEffect(ei, cleanup);
  };
  run();
};