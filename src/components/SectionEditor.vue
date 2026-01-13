<script setup lang="ts">
import { computed } from 'vue';
import type { PaperSection } from './models';

const props = defineProps<{ sections: PaperSection[]; disabled?: boolean }>();
const emit = defineEmits<{ (e: 'update:sections', sections: PaperSection[]): void }>();

const current = computed(() => props.sections);

function emitUpdate(sections: PaperSection[]) {
  emit('update:sections', sections);
}
</script>

<template>
  <q-banner class="bg-warning text-white">
    <template v-slot:avatar>
      <q-icon name="warning" />
    </template>
    <div class="text-h6">Deprecated Component</div>
    <div>SectionEditor is deprecated. Please use PaperEditorPage instead at /proctor/papers/:id</div>
    <div class="q-mt-md">
      <strong>Current sections:</strong> {{ current.length }}
    </div>
  </q-banner>
</template>
