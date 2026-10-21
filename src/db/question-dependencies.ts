/**
 * Question dependencies data layer.
 *
 * Resolves which rules reference a given question response. A rule "uses" a
 * response when any of its conditions is a Questionnaire Question condition
 * for that question with that value.
 *
 * The returned RuleDependency includes the FULL condition set for the rule
 * (not just the matching one), so reviewers can see the whole context the
 * response participates in — clause-data conditions, other question
 * conditions, etc.
 *
 * Powers the "View Dependencies" side pane in the Update Question dialog.
 */
import { getReviewQueue, getRuleReview, type RuleCondition } from './rule-reviews'

export interface RuleDependency {
  ruleId: number
  ruleName: string
  /** All conditions on the rule, in order. */
  conditions: RuleCondition[]
}

interface SeedRule {
  ruleId: number
  ruleName: string
  /** Full list of conditions on this rule, in display order. */
  conditions: RuleCondition[]
}

/** Shorthand for building a clause-data condition. */
function clauseCond(
  id: number,
  clauseData: Exclude<RuleCondition['clauseData'], 'Questionnaire Question'>,
  operator: RuleCondition['operator'],
  value: string,
): RuleCondition {
  return { id, clauseData, questionnaire: null, question: null, operator, value }
}

/** Shorthand for building a questionnaire-question condition. */
function questionCond(
  id: number,
  questionnaire: string,
  question: string,
  operator: RuleCondition['operator'],
  value: string,
): RuleCondition {
  return {
    id,
    clauseData: 'Questionnaire Question',
    questionnaire,
    question,
    operator,
    value,
  }
}

/**
 * Hand-authored seed dependencies keyed by question text, then response value.
 * Each rule carries a varied, realistic mix of conditions so the side pane
 * shows differentiated content per rule.
 */
const seedDependencies: Record<string, Record<string, SeedRule[]>> = {
  'Does this acquisition require compliance banner verification?': {
    'Yes - Banner Required': [
      {
        ruleId: 201,
        ruleName: 'Compliance Banner Verification Clause',
        conditions: [
          clauseCond(1, 'Clause Set Type', 'Equals', 'Solicitation'),
          clauseCond(2, 'Contract Value', 'Greater Than', '$250,000'),
          questionCond(
            3,
            'Compliance Checks',
            'Does this acquisition require compliance banner verification?',
            'Equals',
            'Yes - Banner Required',
          ),
        ],
      },
      {
        ruleId: 202,
        ruleName: 'Mandatory Disclosure Statements',
        conditions: [
          clauseCond(1, 'Agency', 'Equals', 'Department of Defense'),
          questionCond(
            2,
            'Compliance Checks',
            'Does this acquisition require compliance banner verification?',
            'Not Equals',
            'Yes - Banner Required',
          ),
        ],
      },
      {
        ruleId: 203,
        ruleName: 'Vendor Acknowledgement Required',
        conditions: [
          clauseCond(1, 'Contract Category', 'Not Equals', 'Construction'),
          clauseCond(2, 'Place of Performance', 'Equals', 'Overseas'),
          questionCond(
            3,
            'Compliance Checks',
            'Does this acquisition require compliance banner verification?',
            'Equals',
            'Yes - Banner Required',
          ),
        ],
      },
      {
        ruleId: 206,
        ruleName: 'Dual Banner Review Rule',
        conditions: [
          clauseCond(1, 'Agency', 'Equals', 'Department of Homeland Security'),
          questionCond(
            2,
            'Compliance Checks',
            'Does this acquisition require compliance banner verification?',
            'Equals',
            'Yes - Banner Required',
          ),
          questionCond(
            3,
            'Compliance Checks',
            'Does this acquisition require compliance banner verification?',
            'Not Equals',
            'Yes - Banner Required',
          ),
        ],
      },
    ],
    'No - Banner Not Required': [
      {
        ruleId: 204,
        ruleName: 'Standard Acquisition Baseline',
        conditions: [
          clauseCond(1, 'Clause Set Type', 'Equals', 'Award'),
          questionCond(
            2,
            'Compliance Checks',
            'Does this acquisition require compliance banner verification?',
            'Equals',
            'No - Banner Not Required',
          ),
        ],
      },
      {
        ruleId: 205,
        ruleName: 'Skip Banner Verification',
        conditions: [
          clauseCond(1, 'Contract Value', 'Less Than', '$10,000'),
          questionCond(
            2,
            'Compliance Checks',
            'Does this acquisition require compliance banner verification?',
            'Equals',
            'No - Banner Not Required',
          ),
        ],
      },
    ],
  },
  'Does the solicitation request technical proposals under two-step sealed bidding procedures?': {
    Yes: [
      {
        ruleId: 101,
        ruleName: 'Two-Step Sealed Bidding Inclusion',
        conditions: [
          clauseCond(1, 'Clause Set Type', 'Equals', 'Solicitation'),
          clauseCond(2, 'Contract Category', 'Equals', 'New'),
          questionCond(
            3,
            'Acquisition Profile',
            'Does the solicitation request technical proposals under two-step sealed bidding procedures?',
            'Equals',
            'Yes',
          ),
        ],
      },
      {
        ruleId: 102,
        ruleName: 'Technical Proposal Evaluation Clause',
        conditions: [
          clauseCond(1, 'Contract Value', 'Greater Than', '$750,000'),
          questionCond(
            2,
            'Acquisition Profile',
            'Does the solicitation request technical proposals under two-step sealed bidding procedures?',
            'Equals',
            'Yes',
          ),
        ],
      },
      {
        ruleId: 103,
        ruleName: 'Phase I Technical Submission Requirement',
        conditions: [
          clauseCond(1, 'Agency', 'Equals', 'General Services Administration'),
          clauseCond(2, 'Place of Performance', 'Not Equals', 'Overseas'),
          questionCond(
            3,
            'Acquisition Profile',
            'Does the solicitation request technical proposals under two-step sealed bidding procedures?',
            'Equals',
            'Yes',
          ),
        ],
      },
    ],
    No: [
      {
        ruleId: 104,
        ruleName: 'Standard Sealed Bidding Procedures',
        conditions: [
          clauseCond(1, 'Clause Set Type', 'Equals', 'Solicitation'),
          questionCond(
            2,
            'Acquisition Profile',
            'Does the solicitation request technical proposals under two-step sealed bidding procedures?',
            'Equals',
            'No',
          ),
        ],
      },
      {
        ruleId: 105,
        ruleName: 'Negotiated Procurement Baseline',
        conditions: [
          clauseCond(1, 'Contract Category', 'Equals', 'Modification'),
          questionCond(
            2,
            'Acquisition Profile',
            'Does the solicitation request technical proposals under two-step sealed bidding procedures?',
            'Not Equals',
            'No',
          ),
        ],
      },
    ],
  },
  'Does the document specify a total Small Business set-aside?': {
    Yes: [
      {
        ruleId: 110,
        ruleName: 'Small Business Set-Aside Inclusion',
        conditions: [
          clauseCond(1, 'Contract Value', 'Less Than', '$750,000'),
          questionCond(
            2,
            'Socio-Economic and Security',
            'Does the document specify a total Small Business set-aside?',
            'Equals',
            'Yes',
          ),
        ],
      },
      {
        ruleId: 111,
        ruleName: 'Subcontracting Plan Requirement',
        conditions: [
          clauseCond(1, 'Clause Set Type', 'Equals', 'Award'),
          clauseCond(2, 'Agency', 'Equals', 'Department of Homeland Security'),
          questionCond(
            3,
            'Socio-Economic and Security',
            'Does the document specify a total Small Business set-aside?',
            'Equals',
            'Yes',
          ),
        ],
      },
    ],
    No: [
      {
        ruleId: 112,
        ruleName: 'Full and Open Competition Baseline',
        conditions: [
          clauseCond(1, 'Contract Category', 'Equals', 'New'),
          questionCond(
            2,
            'Socio-Economic and Security',
            'Does the document specify a total Small Business set-aside?',
            'Equals',
            'No',
          ),
        ],
      },
    ],
  },
}

/** Rules whose conditions reference a specific response for a specific question. */
export async function getRulesUsingResponse(
  questionText: string,
  responseOption: string,
): Promise<RuleDependency[]> {
  const queue = await getReviewQueue()
  const found = new Map<number, RuleDependency>()

  for (const rule of queue) {
    const review = await getRuleReview(rule.id)
    if (!review) continue
    const allConditions = [
      ...review.conditions,
      ...review.groups.flatMap(g => g.conditions),
    ]
    const matches = allConditions.some(
      c =>
        c.clauseData === 'Questionnaire Question' &&
        c.question === questionText &&
        c.value === responseOption,
    )
    if (matches) {
      found.set(rule.id, {
        ruleId: rule.id,
        ruleName: rule.name,
        conditions: allConditions,
      })
    }
  }

  // Merge hand-authored examples (won't clobber real matches by rule id).
  const seedForQuestion = seedDependencies[questionText]
  for (const seed of seedForQuestion?.[responseOption] ?? []) {
    if (!found.has(seed.ruleId)) {
      found.set(seed.ruleId, {
        ruleId: seed.ruleId,
        ruleName: seed.ruleName,
        conditions: seed.conditions,
      })
    }
  }

  return Array.from(found.values())
}
