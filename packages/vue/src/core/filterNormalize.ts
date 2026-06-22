import { toRaw } from 'vue';
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

/**
 * Converts an external value into the canonical internal representation:
 *  - wraps non-group filters into a `Group` (operator chosen from `allowedOperators`)
 *  - marks the top-level Group as non-removable
 *  - assigns a stable `key` to every node
 *
 * Always returns a fresh (deep-cloned) GroupFilter — safe to mutate.
 */
export function normalizeFilter(value: Filter | null, allowedOperators?: AllowedOperators): GroupFilter {
  const raw = value ? toRaw(value) : null;
  const group: GroupFilter = raw?.type === 'group'
    ? raw
    : {
        type: 'group',
        operator: getContainerOperators('group', allowedOperators)?.[0] || 'and',
        filters: raw ? [raw] : [],
      };
  const clone = structuredClone(group);
  clone.removable = false;
  prepareFilters(clone);
  return clone;
}
