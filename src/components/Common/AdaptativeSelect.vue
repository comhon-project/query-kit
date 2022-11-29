<script setup>
  import { computed, onMounted, onUpdated, ref, watch } from 'vue';

  const emit = defineEmits(['update:modelValue']);
  const props = defineProps({
    modelValue: {
      type: [String, Number],
      required: true
    },
    options: {
      type: Array,
      required: true
    },
    disabled: {
      type: Boolean,
      default: false
    },
  });
  const style = ref({});
  const select = ref(null);
  const selectedLabel = computed(() => {
    const option = props.options.find(opt => opt.value == props.modelValue);
    return option ? option.label : '';
  });

  function updateWidth()
  {
    select.value.insertAdjacentHTML('afterend', `<select :disabled="disabled">
      <option selected>${selectedLabel.value}</option>
    </select>`);
    style.value = { width:  select.value.nextElementSibling.offsetWidth + 'px'};
    select.value.nextElementSibling.remove();
  }

  function updateValue(event) {
    emit('update:modelValue', event.target.value);
  }


  watch(() => props.modelValue, updateWidth, { flush: 'post'});
  onMounted(updateWidth);

</script>

<template>
  <select ref="select" :value="modelValue" @change="updateValue" :style="style" :disabled="disabled">
    <option v-for="(option, index) in options" :key="index" :value="option.value">{{ option.label }}</option>
  </select>
</template>