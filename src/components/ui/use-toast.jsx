import { useState, useEffect } from "react";

const TOAST_LIMIT = 1;
const TOAST_REMOVE_DELAY = 3000;

let count = 0;
function genId() {
  count = (count + 1) % Number.MAX_VALUE;
  return count.toString();
}

const toastTimeouts = new Map();
const listeners = [];
let memoryState = { toasts: [] };

function dispatch(action) {
  switch (action.type) {
    case "ADD_TOAST":
      // Limpar timeout anterior se existir
      memoryState.toasts.forEach(t => {
        if (toastTimeouts.has(t.id)) {
          clearTimeout(toastTimeouts.get(t.id));
          toastTimeouts.delete(t.id);
        }
      });
      
      const newToast = action.toast;
      memoryState = {
        ...memoryState,
        toasts: [newToast].slice(0, TOAST_LIMIT),
      };
      
      // Auto-dismiss após 3 segundos
      const timeout = setTimeout(() => {
        toastTimeouts.delete(newToast.id);
        dispatch({ type: "REMOVE_TOAST", toastId: newToast.id });
      }, TOAST_REMOVE_DELAY);
      toastTimeouts.set(newToast.id, timeout);
      break;

    case "REMOVE_TOAST":
      // Limpar timeout se existir
      if (toastTimeouts.has(action.toastId)) {
        clearTimeout(toastTimeouts.get(action.toastId));
        toastTimeouts.delete(action.toastId);
      }
      memoryState = {
        ...memoryState,
        toasts: memoryState.toasts.filter((t) => t.id !== action.toastId),
      };
      break;
  }

  // Notificar todos os listeners
  listeners.forEach((listener) => {
    listener(memoryState);
  });
}

function toast({ ...props }) {
  const id = genId();

  dispatch({
    type: "ADD_TOAST",
    toast: {
      ...props,
      id,
      open: true,
    },
  });

  return {
    id,
    dismiss: () => dispatch({ type: "REMOVE_TOAST", toastId: id }),
  };
}

function useToast() {
  const [state, setState] = useState(memoryState);

  useEffect(() => {
    listeners.push(setState);
    return () => {
      const index = listeners.indexOf(setState);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }, []);

  return {
    ...state,
    toast,
    dismiss: (toastId) => dispatch({ type: "REMOVE_TOAST", toastId }),
  };
}

export { useToast, toast };
