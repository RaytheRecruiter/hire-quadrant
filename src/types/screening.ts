export type ScreeningQuestionType = 'yes_no' | 'short_text' | 'number' | 'multiple_choice';

export interface ScreeningQuestion {
  id: string;
  type: ScreeningQuestionType;
  question: string;
  required: boolean;
  knockout: boolean;
  expectedAnswer?: string; // used for knockout (yes_no / multiple_choice) or min number
  choices?: string[]; // for multiple_choice
}

export interface ScreeningAnswer {
  questionId: string;
  answer: string;
}
