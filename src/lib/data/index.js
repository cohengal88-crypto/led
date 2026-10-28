// Data layer: Firebase when configured (.env), otherwise a local demo store.
// Pages import only from here, never from an adapter directly.
const hasFirebase = Boolean(import.meta.env.VITE_FIREBASE_API_KEY);

let adapterPromise;
export function data() {
  adapterPromise ??= hasFirebase
    ? import('./firebase.js').then(m => m.default)
    : import('./demo.js').then(m => m.default);
  return adapterPromise;
}
export const mode = hasFirebase ? 'firebase' : 'demo';
