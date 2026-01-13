import { acceptHMRUpdate, defineStore } from 'pinia';
import { computed, ref, watch } from 'vue';
import type { Ref } from 'vue';

import type { Paper, PaperSection, Question, QuestionOption } from 'src/components/models';
import { QuestionType } from 'src/components/models';
import { paperApi } from 'src/util/util-net';
import { getErrorMessage } from 'src/util/util';

// Re-export types for convenience
export type { Paper, PaperSection, Question, QuestionOption } from 'src/components/models';

// =============================================================================
// T039: Validation Types and Rules
// =============================================================================
export interface ValidationIssue {
  type: 'error' | 'warning';
  path: string;
  message: string;
}

// =============================================================================
// T040: Undo/Redo Configuration
// =============================================================================
const MAX_HISTORY_SIZE = 20;

// =============================================================================
// T041: Auto-save Configuration
// =============================================================================
const AUTO_SAVE_DELAY_MS = 30000; // 30 seconds

export const usePaperStore = defineStore('paper', () => {
  // ---------------------------------------------------------------------------
  // Core State
  // ---------------------------------------------------------------------------
  const paper: Ref<Paper | null> = ref(null);
  const isLoading = ref(false);
  const lastMessage = ref<string | null>(null);
  const paperList = ref<Array<{ id: string; title: string; status?: string; section_count?: number; question_count?: number }>>([]);
  const total = ref(0);
  const section: Ref<PaperSection | null> = ref(null);
  const question: Ref<Question | null> = ref(null);
  const questionGroup: Ref<any | null> = ref(null);
  const questionOptions: Ref<QuestionOption[]> = ref([]);

  // ---------------------------------------------------------------------------
  // T040: Undo/Redo State
  // ---------------------------------------------------------------------------
  const historyStack = ref<string[]>([]);
  const historyIndex = ref(-1);
  const isHistoryAction = ref(false);

  // ---------------------------------------------------------------------------
  // T041: Auto-save State
  // ---------------------------------------------------------------------------
  const isDirty = ref(false);
  const lastSavedAt = ref<Date | null>(null);
  const autoSaveEnabled = ref(true);
  let autoSaveTimer: ReturnType<typeof setTimeout> | null = null;

  // ---------------------------------------------------------------------------
  // Computed Properties
  // ---------------------------------------------------------------------------
  const sections = computed<PaperSection[]>(() => paper.value?.sections ?? []);

  const flattenedQuestions = computed<Question[]>(() =>
    sections.value.flatMap((section) => section.questions)
  );

  // ---------------------------------------------------------------------------
  // T039: Validation Rules (FR-004)
  // ---------------------------------------------------------------------------
  const validationIssues = computed<ValidationIssue[]>(() => {
    const issues: ValidationIssue[] = [];
    if (!paper.value) return issues;

    // Paper-level validation
    if (!paper.value.title?.trim()) {
      issues.push({ type: 'error', path: 'paper.title', message: 'Paper title is required' });
    }
    if (!paper.value.duration || paper.value.duration <= 0) {
      issues.push({ type: 'warning', path: 'paper.duration', message: 'Duration should be set' });
    }
    if (paper.value.sections.length === 0) {
      issues.push({ type: 'error', path: 'paper.sections', message: 'At least one section is required' });
    }

    // Section-level validation
    paper.value.sections.forEach((section, sIdx) => {
      if (!section.name?.trim()) {
        issues.push({ type: 'error', path: `sections[${sIdx}].name`, message: `Section ${sIdx + 1} name is required` });
      }
      if (section.questions.length === 0) {
        issues.push({ type: 'warning', path: `sections[${sIdx}].questions`, message: `Section ${sIdx + 1} has no questions` });
      }

      // Question validation
      section.questions.forEach((q, qIdx) => {
        if (!q.content?.trim()) {
          issues.push({ type: 'error', path: `sections[${sIdx}].questions[${qIdx}].content`, message: `Question ${q.seq} content is required` });
        }
        // Choice questions must have at least 2 options with one correct
        const isChoiceType = [QuestionType.SingleChoice, QuestionType.TrueFalse, QuestionType.DefiniteMultipleChoice, QuestionType.IndefiniteMultipleChoice].includes(q.question_type ?? QuestionType.SingleChoice);
        if (isChoiceType) {
          if (q.options.length < 2) {
            issues.push({ type: 'error', path: `sections[${sIdx}].questions[${qIdx}].options`, message: `Question ${q.seq} needs at least 2 options` });
          }
          const hasCorrect = q.options.some(o => o.is_correct);
          if (!hasCorrect) {
            issues.push({ type: 'error', path: `sections[${sIdx}].questions[${qIdx}].options`, message: `Question ${q.seq} must have a correct answer` });
          }
        }
      });
    });

    return issues;
  });

  const hasErrors = computed(() => validationIssues.value.some(i => i.type === 'error'));
  const hasWarnings = computed(() => validationIssues.value.some(i => i.type === 'warning'));
  const canUndo = computed(() => historyIndex.value > 0);
  const canRedo = computed(() => historyIndex.value < historyStack.value.length - 1);

  // ---------------------------------------------------------------------------
  // T040: History Management Functions
  // ---------------------------------------------------------------------------
  function pushHistory() {
    if (isHistoryAction.value || !paper.value) return;

    const snapshot = JSON.stringify(paper.value);
    // Remove any future states if we're not at the end
    if (historyIndex.value < historyStack.value.length - 1) {
      historyStack.value = historyStack.value.slice(0, historyIndex.value + 1);
    }
    historyStack.value.push(snapshot);
    // Limit history size
    if (historyStack.value.length > MAX_HISTORY_SIZE) {
      historyStack.value.shift();
    } else {
      historyIndex.value++;
    }
  }

  function undo() {
    if (!canUndo.value) return;
    isHistoryAction.value = true;
    historyIndex.value--;
    paper.value = JSON.parse(historyStack.value[historyIndex.value]!) as Paper;
    isHistoryAction.value = false;
    isDirty.value = true;
  }

  function redo() {
    if (!canRedo.value) return;
    isHistoryAction.value = true;
    historyIndex.value++;
    paper.value = JSON.parse(historyStack.value[historyIndex.value]!) as Paper;
    isHistoryAction.value = false;
    isDirty.value = true;
  }

  function clearHistory() {
    historyStack.value = [];
    historyIndex.value = -1;
  }

  // ---------------------------------------------------------------------------
  // T041: Auto-save Functions
  // ---------------------------------------------------------------------------
  function scheduleAutoSave() {
    if (autoSaveTimer) {
      clearTimeout(autoSaveTimer);
    }
    if (!autoSaveEnabled.value || !isDirty.value || !paper.value?.id) return;

    autoSaveTimer = setTimeout(async () => {
      if (isDirty.value && paper.value?.id) {
        try {
          await saveDraft();
          isDirty.value = false;
          lastSavedAt.value = new Date();
        } catch {
          // Silent fail - user can manually save
        }
      }
    }, AUTO_SAVE_DELAY_MS);
  }

  function setAutoSaveEnabled(enabled: boolean) {
    autoSaveEnabled.value = enabled;
    if (!enabled && autoSaveTimer) {
      clearTimeout(autoSaveTimer);
      autoSaveTimer = null;
    }
  }

  // ---------------------------------------------------------------------------
  // Core CRUD Functions
  // ---------------------------------------------------------------------------
  function setPaper(next: Paper) {
    paper.value = next;
    clearHistory();
    pushHistory();
    isDirty.value = false;
  }

  function updatePaper(partial: Partial<Paper>) {
    if (!paper.value) return;
    pushHistory();
    paper.value = { ...paper.value, ...partial } as Paper;
    isDirty.value = true;
    scheduleAutoSave();
  }

  function updateSections(nextSections: PaperSection[]) {
    if (!paper.value) return;
    pushHistory();
    paper.value = { ...paper.value, sections: nextSections };
    isDirty.value = true;
    scheduleAutoSave();
  }

  function clearPaper() {
    paper.value = null;
    clearHistory();
    isDirty.value = false;
  }

  // --- network helpers ---
  function unwrap<T>(response: any): T {
    const payload = response?.data;
    if (payload && typeof payload === 'object' && 'data' in payload) {
      return (payload as any).data as T;
    }
    return payload as T;
  }

  function buildDefaultPaper(): Paper {
    return {
      title: 'Untitled Paper',
      question_type: QuestionType.SingleChoice,
      note: '',
      sections: [
        {
          seq: 1,
          name: 'Section 1',
          content: '',
          questions: [
            {
              seq: 1,
              content: 'Question 1',
              question_type: QuestionType.SingleChoice,
              options: [
                { seq: 1, content: 'Option 1', is_correct: true },
                { seq: 2, content: 'Option 2', is_correct: false },
              ],
            },
          ],
        },
      ],
    };
  }

  async function createDraft(payload?: Paper) {
    isLoading.value = true;
    lastMessage.value = null;
    try {
      const request = payload ?? buildDefaultPaper();
      const response = await paperApi.create(request);
      const data = unwrap<{ paper?: Paper;[key: string]: any }>(response);
      const created = data.paper ?? (data as unknown as Paper);
      setPaper(created);
      return created;
    } catch (e) {
      lastMessage.value = getErrorMessage(e);
      throw e;
    } finally {
      isLoading.value = false;
    }
  }

  async function saveDraft() {
    if (!paper.value || !paper.value.id) {
      return createDraft(paper.value ?? undefined);
    }
    isLoading.value = true;
    lastMessage.value = null;
    try {
      const response = await paperApi.update(paper.value.id, paper.value);
      const data = unwrap<{ paper?: Paper;[key: string]: any }>(response);
      const updated = data.paper ?? (data as unknown as Paper);
      setPaper(updated);
      return updated;
    } catch (e) {
      lastMessage.value = getErrorMessage(e);
      throw e;
    } finally {
      isLoading.value = false;
    }
  }

  async function publishDraft(version?: number) {
    if (!paper.value || !paper.value.id) {
      throw new Error('No paper to publish');
    }
    isLoading.value = true;
    lastMessage.value = null;
    try {
      const response = await paperApi.publish(paper.value.id, version);
      const data = unwrap<{ status?: string; paper_id?: string; version?: number }>(response);
      if (paper.value) {
        paper.value = {
          ...paper.value,
          status: data.status ?? 'Published',
          id: data.paper_id ?? paper.value.id,
        } as Paper;
      }
      return data;
    } catch (e) {
      lastMessage.value = getErrorMessage(e);
      throw e;
    } finally {
      isLoading.value = false;
    }
  }

  async function importMarkdown(markdownText: string) {
    isLoading.value = true;
    lastMessage.value = null;
    try {
      const response = await paperApi.importMarkdown(markdownText);
      const data = unwrap<any>(response);
      lastMessage.value = 'Import completed';
      return data;
    } catch (e) {
      lastMessage.value = getErrorMessage(e);
      throw e;
    } finally {
      isLoading.value = false;
    }
  }

  async function loadPaper(paperId: string) {
    isLoading.value = true;
    lastMessage.value = null;
    try {
      const response = await paperApi.get(paperId);
      const data = unwrap<{ paper?: Paper;[key: string]: any }>(response);
      const loaded = data.paper ?? (data as unknown as Paper);
      setPaper(loaded);
      return loaded;
    } catch (e) {
      lastMessage.value = getErrorMessage(e);
      throw e;
    } finally {
      isLoading.value = false;
    }
  }

  function newDraft() {
    const draft = buildDefaultPaper();
    setPaper(draft);
    return draft;
  }

  async function fetchList(params?: { status?: string; search?: string; page?: number; page_size?: number }) {
    isLoading.value = true;
    lastMessage.value = null;
    try {
      const response = await paperApi.list(params ?? {});
      const data = unwrap<{ items: any[]; total: number }>(response);
      paperList.value = data.items as any[];
      total.value = data.total;
      return data;
    } catch (e) {
      lastMessage.value = getErrorMessage(e);
      throw e;
    } finally {
      isLoading.value = false;
    }
  }

  async function duplicatePaper(paperId: string) {
    isLoading.value = true;
    lastMessage.value = null;
    try {
      const response = await paperApi.duplicate(paperId);
      const data = unwrap<{ paper_id: string }>(response);
      await fetchList();
      return data.paper_id;
    } catch (e) {
      lastMessage.value = getErrorMessage(e);
      throw e;
    } finally {
      isLoading.value = false;
    }
  }

  async function deletePaper(paperId: string) {
    isLoading.value = true;
    lastMessage.value = null;
    try {
      await paperApi.remove(paperId);
      await fetchList();
    } catch (e) {
      lastMessage.value = getErrorMessage(e);
      throw e;
    } finally {
      isLoading.value = false;
    }
  }

  function upsertQuestion(sectionSeq: number, question: Question) {
    if (!paper.value) return;
    const nextSections = paper.value.sections.map((section) => {
      if (section.seq !== sectionSeq) return section;
      const existingIndex = section.questions.findIndex((q) => q.seq === question.seq);
      const questions: Question[] = [...section.questions];
      if (existingIndex >= 0) {
        questions[existingIndex] = question;
      } else {
        questions.push(question);
      }
      return { ...section, questions };
    });
    updateSections(nextSections);
  }

  function upsertQuestionOption(sectionSeq: number, questionSeq: number, option: QuestionOption) {
    if (!paper.value) return;
    const nextSections = paper.value.sections.map((section) => {
      if (section.seq !== sectionSeq) return section;
      const nextQuestions = section.questions.map((q) => {
        if (q.seq !== questionSeq) return q;
        const idx = q.options.findIndex((o) => o.seq === option.seq);
        const options = [...q.options];
        if (idx >= 0) {
          options[idx] = option;
        } else {
          options.push(option);
        }
        return { ...q, options };
      });
      return { ...section, questions: nextQuestions };
    });
    updateSections(nextSections);
  }

  return {
    // Core state
    paper,
    sections,
    flattenedQuestions,
    isLoading,
    lastMessage,
    paperList,
    total,
    // T039: Validation
    validationIssues,
    hasErrors,
    hasWarnings,
    // T040: Undo/Redo
    canUndo,
    canRedo,
    undo,
    redo,
    // T041: Auto-save
    isDirty,
    lastSavedAt,
    autoSaveEnabled,
    setAutoSaveEnabled,
    // Core actions
    setPaper,
    updatePaper,
    updateSections,
    createDraft,
    saveDraft,
    publishDraft,
    importMarkdown,
    loadPaper,
    newDraft,
    fetchList,
    duplicatePaper,
    deletePaper,
    upsertQuestion,
    upsertQuestionOption,
    clearPaper,
    // Examinee question state
    section,
    question,
    questionGroup,
    questionOptions,
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(usePaperStore, import.meta.hot));
}
