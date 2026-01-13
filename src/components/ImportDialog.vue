<script setup lang="ts">
import { ref, watch } from 'vue';

const props = defineProps<{ modelValue: boolean; loading?: boolean }>();
const emit = defineEmits<{ (e: 'update:modelValue', value: boolean): void; (e: 'import', markdown: string): void }>();

const markdownText = ref('');
const error = ref<string | null>(null);

watch(
  () => props.modelValue,
  (open) => {
    if (!open) {
      markdownText.value = '';
      error.value = null;
    }
  }
);

function close() {
  emit('update:modelValue', false);
}

function onImport() {
  if (!markdownText.value.trim()) {
    error.value = 'Please paste markdown content first';
    return;
  }
  error.value = null;
  emit('import', markdownText.value);
}
</script>

<template>
  <q-dialog :model-value="modelValue" @update:model-value="(v) => emit('update:modelValue', v)">
    <q-card style="min-width: 600px; max-width: 900px;">
      <q-card-section>
        <div class="text-h6">Import Paper from Markdown</div>
        <div class="text-caption text-grey-7">Paste markdown text and import to populate the editor.</div>
      </q-card-section>

      <q-card-section>
        <q-input
          type="textarea"
          autogrow
          standout
          placeholder="# Paper Title\n\n## Section 1..."
          :model-value="markdownText"
          :disable="loading"
          @update:model-value="(v) => (markdownText = String(v || ''))"
        />
        <div v-if="error" class="text-negative text-caption q-mt-xs">{{ error }}</div>
      </q-card-section>

      <q-card-actions align="right" class="q-gutter-sm">
        <q-btn flat label="Cancel" color="primary" :disable="loading" @click="close" />
        <q-btn unelevated label="Import" color="primary" :loading="loading" @click="onImport" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>
