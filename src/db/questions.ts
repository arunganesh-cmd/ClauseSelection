/**
 * Questions data layer.
 *
 * A Question is one item in the question library that clause sets can ask about
 * (for example, "Is a favorable NACI required for personnel?"). The seed data
 * below is what a customer gets after importing the system questions. Every
 * imported question starts as Pending and must be approved before it appears
 * in the Questions tab.
 *
 * `lastModified` is stored as an ISO 8601 string so it sorts correctly. Pages
 * format it for display with `formatQuestionTimestamp`.
 */

export type QuestionResponseType = 'Radio Button' | 'Dropdown'
export type QuestionStatus = 'Approved' | 'Rejected' | 'Pending'
export type QuestionSource = 'Standard' | 'Custom'

export interface Question {
  id: number
  question: string
  responseType: QuestionResponseType
  /** Standard questions ship with the solution. Custom questions are authored by the agency. */
  source: QuestionSource
  /** The choices a user can pick from when answering the question. */
  responseOptions: string[]
  /** ISO 8601 timestamp. */
  lastModified: string
  /** Username of the person who last modified the question. */
  modifiedBy: string
  status: QuestionStatus
}

const questions: Question[] = [
  { id: 1, question: 'Does this acquisition require compliance banner verification?', responseType: 'Radio Button', source: 'Standard', responseOptions: ['Yes - Banner Required', 'No - Banner Not Required'], lastModified: '2026-09-08T07:21:00', modifiedBy: 'john.smith', status: 'Pending' },
  { id: 2, question: 'Identify the named Contracting Officer (CO) for this requirement.', responseType: 'Dropdown', source: 'Standard', responseOptions: ['Contracting Officer A', 'Contracting Officer B', 'Not specified'], lastModified: '2026-03-27T06:45:00', modifiedBy: 'alice.chen', status: 'Pending' },
  { id: 3, question: 'What is the primary Solicitation or Order Number associated with this document?', responseType: 'Dropdown', source: 'Standard', responseOptions: ['Solicitation number', 'Order number', 'Not specified'], lastModified: '2026-03-27T06:25:00', modifiedBy: 'john.smith', status: 'Pending' },
  { id: 4, question: 'Identify the primary Government Agency issuing this requirement.', responseType: 'Dropdown', source: 'Standard', responseOptions: ['Department of Defense', 'General Services Administration', 'Department of Homeland Security', 'Other'], lastModified: '2026-03-27T06:25:00', modifiedBy: 'john.smith', status: 'Pending' },
  { id: 5, question: 'What is the designated North American Industry Classification System (NAICS) code?', responseType: 'Dropdown', source: 'Standard', responseOptions: ['541511', '541512', '541330', 'Other'], lastModified: '2026-03-27T06:25:00', modifiedBy: 'john.smith', status: 'Pending' },
  { id: 6, question: 'Identify the contemplated Contract Type for this requirement.', responseType: 'Radio Button', source: 'Standard', responseOptions: ['Firm Fixed Price', 'Cost Reimbursement', 'Time and Materials', 'Indefinite Delivery'], lastModified: '2026-03-27T06:25:00', modifiedBy: 'john.smith', status: 'Pending' },
  { id: 7, question: 'Does the document specify a total Small Business set-aside?', responseType: 'Radio Button', source: 'Standard', responseOptions: ['Yes', 'No'], lastModified: '2026-03-27T06:25:00', modifiedBy: 'john.smith', status: 'Pending' },
  { id: 8, question: 'Identify the specific Socio-Economic set-aside (if applicable).', responseType: 'Dropdown', source: 'Standard', responseOptions: ['Women-Owned', 'Service-Disabled Veteran-Owned', 'HUBZone', '8(a)', 'None'], lastModified: '2026-03-27T06:25:00', modifiedBy: 'john.smith', status: 'Pending' },
  { id: 9, question: 'What is the total Period of Performance (including all option periods) in months?', responseType: 'Dropdown', source: 'Standard', responseOptions: ['12 months or less', '13 to 36 months', '37 to 60 months', 'More than 60 months'], lastModified: '2026-03-27T06:25:00', modifiedBy: 'john.smith', status: 'Pending' },
  { id: 10, question: 'Identify the number of Option Years/Periods available in this requirement.', responseType: 'Dropdown', source: 'Standard', responseOptions: ['0', '1', '2', '3', '4 or more'], lastModified: '2026-03-27T06:25:00', modifiedBy: 'john.smith', status: 'Pending' },
  { id: 11, question: 'Is a favorable National Agency Check with Inquiries (NACI) required for personnel?', responseType: 'Radio Button', source: 'Standard', responseOptions: ['Yes', 'No'], lastModified: '2026-03-27T06:25:00', modifiedBy: 'carol.white', status: 'Pending' },
  { id: 12, question: 'What is the highest level of Security Clearance required for the site or personnel?', responseType: 'Dropdown', source: 'Standard', responseOptions: ['None', 'Public Trust', 'Secret', 'Top Secret'], lastModified: '2026-03-27T06:25:00', modifiedBy: 'john.smith', status: 'Pending' },
  { id: 13, question: 'Identify the primary Place of Performance (Region).', responseType: 'Dropdown', source: 'Standard', responseOptions: ['Northeast', 'Southeast', 'Midwest', 'Southwest', 'West', 'Overseas'], lastModified: '2026-03-27T06:25:00', modifiedBy: 'john.smith', status: 'Pending' },
  { id: 14, question: 'Does the requirement mention compliance with Section 508 Accessibility standards?', responseType: 'Radio Button', source: 'Standard', responseOptions: ['Yes', 'No'], lastModified: '2026-03-27T06:25:00', modifiedBy: 'john.smith', status: 'Pending' },
  { id: 15, question: 'Is the Contractor required to provide a Project Management Plan (PMP) as a deliverable?', responseType: 'Radio Button', source: 'Standard', responseOptions: ['Yes', 'No'], lastModified: '2026-03-27T06:25:00', modifiedBy: 'david.kim', status: 'Pending' },
  { id: 16, question: 'Within how many calendar days after award must the Kick-off Meeting be held?', responseType: 'Dropdown', source: 'Standard', responseOptions: ['15 days', '30 days', '45 days', '60 days'], lastModified: '2026-03-27T06:25:00', modifiedBy: 'john.smith', status: 'Pending' },
  { id: 17, question: 'Are there specific Key Personnel roles explicitly named in the document?', responseType: 'Radio Button', source: 'Standard', responseOptions: ['Yes', 'No'], lastModified: '2026-03-27T06:25:00', modifiedBy: 'bob.martinez', status: 'Pending' },
  { id: 18, question: 'Does the requirement include a Government Furnished Property (GFP) clause?', responseType: 'Radio Button', source: 'Standard', responseOptions: ['Yes', 'No'], lastModified: '2026-03-27T06:24:00', modifiedBy: 'john.smith', status: 'Pending' },
  { id: 19, question: 'Identify the applicable Payment Terms for this requirement.', responseType: 'Dropdown', source: 'Standard', responseOptions: ['Net 30', 'Net 45', 'Net 60', 'Progress payments'], lastModified: '2026-03-27T06:24:00', modifiedBy: 'alice.chen', status: 'Pending' },
  { id: 20, question: 'Is the acquisition subject to the Trade Agreements Act?', responseType: 'Radio Button', source: 'Standard', responseOptions: ['Yes', 'No'], lastModified: '2026-03-27T06:24:00', modifiedBy: 'john.smith', status: 'Pending' },
  { id: 21, question: 'Does the solicitation request technical proposals under two-step sealed bidding procedures?', responseType: 'Radio Button', source: 'Standard', responseOptions: ['Yes', 'No'], lastModified: '2026-06-17T17:07:00', modifiedBy: 'raajiv.madivanane', status: 'Pending' },
]

/**
 * System (Standard) questions stay hidden until the customer imports them.
 * Seeded as imported in this prototype so the Review Questions screen is
 * usable immediately without having to click "Import Questions" first.
 */
let systemQuestionsImported = true

const visibleQuestions = () =>
  questions.filter(q => q.source === 'Custom' || systemQuestionsImported)

/** Makes the system questions available for review. Called by "Import system questions". */
export async function importSystemQuestions(): Promise<void> {
  systemQuestionsImported = true
}

/** Everything the customer can currently see: custom questions plus imported system questions. */
export async function getQuestions(): Promise<Question[]> {
  return visibleQuestions()
}

/** The imported system questions. Only these go through review. */
export async function getSystemQuestions(): Promise<Question[]> {
  return visibleQuestions().filter(q => q.source === 'Standard')
}

/** Only the questions that have been approved. The Questions tab shows this list. */
export async function getApprovedQuestions(): Promise<Question[]> {
  return visibleQuestions().filter(q => q.status === 'Approved')
}

/** How many imported questions are still waiting for review. */
export async function getPendingQuestionCount(): Promise<number> {
  return visibleQuestions().filter(q => q.status === 'Pending').length
}

/**
 * Approves or rejects pending questions during review. Questions that are no
 * longer pending are skipped. Returns the questions that changed.
 */
export async function reviewQuestions(
  ids: number[],
  status: Exclude<QuestionStatus, 'Pending'>,
  reviewedBy: string,
): Promise<Question[]> {
  const changed: Question[] = []
  for (const id of ids) {
    const idx = questions.findIndex(q => q.id === id)
    if (idx === -1 || questions[idx].status !== 'Pending') continue
    questions[idx] = {
      ...questions[idx],
      status,
      lastModified: new Date().toISOString(),
      modifiedBy: reviewedBy,
    }
    changed.push(questions[idx])
  }
  return changed
}

export async function getQuestion(id: number): Promise<Question | undefined> {
  return questions.find(q => q.id === id)
}

export async function createQuestion(data: Omit<Question, 'id'>): Promise<Question> {
  const newQuestion = { ...data, id: Math.max(0, ...questions.map(q => q.id)) + 1 }
  questions.push(newQuestion)
  return newQuestion
}

export async function updateQuestion(id: number, data: Partial<Question>): Promise<Question | undefined> {
  const idx = questions.findIndex(q => q.id === id)
  if (idx === -1) return undefined
  questions[idx] = { ...questions[idx], ...data }
  return questions[idx]
}

export async function deleteQuestion(id: number): Promise<boolean> {
  const idx = questions.findIndex(q => q.id === id)
  if (idx === -1) return false
  questions.splice(idx, 1)
  return true
}

/**
 * Simulates importing a spreadsheet of questions. The prototype doesn't parse
 * the file, so it adds three sample questions named after it. Imported
 * questions are Custom and Approved, so they skip review.
 */
export async function importCustomQuestions(fileName: string, importedBy: string): Promise<Question[]> {
  const types: QuestionResponseType[] = ['Radio Button', 'Dropdown', 'Radio Button']
  const created: Question[] = []
  for (let i = 0; i < 3; i++) {
    created.push(
      await createQuestion({
        question: `Imported question ${i + 1} from ${fileName}`,
        responseType: types[i],
        source: 'Custom',
        responseOptions: ['Yes', 'No'],
        lastModified: new Date().toISOString(),
        modifiedBy: importedBy,
        status: 'Approved',
      }),
    )
  }
  return created
}

/** Formats an ISO timestamp the way the Questions grid displays it, e.g. "Sep 8, 2026 7:21 AM". */
export function formatQuestionTimestamp(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  const datePart = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
  const timePart = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
  return `${datePart} ${timePart}`
}
