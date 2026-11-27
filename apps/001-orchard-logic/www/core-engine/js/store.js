/* App Factory Core Engine — Minimal Reactive Store & Event Bus */

export function createStore(initialState = {}) {
  let state = { ...initialState };
  const subscribers = new Set();
  const events = new Map();

  return {
    get(key) {
      return key === undefined ? { ...state } : state[key];
    },

    set(partial) {
      const prev = state;
      state = { ...state, ...partial };
      subscribers.forEach((fn) => fn(state, prev));
    },

    subscribe(fn) {
      subscribers.add(fn);
      return () => subscribers.delete(fn);
    },

    on(eventName, fn) {
      if (!events.has(eventName)) events.set(eventName, new Set());
      events.get(eventName).add(fn);
      return () => events.get(eventName)?.delete(fn);
    },

    emit(eventName, payload) {
      events.get(eventName)?.forEach((fn) => fn(payload));
    }
  };
}
