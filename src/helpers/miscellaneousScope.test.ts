const test = require('node:test');
const assert = require('node:assert/strict');
const { matchesScopeRule } = require('./miscellaneousScope.ts');

test('matches course rules regardless of university when university is not specified', () => {
  const rule = { type: 'course', course_id: 'course-1' };
  assert.equal(
    matchesScopeRule(rule, {
      course_id: 'course-1',
      course_university_id: 'course-university-99',
      university_id: 'university-2',
      semester: 4,
    }),
    true
  );
});

test('matches course rules only for the selected course university when university is specified', () => {
  const rule = { type: 'course', course_id: 'course-1', university_id: 'university-1' };
  assert.equal(
    matchesScopeRule(rule, {
      course_id: 'course-1',
      course_university_id: 'course-university-1',
      university_id: 'university-1',
      semester: 4,
    }),
    true
  );
  assert.equal(
    matchesScopeRule(rule, {
      course_id: 'course-1',
      course_university_id: 'course-university-2',
      university_id: 'university-2',
      semester: 4,
    }),
    false
  );
});

test('matches semester rules only when course, university and semester all align', () => {
  const rule = {
    type: 'semester',
    course_id: 'course-1',
    university_id: 'university-1',
    semester: 4,
  };
  assert.equal(
    matchesScopeRule(rule, {
      course_id: 'course-1',
      course_university_id: 'course-university-1',
      university_id: 'university-1',
      semester: 4,
    }),
    true
  );
  assert.equal(
    matchesScopeRule(rule, {
      course_id: 'course-1',
      course_university_id: 'course-university-1',
      university_id: 'university-1',
      semester: 5,
    }),
    false
  );
});
