import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildClaimRejectedComment,
  buildDoneComment,
  buildFailedComment,
  buildInterruptedComment,
  buildPickupComment,
  isOttoComment,
} from '../lib/comments.js';

const outcome = {
  prUrl: 'https://github.com/o/r/pull/1',
  reusedPr: false,
  quality: { ok: true },
  result: { summary: 'Fixed', openQuestions: [] },
};

test('isOttoComment recognizes every comment otto posts', () => {
  [
    buildPickupComment(),
    buildDoneComment({ outcome, preview: 'https://p' }),
    buildDoneComment({ outcome: { ...outcome, reusedPr: true }, preview: 'https://p' }),
    buildFailedComment({ stage: 'push', message: 'boom', runId: 'r1' }),
    buildInterruptedComment({ runId: 'r1' }),
    buildClaimRejectedComment({ identity: { name: 'jdoe' }, status: 401 }),
    '🤖 otto-bot picked this up using the otto-bot master account.',
    '❌ otto-bot failed at stage **push**: git push failed',
  ].forEach((body) => assert.ok(isOttoComment(body), body));
});

test('isOttoComment keeps human comments', () => {
  ['Please also update the footer.', 'Can otto-bot handle this?', '', null].forEach((body) =>
    assert.equal(isOttoComment(body), false, String(body)),
  );
});
