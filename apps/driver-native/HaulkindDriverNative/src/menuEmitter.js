// Simple event emitter for menu open/close
const listeners = [];

export const menuEmitter = {
  open: () => {
    listeners.forEach(fn => fn());
  },
  subscribe: (fn) => {
    listeners.push(fn);
    return () => {
      const idx = listeners.indexOf(fn);
      if (idx >= 0) listeners.splice(idx, 1);
    };
  },
};
