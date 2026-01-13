<template>
  <q-card flat class="bg-transparent">
    <q-card-section>
      <div class="text-h6 q-mb-md">Question Bank</div>
      <q-input v-model="filter" dense outlined placeholder="Search templates..." class="q-mb-md">
        <template #append>
          <q-icon name="search" />
        </template>
      </q-input>

      <div v-for="category in filteredCategories" :key="category.name" class="q-mb-md">
        <div class="text-caption text-grey-7 q-mb-xs uppercase">{{ category.name }}</div>
        <draggable
          v-model="category.items"
          :group="{ name: 'questions', pull: 'clone', put: false }"
          :clone="cloneQuestion"
          item-key="id"
          class="q-gutter-y-sm"
        >
          <template #item="{ element }">
            <q-item clickable class="bg-white rounded-borders shadow-1 draggable-item">
              <q-item-section avatar>
                <q-icon :name="element.icon" color="primary" />
              </q-item-section>
              <q-item-section>
                <q-item-label class="text-weight-medium">{{ element.label }}</q-item-label>
                <q-item-label caption>{{ element.typeLabel }}</q-item-label>
              </q-item-section>
            </q-item>
          </template>
        </draggable>
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import draggable from 'vuedraggable';

const filter = ref('');

const categories = ref([
  {
    name: 'General',
    items: [
      { id: 1, label: 'Single Choice', type: 1, typeLabel: 'Select one', icon: 'radio_button_checked' },
      { id: 2, label: 'Multiple Choice', type: 3, typeLabel: 'Select many', icon: 'check_box' },
      { id: 3, label: 'True/False', type: 2, typeLabel: 'Boolean', icon: 'rule' },
    ]
  },
  {
    name: 'Text & Media',
    items: [
      { id: 4, label: 'Short Answer', type: 5, typeLabel: 'Filling', icon: 'edit_note' },
      { id: 5, label: 'Long Essay', type: 6, typeLabel: 'Writing', icon: 'article' },
      { id: 6, label: 'Listening Task', type: 7, typeLabel: 'Audio Based', icon: 'audiotrack' },
      { id: 7, label: 'Speaking Task', type: 8, typeLabel: 'Microphone', icon: 'mic' },
    ]
  }
]);

const filteredCategories = computed(() => {
  if (!filter.value) return categories.value;
  const searchTerm = filter.value.toLowerCase();
  
  return categories.value.map(cat => ({
    ...cat,
    items: cat.items.filter(item => 
      item.label.toLowerCase().includes(searchTerm) || 
      item.typeLabel.toLowerCase().includes(searchTerm)
    )
  })).filter(cat => cat.items.length > 0);
});

function cloneQuestion(template: any) {
  return {
    temp_id: Math.random().toString(36).substr(2, 9),
    content: `New ${template.label}`,
    question_type: template.type,
    score: 1,
    options: template.type <= 4 ? [
      { code: 'A', content: 'Option A', is_correct: false },
      { code: 'B', content: 'Option B', is_correct: false },
    ] : [],
  };
}
</script>

<style scoped>
.draggable-item {
  cursor: grab;
  border: 1px solid #eee;
}
.draggable-item:active {
  cursor: grabbing;
}
</style>
