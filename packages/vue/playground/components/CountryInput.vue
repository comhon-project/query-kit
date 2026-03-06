<script setup>
import { locale } from '@query-kit/vue';
import { computed, ref, watch, onBeforeUnmount } from 'vue';

const emit = defineEmits(['update:modelValue']);
const props = defineProps({
  modelValue: { type: [Array, String], default: null },
  multiple: { type: Boolean, required: true },
  disabled: { type: Boolean, required: true },
});

const options = computed(() => [
  { value: '1', label: locale.value === 'fr' ? 'Angleterre' : 'England', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
  { value: '2', label: 'France', flag: '🇫🇷' },
  { value: '3', label: locale.value === 'fr' ? 'Allemagne' : 'Germany', flag: '🇩🇪' },
]);

// ── single ───────────────────────────────────────────────────
const singleValue = computed(() => (Array.isArray(props.modelValue) ? props.modelValue[0] : props.modelValue));
function onSingleChange(e) {
  emit('update:modelValue', e.target.value || null);
}

// ── multi ────────────────────────────────────────────────────
const selected = computed(() =>
  Array.isArray(props.modelValue) ? props.modelValue : props.modelValue ? [props.modelValue] : [],
);

const open = ref(false);
const wrapper = ref(null);

function labelOf(val) {
  return options.value.find((o) => o.value === val)?.label ?? val;
}
function flagOf(val) {
  return options.value.find((o) => o.value === val)?.flag ?? '';
}
function isSelected(val) {
  return selected.value.includes(val);
}

function toggle(val) {
  const next = isSelected(val) ? selected.value.filter((v) => v !== val) : [...selected.value, val];
  emit('update:modelValue', next.length ? next : null);
}

function remove(val) {
  const next = selected.value.filter((v) => v !== val);
  emit('update:modelValue', next.length ? next : null);
}

function onFieldClick() {
  if (!props.disabled) open.value = !open.value;
}

function closeIfOutside(e) {
  if (!wrapper.value?.contains(e.target)) open.value = false;
}

// Le setTimeout garantit que le listener s'enregistre APRÈS que le clic
// d'ouverture ait fini de bubbler — sinon il se déclenche immédiatement
// et referme le dropdown.
watch(open, (isOpen) => {
  if (isOpen) {
    setTimeout(() => document.addEventListener('click', closeIfOutside), 0);
  } else {
    document.removeEventListener('click', closeIfOutside);
  }
});

onBeforeUnmount(() => document.removeEventListener('click', closeIfOutside));
</script>

<template>
  <!-- single -->
  <select v-if="!multiple" :disabled="disabled" :value="singleValue" @change="onSingleChange">
    <option value="" />
    <option v-for="o in options" :key="o.value" :value="o.value">{{ o.flag }} {{ o.label }}</option>
  </select>

  <!-- multi -->
  <div v-else ref="wrapper" class="ms" :class="{ 'ms--open': open, 'ms--disabled': disabled }">
    <div class="ms__field" @click="onFieldClick">
      <span v-if="!selected.length" class="ms__placeholder">—</span>
      <span v-for="val in selected" :key="val" class="ms__tag">
        <span class="ms__tag-label">{{ flagOf(val) }} {{ labelOf(val) }}</span>
        <button v-if="!disabled" type="button" class="ms__tag-remove" tabindex="-1" @click.stop="remove(val)">×</button>
      </span>
      <span class="ms__arrow">▾</span>
    </div>

    <ul v-if="open" class="ms__list">
      <li
        v-for="o in options"
        :key="o.value"
        class="ms__option"
        :class="{ 'ms__option--active': isSelected(o.value) }"
        @click="toggle(o.value)"
      >
        <span class="ms__option-flag">{{ o.flag }}</span>
        <span class="ms__option-label">{{ o.label }}</span>
        <span v-if="isSelected(o.value)" class="ms__check">✓</span>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.ms {
  position: relative;
  display: inline-block;
  min-width: 160px;
  font-size: 0.875rem;
}

/* ── field ── */
.ms__field {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
  min-height: 32px;
  padding: 4px 26px 4px 6px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: #fff;
  cursor: pointer;
  position: relative;
  user-select: none;
}

.ms--open .ms__field {
  border-color: #6366f1;
  box-shadow: 0 0 0 2px #c7d2fe;
}

.ms--disabled .ms__field {
  background: #f9fafb;
  cursor: default;
}

.ms__placeholder {
  color: #9ca3af;
  padding: 0 2px;
}

.ms__arrow {
  position: absolute;
  right: 7px;
  top: 50%;
  transform: translateY(-50%);
  color: #6b7280;
  font-size: 0.7rem;
  pointer-events: none;
}

/* ── tags ── */
.ms__tag {
  display: inline-flex;
  align-items: stretch;
  background: #e0e7ff;
  border: 1px solid #c7d2fe;
  border-radius: 4px;
  overflow: hidden;
  color: #3730a3;
  font-size: 0.8rem;
  white-space: nowrap;
}

.ms__tag-label {
  padding: 2px 6px;
}

.ms__tag-remove {
  display: flex;
  align-items: center;
  padding: 0 6px;
  border: none;
  border-left: 1px solid #c7d2fe;
  background: transparent;
  color: #6366f1;
  cursor: pointer;
  font-size: 1rem;
  line-height: 1;
}

.ms__tag-remove:hover {
  background: #6366f1;
  color: #fff;
}

/* ── dropdown ── */
.ms__list {
  position: absolute;
  top: calc(100% + 3px);
  left: 0;
  right: 0;
  margin: 0;
  padding: 4px 0;
  list-style: none;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
  z-index: 1000;
}

.ms__option {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 10px;
  cursor: pointer;
  transition: background 0.1s;
}

.ms__option:hover {
  background: #f5f3ff;
}

.ms__option--active {
  background: #eef2ff;
}

.ms__option-flag {
  font-size: 1.1rem;
}
.ms__option-label {
  flex: 1;
}
.ms__check {
  color: #6366f1;
  font-weight: 700;
}
</style>
