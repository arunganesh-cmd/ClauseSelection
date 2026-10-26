import { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'wouter'
import {
  SiteNav,
  HeadingField,
  CardLayout,
  ReadOnlyGrid,
  GridColumn,
  TagField,
  ButtonWidget,
} from '@pglevy/sailwind'
import {
  LayoutGrid,
  List,
  Layers,
  CircleHelp,
  Shuffle,
  BookOpen,
  Check,
  X,
} from 'lucide-react'
import {
  getLibraryReviewQueue,
  setLibraryReviewDecision,
  type LibraryRuleReview,
  type LibraryReviewDecision,
} from '../db/library-rule-reviews'
import { type Rule } from '../db/rules'

/**
 * Library rules review wizard.
 *
 * Walks the user through every pending library-sourced rule one at a time.
 * Reuses the record-style layout from `library-rule.tsx` (Summary on the
 * left, Conditions + Included / Excluded Clauses on the right) and adds
 * Previous / Next navigation + Reject / Accept decision buttons.
 *
 * Reached from the "Start review" banner on the Rules page.
 */

const navPages = [
  { label: 'Clause Sets', icon: LayoutGrid },
  { label: 'Clauses', icon: List },
  { label: 'Templates', icon: Layers },
  { label: 'Questionnaires', icon: CircleHelp },
  { label: 'Rules', icon: Shuffle, isSelected: true },
  { label: 'Library', icon: BookOpen },
]

/* -------------------------------------------------------------------------- */
/* Mock conditions / clauses                                                  */
/* -------------------------------------------------------------------------- */

type ConditionJoin = 'AND' | 'OR'

interface Condition {
  id: number
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

/** Deterministic mock conditions per rule so each one reads a bit differently. */
function conditionsFor(rule: Rule): {
  join: ConditionJoin
  conditions: Condition[]
  groups: ConditionGroup[]
} {
  const base: Condition[] = [
    {
      id: 1,
      subject: 'Acquisition Type',
      operator: 'Not equal to',
      value: 'Commercially available off-the-shelf (COTS) items',
    },
  ]
  const groups: ConditionGroup[] = [
    {
      id: 1,
      join: rule.id % 2 === 0 ? 'OR' : 'AND',
      conditions: [
        {
          id: 2,
          subject:
            'OOTB Library Questionnaire (Default) - Will the contractor store, process or transmit Federal contract information?',
          operator: 'Equals',
          value: 'Yes',
        },
        {
          id: 3,
          subject:
            'OOTB Library Questionnaire (Default) - Will the contractor use information systems to perform the contract?',
          operator: 'Equals',
          value: 'Yes',
        },
      ],
    },
  ]
  return { join: 'AND', conditions: base, groups }
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

/* -------------------------------------------------------------------------- */
/* Component                                                                  */
/* -------------------------------------------------------------------------- */

export default function LibraryRulesReview() {
  const [, setLocation] = useLocation()
  const [queue, setQueue] = useState<LibraryRuleReview[]>([])
  const [loading, setLoading] = useState(true)
  const [index, setIndex] = useState(0)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    getLibraryReviewQueue().then(data => {
      setQueue(data)
      setLoading(false)
    })
  }, [])

  // Only the pending rules form the review path; keep the full queue around
  // so Previous/Next can wrap back through items the user already acted on.
  const pendingIds = useMemo(
    () => queue.filter(r => r.decision === 'Pending').map(r => r.id),
    [queue],
  )
  const current = queue[index]

  const totalPending = pendingIds.length
  const positionLabel = useMemo(() => {
    if (!current) return ''
    const pendingPos = pendingIds.indexOf(current.id)
    if (pendingPos === -1) {
      return `${index + 1} of ${queue.length}`
    }
    return `${pendingPos + 1} of ${totalPending} pending`
  }, [current, pendingIds, totalPending, index, queue.length])

  const goPrev = () => setIndex(i => Math.max(0, i - 1))
  const goNext = () => setIndex(i => Math.min(queue.length - 1, i + 1))

  const applyDecision = async (decision: LibraryReviewDecision) => {
    if (!current || busy) return
    setBusy(true)
    await setLibraryReviewDecision(current.id, decision)
    const refreshed = await getLibraryReviewQueue()
    setQueue(refreshed)
    const nextPending = refreshed
      .map((r, i) => ({ r, i }))
      .find(({ r, i }) => r.decision === 'Pending' && i > index)
    if (nextPending) {
      setIndex(nextPending.i)
    } else {
      const firstPending = refreshed.findIndex(r => r.decision === 'Pending')
      if (firstPending === -1) {
        // All done — bounce back to Rules.
        setLocation('/rules')
        setBusy(false)
        return
      }
      setIndex(firstPending)
    }
    setBusy(false)
  }

  if (loading) {
    return (
      <Shell>
        <div className="p-8">
          <HeadingField text="Loading..." size="MEDIUM" headingTag="H1" />
        </div>
      </Shell>
    )
  }

  if (!current) {
    return (
      <Shell>
        <div className="p-8">
          <HeadingField
            text="No rules to review"
            size="LARGE"
            headingTag="H1"
            marginBelow="LESS"
          />
          <ButtonWidget
            label="Back to Rules"
            style="SOLID"
            color="ACCENT"
            onClick={() => setLocation('/rules')}
          />
        </div>
      </Shell>
    )
  }

  const rule = current.rule
  const { clause, title } = splitRuleName(rule.name)
  const { join, conditions, groups } = conditionsFor(rule)
  const summaryRows: { label: string; value: React.ReactNode }[] = [
    {
      label: 'Status',
      value: (
        <TagField
          size="SMALL"
          tags={[
            {
              text: rule.status === 'Active' ? 'Active' : 'Inactive',
              backgroundColor: rule.status === 'Active' ? '#D7F3E0' : '#FDE2E2',
              textColor: rule.status === 'Active' ? '#166534' : '#991B1B',
            },
          ]}
          marginBelow="NONE"
        />
      ),
    },
    { label: 'Source', value: 'System (library)' },
    { label: 'Library version', value: '4.1.2' },
    { label: 'Added in version', value: '4.1.0' },
    { label: 'FAR/DFARS baseline', value: 'FAC 2025-06' },
    { label: 'Last Updated', value: 'Library import · Oct 21, 2026 10:05 AM' },
  ]

  return (
    <Shell>
      {/* Title + progress bar */}
      <div className="shrink-0 border-b border-gray-200 bg-white px-8 pt-5">
        <HeadingField
          text={`${clause || ''}${clause ? ' — ' : ''}${title || rule.name}`}
          size="LARGE"
          headingTag="H1"
          fontWeight="SEMI_BOLD"
          marginBelow="LESS"
        />
        <div className="flex items-center gap-3 pb-3">
          <DecisionTag decision={current.decision} />
          <span className="text-sm text-gray-600">{positionLabel}</span>
          <div className="ml-auto flex items-center gap-2">
            <ButtonWidget
              label="Previous"
              icon="ChevronLeft"
              iconPosition="START"
              style="OUTLINE"
              color="ACCENT"
              size="SMALL"
              disabled={index === 0 || busy}
              onClick={goPrev}
            />
            <ButtonWidget
              label="Next"
              icon="ChevronRight"
              iconPosition="END"
              style="OUTLINE"
              color="ACCENT"
              size="SMALL"
              disabled={index >= queue.length - 1 || busy}
              onClick={goNext}
            />
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-8 py-6">
        <div className="grid w-full grid-cols-1 gap-6 lg:grid-cols-[22rem_minmax(0,1fr)]">
          <aside>
            <HeadingField
              text="Overview"
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
                  {groups.map((group, groupIndex) => (
                    <div key={group.id}>
                      {groupIndex > 0 && (
                        <p className="pb-2 text-xs font-semibold text-gray-600">
                          {join}
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
                  {conditions.length > 0 && (
                    <>
                      {groups.length > 0 && (
                        <p className="pb-2 text-xs font-semibold text-gray-600">
                          {join}
                        </p>
                      )}
                      <ConditionStack conditions={conditions} join={join} />
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
                <ClausesGrid rows={defaultIncluded} />
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
                <ClausesGrid rows={defaultExcluded} />
              </CardLayout>
            </section>
          </div>
        </div>
      </div>

      {/* Decision bar */}
      <div className="flex shrink-0 items-center justify-between gap-3 border-t border-gray-200 bg-white px-8 py-3">
        <ButtonWidget
          label="Cancel"
          style="LINK"
          color="ACCENT"
          disabled={busy}
          onClick={() => setLocation('/rules')}
        />
        <div className="flex items-center gap-3">
          <ButtonWidget
            label="Reject"
            icon="X"
            iconPosition="START"
            style="OUTLINE"
            color="NEGATIVE"
            disabled={busy}
            onClick={() => applyDecision('Rejected')}
          />
          <ButtonWidget
            label="Accept"
            icon="Check"
            iconPosition="START"
            style="SOLID"
            color="ACCENT"
            disabled={busy}
            onClick={() => applyDecision('Accepted')}
          />
        </div>
      </div>
    </Shell>
  )
}

/* -------------------------------------------------------------------------- */
/* Shared pieces                                                              */
/* -------------------------------------------------------------------------- */

function Shell({ children }: { children: React.ReactNode }) {
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
        {children}
      </main>
    </div>
  )
}

function DecisionTag({ decision }: { decision: LibraryReviewDecision }) {
  const styles =
    decision === 'Accepted'
      ? { bg: '#D7F3E0', fg: '#166534', icon: <Check size={14} aria-hidden="true" /> as React.ReactNode }
      : decision === 'Rejected'
        ? { bg: '#FDE2E2', fg: '#991B1B', icon: <X size={14} aria-hidden="true" /> as React.ReactNode }
        : { bg: '#DBEAFE', fg: '#1E40AF', icon: null as React.ReactNode }
  return (
    <span
      className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium"
      style={{ backgroundColor: styles.bg, color: styles.fg }}
    >
      {styles.icon}
      {decision}
    </span>
  )
}

const CLAUSE_RE = /^(FAR|DFARS)\s+[\d.\-A-Za-z]+(?:\s+Alt\s+[IVX]+)?/i
function splitRuleName(name: string): { clause: string; title: string } {
  const match = name.match(CLAUSE_RE)
  if (!match) return { clause: '', title: name }
  return { clause: match[0], title: name.slice(match[0].length).trim() }
}

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
      {conditions.map((condition, i) => (
        <div key={condition.id}>
          {i > 0 && (
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
