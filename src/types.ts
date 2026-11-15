export type ActivityId = 'greeting' | 'turn_taking' | 'classroom_participation';

export type LanguageLevel = 1 | 2 | 3;

export type SystemState = 'IDLE' | 'PRESENTING' | 'WAITING' | 'PAUSED' | 'COMPLETED';

export type PromptSource = 'static' | 'gemini_verified' | 'fallback_safe';

export type ResponseType =
  | 'كلام'
  | 'اختيار صورة'
  | 'إشارة'
  | 'تفاعل مع زميل'
  | 'صمت / انتظار هادئ';

export type InitiationType =
  | 'مبادرة ذاتية'
  | 'استجابة بعد التعليمة'
  | 'استجابة بعد تلميح';

export type SupportLevel =
  | 'مستقل'
  | 'إعادة'
  | 'تبسيط'
  | 'خياران بصريان'
  | 'مساعدة بشرية';

export type InteractionPartner =
  | 'أسماء'
  | 'المعلم'
  | 'زميل فعلي'
  | 'المجموعة';

export interface ChildPreferences {
  sensory_notes: string;
  calm_reinforcer: string;
  avoid_triggers: string;
  preferred_modality?: string;
}

export interface ChildProfile {
  child_id: string;
  alias: string; // Symbol + pseudonym only (e.g. "نجم 1" - no real names)
  avatar_symbol: string;
  age_band: '6-8' | '9-10' | '11-12';
  communication_mode: 'لفظي' | 'بصري / بطاقات' | 'إشارة + لفظي محدود' | 'متنوع';
  language_level: LanguageLevel;
  wait_time: number; // Reference wait time in seconds (e.g. 8, 10, 12, 15)
  preferences: ChildPreferences;
  created_at: string;
}

export interface VisualCard {
  id: string;
  label: string;
  symbol: string;
  category: string;
  spokenText: string;
  isTarget?: boolean;
}

export interface StepDefinition {
  step_id: number;
  title: string;
  defaultPrompt: string;
  instructionNote: string;
  mainSymbol: string;
  cards: VisualCard[];
  SimplifiedFallbacks: Record<LanguageLevel, string>;
  requiresPeerCooperationCheck?: boolean;
  isClosingStep?: boolean;
}

export interface VariationContent {
  variationId: string;
  label: string;
  description: string;
  steps: StepDefinition[];
}

export interface ActivityDefinition {
  id: ActivityId;
  unitNumber: number;
  title: string;
  subtitle: string;
  iconSymbol: string;
  description: string;
  variations: VariationContent[];
}

export interface SessionRecord {
  session_id: string;
  activity_id: ActivityId;
  variation: string;
  participating_children: string[]; // ordered array of child_ids
  status: 'active' | 'paused' | 'completed';
  started_at: string;
  ended_at?: string | null;
}

export interface TurnRecord {
  turn_id: string;
  session_id: string;
  child_id: string;
  child_alias: string;
  activity_id: ActivityId;
  variation: string;
  step_id: number;
  prompt_text: string;
  prompt_source: PromptSource;
  response_type: ResponseType;
  initiation_type: InitiationType;
  support_level: SupportLevel;
  interaction_partner: InteractionPartner;
  peer_cooperation: boolean | null;
  selected_card_label?: string | null;
  wait_elapsed_sec: number;
  recorded_by: 'teacher';
  created_at: string;
}

export interface ObservationEditEntry {
  previous_text: string;
  edited_at: string;
  previous_response_type?: ResponseType;
  previous_support_level?: SupportLevel;
}

export interface ObservationRecord {
  observation_id: string;
  session_id: string;
  turn_id: string;
  child_id: string;
  child_alias: string;
  activity_id: ActivityId;
  step_id: number;
  response_type: ResponseType;
  initiation_type: InitiationType;
  support_level: SupportLevel;
  interaction_partner: InteractionPartner;
  peer_cooperation?: boolean | null;
  note_text: string;
  source: 'teacher';
  recorded_by: 'teacher';
  edit_history: ObservationEditEntry[];
  created_at: string;
  updated_at: string;
}

export interface SystemEventRecord {
  event_id: string;
  session_id: string;
  activity_id: ActivityId;
  step_id: number;
  event_type:
    | 'SESSION_START'
    | 'SESSION_END'
    | 'STEP_CHANGE'
    | 'TURN_ROTATE'
    | 'TURN_SKIP'
    | 'PROMPT_REPEAT'
    | 'PROMPT_SIMPLIFY'
    | 'VISUAL_HINT'
    | 'HUMAN_HELP'
    | 'EMERGENCY_STOP'
    | 'SAFETY_FILTER_TEST'
    | 'CARD_CLICKED';
  model_status: 'static_used' | 'gemini_verified' | 'fallback_used' | 'rejected_by_filter' | 'system_state';
  details: string;
  source: 'system';
  created_at: string;
}

export interface ValidationResult {
  valid: boolean;
  cleanedText: string;
  wordCount: number;
  sentenceCount: number;
  rejectedReason?: string;
  matchedForbiddenWords: string[];
}
