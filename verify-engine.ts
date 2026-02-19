
import { generateLearningGoals } from './src/lib/mock-ai';
import { PlanData } from './src/lib/types';

const testPlan: PlanData = {
    mode: 'single',
    title: 'Fussball heute',
    subject: 'Ethik / Sport',
    topicDescription: 'Die zunehmende Kommerzialisierung des Fussballs und die Folgen für die Fankultur.',
    level: 'sek1',
    durationMinutes: 45,
    lessonCount: 1,
    classProfile: {
        classSize: 20,
        heterogeneity: 'medium',
        languageLevel: 'b2',
    },
    specialNeeds: '',
    learningGoalType: 'analysis',
    goals: [],
    curriculumMappings: [],
    didacticSlots: { slot1: 'standard', slot2: null, slot3: null },
    shortVersion: null,
    detailPlan: null,
    sequenceSkeleton: null,
    status: 'draft',
    gateAApproved: false,
    gateBApproved: false,
};

async function runTest() {
    console.log('--- GENERATING GOALS ---');
    console.log('Description:', testPlan.topicDescription);
    const goals = generateLearningGoals(testPlan);
    console.log('GOALS:');
    goals.forEach(g => console.log(`- ${g}`));
}

runTest().catch(console.error);
