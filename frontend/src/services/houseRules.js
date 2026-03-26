import { getDB, saveDB, nextId, delay } from './mockData';

export const houseRulesService = {
    getRules: async (roomId) => {
        await delay();
        const db = getDB();
        return db.houseRules.filter(r => r.room_id === roomId);
    },

    addRule: async (roomId, ruleText) => {
        await delay();
        const db = getDB();
        const rule = {
            id: nextId(db.houseRules),
            room_id: roomId,
            rule_text: ruleText,
            created_at: new Date().toISOString(),
        };
        db.houseRules.push(rule);
        saveDB(db);
        return rule;
    },

    updateRule: async (ruleId, ruleText) => {
        await delay();
        const db = getDB();
        const rule = db.houseRules.find(r => r.id === ruleId);
        if (rule) rule.rule_text = ruleText;
        saveDB(db);
        return rule;
    },

    deleteRule: async (ruleId) => {
        await delay();
        const db = getDB();
        db.houseRules = db.houseRules.filter(r => r.id !== ruleId);
        saveDB(db);
        return { message: 'Deleted' };
    },
};
