import { acceptHMRUpdate, defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { Ref } from 'vue';
import { api } from 'src/util/api';

// =============================================================================
// Exam Types (Examinee-facing)
// =============================================================================
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

// =============================================================================
// T035: Assignment Types (Proctor-facing)
// =============================================================================
export interface ScheduleAssignment {
  id?: string;
  paper_id: string;
  schedule_session_id: string;
  start_time: string;
  end_time: string;
  examinee_group_filter?: string;
}

export interface AssignmentCreatePayload {
  paper_id: string;
  start_time: string;
  end_time: string;
  examinee_group_filter?: string;
}

export interface AssignmentUpdatePayload {
  start_time?: string;
  end_time?: string;
  examinee_group_filter?: string;
}

export interface AssignmentError {
  type: 'conflict' | 'locked' | 'not_found';
  message: string;
}

export const useExamStore = defineStore('exam', () => {
  // ---------------------------------------------------------------------------
  // Examinee Exam State
  // ---------------------------------------------------------------------------
  const answer: Ref = ref();
  const exam: Ref = ref();
  const section: Ref = ref();
  const section_seq: Ref = ref(0);
  const audioPlayTimes: Ref<{ [key: string]: number }> = ref({ 'exam': 0 });
  const end_count_down: Ref = ref(0);
  const entry_count_down: Ref = ref(new Date());
  const timer_count_down: Ref = ref();

  // ---------------------------------------------------------------------------
  // T035: Assignment State
  // ---------------------------------------------------------------------------
  const assignments: Ref<ScheduleAssignment[]> = ref([]);
  const isLoadingAssignments = ref(false);
  const assignmentError: Ref<AssignmentError | null> = ref(null);

  // ---------------------------------------------------------------------------
  // Examinee Functions
  // ---------------------------------------------------------------------------
  function clearExam() {
    answer.value = null;
    audioPlayTimes.value = { 'exam': 0 };
    exam.value = null;
    section.value = null;
  }

  // ---------------------------------------------------------------------------
  // T035: Assignment CRUD Functions
  // ---------------------------------------------------------------------------
  async function loadAssignments(sessionId: string): Promise<ScheduleAssignment[]> {
    isLoadingAssignments.value = true;
    assignmentError.value = null;
    try {
      const response = await api.get(`/api/sessions/${sessionId}/assignments`);
      assignments.value = response.data as ScheduleAssignment[];
      return assignments.value;
    } catch (err: unknown) {
      assignmentError.value = { type: 'not_found', message: 'Failed to load assignments' };
      throw err;
    } finally {
      isLoadingAssignments.value = false;
    }
  }

  async function createAssignment(sessionId: string, payload: AssignmentCreatePayload): Promise<ScheduleAssignment> {
    isLoadingAssignments.value = true;
    assignmentError.value = null;
    try {
      const response = await api.post(`/api/sessions/${sessionId}/assignments`, payload);
      const newAssignment = response.data.assignment as ScheduleAssignment;
      assignments.value.push(newAssignment);
      return newAssignment;
    } catch (err: unknown) {
      const error = err as { response?: { status?: number; data?: { detail?: string } } };
      if (error.response?.status === 409) {
        assignmentError.value = { type: 'conflict', message: error.response.data?.detail || 'Assignment conflicts with existing schedule' };
      } else {
        assignmentError.value = { type: 'not_found', message: 'Failed to create assignment' };
      }
      throw err;
    } finally {
      isLoadingAssignments.value = false;
    }
  }

  async function updateAssignment(sessionId: string, assignmentId: string, payload: AssignmentUpdatePayload): Promise<ScheduleAssignment> {
    isLoadingAssignments.value = true;
    assignmentError.value = null;
    try {
      const response = await api.put(`/api/sessions/${sessionId}/assignments/${assignmentId}`, payload);
      const updated = response.data.assignment as ScheduleAssignment;
      const idx = assignments.value.findIndex(a => a.id === assignmentId);
      if (idx >= 0) assignments.value[idx] = updated;
      return updated;
    } catch (err: unknown) {
      const error = err as { response?: { status?: number; data?: { detail?: string } } };
      if (error.response?.status === 409) {
        assignmentError.value = { type: 'conflict', message: error.response.data?.detail || 'Assignment conflicts with existing schedule' };
      } else if (error.response?.status === 423) {
        assignmentError.value = { type: 'locked', message: error.response.data?.detail || 'Assignment is locked (exam already started)' };
      } else {
        assignmentError.value = { type: 'not_found', message: 'Failed to update assignment' };
      }
      throw err;
    } finally {
      isLoadingAssignments.value = false;
    }
  }

  async function deleteAssignment(sessionId: string, assignmentId: string): Promise<void> {
    isLoadingAssignments.value = true;
    assignmentError.value = null;
    try {
      await api.delete(`/api/sessions/${sessionId}/assignments/${assignmentId}`);
      assignments.value = assignments.value.filter(a => a.id !== assignmentId);
    } catch (err: unknown) {
      const error = err as { response?: { status?: number; data?: { detail?: string } } };
      if (error.response?.status === 423) {
        assignmentError.value = { type: 'locked', message: error.response.data?.detail || 'Assignment is locked (exam already started)' };
      } else {
        assignmentError.value = { type: 'not_found', message: 'Failed to delete assignment' };
      }
      throw err;
    } finally {
      isLoadingAssignments.value = false;
    }
  }

  function clearAssignmentError() {
    assignmentError.value = null;
  }

  return {
    // Examinee state
    answer,
    audioPlayTimes,
    clearExam,
    end_count_down,
    entry_count_down,
    exam,
    section,
    section_seq,
    timer_count_down,
    // T035: Assignment state
    assignments,
    isLoadingAssignments,
    assignmentError,
    loadAssignments,
    createAssignment,
    updateAssignment,
    deleteAssignment,
    clearAssignmentError,
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useExamStore, import.meta.hot));
}

