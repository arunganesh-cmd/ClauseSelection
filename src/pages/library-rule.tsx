import { useParams, useLocation } from 'wouter'
import {
  SiteNav,
  HeadingField,
  CardLayout,
  ReadOnlyGrid,
  GridColumn,
  TagField,
} from '@pglevy/sailwind'
import {
  LayoutGrid,
  List,
  Layers,
  CircleHelp,
  Shuffle,
  BookOpen,
  ChevronLeft,
} from 'lucide-react'

/**
 * Library rule record view.
 *
 * Reached from the Rule name link on the library-import summary page
 * (/library-rule/:id). Lays out:
 *   - Record title (clause number · rule name) with a Back link
 *   - Pill tab ("Summary" active) — matches the library-import summary page
 *   - Two-column body:
 *       Left: Summary card (status, source, library version, UID, …)
 *       Right: Conditions tree (grouped with AND/OR joins) and the
 *              Included / Excluded Clauses grids
 *
 * The condition-rendering components (ConditionStack / ConditionRow /
 * ConditionGroup) mirror the shape used in rule-review.tsx so library rule
 * records read the same way as the SME review screen.
 */

const navPages = [
  { label: 'Clause Sets', icon: LayoutGrid },
  { label: 'Clauses', icon: List },
  { label: 'Templates', icon: Layers },
  { label: 'Questionnaires', icon: CircleHelp },
  { label: 'Rules', icon: Shuffle },
  { label: 'Library', icon: BookOpen, isSelected: true },
]

/* -------------------------------------------------------------------------- */
/* Mock data                                                                  */
/* -------------------------------------------------------------------------- */

type ConditionJoin = 'AND' | 'OR'

interface Condition {
  id: number
  /** Display text for the left-hand side of the condition. */
  subject: string
  operator: string
  value: string
}

interface ConditionGroup {
  id: number
  join: ConditionJoin
  conditions: Condition[]
}

interface ClauseRow {
  id: number
  number: string
  title: string
}

interface LibraryRule {
  clause: string
  name: string
  status: 'Active' | 'Inactive'
  source: string
  libraryVersion: string
  addedInVersion: string
  farDfarsBaseline: string
  lastUpdated: string
  uid: string
  /** How top-level conditions and groups combine. */
  join: ConditionJoin
  conditions: Condition[]
  groups: ConditionGroup[]
  included: ClauseRow[]
  excluded: ClauseRow[]
}

const defaultIncluded: ClauseRow[] = [
  {
    id: 1,
    number: '52.204-21',
    title: 'Basic Safeguarding of Covered Contractor Information Systems',
  },
  {
    id: 2,
    number: '52.204-23',
    title:
      'Prohibition on Contracting for Hardware, Software, and Services Developed or Provided by Kaspersky Lab',
  },
]

const defaultExcluded: ClauseRow[] = []

/**
 * Rule library keyed by numeric id. The ids line up with those used by the
 * imported-rules grid on the library-import summary page.
 */
const rulesById: Record<number, LibraryRule> = {
  1: {
    clause: 'FAR 52.219-9 Alt II',
    name: 'Small Business Subcontracting Plan Inclusion',
    status: 'Active',
    source: 'System (library)',
    libraryVersion: '4.1.2',
    addedInVersion: '4.1.0',
    farDfarsBaseline: 'FAC 2025-06',
    lastUpdated: 'Library import · Oct 21, 2026 10:05 AM',
    uid: 'a8d2e7c4-1f3b-4c6e-9a05-2b7d4e8f1c36',
    join: 'AND',
    conditions: [
      {
        id: 10,
        subject: 'Acquisition Type',
        operator: 'Not equal to',
        value: 'Commercially available off-the-shelf (COTS) items',
      },
    ],
    groups: [
      {
        id: 1,
        join: 'OR',
        conditions: [
          {
            id: 1,
            subject:
              'OOTB Library Questionnaire (Default) - Will the contractor store, process or transmit Federal contract information?',
            operator: 'Equals',
            value: 'Yes',
          },
          {
            id: 2,
            subject:
              'OOTB Library Questionnaire (Default) - Will the contractor use information systems to perform the contract?',
            operator: 'Equals',
            value: 'Yes',
          },
        ],
      },
    ],
    included: defaultIncluded,
    excluded: defaultExcluded,
  },
  2: {
    clause: 'FAR 52.204-21',
    name: 'Basic Safeguarding of Covered Contractor Information Systems Inclusion',
    status: 'Active',
    source: 'System (library)',
    libraryVersion: '4.1.2',
    addedInVersion: '4.1.0',
    farDfarsBaseline: 'FAC 2025-06',
    lastUpdated: 'Library import · Oct 21, 2026 10:05 AM',
    uid: 'a8d2e7c4-1f3b-4c6e-9a05-2b7d4e8f1c36',
    join: 'AND',
    conditions: [
      {
        id: 10,
        subject: 'Acquisition Type',
        operator: 'Not equal to',
        value: 'Commercially available off-the-shelf (COTS) items',
      },
    ],
    groups: [
      {
        id: 1,
        join: 'OR',
        conditions: [
          {
            id: 1,
            subject:
              'OOTB Library Questionnaire (Default) - Will the contractor store, process or transmit Federal contract information?',
            operator: 'Equals',
            value: 'Yes',
          },
          {
            id: 2,
            subject:
              'OOTB Library Questionnaire (Default) - Will the contractor use information systems to perform the contract?',
            operator: 'Equals',
            value: 'Yes',
          },
        ],
      },
    ],
    included: defaultIncluded,
    excluded: defaultExcluded,
  },
}

/** Fallback rule used when the id in the URL doesn't match a seeded rule. */
const fallbackRule = (clause: string, name: string): LibraryRule => ({
  clause,
  name,
  status: 'Active',
  source: 'System (library)',
  libraryVersion: '4.1.2',
  addedInVersion: '4.1.0',
  farDfarsBaseline: 'FAC 2025-06',
  lastUpdated: 'Library import · Oct 21, 2026 10:05 AM',
  uid: 'a8d2e7c4-1f3b-4c6e-9a05-2b7d4e8f1c36',
  join: 'AND',
  conditions: [
    {
      id: 10,
      subject: 'Acquisition Type',
      operator: 'Not equal to',
      value: 'Commercially available off-the-shelf (COTS) items',
    },
  ],
  groups: [
    {
      id: 1,
      join: 'OR',
      conditions: [
        {
          id: 1,
          subject:
            'OOTB Library Questionnaire (Default) - Will the contractor store, process or transmit Federal contract information?',
          operator: 'Equals',
          value: 'Yes',
        },
        {
          id: 2,
          subject:
            'OOTB Library Questionnaire (Default) - Will the contractor use information systems to perform the contract?',
          operator: 'Equals',
          value: 'Yes',
        },
      ],
    },
  ],
  included: defaultIncluded,
  excluded: defaultExcluded,
})

/* -------------------------------------------------------------------------- */
/* Component                                                                  */
/* -------------------------------------------------------------------------- */

export default function LibraryRule() {
  const params = useParams<{ id: string }>()
  const [, setLocation] = useLocation()
  const id = Number(params.id)
  const rule =
    rulesById[id] ?? fallbackRule('FAR 52.204-21', 'Basic Safeguarding Inclusion')

  const summaryRows: { label: string; value: React.ReactNode }[] = [
    {
      label: 'Status',
      value: (
        <TagField
          size="SMALL"
          tags={[
            {
              text: rule.status,
              backgroundColor: rule.status === 'Active' ? '#D7F3E0' : '#FDE2E2',
              textColor: rule.status === 'Active' ? '#166534' : '#991B1B',
            },
          ]}
          marginBelow="NONE"
        />
      ),
    },
    { label: 'Source', value: rule.source },
    { label: 'Library version', value: rule.libraryVersion },
    { label: 'Added in version', value: rule.addedInVersion },
    { label: 'FAR/DFARS baseline', value: rule.farDfarsBaseline },
    { label: 'Last Updated', value: rule.lastUpdated },
  ]

  return (
    <div className="flex h-screen bg-white">
      <SiteNav
        displayName="Clause Automation"
        pages={navPages}
        userName="Privilege User"
        appianLogoSrc="/images/icon-appian-header.png"
        highlightColor="#C7C4F4"
      />
      <main
        className="flex h-screen min-w-0 flex-1 flex-col overflow-hidden border-l border-gray-200"
        style={{ backgroundColor: '#FAFAFC' }}
      >
        {/* Title + tab */}
        <div className="shrink-0 border-b border-gray-200 bg-white px-8 pt-5">
          <HeadingField
            text={`${rule.clause} — ${rule.name}`}
            size="LARGE"
            headingTag="H1"
            fontWeight="SEMI_BOLD"
            marginBelow="LESS"
          />
          <div className="flex items-center gap-1.5 pb-3">
            <button
              type="button"
              aria-pressed={true}
              className="rounded-md bg-blue-700 px-3 py-1 text-sm font-semibold text-white"
            >
              Summary
            </button>
            <button
              type="button"
              aria-pressed={false}
              className="rounded-md px-3 py-1 text-sm font-medium text-blue-700 hover:bg-blue-50"
            >
              Rule history
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-8 py-6">
          <div className="mb-4">
            <button
              type="button"
              onClick={() => setLocation('/library/import/summary')}
              className="inline-flex items-center gap-1 text-sm font-medium text-blue-700 hover:text-blue-800"
            >
              <ChevronLeft size={14} aria-hidden="true" />
              Back to import summary
            </button>
          </div>
          <div className="grid w-full grid-cols-1 gap-6 lg:grid-cols-[22rem_minmax(0,1fr)]">
            {/* Left column — Summary card */}
            <aside>
              <HeadingField
                text="Summary"
                size="MEDIUM"
                headingTag="H2"
                fontWeight="SEMI_BOLD"
                marginBelow="LESS"
              />
              <div className="rounded-md border border-gray-200 bg-white">
                <dl className="divide-y divide-gray-100">
                  {summaryRows.map(row => (
                    <div
                      key={row.label}
                      className="grid grid-cols-[9rem_minmax(0,1fr)] gap-3 px-4 py-2.5"
                    >
                      <dt className="text-xs uppercase tracking-wide text-gray-500">
                        {row.label}
                      </dt>
                      <dd className="text-sm text-gray-900">{row.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </aside>

            {/* Right column — Conditions + clauses */}
            <div className="space-y-6">
              <section>
                <HeadingField
                  text="Conditions"
                  size="MEDIUM"
                  headingTag="H2"
                  fontWeight="SEMI_BOLD"
                  marginBelow="LESS"
                />
                <CardLayout
                  padding="MORE"
                  shape="SEMI_ROUNDED"
                  style="#FFFFFF"
                  showBorder={true}
                  marginBelow="NONE"
                >
                  <div className="space-y-4">
                    {rule.groups.map((group, groupIndex) => (
                      <div key={group.id}>
                        {groupIndex > 0 && (
                          <p className="pb-2 text-xs font-semibold text-gray-600">
                            {rule.join}
                          </p>
                        )}
                        <div className="rounded-md border border-gray-200 bg-gray-50 p-4">
                          <p className="mb-3 text-xs text-gray-700">
                            Condition Group {groupIndex + 1}
                          </p>
                          <ConditionStack
                            conditions={group.conditions}
                            join={group.join}
                          />
                        </div>
                      </div>
                    ))}
                    {rule.conditions.length > 0 && (
                      <>
                        {rule.groups.length > 0 && (
                          <p className="pb-2 text-xs font-semibold text-gray-600">
                            {rule.join}
                          </p>
                        )}
                        <ConditionStack
                          conditions={rule.conditions}
                          join={rule.join}
                        />
                      </>
                    )}
                  </div>
                </CardLayout>
              </section>

              <section>
                <HeadingField
                  text="Included Clauses"
                  size="MEDIUM"
                  headingTag="H2"
                  fontWeight="SEMI_BOLD"
                  marginBelow="LESS"
                />
                <CardLayout
                  padding="LESS"
                  shape="SEMI_ROUNDED"
                  style="#FFFFFF"
                  showBorder={true}
                  marginBelow="NONE"
                >
                  <ClausesGrid rows={rule.included} />
                </CardLayout>
              </section>

              <section>
                <HeadingField
                  text="Excluded Clauses"
                  size="MEDIUM"
                  headingTag="H2"
                  fontWeight="SEMI_BOLD"
                  marginBelow="LESS"
                />
                <CardLayout
                  padding="LESS"
                  shape="SEMI_ROUNDED"
                  style="#FFFFFF"
                  showBorder={true}
                  marginBelow="NONE"
                >
                  <ClausesGrid rows={rule.excluded} />
                </CardLayout>
              </section>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Condition rendering (mirrors rule-review.tsx)                              */
/* -------------------------------------------------------------------------- */

function ConditionRow({ condition }: { condition: Condition }) {
  return (
    <div className="rounded-md border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900">
      <p>
        <span className="font-medium">{condition.subject}</span>{' '}
        <span className="text-gray-600">{condition.operator}</span>{' '}
        <span>{condition.value}</span>
      </p>
    </div>
  )
}

function ConditionStack({
  conditions,
  join,
}: {
  conditions: Condition[]
  join: ConditionJoin
}) {
  return (
    <div>
      {conditions.map((condition, index) => (
        <div key={condition.id}>
          {index > 0 && (
            <p className="py-1 text-xs font-semibold text-gray-600">{join}</p>
          )}
          <ConditionRow condition={condition} />
        </div>
      ))}
    </div>
  )
}

function ClausesGrid({ rows }: { rows: ClauseRow[] }) {
  if (rows.length === 0) {
    return (
      <p className="px-2 py-4 text-sm text-gray-600">No clauses available</p>
    )
  }
  return (
    <ReadOnlyGrid
      data={rows}
      spacing="STANDARD"
      borderStyle="LIGHT"
      shadeAlternateRows={true}
      pageSize={10}
      pagingControls="ROW_COUNT"
    >
      <GridColumn
        label="Clause Number"
        value={row => (row as ClauseRow).number}
        width="NARROW_PLUS"
      />
      <GridColumn label="Title" value={row => (row as ClauseRow).title} />
    </ReadOnlyGrid>
  )
}
