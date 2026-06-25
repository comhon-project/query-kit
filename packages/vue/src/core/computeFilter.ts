import { toRaw } from 'vue';
import { resolve, resolveIntersection, type EntitySchema, type Scope } from '@core/EntitySchema';
import { getComputedScope, type ComputedScope } from '@core/ComputedScopesManager';
import type { Filter, GroupFilter, ScopeFilter } from '@core/types';

function getScopeDefinition(scopeId: string, entitySchema: EntitySchema): Scope | ComputedScope | undefined {
  const computedScope = getComputedScope(entitySchema.id, scopeId);
  if (computedScope) return computedScope;
  try {
    return entitySchema.getScope(scopeId);
  } catch {
    return undefined;
  }
}

function isScopeFilled(scope: Scope | ComputedScope, filter: ScopeFilter): boolean {
  if (!scope.parameters?.length) {
    return true;
  }
  for (let i = 0; i < scope.parameters.length; i++) {
    const param = scope.parameters[i];
    if (param.nullable !== false) continue;
    const paramValue = filter.parameters?.[i];
    const isParamEmpty =
      paramValue === undefined ||
      paramValue === null ||
      (Array.isArray(paramValue) && paramValue.filter((v) => v !== undefined).length === 0);
    if (isParamEmpty) {
      return false;
    }
  }
  return true;
}

function mustKeepFilter(filter: Filter, entitySchema: EntitySchema): boolean {
  if ('operator' in filter && (filter.operator == 'null' || filter.operator == 'not_null')) {
    return true;
  }
  if (filter.type == 'group') {
    return filter.filters.some((child) => mustKeepFilter(child, entitySchema));
  }
  if (filter.type == 'scope') {
    const scope = getScopeDefinition(filter.id, entitySchema);
    return !!scope && isScopeFilled(scope, filter);
  }
  if (filter.type == 'condition') {
    const isEmpty =
      filter.value === undefined ||
      (Array.isArray(filter.value) && filter.value.filter((value) => value !== undefined).length == 0);
    return !isEmpty;
  }
  return true;
}

export async function computeFilter(filter: Filter | null, entity: string): Promise<GroupFilter> {
  const entitySchema = await resolve(entity);
  const raw = filter ? (toRaw(filter) as Filter) : null;
  const group: GroupFilter =
    raw && raw.type === 'group' ? raw : { type: 'group', operator: 'and', filters: raw ? [raw] : [] };
  const computed = structuredClone(group);
  const stack: Array<[Filter, EntitySchema]> = [[computed, entitySchema]];
  while (stack.length) {
    const [currentFilter, currentSchema] = stack.pop()!;
    if (currentFilter.type == 'entity_condition') {
      if (currentFilter.filter) {
        const property = currentSchema.getProperty(currentFilter.property);
        if (property.relationship_type === 'morph_to' && !currentFilter.entities?.length) {
          throw new Error(`morph_to "${property.id}" should not have a filter without entities`);
        }
        const childSchema = property.relationship_type === 'morph_to'
          ? await resolveIntersection(currentFilter.entities!)
          : await resolve(property.entity!);

        if (mustKeepFilter(currentFilter.filter, childSchema)) {
          stack.push([currentFilter.filter, childSchema]);
        } else {
          delete currentFilter.filter;
        }
      }
    } else if (currentFilter.type == 'group') {
      const kept: Filter[] = [];
      for (const f of currentFilter.filters) {
        if (!mustKeepFilter(f, currentSchema)) continue;
        stack.push([f, currentSchema]);
        kept.push(f);
      }
      currentFilter.filters = kept;
    } else if (currentFilter.type == 'condition') {
      if (Array.isArray(currentFilter.value)) {
        currentFilter.value = (currentFilter.value as unknown[]).filter((value) => value !== undefined);
      } else if (currentFilter.operator == 'like' || currentFilter.operator == 'not_like') {
        currentFilter.value = `%${currentFilter.value}%`;
      } else if (currentFilter.operator == 'ilike' || currentFilter.operator == 'not_ilike') {
        currentFilter.value = `%${currentFilter.value}%`;
      } else if (currentFilter.operator == 'begins_with' || currentFilter.operator == 'doesnt_begin_with') {
        currentFilter.operator = currentFilter.operator == 'begins_with' ? 'like' : 'not_like';
        currentFilter.value = `${currentFilter.value}%`;
      } else if (currentFilter.operator == 'ibegins_with' || currentFilter.operator == 'idoesnt_begin_with') {
        currentFilter.operator = currentFilter.operator == 'ibegins_with' ? 'ilike' : 'not_ilike';
        currentFilter.value = `${currentFilter.value}%`;
      } else if (currentFilter.operator == 'ends_with' || currentFilter.operator == 'doesnt_end_with') {
        currentFilter.operator = currentFilter.operator == 'ends_with' ? 'like' : 'not_like';
        currentFilter.value = `%${currentFilter.value}`;
      } else if (currentFilter.operator == 'iends_with' || currentFilter.operator == 'idoesnt_end_with') {
        currentFilter.operator = currentFilter.operator == 'iends_with' ? 'ilike' : 'not_ilike';
        currentFilter.value = `%${currentFilter.value}`;
      } else if (currentFilter.operator == 'null') {
        currentFilter.operator = '=';
        currentFilter.value = null;
      } else if (currentFilter.operator == 'not_null') {
        currentFilter.operator = '<>';
        currentFilter.value = null;
      }
    } else if (currentFilter.type == 'scope') {
      const parameters = currentFilter.parameters;
      if (parameters?.length) {
        for (let i = 0; i < parameters.length; i++) {
          if (Array.isArray(parameters[i])) {
            parameters[i] = (parameters[i] as unknown[]).filter((v) => v !== undefined);
          }
        }
      }
      const scope = getScopeDefinition(currentFilter.id, currentSchema);
      if (scope && (scope as ComputedScope).computed) {
        const computedScopeValue = (scope as ComputedScope).computed!(parameters || []);
        if (typeof computedScopeValue != 'object') {
          throw new Error(`invalid computed value for scope ${scope.id}, value must be an object`);
        }
        delete (currentFilter as { id?: string }).id;
        Object.assign(currentFilter, computedScopeValue);
      }
    }
    delete currentFilter.key;
    delete currentFilter.editable;
    delete currentFilter.removable;
  }
  return computed;
}
