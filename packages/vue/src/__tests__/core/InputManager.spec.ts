import { describe, it, expect } from 'vitest';
import { defineComponent } from 'vue';

import {
  getComponent,
  supportsMultiple,
  isNativeHtmlComponent,
  registerComponents,
  MultipleCapableComponent,
  _resetForTesting,
} from '@core/InputManager';
import type { TypeContainer, ArrayableTypeContainer } from '@core/EntitySchema';
import BooleanInput from '@components/Common/BooleanInput.vue';
import SelectEnum from '@components/Common/SelectEnum.vue';
import DateTimeInput from '@components/Common/DateTimeInput.vue';

function container(type: string, extra: Partial<TypeContainer> = {}): TypeContainer {
  return { type, ...extra };
}

function arrayContainer(childType: string, childExtra: Partial<TypeContainer> = {}): ArrayableTypeContainer {
  return {
    type: 'array',
    children: { type: childType, ...childExtra },
  };
}

describe('InputManager', () => {
  describe('getComponent', () => {
    it('returns "text" for string type', () => {
      expect(getComponent(container('string'))).toBe('text');
    });

    it('returns "text" for html type', () => {
      expect(getComponent(container('html'))).toBe('text');
    });

    it('returns "number" for integer type', () => {
      expect(getComponent(container('integer'))).toBe('number');
    });

    it('returns "number" for float type', () => {
      expect(getComponent(container('float'))).toBe('number');
    });

    it('returns "date" for date type', () => {
      expect(getComponent(container('date'))).toBe('date');
    });

    it('returns DateTimeInput component for datetime type', () => {
      expect(getComponent(container('datetime'))).toBe(DateTimeInput);
    });

    it('returns "time" for time type', () => {
      expect(getComponent(container('time'))).toBe('time');
    });

    it('returns BooleanInput component for boolean type', () => {
      expect(getComponent(container('boolean'))).toBe(BooleanInput);
    });

    it('returns SelectEnum component for enum type (when enum is set)', () => {
      expect(getComponent(container('string', { enum: 'status' }))).toBe(SelectEnum);
    });

    it('throws for unknown type', () => {
      expect(() => getComponent(container('unknown_type'))).toThrow('invalid type unknown_type');
    });
  });

  describe('supportsMultiple', () => {
    it('returns true for enum type (MultipleCapableComponent)', () => {
      expect(supportsMultiple(container('string', { enum: 'status' }) as ArrayableTypeContainer)).toBe(true);
    });

    it('returns false for string type', () => {
      expect(supportsMultiple(container('string') as ArrayableTypeContainer)).toBe(false);
    });

    it('returns false for integer type', () => {
      expect(supportsMultiple(container('integer') as ArrayableTypeContainer)).toBe(false);
    });

    it('returns false for boolean type', () => {
      expect(supportsMultiple(container('boolean') as ArrayableTypeContainer)).toBe(false);
    });

    it('returns false for date type', () => {
      expect(supportsMultiple(container('date') as ArrayableTypeContainer)).toBe(false);
    });

    it('returns false for datetime type', () => {
      expect(supportsMultiple(container('datetime') as ArrayableTypeContainer)).toBe(false);
    });

    it('unwraps array containers and checks the leaf type', () => {
      // array of enums should return true
      expect(supportsMultiple(arrayContainer('string', { enum: 'colors' }))).toBe(true);
    });

    it('unwraps array of strings and returns false', () => {
      expect(supportsMultiple(arrayContainer('string'))).toBe(false);
    });
  });

  describe('isNativeHtmlComponent', () => {
    it('returns true for "text"', () => {
      expect(isNativeHtmlComponent('text')).toBe(true);
    });

    it('returns true for "number"', () => {
      expect(isNativeHtmlComponent('number')).toBe(true);
    });

    it('returns true for "date"', () => {
      expect(isNativeHtmlComponent('date')).toBe(true);
    });

    it('returns true for "time"', () => {
      expect(isNativeHtmlComponent('time')).toBe(true);
    });

    it('returns true for "email"', () => {
      expect(isNativeHtmlComponent('email')).toBe(true);
    });

    it('returns true for "textarea"', () => {
      expect(isNativeHtmlComponent('textarea')).toBe(true);
    });

    it('returns true for "select"', () => {
      expect(isNativeHtmlComponent('select')).toBe(true);
    });

    it('returns true for "checkbox"', () => {
      expect(isNativeHtmlComponent('checkbox')).toBe(true);
    });

    it('returns true for "password"', () => {
      expect(isNativeHtmlComponent('password')).toBe(true);
    });

    it('returns true for "datetime-local"', () => {
      expect(isNativeHtmlComponent('datetime-local')).toBe(true);
    });

    it('returns false for a Vue component object', () => {
      const MyComponent = defineComponent({ template: '<div />' });
      expect(isNativeHtmlComponent(MyComponent)).toBe(false);
    });

    it('returns false for an arbitrary string not in the native list', () => {
      expect(isNativeHtmlComponent('my-custom-input')).toBe(false);
    });
  });

  describe('registerComponents', () => {
    it('overrides an existing component mapping', () => {
      const CustomBooleanInput = defineComponent({ template: '<span />' });
      registerComponents({ boolean: CustomBooleanInput });
      expect(getComponent(container('boolean'))).toBe(CustomBooleanInput);
    });

    it('registers a new custom type component', () => {
      const CustomInput = defineComponent({ template: '<input />' });
      registerComponents({ currency: CustomInput });
      expect(getComponent(container('currency'))).toBe(CustomInput);
    });

    it('allows registering a MultipleCapableComponent', () => {
      const CustomSelect = defineComponent({ template: '<select />' });
      registerComponents({ custom_enum: new MultipleCapableComponent(CustomSelect) });
      expect(getComponent(container('custom_enum'))).toBe(CustomSelect);
      expect(supportsMultiple(container('custom_enum') as ArrayableTypeContainer)).toBe(true);
    });

    it('allows registering a native HTML component string', () => {
      registerComponents({ custom: 'email' });
      expect(getComponent(container('custom'))).toBe('email');
      expect(isNativeHtmlComponent('email')).toBe(true);
    });
  });

  describe('_resetForTesting', () => {
    it('restores default component mappings after override', () => {
      const Custom = defineComponent({ template: '<div />' });
      registerComponents({ string: Custom });
      expect(getComponent(container('string'))).toBe(Custom);

      _resetForTesting();
      expect(getComponent(container('string'))).toBe('text');
    });

    it('removes custom type registrations', () => {
      const Custom = defineComponent({ template: '<div />' });
      registerComponents({ currency: Custom });
      expect(getComponent(container('currency'))).toBe(Custom);

      _resetForTesting();
      expect(() => getComponent(container('currency'))).toThrow('invalid type currency');
    });

    it('restores boolean to BooleanInput', () => {
      registerComponents({ boolean: 'checkbox' });
      expect(getComponent(container('boolean'))).toBe('checkbox');

      _resetForTesting();
      expect(getComponent(container('boolean'))).toBe(BooleanInput);
    });

    it('restores datetime to DateTimeInput', () => {
      registerComponents({ datetime: 'datetime-local' });
      expect(getComponent(container('datetime'))).toBe('datetime-local');

      _resetForTesting();
      expect(getComponent(container('datetime'))).toBe(DateTimeInput);
    });

    it('restores enum to SelectEnum via MultipleCapableComponent', () => {
      const Custom = defineComponent({ template: '<div />' });
      registerComponents({ enum: Custom });
      expect(getComponent(container('string', { enum: 'status' }))).toBe(Custom);

      _resetForTesting();
      expect(getComponent(container('string', { enum: 'status' }))).toBe(SelectEnum);
      expect(supportsMultiple(container('string', { enum: 'status' }) as ArrayableTypeContainer)).toBe(true);
    });
  });
});
