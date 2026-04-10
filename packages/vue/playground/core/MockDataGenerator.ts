import type { RawProperty, RawEntitySchema } from '@core/EntitySchema';
import type { RawEnumSchema } from '@core/EnumSchema';

type EntitySchema = RawEntitySchema & { id: string };

const entityModules = import.meta.glob('../schemas/entities/*/schema.js', { eager: true }) as Record<string, { default: EntitySchema }>;
const enumModules = import.meta.glob('../schemas/enums/*/schema.js', { eager: true }) as Record<string, { default: RawEnumSchema }>;

const ENTITIES: Record<string, EntitySchema> = {};
for (const [path, module] of Object.entries(entityModules)) {
  const schema = module.default;
  ENTITIES[schema.id] = schema;
}

const ENUMS: Record<string, RawEnumSchema> = {};
for (const [path, module] of Object.entries(enumModules)) {
  const id = path.match(/enums\/(.+)\/schema\.js/)![1];
  ENUMS[id] = module.default;
}

const WORDS = ['alpha', 'beta', 'gamma', 'delta', 'epsilon', 'zeta', 'eta', 'theta', 'iota', 'kappa'];
const FIRST_NAMES = ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve', 'Frank', 'Grace', 'Hugo', 'Iris', 'Jules'];
const LAST_NAMES = ['Martin', 'Bernard', 'Dubois', 'Thomas', 'Robert', 'Petit', 'Richard', 'Durand', 'Leroy', 'Moreau'];
const BRAND_NAMES = ['Acme Corp', 'Globex', 'Initech', 'Umbrella', 'Stark Industries', 'Wayne Enterprises', 'Capsule Corp', 'Cyberdyne', 'Wonka', 'Oscorp'];
const ADDRESSES = ['12 Baker Street', '42 Elm Avenue', '7 Rue de Rivoli', '3 Königstraße', '88 Broadway', '15 Via Roma', '21 Maple Drive', '5 Place Bellecour', '9 Oxford Road', '33 Sunset Blvd'];

function randomWord(): string {
  return WORDS[Math.floor(Math.random() * WORDS.length)];
}

function randomDate(): string {
  const year = 2020 + Math.floor(Math.random() * 5);
  const month = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0');
  const day = String(Math.floor(Math.random() * 28) + 1).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function randomTime(): string {
  const h = String(Math.floor(Math.random() * 24)).padStart(2, '0');
  const m = String(Math.floor(Math.random() * 60)).padStart(2, '0');
  const s = String(Math.floor(Math.random() * 60)).padStart(2, '0');
  return `${h}:${m}:${s}`;
}

function randomEnumCase(enumId: string): string {
  const schema = ENUMS[enumId];
  if (!schema) return 'unknown';
  return schema.cases[Math.floor(Math.random() * schema.cases.length)].id;
}

function randomFrom(list: string[]): string {
  return list[Math.floor(Math.random() * list.length)];
}

function generateValue(property: RawProperty): unknown {
  if (property.enum) {
    return randomEnumCase(property.enum);
  }

  switch (property.type) {
    case 'string':
      switch (property.id) {
        case 'first_name': return randomFrom(FIRST_NAMES);
        case 'last_name': case 'name': return randomFrom(LAST_NAMES);
        case 'brand_name': return randomFrom(BRAND_NAMES);
        case 'address': case 'street': return randomFrom(ADDRESSES);
        default: return randomWord();
      }
    case 'integer':
      return Math.floor(Math.random() * 1000);
    case 'float':
      return +(Math.random() * 100).toFixed(2);
    case 'boolean':
      return Math.random() > 0.5;
    case 'datetime':
      return `${randomDate()}T${randomTime()}Z`;
    case 'date':
      return randomDate();
    case 'time':
      return randomTime();
    case 'html':
      return `${randomWord()} <b>${randomWord()}</b>`;
    case 'country':
      return String(Math.floor(Math.random() * 3) + 1);
    case 'array': {
      const count = Math.floor(Math.random() * 4);
      const items: unknown[] = [];
      for (let i = 0; i < count; i++) {
        if (property.items?.enum) {
          items.push(randomEnumCase(property.items.enum));
        } else {
          items.push(generateValue({ id: '', type: property.items?.type || 'string' }));
        }
      }
      return items;
    }
    default:
      return randomWord();
  }
}

function findProperty(
  rootEntityId: string,
  columnId: string,
): { property: RawProperty; rootSchema: EntitySchema } | null {
  const segments = columnId.split('.');
  let currentSchema = ENTITIES[rootEntityId];
  if (!currentSchema) return null;

  let rootSchema = currentSchema;
  let subEntityPath: string[] = [];

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    const property = currentSchema.properties.find((p) => p.id === segment);
    if (!property) return null;

    if (i === segments.length - 1) {
      return { property, rootSchema };
    }

    if (property.type === 'relationship' && property.entity) {
      currentSchema = ENTITIES[property.entity];
      if (!currentSchema) return null;
      rootSchema = currentSchema;
      subEntityPath = [];
    } else if (property.type === 'object') {
      subEntityPath.push(segment);
      const entityKey = subEntityPath.join('.');
      const subEntity = rootSchema.entities?.[entityKey];
      if (!subEntity) return null;
      currentSchema = { ...rootSchema, properties: subEntity.properties };
    } else {
      return null;
    }
  }

  return null;
}

function generateEntityData(entityId: string, rootSchema?: EntitySchema): Record<string, unknown> {
  const schema = ENTITIES[entityId];
  if (schema) {
    const data: Record<string, unknown> = {};
    if (schema.unique_identifier) {
      const prop = schema.properties.find((p) => p.id === schema.unique_identifier);
      data[schema.unique_identifier] = prop ? generateValue(prop) : String(Math.floor(Math.random() * 10000));
    }
    if (schema.primary_identifiers) {
      for (const id of schema.primary_identifiers) {
        const prop = schema.properties.find((p) => p.id === id);
        if (prop) data[id] = generateValue(prop);
      }
    }
    return data;
  }

  if (rootSchema?.entities) {
    const subEntityKey = entityId.split('.').slice(1).join('.');
    const subEntity = rootSchema.entities[subEntityKey];
    if (subEntity) {
      const data: Record<string, unknown> = {};
      for (const prop of subEntity.properties) {
        if (prop.type !== 'relationship' && prop.type !== 'object') {
          data[prop.id] = generateValue(prop);
        }
      }
      return data;
    }
  }

  return {};
}

function setNested(row: Record<string, unknown>, path: string, value: unknown): void {
  const segments = path.split('.');
  let container = row;
  for (let i = 0; i < segments.length - 1; i++) {
    const key = segments[i];
    if (!container[key] || typeof container[key] !== 'object') {
      container[key] = {};
    }
    container = container[key] as Record<string, unknown>;
  }
  container[segments[segments.length - 1]] = value;
}

export function generateRow(
  rootEntityId: string,
  columnIds: string[],
): Record<string, unknown> {
  const row: Record<string, unknown> = {};

  for (const columnId of columnIds) {
    const resolved = findProperty(rootEntityId, columnId);
    if (!resolved) continue;

    const { property, rootSchema } = resolved;

    if (property.type === 'relationship' || property.type === 'object') {
      let targetEntityId: string | undefined;
      if (property.relationship_type === 'morph_to') {
        const candidates = property.entities?.length ? property.entities : Object.keys(ENTITIES);
        targetEntityId = candidates[Math.floor(Math.random() * candidates.length)];
        setNested(row, columnId + '_type', targetEntityId);
      } else {
        targetEntityId = property.entity;
      }
      if (!targetEntityId) continue;
      const data = generateEntityData(targetEntityId, rootSchema);
      setNested(row, columnId, data);
    } else {
      const value = generateValue(property);
      setNested(row, columnId, value);
    }
  }

  return row;
}
