<script setup lang="ts">
import { computed } from 'vue';
import type { PaperSection, QuestionGroup, Question, QuestionOption } from './models';
import { QuestionType } from './models';

const props = defineProps<{ sections: PaperSection[]; disabled?: boolean }>();
const emit = defineEmits<{ (e: 'update:sections', value: PaperSection[]): void }>();

const questionTypeOptions = [
  { label: 'Inherit (default)', value: undefined },
  { label: 'Single Choice', value: QuestionType.SingleChoice },
  { label: 'True / False', value: QuestionType.TrueFalse },
  { label: 'Definite Multiple Choice', value: QuestionType.DefiniteMultipleChoice },
  { label: 'Indefinite Multiple Choice', value: QuestionType.IndefiniteMultipleChoice },
  { label: 'Fill in the Blank', value: QuestionType.FillInTheBlank },
  { label: 'Writing', value: QuestionType.Writing },
  { label: 'Listening', value: QuestionType.Listening },
  { label: 'Speaking', value: QuestionType.Speaking },
];

const current = computed(() => props.sections ?? []);

function emitUpdate(next: PaperSection[]) {
  emit('update:sections', next);
}

function reorder<T>(list: T[], index: number, delta: number): T[] {
  const target = index + delta;
  if (target < 0 || target >= list.length) return list;
  const clone = [...list];
  const [item] = clone.splice(index, 1);
  clone.splice(target, 0, item);
  return clone;
}

function addSection() {
  const nextSeq = current.value.length + 1;
  const next: PaperSection[] = [
    ...current.value,
    {
      seq: nextSeq,
      name: `Section ${nextSeq}`,
      questionGroups: [],
    },
  ];
  emitUpdate(next);
}

function updateSection(sectionIndex: number, partial: Partial<PaperSection>) {
  const next = current.value.map((section, idx) =>
    idx === sectionIndex ? { ...section, ...partial } : section
  );
  emitUpdate(next);
}

function moveSection(sectionIndex: number, delta: number) {
  const next = reorder(current.value, sectionIndex, delta).map((section, idx) => ({
    ...section,
    seq: idx + 1,
  }));
  emitUpdate(next);
}

function addGroup(sectionIndex: number) {
  const section = current.value[sectionIndex];
  const nextSeq = (section?.questionGroups?.length ?? 0) + 1;
  const next = current.value.map((s, idx) => {
    if (idx !== sectionIndex) return s;
    const groups = [...(s.questionGroups ?? [])];
    groups.push({
      seq: nextSeq,
      title: `Group ${nextSeq}`,
      questions: [],
    } as QuestionGroup);
    return { ...s, questionGroups: groups };
  });
  emitUpdate(next);
}

function updateGroup(sectionIndex: number, groupIndex: number, partial: Partial<QuestionGroup>) {
  const next = current.value.map((s, sIdx) => {
    if (sIdx !== sectionIndex) return s;
    const groups = (s.questionGroups ?? []).map((g, gIdx) => (gIdx === groupIndex ? { ...g, ...partial } : g));
    return { ...s, questionGroups: groups };
  });
  emitUpdate(next);
}

function moveGroup(sectionIndex: number, groupIndex: number, delta: number) {
  const next = current.value.map((s, sIdx) => {
    if (sIdx !== sectionIndex) return s;
    const groups = reorder(s.questionGroups ?? [], groupIndex, delta).map((g, idx) => ({
      ...g,
      seq: idx + 1,
    }));
    return { ...s, questionGroups: groups };
  });
  emitUpdate(next);
}

function addQuestion(sectionIndex: number, groupIndex: number) {
  const next = current.value.map((s, sIdx) => {
    if (sIdx !== sectionIndex) return s;
    const groups = (s.questionGroups ?? []).map((g, gIdx) => {
      if (gIdx !== groupIndex) return g;
      const nextSeq = (g.questions?.length ?? 0) + 1;
      const questions = [...(g.questions ?? [])];
      questions.push({
        seq: nextSeq,
        title: `Question ${nextSeq}`,
        options: [
          { seq: 1, optionText: 'Option 1', isCorrect: true },
          { seq: 2, optionText: 'Option 2', isCorrect: false },
        ],
      } as Question);
      return { ...g, questions };
    });
    return { ...s, questionGroups: groups };
  });
  emitUpdate(next);
}

function updateQuestion(sectionIndex: number, groupIndex: number, questionIndex: number, partial: Partial<Question>) {
  const next = current.value.map((s, sIdx) => {
    if (sIdx !== sectionIndex) return s;
    const groups = (s.questionGroups ?? []).map((g, gIdx) => {
      if (gIdx !== groupIndex) return g;
      const questions = (g.questions ?? []).map((q, qIdx) => (qIdx === questionIndex ? { ...q, ...partial } : q));
      return { ...g, questions };
    });
    return { ...s, questionGroups: groups };
  });
  emitUpdate(next);
}

function addOption(sectionIndex: number, groupIndex: number, questionIndex: number) {
  const next = current.value.map((s, sIdx) => {
    if (sIdx !== sectionIndex) return s;
    const groups = (s.questionGroups ?? []).map((g, gIdx) => {
      if (gIdx !== groupIndex) return g;
      const questions = (g.questions ?? []).map((q, qIdx) => {
        if (qIdx !== questionIndex) return q;
        const nextSeq = (q.options?.length ?? 0) + 1;
        const options = [...(q.options ?? [])];
        options.push({ seq: nextSeq, optionText: `Option ${nextSeq}`, isCorrect: false } as QuestionOption);
        return { ...q, options };
      });
      return { ...g, questions };
    });
    return { ...s, questionGroups: groups };
  });
  emitUpdate(next);
}

function updateOption(sectionIndex: number, groupIndex: number, questionIndex: number, optionIndex: number, partial: Partial<QuestionOption>) {
  const next = current.value.map((s, sIdx) => {
    if (sIdx !== sectionIndex) return s;
    const groups = (s.questionGroups ?? []).map((g, gIdx) => {
      if (gIdx !== groupIndex) return g;
      const questions = (g.questions ?? []).map((q, qIdx) => {
        if (qIdx !== questionIndex) return q;
        const options = (q.options ?? []).map((o, oIdx) => (oIdx === optionIndex ? { ...o, ...partial } : o));
        return { ...q, options };
      });
      return { ...g, questions };
    });
    return { ...s, questionGroups: groups };
  });
  emitUpdate(next);
}
</script>

<template>
  <div class="column q-gutter-md">
    <div class="row items-center justify-between">
      <div class="text-subtitle1">Sections & Questions</div>
      <q-btn color="primary" icon="add" label="Add Section" :disable="disabled" dense @click="addSection" />
    </div>

    <q-list bordered separator class="rounded-borders">
      <template v-if="current.length">
        <q-expansion-item
          v-for="(section, sIdx) in current"
          :key="`section-${sIdx}`"
          :label="`${section.seq}. ${section.name}`"
          expand-separator
          header-class="bg-grey-1 text-primary"
        >
          <q-card flat>
            <q-card-section class="row q-col-gutter-md">
              <div class="col-12 col-md-6">
                <q-input
                  label="Section Name"
                  dense
                  :model-value="section.name"
                  :disable="disabled"
                  @update:model-value="(v) => updateSection(sIdx, { name: v || '' })"
                />
              </div>
              <div class="col-12 col-md-3">
                <q-input
                  label="Duration (min)"
                  type="number"
                  dense
                  :model-value="section.duration ?? ''"
                  :disable="disabled"
                  @update:model-value="(v) => updateSection(sIdx, { duration: v ? Number(v) : undefined })"
                />
              </div>
              <div class="col-12 col-md-3">
                <q-select
                  label="Question Type"
                  dense
                  emit-value
                  map-options
                  :options="questionTypeOptions"
                  :model-value="section.questionType"
                  :disable="disabled"
                  @update:model-value="(v) => updateSection(sIdx, { questionType: v as QuestionType | undefined })"
                />
              </div>
              <div class="col-12">
                <div class="row q-gutter-xs">
                  <q-btn flat icon="arrow_upward" :disable="disabled || sIdx === 0" @click="() => moveSection(sIdx, -1)" />
                  <q-btn flat icon="arrow_downward" :disable="disabled || sIdx === current.length - 1" @click="() => moveSection(sIdx, 1)" />
                  <q-btn flat icon="add" label="Add Group" :disable="disabled" @click="() => addGroup(sIdx)" />
                </div>
              </div>
            </q-card-section>

            <q-separator />

            <div class="q-pa-md q-gutter-md">
              <q-expansion-item
                v-for="(group, gIdx) in section.questionGroups"
                :key="`group-${sIdx}-${gIdx}`"
                switch-toggle-side
                :label="`${group.seq}. ${group.title}`"
              >
                <q-card flat>
                  <q-card-section class="row q-col-gutter-md">
                    <div class="col-12 col-md-6">
                      <q-input
                        label="Group Title"
                        dense
                        :model-value="group.title"
                        :disable="disabled"
                        @update:model-value="(v) => updateGroup(sIdx, gIdx, { title: v || '' })"
                      />
                    </div>
                    <div class="col-12 col-md-3">
                      <q-input
                        label="Unit Score"
                        type="number"
                        dense
                        :model-value="group.unitScore ?? ''"
                        :disable="disabled"
                        @update:model-value="(v) => updateGroup(sIdx, gIdx, { unitScore: v ? Number(v) : undefined })"
                      />
                    </div>
                    <div class="col-12 col-md-3">
                      <q-select
                        label="Question Type"
                        dense
                        emit-value
                        map-options
                        :options="questionTypeOptions"
                        :model-value="group.questionType"
                        :disable="disabled"
                        @update:model-value="(v) => updateGroup(sIdx, gIdx, { questionType: v as QuestionType | undefined })"
                      />
                    </div>
                    <div class="col-12">
                      <div class="row q-gutter-xs">
                        <q-btn flat icon="arrow_upward" :disable="disabled || gIdx === 0" @click="() => moveGroup(sIdx, gIdx, -1)" />
                        <q-btn flat icon="arrow_downward" :disable="disabled || gIdx === (section.questionGroups?.length ?? 0) - 1" @click="() => moveGroup(sIdx, gIdx, 1)" />
                        <q-btn flat icon="add" label="Add Question" :disable="disabled" @click="() => addQuestion(sIdx, gIdx)" />
                      </div>
                    </div>
                  </q-card-section>

                  <q-separator inset />

                  <div class="q-pa-md column q-gutter-sm">
                    <q-card
                      flat
                      bordered
                      v-for="(question, qIdx) in group.questions"
                      :key="`question-${sIdx}-${gIdx}-${qIdx}`"
                    >
                      <q-card-section class="row q-col-gutter-md">
                        <div class="col-12 col-md-8">
                          <q-input
                            label="Question"
                            dense
                            autogrow
                            :model-value="question.title"
                            :disable="disabled"
                            @update:model-value="(v) => updateQuestion(sIdx, gIdx, qIdx, { title: v || '' })"
                          />
                        </div>
                        <div class="col-12 col-md-4">
                          <q-select
                            label="Question Type"
                            dense
                            emit-value
                            map-options
                            :options="questionTypeOptions"
                            :model-value="question.questionType"
                            :disable="disabled"
                            @update:model-value="(v) => updateQuestion(sIdx, gIdx, qIdx, { questionType: v as QuestionType | undefined })"
                          />
                        </div>
                        <div class="col-12 col-md-4">
                          <q-input
                            label="Score"
                            type="number"
                            dense
                            :model-value="question.score ?? ''"
                            :disable="disabled"
                            @update:model-value="(v) => updateQuestion(sIdx, gIdx, qIdx, { score: v ? Number(v) : undefined })"
                          />
                        </div>
                        <div class="col-12 col-md-8">
                          <q-input
                            label="Description / Stem"
                            type="textarea"
                            autogrow
                            :model-value="question.description ?? ''"
                            :disable="disabled"
                            @update:model-value="(v) => updateQuestion(sIdx, gIdx, qIdx, { description: v ?? '' })"
                          />
                        </div>
                      </q-card-section>

                      <q-separator />

                      <q-card-section>
                        <div class="row items-center justify-between q-mb-sm">
                          <div class="text-caption">Options</div>
                          <q-btn flat dense icon="add" label="Add Option" :disable="disabled" @click="() => addOption(sIdx, gIdx, qIdx)" />
                        </div>
                        <div class="column q-gutter-sm">
                          <div class="row q-col-gutter-sm items-center" v-for="(option, oIdx) in question.options" :key="`opt-${sIdx}-${gIdx}-${qIdx}-${oIdx}`">
                            <div class="col-auto">
                              <q-checkbox
                                size="md"
                                :model-value="option.isCorrect"
                                :disable="disabled"
                                @update:model-value="(v) => updateOption(sIdx, gIdx, qIdx, oIdx, { isCorrect: !!v })"
                              />
                            </div>
                            <div class="col">
                              <q-input
                                dense
                                placeholder="Option text"
                                :model-value="option.optionText"
                                :disable="disabled"
                                @update:model-value="(v) => updateOption(sIdx, gIdx, qIdx, oIdx, { optionText: v || '' })"
                              />
                            </div>
                          </div>
                        </div>
                      </q-card-section>
                    </q-card>
                  </div>
                </q-card>
              </q-expansion-item>
            </div>
          </q-card>
        </q-expansion-item>
      </template>
      <div v-else class="q-pa-md text-grey-6">No sections yet. Start by adding a section.</div>
    </q-list>
  </div>
</template>

<style scoped>
.rounded-borders {
  border-radius: 8px;
}
</style>
