import { acceptHMRUpdate, defineStore } from 'pinia';
import { ref } from 'vue';
import type { Ref } from 'vue';

export interface Exam {
  id: string;
  status: number;
  actual_start: Date;
  actual_end: Date;
  examinee_id: string;
  paper_id: string;
  schedule_session_id: string;
  schedule_id: string;
}

export interface ExamSection {
  id: string;
  exam_id: string;
  name: string;
  actual_start?: Date;
  actual_end?: Date;
  schedule_session_id: string;
  schedule_id: string;
  seq: number;
}

export interface ExamAnswer {
  id: string;
  answer: string;
  sort: number;
}

export const useExamStore = defineStore('exam', () => {
  const answer:Ref = ref();
  const exam:Ref = ref();
  const section:Ref = ref();
  const section_seq:Ref = ref(0);
  const audioPlayTimes:Ref<{ [key: string]: number }> = ref({'exam':0});
  const end_count_down:Ref = ref(0);
  const entry_count_down:Ref = ref(new Date());
  const timer_count_down:Ref = ref();

  function clearExam() {
    answer.value = null;
    audioPlayTimes.value = {'exam':0};
    exam.value = null;
    section.value = null;
  }

  return { answer, audioPlayTimes, clearExam, end_count_down, entry_count_down, exam, section, section_seq, timer_count_down };
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useExamStore, import.meta.hot));
}
