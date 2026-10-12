# VFIT V22: session planning and progression

## Session adaptation

An explicit preview and acceptance create `currentWorkout.adaptation`. The permanent program and its five days remain unchanged. The draft persists in the account snapshot and detailed history identifies adapted sessions. Current session sets are displayed according to the plan; existing per-exercise data stays indexed to the permanent program. Users can return to the full routine or change series counts during the session.

The duration is an estimate, not a deadline or measured prediction: 5 minutes preparation, 45 seconds per set, the user-selected rest after every set and 1 minute per exercise for transitions. The routine order is treated as the user's priority. To fit time, series above two are removed from the end first, then trailing exercises. Low energy caps the initial proposal at two sets per exercise. Preparation time and rest are not silently shortened. No automatic exercise substitutions or recovery scores are inferred.

## Opt-in progression heuristic

VFIT's rule is an implementation choice, not a clinically validated personalized prescription:

- Require two detailed sessions on different days within the last 28 days.
- Exclude adapted sessions and ambiguous repeated occurrences of the same exercise.
- Require the planned number of sets, the same weights, all repetitions at or above the current range maximum, and recorded RIR of at least 2.
- Use the user-selected equipment increment only if it is at most 5% of every corresponding load.
- Show the exact proposed weights, reset target repetitions to the range minimum, and require confirmation of recorded effort, controlled technique, no discomfort and identical equipment.
- Never overwrite completed sets. Never infer a starting weight from zero, old summary-only history, or another exercise.

RIR is self-reported and currently prefilled; the acceptance confirmation is necessary. Machine identity is not stored yet. The rule does not diagnose injuries or estimate biological recovery. There is no model API or per-recommendation external service.

Background references consulted (the precise product thresholds above are not claimed to be mandated by these sources):
- https://acsm.org/resistance-training-guidelines-update-2026/
- https://pubmed.ncbi.nlm.nih.gov/19204579/

## Verification

Run both integration suites with an installed jsdom package:

```
VFIT_JSDOM_PATH=/path/to/jsdom node scripts/test-accounts.cjs
VFIT_JSDOM_PATH=/path/to/jsdom node scripts/test-adaptive.cjs
```

They use the vendored Supabase SDK with a mock server, not production user accounts. Coverage includes account isolation and conflicts, program persistence, 48 time/energy/rest combinations, adapted-session restoration, progression rejection paths, explicit acceptance and persistence. These checks do not replace real-device visual QA.
