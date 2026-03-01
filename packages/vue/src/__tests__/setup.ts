import { vi } from 'vitest';

// Mock HTMLDialogElement methods (jsdom has incomplete <dialog> support)
HTMLDialogElement.prototype.showModal =
  HTMLDialogElement.prototype.showModal ?? vi.fn();
HTMLDialogElement.prototype.close =
  HTMLDialogElement.prototype.close ?? vi.fn();

// Mock Element.prototype.getAnimations (not implemented in jsdom)
Element.prototype.getAnimations =
  Element.prototype.getAnimations ?? vi.fn(() => []);

// Mock IntersectionObserver (not implemented in jsdom)
global.IntersectionObserver =
  global.IntersectionObserver ??
  vi.fn().mockImplementation((callback: IntersectionObserverCallback) => ({
    observe: vi.fn(),
    disconnect: vi.fn(),
    unobserve: vi.fn(),
    _callback: callback,
  }));
