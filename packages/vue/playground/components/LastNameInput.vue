<script setup>
const props = defineProps({
  modelValue: { default: null },
  disabled: { type: Boolean, required: true },
});

const emit = defineEmits(['update:modelValue']);

function update(event) {
  const value = event.target.value.trim() || null;
  emit('update:modelValue', value ? value.toUpperCase() : value);
}
</script>

<template>
  <span class="last-name-input">
    <span class="last-name-input__prefix">AA</span>
    <input
      :value="modelValue"
      :disabled="disabled"
      type="text"
      placeholder="LAST NAME"
      @input="update"
    />
  </span>
</template>

<style scoped>
.last-name-input {
  display: inline-flex;
  align-items: center;
  border: 2px solid #6366f1;
  border-radius: 6px;
  overflow: hidden;
  font-family: monospace;
}

.last-name-input__prefix {
  padding: 0 6px;
  background: #6366f1;
  color: #fff;
  font-size: 0.75rem;
  font-weight: bold;
  letter-spacing: 0.05em;
  align-self: stretch;
  display: flex;
  align-items: center;
}

.last-name-input input {
  border: none;
  outline: none;
  padding: 4px 6px;
  font-family: monospace;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  width: 12ch;
}

.last-name-input input:disabled {
  background: #f3f4f6;
  color: #9ca3af;
}
</style>
