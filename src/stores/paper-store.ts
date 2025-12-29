import { acceptHMRUpdate, defineStore } from 'pinia';
import { computed, ref } from 'vue';
import type { Ref } from 'vue';

import type { Paper, PaperSection, Question, QuestionGroup, QuestionOption } from 'src/components/models';
import { QuestionType } from 'src/components/models';
import { paperApi } from 'src/util/util-net';
import { getErrorMessage } from 'src/util/util';

export const usePaperStore = defineStore('paper', () => {
  const paper: Ref<Paper | null> = ref(null);
  const isLoading = ref(false);
  const lastMessage = ref<string | null>(null);
  const paperList = ref<Array<{ id: string; title: string; status?: string; section_count?: number; question_count?: number }>>([]);
  const total = ref(0);

  const sections = computed<PaperSection[]>(() => paper.value?.sections ?? []);

  const flattenedQuestions = computed<Question[]>(() =>
    sections.value.flatMap((section) =>
      section.questionGroups.flatMap((group) => group.questions)
    )
  );

  function setPaper(next: Paper) {
    paper.value = next;
  }

  function updatePaper(partial: Partial<Paper>) {
    if (!paper.value) return;
    paper.value = { ...paper.value, ...partial } as Paper;
  }

  function updateSections(nextSections: PaperSection[]) {
    if (!paper.value) return;
    paper.value = { ...paper.value, sections: nextSections };
  }

  function clearPaper() {
    paper.value = null;
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
      questionType: QuestionType.SingleChoice,
      note: '',
      sections: [
        {
          seq: 1,
          name: 'Section 1',
          questionGroups: [
            {
              seq: 1,
              title: 'Group 1',
              questions: [
                {
                  seq: 1,
                  title: 'Question 1',
                  options: [
                    { seq: 1, optionText: 'Option 1', isCorrect: true },
                    { seq: 2, optionText: 'Option 2', isCorrect: false },
                  ],
                },
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
      const data = unwrap<{ paper?: Paper; [key: string]: any }>(response);
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
      const data = unwrap<{ paper?: Paper; [key: string]: any }>(response);
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
      const data = unwrap<{ paper?: Paper; [key: string]: any }>(response);
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

  function upsertQuestion(sectionSeq: number, groupSeq: number, question: Question) {
    if (!paper.value) return;
    const nextSections = paper.value.sections.map((section) => {
      if (section.seq !== sectionSeq) return section;
      const nextGroups = section.questionGroups.map((group) => {
        if (group.seq !== groupSeq) return group;
        const existingIndex = group.questions.findIndex((q) => q.seq === question.seq);
        const questions: Question[] = [...group.questions];
        if (existingIndex >= 0) {
          questions[existingIndex] = question;
        } else {
          questions.push(question);
        }
        return { ...group, questions };
      });
      return { ...section, questionGroups: nextGroups };
    });
    updateSections(nextSections);
  }

  function upsertQuestionOption(sectionSeq: number, groupSeq: number, questionSeq: number, option: QuestionOption) {
    if (!paper.value) return;
    const nextSections = paper.value.sections.map((section) => {
      if (section.seq !== sectionSeq) return section;
      const nextGroups = section.questionGroups.map((group) => {
        if (group.seq !== groupSeq) return group;
        const nextQuestions = group.questions.map((q) => {
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
        return { ...group, questions: nextQuestions };
      });
      return { ...section, questionGroups: nextGroups };
    });
    updateSections(nextSections);
  }

  return {
    paper,
    sections,
    flattenedQuestions,
    isLoading,
    lastMessage,
    paperList,
    total,
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
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(usePaperStore, import.meta.hot));
}
