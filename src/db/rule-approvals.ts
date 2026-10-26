/**
 * Rule approvals data layer.
 *
 * Same rules as `rules.ts`, but each one carries an approval status
 * (Approved or Pending) instead of the Active/Draft lifecycle status.
 * Seed data is derived from `getRules()` so both pages stay in sync on names,
 * conditions, and timestamps.
 */
import { getRules } from './rules'

export type RuleApprovalStatus = 'Pending' | 'Approved'
export type RuleActiveStatus = 'Active' | 'Inactive'

export interface RuleApproval {
  id: number
  name: string
  /** Review status: whether the rule is still Pending or has been Approved. */
  status: RuleApprovalStatus
  /** Operational status: whether the rule is currently in effect. Separate from review status. */
  activeStatus: RuleActiveStatus
  /** Number of individual conditions across the rule. */
  conditions: number
  /** Number of condition groups wrapping those conditions. */
  conditionGroups: number
  includedClauses: number
  excludedClauses: number
  /** ISO 8601 timestamp. */
  lastUpdated: string
  createdBy: string
  modifiedBy: string
}

// Deterministic spread so both statuses show up on the first page of the grid.
const statusCycle: RuleApprovalStatus[] = [
  'Pending',
  'Approved',
  'Approved',
  'Pending',
  'Approved',
  'Pending',
  'Approved',
  'Pending',
  'Approved',
  'Pending',
]

// All rules are Active by default; only these specific IDs are shown as Inactive
// so the grid has at most two Inactive rows on the first page.
const inactiveRuleIds = new Set<number>([3, 7])

let ruleApprovals: RuleApproval[] | null = null

async function load(): Promise<RuleApproval[]> {
  if (ruleApprovals === null) {
    const rules = await getRules()
    ruleApprovals = rules.map((rule, index) => ({
      id: rule.id,
      name: rule.name,
      status: statusCycle[index % statusCycle.length],
      activeStatus: inactiveRuleIds.has(rule.id) ? 'Inactive' : 'Active',
      conditions: rule.conditions,
      conditionGroups: rule.conditionGroups,
      includedClauses: rule.includedClauses,
      excludedClauses: rule.excludedClauses,
      lastUpdated: rule.lastUpdated,
      createdBy: rule.createdBy,
      modifiedBy: rule.modifiedBy,
    }))
  }
  return ruleApprovals
}

export async function getRuleApprovals(): Promise<RuleApproval[]> {
  return load()
}

export async function getRuleApproval(id: number): Promise<RuleApproval | undefined> {
  return (await load()).find(r => r.id === id)
}

export async function createRuleApproval(data: Omit<RuleApproval, 'id'>): Promise<RuleApproval> {
  const all = await load()
  const newRuleApproval = { ...data, id: Math.max(0, ...all.map(r => r.id)) + 1 }
  all.push(newRuleApproval)
  return newRuleApproval
}

export async function updateRuleApproval(
  id: number,
  data: Partial<RuleApproval>,
): Promise<RuleApproval | undefined> {
  const all = await load()
  const idx = all.findIndex(r => r.id === id)
  if (idx === -1) return undefined
  all[idx] = { ...all[idx], ...data }
  return all[idx]
}

export async function deleteRuleApproval(id: number): Promise<boolean> {
  const all = await load()
  const idx = all.findIndex(r => r.id === id)
  if (idx === -1) return false
  all.splice(idx, 1)
  return true
}

/** Summarizes a rule's condition structure, e.g. "2 conditions • 1 group". */
export function formatRuleApprovalConditions(rule: RuleApproval): string {
  const conditionLabel = `${rule.conditions} condition${rule.conditions === 1 ? '' : 's'}`
  const groupLabel = `${rule.conditionGroups} group${rule.conditionGroups === 1 ? '' : 's'}`
  return `${conditionLabel} • ${groupLabel}`
}
