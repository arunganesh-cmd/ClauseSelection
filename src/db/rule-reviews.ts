/**
 * Rule reviews data layer.
 *
 * A RuleReview is the working copy an internal reviewer sees for one rule from
 * the out-of-the-box (OOTB) library:
 *
 * - Conditions belong to the rule and apply to every clause in it. A condition
 *   either tests clause set data (for example Contract Category) or the answer
 *   to a questionnaire question.
 * - Each clause carries its own prescription text and clause text, which are
 *   read-only during review.
 * - Each clause is either Included or Excluded by the rule.
 *
 * Reviews are built lazily from the rule list in `rule-approvals.ts` so the two
 * screens always agree on names, counts, and statuses. Text is sample content.
 */
import {
  getRuleApprovals,
  getRuleApproval,
  updateRuleApproval,
  type RuleApproval,
  type RuleApprovalStatus,
} from './rule-approvals'

export type ClauseDataType =
  | 'Clause Set Type'
  | 'Contract Category'
  | 'Contract Value'
  | 'Agency'
  | 'Place of Performance'
  | 'Questionnaire Question'

export type ConditionOperator =
  | 'Equals'
  | 'Not Equals'
  | 'Does not equal'
  | 'Greater Than'
  | 'Less Than'
export type ConditionJoin = 'AND' | 'OR'
export type ClauseOutcome = 'Included' | 'Excluded'

export interface ClauseDataDefinition {
  clauseData: Exclude<ClauseDataType, 'Questionnaire Question'>
  options: string[]
}

export interface QuestionnaireQuestion {
  question: string
  responseType: 'Radio Button' | 'Dropdown'
  options: string[]
}

export interface Questionnaire {
  name: string
  questions: QuestionnaireQuestion[]
}

export interface RuleCondition {
  id: number
  clauseData: ClauseDataType
  /** Set only when `clauseData` is "Questionnaire Question". */
  questionnaire: string | null
  /** Set only when `clauseData` is "Questionnaire Question". */
  question: string | null
  operator: ConditionOperator
  value: string
}

export interface ConditionGroup {
  id: number
  join: ConditionJoin
  conditions: RuleCondition[]
}

export interface ReviewClause {
  id: number
  /** Clause number, e.g. "52.219-9". */
  number: string
  title: string
  outcome: ClauseOutcome
  /** Read-only during review. */
  prescription: string
  /** Read-only during review. */
  text: string
}

export interface RuleReview {
  id: number
  /** The rule this review belongs to (matches `RuleApproval.id`). */
  ruleId: number
  /** How top-level conditions and groups combine. */
  join: ConditionJoin
  conditions: RuleCondition[]
  groups: ConditionGroup[]
  clauses: ReviewClause[]
  /** ISO 8601 timestamp of the last "Save draft", or null if none. */
  draftSavedAt: string | null
  /**
   * Immutable snapshot of what the AI first produced for this rule. Captured
   * once when the review is built and preserved across all subsequent updates
   * so the AI Generation Summary can always show the original output,
   * regardless of what the reviewer edits.
   */
  aiOriginal: {
    join: ConditionJoin
    conditions: RuleCondition[]
    groups: ConditionGroup[]
    clauses: ReviewClause[]
  }
}

/** The editable parts of a review, used when saving a draft or accepting. */
export type RuleReviewContent = Pick<RuleReview, 'join' | 'conditions' | 'groups'>

export const conditionOperators: ConditionOperator[] = [
  'Equals',
  'Not Equals',
  'Does not equal',
  'Greater Than',
  'Less Than',
]
export const conditionJoins: ConditionJoin[] = ['AND', 'OR']

export const clauseDataDefinitions: ClauseDataDefinition[] = [
  {
    clauseData: 'Clause Set Type',
    options: ['Solicitation', 'Award', 'Modification', 'IDIQ Order'],
  },
  {
    clauseData: 'Contract Category',
    options: ['New', 'Modification', 'Renewal', 'Task Order'],
  },
  {
    clauseData: 'Contract Value',
    options: ['Under $10,000', '$10,000 to $250,000', '$250,001 to $750,000', 'Over $750,000'],
  },
  {
    clauseData: 'Agency',
    options: ['Department of Defense', 'General Services Administration', 'Department of Homeland Security', 'Other'],
  },
  {
    clauseData: 'Place of Performance',
    options: ['Northeast', 'Southeast', 'Midwest', 'Southwest', 'West', 'Overseas'],
  },
]

export const clauseDataTypes: ClauseDataType[] = [
  ...clauseDataDefinitions.map(d => d.clauseData),
  'Questionnaire Question',
]

export const questionnaires: Questionnaire[] = [
  {
    name: 'Acquisition Profile',
    questions: [
      {
        question: 'Identify the contemplated Contract Type for this requirement.',
        responseType: 'Radio Button',
        options: ['Firm Fixed Price', 'Cost Reimbursement', 'Time and Materials', 'Indefinite Delivery'],
      },
      {
        question: 'What is the total Period of Performance (including all option periods) in months?',
        responseType: 'Dropdown',
        options: ['12 months or less', '13 to 36 months', '37 to 60 months', 'More than 60 months'],
      },
      {
        question: 'Is the acquisition subject to the Trade Agreements Act?',
        responseType: 'Radio Button',
        options: ['Yes', 'No'],
      },
    ],
  },
  {
    name: 'Socio-Economic and Security',
    questions: [
      {
        question: 'Does the document specify a total Small Business set-aside?',
        responseType: 'Radio Button',
        options: ['Yes', 'No'],
      },
      {
        question: 'What is the highest level of Security Clearance required for the site or personnel?',
        responseType: 'Dropdown',
        options: ['None', 'Public Trust', 'Secret', 'Top Secret'],
      },
      {
        question: 'Is a favorable National Agency Check with Inquiries (NACI) required for personnel?',
        responseType: 'Radio Button',
        options: ['Yes', 'No'],
      },
    ],
  },
]

/** The values a condition can be compared against, based on its clause data or question. */
export function getConditionValueOptions(condition: RuleCondition): string[] {
  if (condition.clauseData === 'Questionnaire Question') {
    const questionnaire = questionnaires.find(q => q.name === condition.questionnaire)
    return questionnaire?.questions.find(q => q.question === condition.question)?.options ?? []
  }
  return clauseDataDefinitions.find(d => d.clauseData === condition.clauseData)?.options ?? []
}

/** The questions available once a questionnaire is chosen. */
export function getQuestionnaireQuestions(questionnaireName: string | null): string[] {
  return questionnaires.find(q => q.name === questionnaireName)?.questions.map(q => q.question) ?? []
}

/** A blank-but-valid condition for the given clause data, with sensible defaults chosen. */
export function createCondition(id: number, clauseData: ClauseDataType): RuleCondition {
  if (clauseData === 'Questionnaire Question') {
    const questionnaire = questionnaires[0]
    const question = questionnaire.questions[0]
    return {
      id,
      clauseData,
      questionnaire: questionnaire.name,
      question: question.question,
      operator: 'Equals',
      value: question.options[0],
    }
  }
  const definition = clauseDataDefinitions.find(d => d.clauseData === clauseData)
  return {
    id,
    clauseData,
    questionnaire: null,
    question: null,
    operator: 'Equals',
    value: definition?.options[0] ?? '',
  }
}

/** Switches a condition to another clause data type, resetting the fields that no longer apply. */
export function changeConditionClauseData(
  condition: RuleCondition,
  clauseData: ClauseDataType,
): RuleCondition {
  return { ...createCondition(condition.id, clauseData), operator: condition.operator }
}

/** Switches a questionnaire condition to another questionnaire, picking its first question. */
export function changeConditionQuestionnaire(
  condition: RuleCondition,
  questionnaireName: string,
): RuleCondition {
  const questionnaire = questionnaires.find(q => q.name === questionnaireName)
  const question = questionnaire?.questions[0]
  return {
    ...condition,
    questionnaire: questionnaireName,
    question: question?.question ?? null,
    value: question?.options[0] ?? '',
  }
}

/** Switches a questionnaire condition to another question, picking its first answer. */
export function changeConditionQuestion(condition: RuleCondition, questionText: string): RuleCondition {
  const questionnaire = questionnaires.find(q => q.name === condition.questionnaire)
  const question = questionnaire?.questions.find(q => q.question === questionText)
  return { ...condition, question: questionText, value: question?.options[0] ?? '' }
}

interface ClauseSeed {
  number: string
  title: string
  prescription: string
  text: string
}

const clauseSeeds: ClauseSeed[] = [
  {
    number: '52.202-1',
    title: 'Definitions',
    prescription:
      '(a) Agencies are encouraged to develop internal procedures seeking voluntary feedback from interested parties in an acquisition to assess process strengths and weaknesses and improve effectiveness and efficiency of the acquisition process. Agencies may—\n\n' +
      '(1) Utilize a variety of feedback mechanisms available to the public (e.g., surveys, in-person, and/or group exchanges);\n\n' +
      '(2) Utilize the core preaward and debriefing survey questions at https://www.acquisition.gov/360; and\n\n' +
      '(3) Seek additional feedback on targeted aspects of an acquisition throughout its lifecycle (e.g., performance standards at 1.102-2 or postaward contract administration responsibilities at 42.302).\n\n' +
      '(b) Contracting officers are encouraged to insert the provision 52.201-1, Acquisition 360: Voluntary Survey, in accordance with agency procedures.\n\n' +
      '(c) Contracting officers shall not review information until after contract award and shall not consider it in the award decision.',
    text: 'When a solicitation provision or contract clause uses a word or term that is defined in the Federal Acquisition Regulation (FAR), the word or term has the same meaning as the definition in FAR 2.101 in effect at the time the solicitation was issued.',
  },
  {
    number: '52.228-1',
    title: 'Performance and Payment Bonds—Other Than Construction',
    prescription:
      'Insert the clause in solicitations and contracts for other than construction when performance and payment bonds are required, in accordance with the agency regulations referenced in 28.103-4.',
    text:
      'As prescribed in 28.103-4, insert a clause substantially as follows:\n\n' +
      'Performance and Payment Bonds-Other Than Construction (Nov 2006)\n\n' +
      '(a) Definitions. As used in this clause—\n\n' +
      '"Original contract price" means the award price of the contract or, for requirements contracts, the price payable for the estimated quantity; or, for indefinite-quantity contracts, the price payable for the specified minimum quantity. Original contract price does not include the price of any options, except those options exercised at the time of contract award.\n\n' +
      '(b) The Contractor shall furnish a performance bond (Standard Form 1418) for the protection of the Government in an amount equal to _______ percent of the original contract price and a payment bond (Standard Form 1416) in an amount equal to ______ percent of the original contract price.\n\n' +
      '(c) The Contractor shall furnish all executed bonds, including any necessary reinsurance agreements, to the Contracting Officer, within ________ days, but in any event, before starting work.\n\n' +
      '(d) The Government may require additional performance and payment bond protection if the contract price is increased. The Government may secure the additional protection by directing the Contractor to increase the penal amount of the existing bonds or to obtain additional bonds.\n\n' +
      '(e) The bonds shall be in the form of firm commitment, supported by corporate sureties whose names appear on the list contained in Treasury Department Circular 570, individual sureties, or by other acceptable security such as postal money order, certified check, cashier\'s check, irrevocable letter of credit, or, in accordance with Treasury Department regulations, certain bonds or notes of the United States. Treasury Circular 570 is published in the Federal Register, or may be obtained from the:',
  },
  {
    number: '52.204-21',
    title: 'Basic Safeguarding of Covered Contractor Information Systems',
    prescription:
      'Insert the clause in solicitations and contracts when the contractor or a subcontractor at any tier may have Federal contract information residing in or transiting through its information system.',
    text: '(b) Safeguarding requirements and procedures. The Contractor shall apply the following basic safeguarding requirements and procedures to protect covered contractor information systems, including limiting information system access to authorized users and sanitizing or destroying media before disposal or reuse.',
  },
  {
    number: '52.204-25',
    title: 'Prohibition on Contracting for Certain Telecommunications and Video Surveillance Services or Equipment',
    prescription:
      'Insert the clause in all solicitations and contracts, including those for commercial products and commercial services, as required by Section 889 of the National Defense Authorization Act.',
    text: '(b) Prohibition. The Contractor is prohibited from providing to the Government any equipment, system, or service that uses covered telecommunications equipment or services as a substantial or essential component of any system.',
  },
  {
    number: '52.212-4',
    title: 'Contract Terms and Conditions—Commercial Products and Commercial Services',
    prescription:
      'Insert the clause in solicitations and contracts for commercial products or commercial services when the acquisition is conducted under FAR Part 12.',
    text: '(a) Inspection and acceptance. The Government has the right to inspect and test all products called for by the contract, to the extent practicable at all places and times, including the period of performance, and in any event before acceptance.',
  },
  {
    number: '52.215-2',
    title: 'Audit and Records—Negotiation',
    prescription:
      'Insert the clause in solicitations and contracts other than firm-fixed-price contracts when the contract is expected to exceed the threshold for submission of certified cost or pricing data.',
    text: '(b) Examination of costs. If this is a cost-reimbursement, incentive, time-and-materials, labor-hour, or price-redeterminable contract, the Contractor shall maintain and the Contracting Officer, or an authorized representative, shall have the right to examine and audit all records and other evidence sufficient to reflect properly all costs claimed to have been incurred.',
  },
  {
    number: '52.229-3',
    title: 'Federal, State, and Local Taxes',
    prescription:
      'Insert the clause in solicitations and contracts where the contract will be performed wholly or partly in the United States or its outlying areas, when a fixed-price contract is contemplated and the contract is expected to exceed the simplified acquisition threshold, as directed by 29.401-3.',
    text:
      'As prescribed in 29.401-3, insert the following clause:\n\n' +
      'Federal, State, and Local Taxes (State and Local Adjustments) (Feb 2013)\n\n' +
      '(a) As used in this clause—\n\n' +
      '"After-imposed tax" means any new or increased Federal, State, or local tax or duty, or tax that was excluded on the contract date but whose exclusion was later revoked or amount of exemption reduced during the contract period, other than an excepted tax, on the transactions or property covered by this contract that the Contractor is required to pay or bear as the result of legislative, judicial, or administrative action taking effect after the contract date.\n\n' +
      '"After-relieved tax" means any amount of Federal, State, or local tax or duty, other than an excepted tax, that would otherwise have been payable on the transactions or property covered by this contract, but which the Contractor is not required to pay or bear, or for which the Contractor obtains a refund or drawback, as the result of legislative, judicial, or administrative action taking effect after the contract date.\n\n' +
      '"All applicable Federal, State, and local taxes and duties" means all taxes and duties, in effect on the contract date, that the taxing authority is imposing and collecting on the transactions or property covered by this contract.\n\n' +
      '"Contract date" means the effective date of this contract and, for any modification to this contract, the effective date of the modification.\n\n' +
      '"Excepted tax" means social security or other employment taxes, net income and franchise taxes, excess profits taxes, capital stock taxes, transportation taxes, unemployment compensation taxes, and property taxes. "Excepted tax" does not include gross income taxes levied on or measured by sales or receipts from sales, property taxes assessed on completed supplies covered by this contract, or any tax assessed on the Contractor\'s possession of, interest in, or use of property, title to which is in the Government.\n\n' +
      '"Local taxes" includes taxes imposed by a possession or territory of the United States, Puerto Rico, or the Northern Mariana Islands, if the contract is performed wholly or partly in any of those areas.\n\n' +
      '(b)(1) Unless otherwise provided in this contract, the contract price includes all applicable Federal, State, and local taxes and duties, except as provided in subparagraph (b)(2)(i) of this clause.\n\n' +
      '(2) Taxes imposed under 26 U.S.C. 5000 C may not be—\n\n' +
      '(i) Included in the contract price; nor\n\n' +
      '(ii) Reimbursed.\n\n' +
      '(c) The contract price shall be increased by the amount of any after-imposed tax, or of any tax or duty specifically excluded from the contract price by a term or condition of this contract that the Contractor is required to pay or bear, including any interest or penalty, if the Contractor states in writing that the contract price does not include any contingency for such tax and if liability for such tax, interest, or penalty was not incurred through the Contractor\'s fault, negligence, or failure to follow instructions of the Contracting Officer.\n\n' +
      '(d) The contract price shall be decreased by the amount of any after-relieved tax. The Government shall be entitled to interest received by the Contractor incident to a refund of taxes to the extent that such interest was earned after the Contractor was paid by the Government for such taxes. The Government shall be entitled to repayment of any penalty refunded to the Contractor to the extent that the penalty was paid by the Government.\n\n' +
      '(e) The contract price shall be decreased by the amount of any Federal, State, or local tax, other than an excepted tax, that was included in the contract price and that the Contractor is required to pay or bear, or does not obtain a refund of, through the Contractor\'s fault, negligence, or failure to follow instructions of the Contracting Officer.\n\n' +
      '(f) No adjustment shall be made in the contract price under this clause unless the amount of the adjustment exceeds $250.\n\n' +
      '(g) The Contractor shall promptly notify the Contracting Officer of all matters relating to Federal, State, and local taxes and duties that reasonably may be expected to result in either an increase or decrease in the contract price and shall take appropriate action as the Contracting Officer directs. The contract price shall be equitably adjusted to cover the costs of action taken by the Contractor at the direction of the Contracting Officer, including any interest, penalty, and reasonable attorneys\' fees.\n\n' +
      '(h) The Government shall furnish evidence appropriate to establish exemption from any Federal, State, or local tax when—\n\n' +
      '(1) The Contractor requests such exemption and states in writing that it applies to a tax excluded from the contract price; and\n\n' +
      '(2) A reasonable basis exists to sustain the exemption.',
  },
  {
    number: '52.219-9',
    title: 'Small Business Subcontracting Plan',
    prescription:
      'Insert the clause in solicitations and contracts that offer subcontracting possibilities, are expected to exceed the subcontracting plan threshold, and are required to include a subcontracting plan.',
    text: '(d) The Offeror shall submit a subcontracting plan that separately addresses subcontracting with small business, veteran-owned small business, service-disabled veteran-owned small business, HUBZone small business, small disadvantaged business, and women-owned small business concerns.',
  },
  {
    number: '52.222-26',
    title: 'Equal Opportunity',
    prescription:
      'Insert the clause in solicitations and contracts unless the work is performed outside the United States by employees who were not recruited within the United States.',
    text: '(b) During performing this contract, the Contractor agrees that it will not discriminate against any employee or applicant for employment because of race, color, religion, sex, sexual orientation, gender identity, or national origin.',
  },
  {
    number: '52.222-41',
    title: 'Service Contract Labor Standards',
    prescription:
      'Insert the clause in solicitations and contracts for services that are subject to the Service Contract Labor Standards statute and exceed the micro-purchase threshold.',
    text: '(c) Compensation. Each service employee employed in the performance of this contract by the Contractor or any subcontractor shall be paid not less than the minimum monetary wages and shall be furnished fringe benefits in accordance with the wage determination attached to this contract.',
  },
  {
    number: '52.222-50',
    title: 'Combating Trafficking in Persons',
    prescription:
      'Insert the clause in all solicitations and contracts, including those for commercial products and commercial services.',
    text: '(b) Policy. The United States Government has adopted a policy prohibiting trafficking in persons, including the trafficking-related activities of procuring commercial sex acts and using forced labor during the period of performance of the contract.',
  },
  {
    number: '52.223-18',
    title: 'Encouraging Contractor Policies to Ban Text Messaging While Driving',
    prescription:
      'Insert the clause in solicitations and contracts that exceed the micro-purchase threshold.',
    text: '(b) Contractor requirements. The Contractor is encouraged to adopt and enforce policies that ban text messaging while driving company-owned or rented vehicles or Government-owned vehicles.',
  },
  {
    number: '52.224-1',
    title: 'Privacy Act Notification',
    prescription:
      'Insert the clause in solicitations and contracts when the design, development, or operation of a system of records on individuals is required to accomplish an agency function.',
    text: 'The Contractor will be required to design, develop, or operate a system of records on individuals to accomplish an agency function subject to the Privacy Act of 1974, Public Law 93-579, December 31, 1974 (5 U.S.C. 552a) and applicable agency regulations.',
  },
  {
    number: '52.225-1',
    title: 'Buy American—Supplies',
    prescription:
      'Insert the clause in solicitations and contracts for supplies that are for use within the United States, except where a trade agreement or an exception applies.',
    text: '(b) The Contractor shall deliver only domestic end products unless, in its offer, it specified delivery of foreign end products in the Buy American—Free Trade Agreements—Balance of Payments Program Certificate.',
  },
  {
    number: '52.227-14',
    title: 'Rights in Data—General',
    prescription:
      'Insert the clause in solicitations and contracts when data will be produced, furnished, or acquired under the contract, unless an alternative data rights clause applies.',
    text: '(d) Rights in data—unlimited rights. The Government shall have unlimited rights in data first produced in the performance of this contract, and in form, fit, and function data delivered under this contract.',
  },
  {
    number: '52.232-33',
    title: 'Payment by Electronic Funds Transfer—System for Award Management',
    prescription:
      'Insert the clause in solicitations and contracts, except when the contract is paid with a Governmentwide commercial purchase card or an alternate payment method applies.',
    text: '(b) Method of payment. All payments by the Government under this contract shall be made by electronic funds transfer (EFT), except as provided in paragraph (c) of this clause.',
  },
  {
    number: '52.233-1',
    title: 'Disputes',
    prescription:
      'Insert the clause in solicitations and contracts unless the contract is with a foreign government or agency that is unwilling to accept its terms.',
    text: '(a) This contract is subject to the Contract Disputes Act of 1978, as amended (41 U.S.C. 7101-7109). (c) Claims by the Contractor against the Government relating to the contract shall be submitted in writing to the Contracting Officer for a written decision.',
  },
  {
    number: '52.243-1',
    title: 'Changes—Fixed-Price',
    prescription:
      'Insert the clause in solicitations and contracts for supplies when a fixed-price contract is contemplated and the contract is not for commercial products or commercial services.',
    text: '(a) The Contracting Officer may at any time, by written order, and without notice to the sureties, if any, make changes within the general scope of this contract in any one or more of drawings, designs, or specifications, the method of shipment or packing, or the place of delivery.',
  },
  {
    number: '52.249-2',
    title: 'Termination for Convenience of the Government (Fixed-Price)',
    prescription:
      'Insert the clause in solicitations and contracts when a fixed-price contract is contemplated and the contract is expected to exceed the simplified acquisition threshold.',
    text: '(a) The Government may terminate performance of work under this contract in whole or, from time to time, in part, if the Contracting Officer determines that a termination is in the Government’s interest. The Contracting Officer shall terminate by delivering to the Contractor a Notice of Termination specifying the extent of termination and the effective date.',
  },
]

const alternateLabels = ['', 'Alternate I', 'Alternate II', 'Alternate III']

function pick<T>(items: T[], index: number): T {
  return items[((index % items.length) + items.length) % items.length]
}

function buildClauses(rule: RuleApproval): ReviewClause[] {
  const total = rule.includedClauses + rule.excludedClauses
  return Array.from({ length: total }, (_, i) => {
    const seed = clauseSeeds[i % clauseSeeds.length]
    const alternate = alternateLabels[Math.floor(i / clauseSeeds.length)] ?? ''
    const prescription = alternate
      ? `${seed.prescription} Use ${alternate} when the requirement is also subject to the agency supplement.`
      : seed.prescription
    const text = alternate
      ? `${seed.text}\n\n${alternate}. Add the following paragraph: agency-specific supplemental terms apply as identified in the solicitation.`
      : seed.text
    return {
      id: i + 1,
      number: alternate ? `${seed.number} (${alternate})` : seed.number,
      title: seed.title,
      outcome: i < rule.includedClauses ? 'Included' : 'Excluded',
      prescription,
      text,
    }
  })
}

const seedClauseData: ClauseDataType[] = [
  'Contract Category',
  'Questionnaire Question',
  'Contract Value',
  'Agency',
  'Questionnaire Question',
  'Place of Performance',
]

function buildCondition(rule: RuleApproval, k: number): RuleCondition {
  const clauseData = pick(seedClauseData, rule.id + k)
  const base = createCondition(k + 1, clauseData)
  const operator: ConditionOperator = k % 3 === 2 ? 'Does not equal' : 'Equals'

  if (clauseData === 'Questionnaire Question') {
    const questionnaire = pick(questionnaires, rule.id + k)
    const question = pick(questionnaire.questions, rule.id + k * 2)
    return {
      ...base,
      questionnaire: questionnaire.name,
      question: question.question,
      operator,
      value: pick(question.options, rule.id + k),
    }
  }
  const options = getConditionValueOptions(base)
  return { ...base, operator, value: pick(options, rule.id + k) }
}

/**
 * Hand-authored review for rule 1 (pktestrule2). Matches the mockup exactly so
 * the Review Rule screen opens with the richer example reviewers expect: two
 * condition groups, mixed operators, and a longer clause list.
 */
function buildFeaturedReview(rule: RuleApproval): RuleReview {
  const groups: ConditionGroup[] = [
    {
      id: 1,
      join: 'AND',
      conditions: [
        { id: 1, clauseData: 'Clause Set Type', questionnaire: null, question: null, operator: 'Equals', value: 'Solicitation' },
        { id: 2, clauseData: 'Clause Set Type', questionnaire: null, question: null, operator: 'Equals', value: 'Award' },
        { id: 3, clauseData: 'Clause Set Type', questionnaire: null, question: null, operator: 'Equals', value: 'Modification' },
      ],
    },
    {
      id: 2,
      join: 'OR',
      conditions: [
        { id: 4, clauseData: 'Contract Category', questionnaire: null, question: null, operator: 'Equals', value: 'Commercial Items' },
        { id: 5, clauseData: 'Contract Category', questionnaire: null, question: null, operator: 'Not Equals', value: 'Construction' },
        { id: 6, clauseData: 'Contract Value', questionnaire: null, question: null, operator: 'Greater Than', value: '$250,000' },
        { id: 7, clauseData: 'Contract Value', questionnaire: null, question: null, operator: 'Less Than', value: '$5,000,000' },
      ],
    },
  ]

  const clauses = buildClauses(rule)
  return {
    id: rule.id,
    ruleId: rule.id,
    join: 'AND',
    conditions: [],
    groups,
    clauses,
    draftSavedAt: null,
    aiOriginal: {
      join: 'AND',
      conditions: [],
      groups: structuredClone(groups),
      clauses: structuredClone(clauses),
    },
  }
}

function buildReview(rule: RuleApproval): RuleReview {
  if (rule.id === 1) return buildFeaturedReview(rule)
  const all = Array.from({ length: rule.conditions }, (_, k) => buildCondition(rule, k))
  const groupCount = Math.min(rule.conditionGroups, all.length)

  let conditions: RuleCondition[] = all
  const groups: ConditionGroup[] = []
  if (groupCount > 0) {
    conditions = []
    const base = Math.floor(all.length / groupCount)
    const remainder = all.length % groupCount
    let cursor = 0
    for (let g = 0; g < groupCount; g++) {
      const size = base + (g < remainder ? 1 : 0)
      groups.push({
        id: g + 1,
        join: g % 2 === 1 ? 'OR' : 'AND',
        conditions: all.slice(cursor, cursor + size),
      })
      cursor += size
    }
  }

  const clauses = buildClauses(rule)
  return {
    id: rule.id,
    ruleId: rule.id,
    join: 'AND',
    conditions,
    groups,
    clauses,
    draftSavedAt: null,
    aiOriginal: {
      join: 'AND',
      conditions: structuredClone(conditions),
      groups: structuredClone(groups),
      clauses: structuredClone(clauses),
    },
  }
}

const reviews = new Map<number, RuleReview>()

/** All rules in review order: newest first, matching the Rules list default sort. */
export async function getReviewQueue(): Promise<RuleApproval[]> {
  const rules = await getRuleApprovals()
  return [...rules].sort((a, b) => b.lastUpdated.localeCompare(a.lastUpdated))
}

export async function getRuleReview(ruleId: number): Promise<RuleReview | undefined> {
  const existing = reviews.get(ruleId)
  if (existing) return existing
  const rule = await getRuleApproval(ruleId)
  if (!rule) return undefined
  const review = buildReview(rule)
  reviews.set(ruleId, review)
  return review
}

export async function updateRuleReview(
  ruleId: number,
  data: Partial<RuleReview>,
): Promise<RuleReview | undefined> {
  const existing = await getRuleReview(ruleId)
  if (!existing) return undefined
  // aiOriginal is immutable — ignore any attempt to overwrite it.
  const { aiOriginal: _ignored, ...safe } = data
  const updated = {
    ...existing,
    ...safe,
    id: existing.id,
    ruleId: existing.ruleId,
    aiOriginal: existing.aiOriginal,
  }
  reviews.set(ruleId, updated)
  return updated
}

/**
 * Stores the reviewer's edits without changing the rule's status. Works for
 * rules in any status (Pending or Approved), so reviewers can tweak a rule's
 * content after it has been approved.
 */
export async function saveRuleReviewDraft(
  ruleId: number,
  content: RuleReviewContent,
): Promise<RuleReview | undefined> {
  return updateRuleReview(ruleId, { ...content, draftSavedAt: new Date().toISOString() })
}

/**
 * Stores the reviewer's edits and sets the rule's status. `lastUpdated` is
 * left alone so the review queue keeps its order while the reviewer works
 * through it. Accepts transitions from any status, so a reviewer can
 * re-approve a rule after further edits.
 */
async function decideRuleReview(
  ruleId: number,
  content: RuleReviewContent,
  status: RuleApprovalStatus,
): Promise<RuleReview | undefined> {
  const updated = await updateRuleReview(ruleId, { ...content, draftSavedAt: null })
  if (!updated) return undefined
  await updateRuleApproval(ruleId, { status })
  return updated
}

export async function approveRuleReview(
  ruleId: number,
  content: RuleReviewContent,
): Promise<RuleReview | undefined> {
  return decideRuleReview(ruleId, content, 'Approved')
}

/** Saves edits and sets the rule's status back to Pending. */
export async function pendRuleReview(
  ruleId: number,
  content: RuleReviewContent,
): Promise<RuleReview | undefined> {
  return decideRuleReview(ruleId, content, 'Pending')
}



export function countConditions(review: Pick<RuleReviewContent, 'conditions' | 'groups'>): number {
  return review.conditions.length + review.groups.reduce((sum, g) => sum + g.conditions.length, 0)
}
