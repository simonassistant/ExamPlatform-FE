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
  optionText: string;
  isCorrect: boolean;
  explanation?: string;
}

export interface Question {
  id?: string;
  seq: number;
  title: string;
  description?: string;
  questionType?: QuestionType;
  score?: number;
  correctAnswer?: string | string[];
  mediaUrl?: string;
  options: QuestionOption[];
}

export interface QuestionGroup {
  id?: string;
  seq: number;
  title: string;
  content?: string;
  questionType?: QuestionType;
  unitScore?: number;
  questions: Question[];
}

export interface PaperSection {
  id?: string;
  seq: number;
  name: string;
  duration?: number;
  questionType?: QuestionType;
  unitScore?: number;
  fullScore?: number;
  passScore?: number;
  note?: string;
  questionGroups: QuestionGroup[];
}

export interface Paper {
  id?: string;
  title: string;
  duration?: number;
  questionType: QuestionType;
  unitScore?: number;
  fullScore?: number;
  passScore?: number;
  note?: string;
  status?: 'Draft' | 'Published' | 'Archived';
  sections: PaperSection[];
}

export interface ScheduleSession {
  id?: string;
  name: string;
  startTime: string;
  endTime: string;
  status?: string;
}

export interface ScheduleAssignment {
  id?: string;
  paperId: string;
  scheduleSessionId: string;
  startTime: string;
  endTime: string;
  examineeGroupFilter?: string;
}
