# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Query-Kit is a Vue 3 library for building complex queries and displaying object collections. The main package `@query-kit/vue` provides components for query filtering, data tables, pagination, and search capabilities.

## Commands

```bash
# Development
npm run dev              # Start Vite dev server (serves playground)

# Build
npm run build            # Type-check + vite build

# Testing
npm run test:unit        # Run vitest unit tests

# Linting & Type Checking
npm run lint             # ESLint with auto-fix
npm run type-check       # vue-tsc type checking
```

## Architecture

### Plugin Pattern
The library uses Vue's plugin pattern for configuration. Core plugin (`Plugin.ts`) registers:
- **Managers**: Singleton registries for CSS classes, icons, inputs, cell renderers, operators
- **Loaders**: Async schema loaders (EntitySchema, EnumSchema, RequestSchema)

### Manager System
All managers follow a registry pattern with Proxy-based read-only access:
- `ClassManager` - CSS class mapping
- `IconManager` - Icon configuration
- `InputManager` - Component registry for data types
- `CellRendererManager` - Cell rendering by type or property
- `OperatorManager` - Query operators configuration

### Schema System (Class-Based)
- `EntitySchema` class encapsulates entity properties, scopes, and metadata
- Schemas are async-loaded and cached via `resolve()` function
- Each entity has a `unique_identifier` property for identification

### Filter Type Hierarchy
```
Filter
├── ConditionFilter       (property + operator + value)
├── ScopeFilter          (predefined scope with parameters)
├── GroupFilter          (AND/OR grouping)
└── RelationshipConditionFilter (filtering related entities)
```

### Component Structure
- `Search.vue` - Main orchestrator coordinating filter builder and collection
- `Filter/Builder.vue` - Query construction with nested AND/OR groups
- `Collection/Collection.vue` - Data table with pagination and dynamic columns
- `Filter/Composable/` - Reusable composition functions (FilterWithOperator, PropertyPath, Searchable)

### Data Flow
1. **Search Component** manages filter state, sorting, pagination
2. **Filter Builder** constructs queries via property → operator → value selection
3. **Collection Component** renders data with type-based cell rendering
4. **Requester** executes requests and returns `RequestResponse<T>`

## Path Aliases

Defined in `vite.config.js`:
- `@core` → `src/core/`
- `@components` → `src/components/`
- `@i18n` → `src/i18n/`
- `@config` → `src/config/`
- `@tests` → `src/__tests__/`

## Code Conventions

- Vue 3 Composition API with `<script setup>` and TypeScript
- ESLint flat config with Vue plugin (multi-word component names disabled)
- Prettier: 120 char width, single quotes
- Use `structuredClone()` for deep copying filters
- Proxy-based immutability for manager registries

## Package Structure

```
packages/
├── vue/           # Main library (@query-kit/vue)
│   ├── src/
│   │   ├── core/        # Business logic & managers
│   │   ├── components/  # Vue components
│   │   ├── i18n/        # Internationalization with lazy-loaded locales
│   │   └── config/      # Global configuration
│   └── playground/      # Development environment
└── themes/        # CSS themes (@query-kit/themes)
```

## Key Types

- `Filter` - Base filter union type
- `ConditionFilter` - Single condition with property path, operator, and value
- `EntitySchema` - Class representing entity metadata and properties
- `ArrayableTypeContainer` - Recursive structure for nested array types
- `RequestResponse<T>` - Generic response wrapper for data requests
