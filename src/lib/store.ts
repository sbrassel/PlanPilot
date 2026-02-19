// ============================================
// PlanPilot — Zustand Store (State Management)
// ============================================

'use client';

import { create } from 'zustand';
import type { PlanData, PlanMode, Level, LearningGoalType, StructureModel, LearningMode, QualityLayer, ShortVersion, DetailPlan, SequenceSkeleton, CurriculumMapping } from './types';
import { validateStep, isStepAccessible } from './validation';

// --- Initial Plan Data ---

function createInitialPlan(): PlanData {
    return {
        mode: 'single',
        title: '',
        subject: '',
        topicDescription: '',
        level: null,
        durationMinutes: 45,
        lessonCount: 6,
        classProfile: {
            classSize: 20,
            heterogeneity: 'medium',
            languageLevel: 'b2',
        },
        specialNeeds: '',
        learningGoalType: null,
        goals: [''],
        curriculumMappings: [],
        didacticSlots: {
            slot1: null,
            slot2: null,
            slot3: null,
        },
        shortVersion: null,
        detailPlan: null,
        sequenceSkeleton: null,
        status: 'draft',
        gateAApproved: false,
        gateBApproved: false,
    };
}

// --- Store Interface ---

interface PlanStore {
    // State
    plan: PlanData;
    currentStep: number;
    isGenerating: boolean;
    validationErrors: string[];
    undoStack: PlanData[];
    redoStack: PlanData[];

    // Edited short version (for diff comparison)
    editedShortVersion: ShortVersion | null;

    // Navigation
    setStep: (step: number) => void;
    nextStep: () => void;
    prevStep: () => void;

    // Plan mutations
    updatePlan: (partial: Partial<PlanData>) => void;
    setMode: (mode: PlanMode) => void;
    setLevel: (level: Level) => void;
    setDuration: (minutes: number) => void;
    setLearningGoalType: (type: LearningGoalType) => void;
    setSubject: (subject: string) => void;
    setTopicDescription: (desc: string) => void;
    setTitle: (title: string) => void;
    setClassSize: (size: number) => void;
    setHeterogeneity: (het: 'low' | 'medium' | 'high') => void;
    setLanguageLevel: (level: string) => void;
    setSpecialNeeds: (notes: string) => void;

    // Goals
    addGoal: () => void;
    updateGoal: (index: number, value: string) => void;
    removeGoal: (index: number) => void;
    setGoals: (goals: string[]) => void;

    // Didactic slots
    setSlot1: (value: StructureModel | null) => void;
    setSlot2: (value: LearningMode | null) => void;
    setSlot3: (value: QualityLayer | null) => void;

    // AI Generation
    setGenerating: (generating: boolean) => void;
    setShortVersion: (sv: ShortVersion) => void;
    setDetailPlan: (dp: DetailPlan) => void;
    setSequenceSkeleton: (ss: SequenceSkeleton) => void;
    setEditedShortVersion: (sv: ShortVersion) => void;

    // Gates
    approveGateA: () => void;
    approveGateB: () => void;
    resetGates: () => void;

    // Curriculum mappings
    addCurriculumMapping: (mapping: CurriculumMapping) => void;
    removeCurriculumMapping: (competencyId: string) => void;
    confirmMapping: (competencyId: string) => void;

    // Sequence lesson details
    setLessonDetail: (lessonIndex: number, detail: DetailPlan) => void;
    lessonGeneratingIndex: number | null;
    setLessonGeneratingIndex: (index: number | null) => void;

    // Undo/Redo
    undo: () => void;
    redo: () => void;
    canUndo: () => boolean;
    canRedo: () => boolean;

    // Reset
    resetPlan: () => void;
}

// --- Autosave ---

function saveToLocalStorage(plan: PlanData, step: number) {
    if (typeof window !== 'undefined') {
        try {
            localStorage.setItem('planpilot-draft', JSON.stringify({ plan, step, timestamp: Date.now() }));
        } catch {
            // Storage full or unavailable
        }
    }
}

function loadFromLocalStorage(): { plan: PlanData; step: number } | null {
    if (typeof window !== 'undefined') {
        try {
            const saved = localStorage.getItem('planpilot-draft');
            if (saved) {
                return JSON.parse(saved);
            }
        } catch {
            // Invalid data
        }
    }
    return null;
}

// --- Store ---

export const usePlanStore = create<PlanStore>((set, get) => {
    // Try to load saved state
    const saved = loadFromLocalStorage();

    return {
        plan: saved?.plan || createInitialPlan(),
        currentStep: saved?.step || 1,
        isGenerating: false,
        validationErrors: [],
        undoStack: [],
        redoStack: [],
        editedShortVersion: null,
        lessonGeneratingIndex: null,

        // --- Navigation ---

        setStep: (step) => {
            const { plan } = get();
            if (isStepAccessible(step, plan)) {
                set({ currentStep: step, validationErrors: [] });
                saveToLocalStorage(plan, step);
            }
        },

        nextStep: () => {
            const { currentStep, plan } = get();
            const validation = validateStep(currentStep, plan);

            if (!validation.valid) {
                set({ validationErrors: validation.errors });
                return;
            }

            const nextStep = currentStep + 1;
            if (nextStep <= 9 && isStepAccessible(nextStep, plan)) {
                set({ currentStep: nextStep, validationErrors: [] });
                saveToLocalStorage(plan, nextStep);
            }
        },

        prevStep: () => {
            const { currentStep, plan } = get();
            if (currentStep > 1) {
                const prev = currentStep - 1;
                set({ currentStep: prev, validationErrors: [] });
                saveToLocalStorage(plan, prev);
            }
        },

        // --- Plan Mutations (with undo support) ---

        updatePlan: (partial) => {
            const { plan, undoStack } = get();
            const newStack = [...undoStack, structuredClone(plan)].slice(-50);
            const newPlan = { ...plan, ...partial };
            set({ plan: newPlan, undoStack: newStack, redoStack: [] });
            saveToLocalStorage(newPlan, get().currentStep);
        },

        setMode: (mode) => get().updatePlan({ mode }),
        setLevel: (level) => get().updatePlan({ level }),
        setDuration: (minutes) => get().updatePlan({ durationMinutes: minutes }),
        setLearningGoalType: (type) => get().updatePlan({ learningGoalType: type }),
        setSubject: (subject) => get().updatePlan({ subject }),
        setTopicDescription: (desc) => get().updatePlan({ topicDescription: desc }),
        setTitle: (title) => get().updatePlan({ title }),
        setClassSize: (size) => get().updatePlan({
            classProfile: { ...get().plan.classProfile, classSize: size }
        }),
        setHeterogeneity: (het) => get().updatePlan({
            classProfile: { ...get().plan.classProfile, heterogeneity: het }
        }),
        setLanguageLevel: (level) => get().updatePlan({
            classProfile: { ...get().plan.classProfile, languageLevel: level as 'a1' | 'a2' | 'b1' | 'b2' | 'c1' | 'c2' }
        }),
        setSpecialNeeds: (notes) => get().updatePlan({ specialNeeds: notes }),

        // --- Goals ---

        addGoal: () => {
            const { plan } = get();
            get().updatePlan({ goals: [...plan.goals, ''] });
        },

        updateGoal: (index, value) => {
            const { plan } = get();
            const newGoals = [...plan.goals];
            newGoals[index] = value;
            get().updatePlan({ goals: newGoals });
        },

        removeGoal: (index) => {
            const { plan } = get();
            if (plan.goals.length > 1) {
                get().updatePlan({ goals: plan.goals.filter((_, i) => i !== index) });
            }
        },

        setGoals: (goals) => get().updatePlan({ goals }),

        // --- Didactic Slots ---

        setSlot1: (value) => get().updatePlan({
            didacticSlots: { ...get().plan.didacticSlots, slot1: value }
        }),

        setSlot2: (value) => get().updatePlan({
            didacticSlots: { ...get().plan.didacticSlots, slot2: value }
        }),

        setSlot3: (value) => get().updatePlan({
            didacticSlots: { ...get().plan.didacticSlots, slot3: value }
        }),

        // --- AI Generation ---

        setGenerating: (generating) => set({ isGenerating: generating }),

        setShortVersion: (sv) => {
            get().updatePlan({
                shortVersion: sv,
                status: 'ai_generated',
            });
            set({ editedShortVersion: JSON.parse(JSON.stringify(sv)) });
        },

        setDetailPlan: (dp) => {
            get().updatePlan({
                detailPlan: dp,
                status: 'detail_ready',
            });
        },

        setSequenceSkeleton: (ss) => {
            get().updatePlan({ sequenceSkeleton: ss });
        },

        setEditedShortVersion: (sv) => {
            set({ editedShortVersion: sv });
            get().updatePlan({ status: 'edited' });
        },

        // --- Gates ---

        approveGateA: () => {
            get().updatePlan({ gateAApproved: true, status: 'edited' });
        },

        approveGateB: () => {
            get().updatePlan({ gateBApproved: true, status: 'approved' });
        },

        resetGates: () => {
            get().updatePlan({ gateAApproved: false, gateBApproved: false, status: 'draft' });
        },

        // --- Curriculum Mappings ---

        addCurriculumMapping: (mapping) => {
            const { plan } = get();
            // Prevent duplicates
            if (plan.curriculumMappings.some(m => m.competencyId === mapping.competencyId)) return;
            get().updatePlan({
                curriculumMappings: [...plan.curriculumMappings, mapping],
            });
        },

        removeCurriculumMapping: (competencyId) => {
            const { plan } = get();
            get().updatePlan({
                curriculumMappings: plan.curriculumMappings.filter(m => m.competencyId !== competencyId),
            });
        },

        confirmMapping: (competencyId) => {
            const { plan } = get();
            get().updatePlan({
                curriculumMappings: plan.curriculumMappings.map(m =>
                    m.competencyId === competencyId ? { ...m, confirmed: true } : m
                ),
            });
        },

        // --- Sequence Lesson Details ---

        setLessonDetail: (lessonIndex, detail) => {
            const { plan } = get();
            if (!plan.sequenceSkeleton) return;
            const lessons = [...plan.sequenceSkeleton.lessons];
            if (lessons[lessonIndex]) {
                lessons[lessonIndex] = { ...lessons[lessonIndex], detailPlan: detail };
                get().updatePlan({
                    sequenceSkeleton: { ...plan.sequenceSkeleton, lessons },
                });
            }
        },

        setLessonGeneratingIndex: (index) => set({ lessonGeneratingIndex: index }),

        // --- Undo/Redo ---

        undo: () => {
            const { undoStack, plan } = get();
            if (undoStack.length > 0) {
                const previous = undoStack[undoStack.length - 1];
                set({
                    plan: previous,
                    undoStack: undoStack.slice(0, -1),
                    redoStack: [...get().redoStack, plan],
                });
                saveToLocalStorage(previous, get().currentStep);
            }
        },

        redo: () => {
            const { redoStack, plan } = get();
            if (redoStack.length > 0) {
                const next = redoStack[redoStack.length - 1];
                set({
                    plan: next,
                    redoStack: redoStack.slice(0, -1),
                    undoStack: [...get().undoStack, plan],
                });
                saveToLocalStorage(next, get().currentStep);
            }
        },

        canUndo: () => get().undoStack.length > 0,
        canRedo: () => get().redoStack.length > 0,

        // --- Reset ---

        resetPlan: () => {
            const fresh = createInitialPlan();
            set({
                plan: fresh,
                currentStep: 1,
                validationErrors: [],
                undoStack: [],
                redoStack: [],
                editedShortVersion: null,
            });
            saveToLocalStorage(fresh, 1);
        },
    };
});
