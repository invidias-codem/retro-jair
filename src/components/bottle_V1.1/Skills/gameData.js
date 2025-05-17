// gameData.js
export const skillsData = [
    { name: 'React', points: 3, category: 'frontend' },
    { name: 'Node.js', points: 3, category: 'backend' },
    { name: 'Python', points: 2, category: 'backend' },
    { name: 'SQL', points: 2, category: 'database' },
    { name: 'JavaScript', points: 2, category: 'frontend' },
    { name: 'HTML/CSS', points: 1, category: 'frontend' },
    { name: 'Git', points: 1, category: 'tool' },
    { name: 'REST API', points: 2, category: 'backend' },
    { name: 'MongoDB', points: 2, category: 'database' },
    { name: 'AWS', points: 2, category: 'cloud' },
    { name: 'TypeScript', points: 3, category: 'frontend' },
    { name: 'Docker', points: 2, category: 'tool' },
    { name: 'GraphQL', points: 3, category: 'backend' },
    { name: 'Vue.js', points: 3, category: 'frontend' },
    { name: 'Testing', points: 2, category: 'methodology' }
];

export const antiSkillsData = [
    { name: 'Procrastination', points: -3 },
    { name: 'Bugs', points: -2 },
    { name: 'Coffee Spills', points: -1 },
    { name: 'Meetings', points: -2 },
    { name: 'Slow Internet', points: -2 },
    { name: 'Distractions', points: -2 },
    { name: 'Burnout', points: -3 },
    { name: 'Scope Creep', points: -2 },
    { name: 'Legacy Code', points: -2 },
    { name: 'Deadlines', points: -2 },
    { name: 'Multitasking', points: -1 },
    { name: 'Tech Debt', points: -2 },
    { name: 'Feature Creep', points: -2 },
    { name: 'Overtime', points: -1 },
    { name: 'Imposter Syndrome', points: -2 },
    { name: 'Noisy Colleagues', points: -1 },
    { name: 'Unexpected Reboots', points: -2 }
];

export const mysteryItemsData = [
    { name: 'Mystery Box', effect: 'random_score_change', points: 0 }, // Points here are nominal
    { name: 'Question Mark', effect: 'temp_shield', points: 0 },
    { name: 'Surprise Package', effect: 'clear_some_antis', points: 0 },
    { name: 'Gambler\'s Orb', effect: 'double_or_half_next', points: 0 } // effect on next collected item
];

export const eventModifiers = [
    { type: 'FRENZY_MODE', name: 'Frenzy Mode!', duration: 15000, description: 'Items are faster and spawn more!' },
    { type: 'HIGH_STAKES', name: 'High Stakes!', duration: 20000, description: 'All points doubled (good and bad)!' },
    { type: 'SAFE_ZONE', name: 'Safe Zone!', duration: 10000, description: 'No anti-skills will spawn!' },
    { type: 'SPECIFIC_SKILL_BONUS', name: 'Skill Hunter!', duration: 20000, description: 'Bonus for a specific skill!' }
    // { type: 'NONE', name: 'Normal', duration: Infinity, description: 'Standard conditions.' }
];