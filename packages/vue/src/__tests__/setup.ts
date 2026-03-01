import { vi, beforeEach } from 'vitest';
import { _resetForTesting as resetI18n } from '@i18n/i18n';
import { _resetForTesting as resetConfig } from '@config/config';
import { _resetForTesting as resetClassManager } from '@core/ClassManager';
import { _resetForTesting as resetIconManager } from '@core/IconManager';
import { _resetForTesting as resetEnumSchema } from '@core/EnumSchema';
import { _resetForTesting as resetEntitySchema } from '@core/EntitySchema';
import { _resetForTesting as resetRequestSchema } from '@core/RequestSchema';
import { _resetForTesting as resetOperatorManager } from '@core/OperatorManager';
import { _resetForTesting as resetComputedScopes } from '@core/ComputedScopesManager';
import { _resetForTesting as resetCellRenderers } from '@core/CellRendererManager';
import { _resetForTesting as resetInputManager } from '@core/InputManager';
import { _resetForTesting as resetRequester } from '@core/Requester';

beforeEach(() => {
  resetI18n();
  resetConfig();
  resetClassManager();
  resetIconManager();
  resetEnumSchema();
  resetEntitySchema();
  resetRequestSchema();
  resetOperatorManager();
  resetComputedScopes();
  resetCellRenderers();
  resetInputManager();
  resetRequester();
});

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
