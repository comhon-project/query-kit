import { flushPromises } from '@vue/test-utils';
import { nextTick } from 'vue';

export async function flushAll(): Promise<void> {
  await flushPromises();
  await nextTick();
  await flushPromises();
}
