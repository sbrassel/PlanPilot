// ============================================
// PlanPilot — TypeScript Type Definitions
// ============================================

// --- Enums / Literal Types ---

export type Level = 'kg' | 'primar' | 'sek1' | '10sj' | 'gymnasium';
export type PlanMode = 'single' | 'sequence' | 'unit';
export type LearningGoalType = 'knowledge' | 'application' | 'reflection' | 'transfer';
export type Heterogeneity = 'low' | 'medium' | 'high';
export type LanguageLevel = 'a1' | 'a2' | 'b1' | 'b2' | 'c1' | 'c2';

// Didactic Slot 1: Structure Model
export type StructureModel =
  | 'aviva'
  | 'direct_instruction'
  | '5e'
  | 'workshop'
  | 'project_cycle';

// Didactic Slot 2: Learning Mode
export type LearningMode =
  | 'cooperative'
  | 'problem_based'
  | 'inquiry'
  | 'project_based'
  | 'practice'
  | 'discourse';

// Didactic Slot 3: Quality Layer
export type QualityLayer =
  | 'four_k'
  | 'deeper_learning'
  | 'language_sensitive'
  | 'formative_assessment'
  | 'udl'
  | 'self_regulated'
  | 'gamification';

export type PlanStatus =
  | 'draft'
  | 'ai_generated'
  | 'edited'
  | 'revised'
  | 'approved'
  | 'detail_ready'
  | 'exported';

// --- Interfaces ---

export interface ClassProfile {
  classSize: number;
  heterogeneity: Heterogeneity;
  languageLevel: LanguageLevel;
  notes?: string;
}

export interface DidacticSlots {
  slot1: StructureModel | null;
  slot2: LearningMode | null;
  slot3: QualityLayer | null;
}

// --- Curriculum ---

export type CurriculumSource = 'lehrplan21' | 'custom_upload';

export interface CurriculumCompetency {
  id: string;
  code: string;
  area: string;
  competencyArea: string;
  competency: string;
  cycle: string | null;
  levelIndicators: string[];
  source?: CurriculumSource;
}

export interface CurriculumMapping {
  competencyId: string;
  competencyCode: string;
  competencyText: string;
  area: string;
  confidenceScore: number; // 0.0 – 1.0
  confirmed: boolean;
}

export interface Differentiation {
  niveauA: string; // Basis
  niveauB: string; // Standard
  niveauC: string; // Challenge
  sentenceStarters?: string[];
  wordList?: string[];
  accessModes?: ('text' | 'visual' | 'audio' | 'product')[];
  supportHints?: string;
}

export interface Phase {
  id: string;
  name: string; // Teilschritte
  durationMinutes: number; // Zeit
  description: string; // Detailbeschreibung
  didacticComment?: string; // Didaktischer Kommentar
  teacherActions?: string; // Inhalte, Tätigkeit der Lehrperson
  childActions?: string; // Inhalte, Tätigkeit der Kinder
  materials?: string[]; // Material / Medien
  socialForm?: string; // Sozialform
  differentiation: Differentiation;
  planBAlternative?: string;
}

export interface ShortVersion {
  title: string;
  overview: string;
  goals: string[];
  phasesSummary: PhaseSummary[];
  differentiationSummary: Differentiation;
  languageSupports?: string[];
}

export interface PhaseSummary {
  name: string;
  durationMinutes: number;
  description: string;
}

export interface DetailPlan {
  phases: Phase[];
  planBIncluded: boolean;
  reflectionNotes: string;

  // New High-Fidelity Fields (Block L)
  didacticDiagnosis?: {
    coreConcept: string;
    misconceptions: string[];
    thresholdConcept: string;
    relevance: string;
  };
  assessmentRubric?: {
    criteria: string;
    levelA: string;
    levelB: string;
    levelC: string;
  }[];
}

export interface SequenceLesson {
  id: string;
  lessonNumber: number;
  title: string;
  focus: string;
  goals: string[];
  durationMinutes: number;
  intermediateCheck?: string;
  shortVersion?: ShortVersion;
  detailPlan?: DetailPlan;
}

export interface SequenceSkeleton {
  lessons: SequenceLesson[];
  progression: string;
  overallGoals: string[];
}

export interface PlanData {
  // Step 1: Context
  mode: PlanMode;
  title: string;
  subject: string;
  topicDescription: string;
  level: Level | null;
  durationMinutes: number;
  lessonCount: number; // For sequence mode
  classProfile: ClassProfile; // Moved up in UI, but kept in data model here
  specialNeeds: string; // "Besonderes"
  learningGoalType: LearningGoalType | null;

  // Step 2: Goals + Curriculum
  goals: string[];
  curriculumMappings: CurriculumMapping[];

  // Step 3: Didactics
  didacticSlots: DidacticSlots;

  // Generated content
  shortVersion: ShortVersion | null;
  detailPlan: DetailPlan | null;
  sequenceSkeleton: SequenceSkeleton | null;

  // Status
  status: PlanStatus;
  gateAApproved: boolean;
  gateBApproved: boolean;
}

export interface QualityWarning {
  type: 'time' | 'compatibility' | 'language' | 'workload' | 'resources';
  severity: 'info' | 'warning' | 'error';
  message: string;
  suggestion?: string;
}

export interface CompatibilityResult {
  compatible: boolean;
  warnings: QualityWarning[];
  alternatives?: string[];
}

export interface StepConfig {
  id: number;
  title: string;
  description: string;
  isGate: boolean;
  gateLabel?: string;
}
