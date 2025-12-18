import { acceptHMRUpdate, defineStore } from 'pinia';
import { ref } from 'vue';
import type { Ref } from 'vue';

export enum QuestionType {
  SingleChoice = 1,
  TureFalse,
  DefiniteMultipleChoice,
  IndefiniteMultipleChoice,
  FillInTheBlank,
  Writing,
  Listening,
  Speaking,
}

export interface Paper {
  id: string;
  duration: number;
  note: string;
  title: string;
}

export interface PaperSection {
  id: string;
  duration: number;
  full_score?: number;
  name: string;
  note: string;
  pass_score?: number;
  question_num: number;
  question_type: number;
  seq: number;
  unit_score?: number;
}

export interface Question {
  id: string;
  code: string;
  content: string;
  seq: number;
  question_type: QuestionType;
  score: number;
}

export interface QuestionGroup {
  id: string;
  code: string;
  content: string;
  seq: number;
  title: string;
}

export interface QuestionOption {
  id: string;
  code: string;
  content: string;
  question_id: string;
}


export const usePaperStore = defineStore('paper', () => {
  const paper:Ref = ref();
  const question:Ref = ref();
  const questionGroup:Ref = ref();
  const questionOptions:Ref = ref();
  const section:Ref = ref();
  const sections:Ref = ref();

  function clearPaper() {
    paper.value = null;
    question.value = null;
    questionOptions.value = null;
    questionGroup.value = null;
    section.value = null;
    sections.value = null;
  }

  return { clearPaper, paper, question, questionGroup, questionOptions, section, sections };
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(usePaperStore, import.meta.hot));
}
