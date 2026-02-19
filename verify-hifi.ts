
import { generateDetailPlan } from './src/lib/mock-ai';
import { PlanData } from './src/lib/types';

const testPlan: PlanData = {
    mode: 'single',
    title: 'Hifi Test',
    subject: 'Physik',
    topicDescription: 'Der einfache Stromkreis und die Gefahren.',
    level: 'sek1',
    durationMinutes: 45,
    lessonCount: 1,
    goals: [],
    didacticSlots: { slot1: 'aviva', slot2: null, slot3: null },
    shortVersion: null,
    detailPlan: null,
    sequenceSkeleton: null,
    status: 'draft',
    gateAApproved: false,
    gateBApproved: false,
    classProfile: { classSize: 20, heterogeneity: 'medium', languageLevel: 'b2' },
    specialNeeds: ''
};

async function runTest() {
    console.log('--- GENERATING HIFI PLAN ---');
    const detail = await generateDetailPlan(testPlan);

    console.log('DIAGNOSIS:');
    console.log(JSON.stringify(detail.didacticDiagnosis, null, 2));

    console.log('\nRUBRIC:');
    console.log(JSON.stringify(detail.assessmentRubric, null, 2));

    console.log('\nPHASES:');
    detail.phases.forEach(p => console.log(`- ${p.name}`));
}

runTest().catch(console.error);
