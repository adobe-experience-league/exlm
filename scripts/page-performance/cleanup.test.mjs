import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { artifactsToDelete } from './cleanup.mjs';

describe('artifactsToDelete', () => {
  it('keeps the newest N unique workflow runs and deletes the rest', () => {
    const artifacts = [
      { id: 1, name: 'page-performance-shard-0', workflow_run: { id: 100 }, created_at: '2026-09-01T00:00:00Z' },
      { id: 2, name: 'page-performance-summary', workflow_run: { id: 100 }, created_at: '2026-09-01T00:01:00Z' },
      { id: 3, name: 'page-performance-shard-0', workflow_run: { id: 200 }, created_at: '2026-09-08T00:00:00Z' },
      { id: 4, name: 'page-performance-summary', workflow_run: { id: 200 }, created_at: '2026-09-08T00:01:00Z' },
      { id: 5, name: 'unrelated-build', workflow_run: { id: 200 }, created_at: '2026-09-08T00:02:00Z' },
    ];
    const del = artifactsToDelete(artifacts, { prefix: 'page-performance-', keepLastRuns: 1 });
    const ids = del.map((a) => a.id).sort();
    assert.deepEqual(ids, [1, 2]);
  });

  it('skips expired artifacts', () => {
    const artifacts = [
      {
        id: 9,
        name: 'page-performance-summary',
        expired: true,
        workflow_run: { id: 50 },
        created_at: '2026-08-01T00:00:00Z',
      },
      {
        id: 10,
        name: 'page-performance-summary',
        expired: false,
        workflow_run: { id: 200 },
        created_at: '2026-09-08T00:00:00Z',
      },
    ];
    assert.deepEqual(
      artifactsToDelete(artifacts, { prefix: 'page-performance-', keepLastRuns: 1 }).map((a) => a.id),
      [],
    );
  });

  it('deletes nothing when keepLastRuns covers every run', () => {
    const artifacts = [
      { id: 3, name: 'page-performance-summary', workflow_run: { id: 200 }, created_at: '2026-09-08T00:00:00Z' },
    ];
    assert.deepEqual(artifactsToDelete(artifacts, { prefix: 'page-performance-', keepLastRuns: 5 }), []);
  });
});
