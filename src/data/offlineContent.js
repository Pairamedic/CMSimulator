// Offline content catalog — the same medical content that normally lives in
// Firestore (`acls_content`), assembled here from the single source-of-truth in
// scripts/seed-data/. This lets the app run with no Firebase backend at all:
// when offline, ContentContext reads this instead of hitting the network.
//
// Shape matches exactly what fbLoadContent() returns, so ContentContext consumes
// it without knowing whether the catalog came from the cloud or from here.
import { SCENARIOS, SCENARIO_GROUPS } from '../../scripts/seed-data/scenarios.js'
import { ALGORITHMS } from '../../scripts/seed-data/algorithms.js'
import { REVERSIBLE_CAUSES } from '../../scripts/seed-data/reversibleCauses.js'

export const OFFLINE_CONTENT = {
  scenarios:        { groups: SCENARIO_GROUPS, items: SCENARIOS },
  algorithms:       { items: ALGORITHMS },
  reversibleCauses: { items: REVERSIBLE_CAUSES },
}
