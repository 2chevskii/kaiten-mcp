import assert from 'node:assert/strict';
import {test} from 'node:test';
import {startHarness} from './harness.ts';

test('service desk recipient inputs are validated and access failures are sanitized', async context => {
  const harness = await startHarness(context);
  for (const email of ['', null, 123]) {
    assert.equal(
      (
        await harness.call(
          'cardServiceDeskExternalRecipients.addNewRecipient',
          {card_id: 10, email},
        )
      ).isError,
      true,
    );
  }
  assert.equal(harness.requests.length, 0);
  harness.reply({message: 'private upstream details'}, 403);
  const result = await harness.call(
    'cardServiceDeskExternalRecipients.addNewRecipient',
    {card_id: 10, email: 'user@example.com'},
  );
  assert.equal(result.isError, true);
  assert.match(JSON.stringify(result), /KAITEN_HTTP_ERROR/);
  assert.match(JSON.stringify(result), /403/);
  assert.doesNotMatch(JSON.stringify(result), /private upstream details/);
  assert.equal(harness.requests.length, 1);
});
