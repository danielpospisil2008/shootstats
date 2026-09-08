/*
 * Offline tests for database.rules.v2.json
 * -----------------------------------------
 * Runs the Realtime Database security rules through `targaryen`, a local
 * evaluator, and checks that each read/write is allowed or denied the way we
 * expect. No network, no Firebase project, no Java — just `npm test`.
 *
 * Run it every time you touch database.rules.v2.json. A failing line here means
 * the rules would let something through (or block something) that they should
 * not — fix the rules, not the test, unless the expectation itself is wrong.
 */

const fs = require('fs');
const path = require('path');
const targaryen = require('targaryen');

const RULES_FILE = path.join(__dirname, '..', 'database.rules.v2.json');
const rules = JSON.parse(fs.readFileSync(RULES_FILE, 'utf8'));
const ruleset = targaryen.ruleset(rules);

/* ---- fake accounts ------------------------------------------------------- */
const COACH   = 'coach-uid';     // owns group g1
const ATHLETE = 'athlete-uid';   // member of group g1
const OUTSIDER = 'outsider-uid'; // signed in, but not in any group
const anon = targaryen.users.unauthenticated;
const as = uid => ({ uid });

/* ---- starting state of the database ------------------------------------- */
function freshDb() {
  return targaryen.database(ruleset, {
    users: {
      [ATHLETE]: {
        memberGroups: { g1: true },
        coachAccess: { [COACH]: true },
        profile: { email: 'a@example.com', firstName: 'Ann' },
        sessions: { s1: { hits: 10 } }
      },
      [COACH]: {
        ownedGroups: { g1: true },
        profile: { email: 'c@example.com' }
      }
    },
    groups: {
      g1: { ownerUid: COACH, name: 'Team', code: 'ABC123', members: { [ATHLETE]: true } }
    },
    groupCodes: { ABC123: 'g1' }
  });
}

/* ---- tiny test runner -------------------------------------------------- */
let passed = 0;
let failed = 0;

function expect(label, result, wantAllowed) {
  const got = result.allowed;
  if (got === wantAllowed) {
    passed++;
    console.log(`  ok   ${label}  (${got ? 'ALLOW' : 'DENY'})`);
  } else {
    failed++;
    console.log(`  FAIL ${label}`);
    console.log(`       expected ${wantAllowed ? 'ALLOW' : 'DENY'}, got ${got ? 'ALLOW' : 'DENY'}`);
    if (result.info) console.log('       ' + String(result.info).split('\n')[0]);
  }
}

const allow = (label, r) => expect(label, r, true);
const deny  = (label, r) => expect(label, r, false);

/* ====================================================================== */
console.log('\nSessions / profile — a coach may read a linked athlete, nobody else');

allow('athlete reads own sessions',
  freshDb().as(as(ATHLETE)).read(`users/${ATHLETE}/sessions`));
allow('coach reads linked athlete sessions',
  freshDb().as(as(COACH)).read(`users/${ATHLETE}/sessions`));
deny('outsider reads athlete sessions',
  freshDb().as(as(OUTSIDER)).read(`users/${ATHLETE}/sessions`));
deny('athlete writes another user\'s sessions',
  freshDb().as(as(ATHLETE)).write(`users/${COACH}/sessions`, { s: 1 }));
deny('coach writes the athlete\'s sessions (read-only access)',
  freshDb().as(as(COACH)).write(`users/${ATHLETE}/sessions`, { s: 1 }));

/* ====================================================================== */
console.log('\nJoining a group — only the athlete adds themselves, with a code');

allow('athlete adds themselves as a member',
  freshDb().as(as(ATHLETE)).write(`groups/g1/members/${ATHLETE}`, true));
deny('coach adds a different person as a member',
  freshDb().as(as(COACH)).write(`groups/g1/members/${OUTSIDER}`, true));
deny('athlete adds a third person as a member',
  freshDb().as(as(ATHLETE)).write(`groups/g1/members/${OUTSIDER}`, true));
allow('athlete grants coachAccess to themselves (the join step)',
  freshDb().as(as(ATHLETE)).write(`users/${ATHLETE}/coachAccess/${COACH}`, true));

/* ====================================================================== */
console.log('\nThe core attack — nobody can hand themselves access to another user');

deny('outsider writes coachAccess into a victim\'s node',
  freshDb().as(as(OUTSIDER)).write(`users/${ATHLETE}/coachAccess/${OUTSIDER}`, true));
deny('coach writes coachAccess into an unrelated user\'s node',
  freshDb().as(as(COACH)).write(`users/${OUTSIDER}/coachAccess/${COACH}`, true));

/* ====================================================================== */
console.log('\nLeaving / removing — an athlete leaves; an owner removes a member');

allow('athlete removes their own coachAccess (leaving)',
  freshDb().as(as(ATHLETE)).write(`users/${ATHLETE}/coachAccess/${COACH}`, null));
allow('coach removes coachAccess for a member they own (kick)',
  freshDb().as(as(COACH)).write(`users/${ATHLETE}/coachAccess/${COACH}`, null));
allow('coach removes a member from the group',
  freshDb().as(as(COACH)).write(`groups/g1/members/${ATHLETE}`, null));
allow('coach removes a member\'s memberGroups pointer',
  freshDb().as(as(COACH)).write(`users/${ATHLETE}/memberGroups/g1`, null));
deny('coach adds a memberGroups pointer to someone else',
  freshDb().as(as(COACH)).write(`users/${OUTSIDER}/memberGroups/g1`, true));

/* ====================================================================== */
console.log('\nThe group node — member list is private; ownerUid is the only public field');

allow('owner reads the whole group',
  freshDb().as(as(COACH)).read('groups/g1'));
allow('member reads the whole group',
  freshDb().as(as(ATHLETE)).read('groups/g1'));
deny('outsider reads the whole group (would leak the member list)',
  freshDb().as(as(OUTSIDER)).read('groups/g1'));
allow('outsider reads only groups/g1/ownerUid (needed to join by code)',
  freshDb().as(as(OUTSIDER)).read('groups/g1/ownerUid'));
deny('signed-out visitor reads groups/g1/ownerUid',
  freshDb().as(anon).read('groups/g1/ownerUid'));

/* ====================================================================== */
console.log('\nCreating & editing a group');

allow('coach creates a new group they own',
  freshDb().as(as(COACH)).write('groups/g2', { ownerUid: COACH, name: 'B', code: 'ZZ0000', members: {} }));
deny('athlete creates a group naming someone else as owner',
  freshDb().as(as(ATHLETE)).write('groups/g2', { ownerUid: COACH, name: 'B', members: {} }));
allow('owner renames their group',
  freshDb().as(as(COACH)).update('groups/g1', { name: 'Renamed' }));
deny('owner reassigns ownerUid to someone else',
  freshDb().as(as(COACH)).update('groups/g1', { ownerUid: ATHLETE }));

/* ====================================================================== */
console.log('\nGroup codes — must point at a group you own');

allow('coach creates a code pointing at their own group',
  freshDb().as(as(COACH)).write('groupCodes/NEWONE', 'g1'));
deny('outsider creates a code pointing at a group they don\'t own',
  freshDb().as(as(OUTSIDER)).write('groupCodes/NEWTWO', 'g1'));

/* ====================================================================== */
console.log('\nProfile photo — only a real image data URL, size-capped, no HTML/CSS breakout chars');

allow('valid jpeg data URL',
  freshDb().as(as(ATHLETE)).write(`users/${ATHLETE}/profile/photo`,
    'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ+ab/cD=='));
deny('XSS payload instead of an image',
  freshDb().as(as(ATHLETE)).write(`users/${ATHLETE}/profile/photo`,
    '"><img src=x onerror=alert(1)>'));
deny('remote URL instead of a data URL',
  freshDb().as(as(ATHLETE)).write(`users/${ATHLETE}/profile/photo`,
    'https://evil.example/p.png'));
deny('oversized photo string',
  freshDb().as(as(ATHLETE)).write(`users/${ATHLETE}/profile/photo`,
    'data:image/png;base64,' + 'A'.repeat(500000)));

/* ====================================================================== */
console.log('\nAccount deletion — you can wipe your own subtree, not anyone else\'s');

allow('user deletes their own /users/<uid>',
  freshDb().as(as(ATHLETE)).write(`users/${ATHLETE}`, null));
deny('user deletes another user\'s /users/<uid>',
  freshDb().as(as(COACH)).write(`users/${ATHLETE}`, null));

/* ---- result ---------------------------------------------------------- */
console.log(`\n${passed} passed, ${failed} failed\n`);
process.exit(failed === 0 ? 0 : 1);
