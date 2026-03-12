# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

query-kit is a Vue 3 library for building complex queries and displaying object collections with an intuitive user interface. It provides filter builders, data collections with pagination, and schema-driven entity management.

## Repository Structure

Monorepo using npm workspaces:
- `packages/vue` - Main Vue 3 component library (`@query-kit/vue`)
- `packages/themes` - CSS themes using CSS variables (`@query-kit/themes`)

## Common Commands

All commands run from `packages/vue/`:

```bash
npm run dev              # Dev server (playground)
npm run build            # Type-check + Vite build
npm run test:unit        # Run all tests
npm run test:coverage    # Tests + coverage report (text + HTML in ../coverage/)
npm run lint             # ESLint with auto-fix
npm run type-check       # vue-tsc --noEmit

# Single test file
npx vitest run src/__tests__/core/schema.spec.js --config vitest.config.ts
```

Root `package.json` also has `test:unit` and `lint` scripts that work from the repo root.

## Architecture

### Public API (`packages/vue/index.ts`)

Three exports: `plugin` (Vue plugin), `locale` (ref for runtime language switching), `MultipleCapableComponent` (base class for custom inputs).

### Plugin System (`src/core/Plugin.ts`)

Installed via `app.use(plugin, options)`. The options object configures:
- **Required**: `entitySchemaLoader` - loads entity schemas by ID
- **Optional loaders**: `entityTranslationsLoader`, `enumSchemaLoader`, `enumTranslationsLoader`, `requestSchemaLoader`
- **UI**: `icons`, `iconComponent`, `iconPropName`, `classes`, `inputs`
- **Cell renderers**: `cellTypeRenderers`, `cellPropertyRenderers`
- **Locale**: `defaultLocale`, `fallbackLocale`
- **Operators/scopes**: `operators`, `computedScopes`
- **Query execution**: `requester` (function or `{ request }` object)

Loaders are called lazily on first use and results are cached.

### Component Hierarchy

Three global components registered by the plugin:
- **QkitSearch** (`components/Search.vue`) - Composite: Builder + Collection
- **QkitBuilder** (`components/Filter/Builder.vue`) - Standalone filter tree builder
- **QkitCollection** (`components/Collection/Collection.vue`) - Data table with pagination/infinite scroll

**Filter tree** (nested under Builder):
`Group` → `ChildGroup` → `GroupElement` → `Condition` | `Scope` | `RelationshipCondition`

Input components: `UniqueInput`, `ArrayableInput`, `CollectionInput`

**Collection sub-components**: `Header`, `Cell`, `ColumnEditor`, `Pagination`

### Composables (`components/Filter/Composable/`)

- `History.ts` - Undo/redo stack
- `FilterWithOperator.ts` - Operator selection logic
- `Searchable.ts` - Property search/filter for picker UIs
- `TreeNavigation.ts` - Keyboard navigation for filter tree

### Core Managers (`src/core/`)

Singleton managers with `_resetForTesting()` methods for test isolation:
- `EntitySchema.ts`, `EnumSchema.ts`, `RequestSchema.ts` - Schema loading/caching
- `Requester.ts` - Query execution (configurable per-instance or globally)
- `OperatorManager.ts` - Allowed operators per condition/group
- `InputManager.ts` - Custom input component registration
- `CellRendererManager.ts` - Cell renderer by type or property
- `IconManager.ts` - Icon component/class config
- `ClassManager.ts` - CSS class customization

### Path Aliases

Configured in both `vite.config.ts` and `vitest.config.ts`:
- `@core/*` → `src/core/*`
- `@components/*` → `src/components/*`
- `@i18n/*` → `src/i18n/*`
- `@config/*` → `src/config/*`
- `@tests/*` → `src/__tests__/*`

### i18n (`src/i18n/`)

Built-in locales: en, fr, de, es, pt, ru, zh, ja, ar, hi, bn. Dynamic import of locale files. Runtime switching via exported `locale` ref.

## Testing

Tests in `src/__tests__/` using Vitest + jsdom. Config in `packages/vue/vitest.config.ts`.

### Test Helpers (`src/__tests__/helpers/`)

- `mountPlugin.ts` - `mountWithPlugin()`: mounts component with the query-kit plugin and default loaders
- `flushAsync.ts` - `flushAll()`: flushPromises + nextTick + flushPromises for async watchEffect resolution
- `createMockRequester.ts` - Factory for mocking request/response cycles
- `provideConfig.ts` - `builderConfigProvide()`: injects BuilderConfig via InjectionKeys

### Test Setup (`src/__tests__/setup.ts`)

- Calls `_resetForTesting()` on all core managers in `beforeEach`
- Mocks jsdom gaps: `IntersectionObserver` (class-based), `HTMLDialogElement.showModal/close`, `Element.getAnimations`, `Element.scrollTo`

### Test Assets (`src/__tests__/assets/`)

Schema fixtures, mock requesters, and translations used across tests.

### Key Patterns

- Use `mountWithPlugin` for any component that relies on the plugin (most components)
- Call `await flushAll()` after mount for components with async `watchEffect`
- Always `afterEach(() => wrapper?.unmount())` to prevent stale watchEffects during reset
- Use `vi.useFakeTimers()` for Builder tests (debounced emission)
- Use `vi.hoisted()` for variables referenced inside `vi.mock()` factories

## Rules

- Every new implementation must have unit tests.

## Development Notes

- The playground in `packages/vue/playground/` has its own schemas, requesters, and config in `main.js`
- The codebase is transitioning from JavaScript to TypeScript (core modules are .ts, some components still .vue with JS)
- Coverage HTML report viewable at `packages/vue/coverage/index.html` after running `test:coverage`
