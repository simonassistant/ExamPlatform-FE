export enum QuestionType {
  SingleChoice = 1,
  TrueFalse = 2,
  DefiniteMultipleChoice = 3,
  IndefiniteMultipleChoice = 4,
  FillInTheBlank = 5,
  Writing = 6,
  Listening = 7,
  Speaking = 8,
}

export interface QuestionOption {
  id?: string;
  seq: number;
  code?: string; // For A, B, C, D labels (generated in frontend)
  content: string;
  is_correct: boolean;
  explanation?: string;
  question_id?: string;
}

export interface Question {
  id?: string;
  seq: number;
  content: string;
  description?: string;
  question_type?: QuestionType;
  score?: number;
  media_url?: string;
  options: QuestionOption[];
  temp_id?: string; // For FE draggable
}

export interface PaperSection {
  id?: string;
  seq: number;
  name: string;
  content?: string;
  duration?: number;
  question_type?: QuestionType;
  full_score?: number;
  pass_score?: number;
  note?: string;
  questions: Question[];
  temp_id?: string; // For FE draggable
  question_num?: number; // Computed or from backend for examinee flow
}

export enum PaperType {
  Reading = 1,
  Listening = 2,
  Writing = 3,
  Speaking = 4,
}

export interface Paper {
  id?: string;
  title: string;
  paper_type?: PaperType;
  duration?: number;
  question_type?: QuestionType;
  full_score?: number;
  pass_score?: number;
  note?: string;
  status?: 'Draft' | 'Published' | 'Archived';
  sections: PaperSection[];
}

export interface ScheduleSession {
  id?: string;
  name: string;
  start_time: string;
  end_time: string;
  status?: string;
}

export interface ScheduleAssignment {
  id?: string;
  paper_id: string;
  schedule_session_id: string;
  start_time: string;
  end_time: string;
  examinee_group_filter?: string;
}
