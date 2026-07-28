import { isProxy, toRaw } from 'vue';
import { getUniqueId } from '@core/Utils';
import { getContainerOperators, type AllowedOperators } from '@core/OperatorManager';
import type { Filter, GroupFilter } from '@core/types';

/**
 * Assigns a stable `key` to every node in the tree that doesn't have one yet.
 * Mutates in place. Idempotent — existing keys are preserved.
 */
export function prepareFilters(filter: Filter): void {
  const stack: Filter[] = [filter];
  while (stack.length) {
    const current = stack.pop()!;
    if (current.key === undefined) current.key = getUniqueId();
    if (current.type === 'group') {
      if (!Array.isArray(current.filters)) {
        current.filters = [];
      }
      stack.push(...current.filters);
    }
    if (current.type === 'entity_condition' && current.filter) {
      stack.push(current.filter);
    }
  }
}

/**
 * Returns a deep clone of the filter with all `key` properties removed.
 * Used at the QueryBuilder ↔ parent boundary so consumers never see internal keys.
 */
export function stripKeys(filter: GroupFilter): GroupFilter {
  const clone = structuredClone(toRaw(filter));
  const stack: Filter[] = [clone];
  while (stack.length) {
    const current = stack.pop()!;
    delete current.key;
    if (current.type === 'group') {
      stack.push(...current.filters);
    }
    if (current.type === 'entity_condition' && current.filter) {
      stack.push(current.filter);
    }
  }
  return clone;
}

function deproxyShallow<T>(value: T): T {
  const raw = toRaw(value) as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const key of Object.keys(raw)) {
    const nested = raw[key];
    out[key] = nested && typeof nested === 'object' ? toRaw(nested) : nested;
  }
  return out as T;
}

function containsVueProxy(value: unknown): boolean {
  const seen = new WeakSet<object>();
  const stack: unknown[] = [value];
  while (stack.length) {
    const current = stack.pop();
    if (!current || typeof current !== 'object') continue;
    if (isProxy(current)) return true;
    if (seen.has(current)) continue;
    seen.add(current);
    stack.push(...Object.values(current as Record<string, unknown>));
  }
  return false;
}

function cloneFilterTree<T>(filter: T): T {
  try {
    return structuredClone(filter);
  } catch (error) {
    if (error instanceof Error && error.name === 'DataCloneError') {
      if (containsVueProxy(filter)) {
        throw new Error(
          '[query-kit] The filter could not be cloned: it contains Vue reactive proxies, which query-kit does not ' +
            'support inside a filter. Do not copy a reactive value directly. For example, do not use ' +
            '`{ ...filter.value }`, use `{ ...toRaw(filter.value) }` instead.',
          { cause: error },
        );
      }
      throw new Error(
        '[query-kit] The filter could not be cloned: it contains a value that structuredClone cannot handle ' +
          '(a function, a Proxy, or a non-serializable object). Pass a plain, serializable filter.',
        { cause: error },
      );
    }
    throw error;
  }
}

export function toClonedGroup(
  value: Filter | null | undefined,
  fallbackOperator: GroupFilter['operator'] = 'and',
): GroupFilter {
  const raw = value ? cloneFilterTree(deproxyShallow(value)) : null;
  return raw?.type === 'group'
    ? raw
    : { type: 'group', operator: fallbackOperator, filters: raw ? [raw] : [] };
}

/**
 * Converts an external value into the canonical internal representation:
 *  - wraps non-group filters into a `Group` (operator chosen from `allowedOperators`)
 *  - marks the top-level Group as non-removable
 *  - assigns a stable `key` to every node
 *
 * Always returns a fresh (deep-cloned) GroupFilter — safe to mutate.
 */
export function normalizeFilter(value: Filter | null, allowedOperators?: AllowedOperators): GroupFilter {
  const clone = toClonedGroup(value, getContainerOperators('group', allowedOperators)?.[0] || 'and');
  clone.removable = false;
  prepareFilters(clone);
  return clone;
}
