import assert from 'node:assert/strict';
import {test} from 'node:test';
import {belowPerfect} from '../tools/tdqs.ts';

test('the TDQS goal checks every raw tool and server dimension', () => {
  const dimension = {score: 5, justification: 'Fixture'} as const;
  const report = {
    tools: [
      {
        name: 'kaiten_cards_read',
        scores: {
          behavioral_transparency: 5,
          conciseness_structure: 5,
          contextual_completeness: 5,
          parameter_semantics: 5,
          purpose_clarity: 5,
          usage_guidelines: 5,
        },
      },
    ],
    serverScore: {
      coherenceJustifications: {
        completeness: dimension,
        disambiguation: dimension,
        naming_consistency: dimension,
        tool_count_appropriateness: dimension,
      },
    },
  } as const;
  assert.deepEqual(belowPerfect({...report, tools: [...report.tools]}), []);
  assert.deepEqual(
    belowPerfect({
      tools: [
        {
          ...report.tools[0],
          scores: {...report.tools[0].scores, parameter_semantics: 4},
        },
      ],
      serverScore: {
        coherenceJustifications: {
          ...report.serverScore.coherenceJustifications,
          completeness: {...dimension, score: 4},
        },
      },
    }),
    [
      'kaiten_cards_read · parameter_semantics: 4/5',
      'server · completeness: 4/5',
    ],
  );
});
