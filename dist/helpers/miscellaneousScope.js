"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.matchesScopeRule = matchesScopeRule;
exports.matchesScopeRules = matchesScopeRules;
function matchesScopeRule(rule, member) {
    switch (rule.type) {
        case 'general':
            return true;
        case 'cae':
            return !!rule.cae_id && member.cae_id === rule.cae_id;
        case 'car':
            return !!rule.car_id && member.car_id === rule.car_id;
        case 'city':
            return !!rule.city_id && member.city_id === rule.city_id;
        case 'university':
            return !!rule.university_id && member.university_id === rule.university_id;
        case 'course': {
            if (!rule.course_id)
                return false;
            const courseMatches = member.course_id === rule.course_id;
            if (!rule.university_id)
                return courseMatches;
            return courseMatches && member.university_id === rule.university_id;
        }
        case 'semester': {
            if (!rule.course_id || rule.semester === undefined || rule.semester === null)
                return false;
            const courseMatches = member.course_id === rule.course_id;
            const semesterMatches = member.semester === rule.semester;
            if (!rule.university_id)
                return courseMatches && semesterMatches;
            return courseMatches && semesterMatches && member.university_id === rule.university_id;
        }
        default:
            return false;
    }
}
function matchesScopeRules(rules, member) {
    if (!rules?.length)
        return true;
    return rules.some(rule => matchesScopeRule(rule, member));
}
