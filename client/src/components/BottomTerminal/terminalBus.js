/**
 * Tiny event bus for the global bottom terminal drawer.
 * Any button / shortcut dispatches an action; <BottomTerminal/> listens.
 */
export const TERMINAL_EVENT = 'hoas:bottom-terminal';
export const TERMINAL_STATE_EVENT = 'hoas:bottom-terminal-state';

const emit = (action) => {
  try {
    window.dispatchEvent(new CustomEvent(TERMINAL_EVENT, { detail: { action } }));
  } catch { /* noop */ }
};

export const openBottomTerminal = () => emit('open');
export const closeBottomTerminal = () => emit('close');
export const toggleBottomTerminal = () => emit('toggle');

export const emitTerminalState = (open) => {
  try {
    window.dispatchEvent(new CustomEvent(TERMINAL_STATE_EVENT, { detail: { open } }));
  } catch { /* noop */ }
};
