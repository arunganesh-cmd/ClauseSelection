/**
 * Library rule review queue.
 *
 * The set of library (Standard) rules that landed in the last import and
 * still need a Privileged User's accept / reject decision.
 *
 * The queue is a shallow projection built from `getRules()` so the Rules
 * grid and the review flow stay in sync. Decisions are kept in a Map keyed
 * by rule id. The flow is prototype-only — nothing is persisted beyond the
 * life of the browser session.
 */
import { getRules, type Rule } from './rules'

export type LibraryReviewDecision = 'Pending' | 'Accepted' | 'Rejected'

export interface LibraryRuleReview {
  id: number
  rule: Rule
  decision: LibraryReviewDecision
}

/** Rules that count as "newly imported from the library" for this prototype. */
const LIBRARY_SOURCE: Rule['source'] = 'Standard'

const decisions = new Map<number, LibraryReviewDecision>()

/** All library-sourced rules, with their current decision. */
export async function getLibraryReviewQueue(): Promise<LibraryRuleReview[]> {
  const rules = await getRules()
  return rules
    .filter(r => r.source === LIBRARY_SOURCE)
    .map(rule => ({
      id: rule.id,
      rule,
      decision: decisions.get(rule.id) ?? 'Pending',
    }))
}

/** Just the pending rules — what the review wizard walks through. */
export async function getPendingLibraryReviews(): Promise<LibraryRuleReview[]> {
  return (await getLibraryReviewQueue()).filter(r => r.decision === 'Pending')
}

export async function getPendingLibraryReviewCount(): Promise<number> {
  return (await getPendingLibraryReviews()).length
}

export async function setLibraryReviewDecision(
  ruleId: number,
  decision: LibraryReviewDecision,
): Promise<void> {
  decisions.set(ruleId, decision)
}

/** Clear all decisions — used when the user wants to re-review from scratch. */
export async function resetLibraryReviews(): Promise<void> {
  decisions.clear()
}
