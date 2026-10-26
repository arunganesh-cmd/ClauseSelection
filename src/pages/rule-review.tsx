import { useState, useEffect, type ReactNode } from 'react'
import { useLocation, useParams } from 'wouter'
import {
  SiteNav,
  HeadingField,
  CardLayout,
  DialogField,
  ButtonWidget,
  RichTextDisplayField,
  TextItem,
  TagField,
  MessageBanner,
  TextField,
  RadioButtonField,
} from '@pglevy/sailwind'
import {
  List,
  CircleHelp,
  Shuffle,
  Sparkles,
  Info,
  AlertTriangle,
} from 'lucide-react'
import {
  ConditionsEditor,
  ConditionsPreview,
  type EditConditionsMode,
} from '../components/edit-conditions-form'
import {
  getReviewQueue,
  getRuleReview,
  approveRuleReview,
  pendRuleReview,
  countConditions,
  clauseDataTypes,
  type RuleReview,
  type RuleReviewContent,
  type RuleCondition,
  type ConditionJoin,
  type ReviewClause,
} from '../db/rule-reviews'
import {
  updateRuleApproval,
  type RuleApproval,
  type RuleApprovalStatus,
  type RuleActiveStatus,
} from '../db/rule-approvals'

const navPages = [
  { label: 'Clauses', icon: List },
  { label: 'Questionnaires', icon: CircleHelp },
  { label: 'Rules', icon: Shuffle, isSelected: true },
]

const statusTagColors: Record<RuleApprovalStatus, { background: string; text: string }> = {
  Pending: { background: '#DBEAFE', text: '#1E40AF' },
  Approved: { background: '#D7F3E0', text: '#166534' },
}

const UNSAVED_CONFIRM = 'You have unsaved changes. Discard them and continue?'

const pluralize = (count: number, singular: string) =>
  `${count} ${singular}${count === 1 ? '' : 's'}`

/* -------------------------------------------------------------------------- */
/* Read-only pieces                                                           */
/* -------------------------------------------------------------------------- */

/** Renders long text as read-only paragraphs, keeping the blank lines in the source. */
function TextBlock({ text }: { text: string }) {
  return (
    <>
      {text.split(/\n\n+/).map((paragraph, index) => (
        <RichTextDisplayField
          key={index}
          value={[<TextItem key="t" text={paragraph} size="STANDARD" />]}
          marginBelow="STANDARD"
        />
      ))}
    </>
  )
}

/** One condition on a single line: clause data, operator, value. */
function ConditionRow({ condition }: { condition: RuleCondition }) {
  const isQuestion = condition.clauseData === 'Questionnaire Question'
  return (
    <div className="rounded-md border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900">
      <p>
        <span className="font-medium">{isQuestion ? condition.question : condition.clauseData}</span>{' '}
        <span className="text-gray-600">{condition.operator}</span>{' '}
        <span>{condition.value}</span>
      </p>
      {isQuestion && <p className="mt-0.5 text-xs text-gray-600">{condition.questionnaire}</p>}
    </div>
  )
}

/** Conditions stacked with the join (AND / OR) between them. */
function ConditionStack({ conditions, join }: { conditions: RuleCondition[]; join: ConditionJoin }) {
  return (
    <div>
      {conditions.map((condition, index) => (
        <div key={condition.id}>
          {index > 0 && <p className="py-1 text-xs font-semibold text-gray-600">{join}</p>}
          <ConditionRow condition={condition} />
        </div>
      ))}
    </div>
  )
}

/** A compact row in the clause lists: clickable clause number followed by its title. */
function ClauseRow({ clause, onView }: { clause: ReviewClause; onView: () => void }) {
  return (
    <div className="border-b border-gray-100 px-4 py-2 text-sm last:border-b-0">
      <button
        type="button"
        onClick={onView}
        aria-label={`View ${clause.number} ${clause.title}`}
        className="font-semibold text-blue-700 hover:underline focus:outline-none focus-visible:underline"
      >
        {clause.number}
      </button>
      <span className="ml-2 text-gray-700">{clause.title}</span>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Page                                                                       */
/* -------------------------------------------------------------------------- */

function RuleReviewScreen({ pendingOnly }: { pendingOnly: boolean }) {
  const params = useParams<{ id: string }>()
  const ruleId = Number(params.id)
  const [, setLocation] = useLocation()

  const [queue, setQueue] = useState<RuleApproval[]>([])
  const [review, setReview] = useState<RuleReview | null>(null)
  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'missing'>('loading')
  const [dirty, setDirty] = useState(false)
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  const [conditionsMode, setConditionsMode] = useState<EditConditionsMode>('PREVIEW')
  const [viewingAiSummary, setViewingAiSummary] = useState(false)
  const [selectedClauseId, setSelectedClauseId] = useState<number | null>(null)
  const [viewingClauseId, setViewingClauseId] = useState<number | null>(null)
  const [nameInput, setNameInput] = useState('')
  const [activeStatusInput, setActiveStatusInput] = useState<RuleActiveStatus>('Active')

  useEffect(() => {
    let cancelled = false
    setLoadState('loading')
    setDone(false)
    setConditionsMode('PREVIEW')
    Promise.all([getReviewQueue(), getRuleReview(ruleId)]).then(([rules, stored]) => {
      if (cancelled) return
      setQueue(rules)
      if (!stored) {
        setReview(null)
        setLoadState('missing')
        return
      }
      // Work on a copy so unsaved edits never leak into the data layer.
      const copy = structuredClone(stored)
      setReview(copy)
      setDirty(false)
      const foundRule = rules.find(r => r.id === ruleId)
      if (foundRule) {
        setNameInput(foundRule.name)
        setActiveStatusInput(foundRule.activeStatus)
      }
      const included = copy.clauses.filter(c => c.outcome === 'Included')
      const excluded = copy.clauses.filter(c => c.outcome === 'Excluded')
      setSelectedClauseId([...included, ...excluded][0]?.id ?? null)
      setLoadState('ready')
    })
    return () => {
      cancelled = true
    }
  }, [ruleId])

  const rule = queue.find(r => r.id === ruleId)

  const includedClauses = review?.clauses.filter(c => c.outcome === 'Included') ?? []
  const excludedClauses = review?.clauses.filter(c => c.outcome === 'Excluded') ?? []
  // AI Generation Summary reads from review.aiOriginal — an immutable snapshot
  // the data layer captured when the review was first built. Reviewer edits
  // never affect what shows here.
  const aiIncludedClauses =
    review?.aiOriginal.clauses.filter(c => c.outcome === 'Included') ?? []
  const aiExcludedClauses =
    review?.aiOriginal.clauses.filter(c => c.outcome === 'Excluded') ?? []
  const selectedClause = review?.clauses.find(c => c.id === selectedClauseId) ?? null

  const conditionTotal = review ? countConditions(review) : 0

  const toContent = (r: RuleReview): RuleReviewContent => ({
    join: r.join,
    conditions: r.conditions,
    groups: r.groups,
  })

  /* -------------------------------- navigation ------------------------------- */

  const confirmLeave = () => !dirty || window.confirm(UNSAVED_CONFIRM)

  const goToList = () => {
    if (!confirmLeave()) return
    setLocation('/rules-review')
  }

  /* --------------------------------- actions --------------------------------- */

  /** Edits made in-place in EDIT mode write straight through to the review state. */
  const handleConditionsChange = (content: RuleReviewContent) => {
    setReview(prev => (prev ? { ...prev, ...content } : prev))
    setDirty(true)
  }

  /** Persist name/status changes, if any, so the Rules list and header stay in sync. */
  const persistHeaderIfChanged = async () => {
    if (!rule) return
    const patch: Partial<RuleApproval> = {}
    if (nameInput !== rule.name) patch.name = nameInput
    if (activeStatusInput !== rule.activeStatus) patch.activeStatus = activeStatusInput
    if (Object.keys(patch).length === 0) return
    await updateRuleApproval(ruleId, patch)
    setQueue(await getReviewQueue())
  }

  /** Persist edits and set the rule's status to Pending (needs re-review). */
  const handleSave = async () => {
    if (!review) return
    setBusy(true)
    await persistHeaderIfChanged()
    await pendRuleReview(ruleId, toContent(review))
    setDirty(false)
    setBusy(false)
    setLocation('/rules-review')
  }

  /** Persist edits AND mark the rule as Approved. */
  const handleSaveAndApprove = async () => {
    if (!review) return
    setBusy(true)
    await persistHeaderIfChanged()
    await approveRuleReview(ruleId, toContent(review))
    setDirty(false)
    setBusy(false)
    setLocation('/rules-review')
  }



  /* ---------------------------------- render --------------------------------- */

  const renderShell = (content: ReactNode) => (
    <div className="flex h-screen bg-white">
      <SiteNav
        displayName="Clause Automation"
        pages={navPages}
        userName="Pradhima P M"
        appianLogoSrc="/images/icon-appian-header.png"
        highlightColor="#C7C4F4"
      />
      <main className="flex h-screen min-w-0 flex-1 flex-col overflow-hidden border-l border-gray-200 bg-gray-50">
        {content}
      </main>
    </div>
  )

  if (loadState === 'loading') {
    return renderShell(
      <div className="p-8">
        <HeadingField text="Loading rule..." size="MEDIUM" headingTag="H1" />
      </div>,
    )
  }

  if (loadState === 'missing' || !review || !rule) {
    return renderShell(
      <div className="p-8 max-w-xl">
        <HeadingField text="Rule not found" size="LARGE" headingTag="H1" marginBelow="LESS" />
        <RichTextDisplayField
          value={[<TextItem key="t" text="This rule doesn't exist or has been removed." color="SECONDARY" />]}
          marginBelow="STANDARD"
        />
        <ButtonWidget label="Back to Rules" style="OUTLINE" color="ACCENT" onClick={() => setLocation('/rules-review')} />
      </div>,
    )
  }

  if (done) {
    const counts = {
      Pending: queue.filter(r => r.status === 'Pending').length,
      Approved: queue.filter(r => r.status === 'Approved').length,
    }
    return renderShell(
      <div className="p-8 max-w-2xl">
        <CardLayout padding="MORE" showBorder={true} shape="SEMI_ROUNDED" style="#FFFFFF">
          <HeadingField
            text={pendingOnly ? 'All pending rules reviewed' : 'All rules reviewed'}
            size="LARGE"
            headingTag="H1"
            marginBelow="LESS"
          />
          <RichTextDisplayField
            value={[
              <TextItem
                key="t"
                text="There are no more pending rules in the library."
                color="SECONDARY"
              />,
            ]}
            marginBelow="STANDARD"
          />
          <div className="flex gap-3 mb-6">
            {(Object.keys(counts) as RuleApprovalStatus[]).map(status => (
              <TagField
                key={status}
                size="STANDARD"
                tags={[
                  {
                    text: `${counts[status]} ${status}`,
                    backgroundColor: statusTagColors[status].background,
                    textColor: statusTagColors[status].text,
                  },
                ]}
                marginBelow="NONE"
              />
            ))}
          </div>
          <ButtonWidget
            label="Back to Rules"
            style="SOLID"
            color="ACCENT"
            onClick={() => setLocation('/rules-review')}
          />
        </CardLayout>
      </div>,
    )
  }

  return renderShell(
    <>
      {/* Page header */}
      <div className="shrink-0 border-b border-gray-200 bg-white px-8 py-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-3">
              <HeadingField
                text="Review Rule"
                size="LARGE"
                headingTag="H1"
                fontWeight="REGULAR"
                marginBelow="NONE"
              />
              <TagField
                size="SMALL"
                tags={[
                  {
                    text: rule.status,
                    backgroundColor: statusTagColors[rule.status].background,
                    textColor: statusTagColors[rule.status].text,
                  },
                ]}
                marginBelow="NONE"
              />
            </div>
            <RichTextDisplayField
              value={[
                <TextItem
                  key="subtitle"
                  text="Review the rule and accept it to add to the library"
                  color="SECONDARY"
                  size="STANDARD"
                />,
              ]}
              marginBelow="NONE"
            />
          </div>

        </div>
      </div>



      {/* Two panes, each scrolling on its own */}
      <div className="flex min-h-0 flex-1">
        {/* Left pane: rule, conditions, included and excluded clauses — or the
            AI generation summary when the user clicks the banner link. */}
        <section aria-label="Rule" className="min-w-0 flex-[3] overflow-y-auto px-8 py-6">
          {viewingAiSummary ? (
            <>
              <div className="-ml-2 mb-2">
                <ButtonWidget
                  label="Back"
                  style="GHOST"
                  color="ACCENT"
                  size="SMALL"
                  icon="ArrowLeft"
                  iconPosition="START"
                  onClick={() => setViewingAiSummary(false)}
                />
              </div>
              <div className="rounded-md border border-gray-200 bg-white px-6 py-5">
                <HeadingField
                  text="AI Generation Summary"
                  size="MEDIUM_PLUS"
                  headingTag="H2"
                  fontWeight="SEMI_BOLD"
                  marginBelow="STANDARD"
                />

                {/* Input section — prescription text from each AI-included clause. */}
                <section className="mb-6">
                  <h3 className="mb-2 text-base font-semibold text-gray-900">Input</h3>
                  {aiIncludedClauses.length === 0 ? (
                    <p className="text-sm text-gray-700">
                      No prescription text available.
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {aiIncludedClauses.map(clause => (
                        <div
                          key={clause.id}
                          className="rounded-md border border-gray-200 bg-white px-4 py-3"
                        >
                          <p className="mb-2 text-sm">
                            <span className="mr-2 font-semibold text-gray-900">{clause.number}</span>
                            <span className="text-gray-700">{clause.title}</span>
                          </p>
                          <div className="text-sm leading-relaxed text-gray-800">
                            <TextBlock text={clause.prescription} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                {/* Output section */}
                <section>
                  <h3 className="mb-3 text-base font-semibold text-gray-900">Output</h3>

                  <p className="mb-2 text-sm font-medium text-gray-800">Rule Preview</p>
                  <ConditionsPreview content={review.aiOriginal} />

                  {review.aiOriginal.conditions
                    .concat(review.aiOriginal.groups.flatMap(g => g.conditions))
                    .some(c => !clauseDataTypes.includes(c.clauseData)) && (
                    <div className="mt-3 flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-900">
                      <AlertTriangle
                        size={14}
                        aria-hidden="true"
                        className="mt-0.5 shrink-0 text-amber-600"
                      />
                      <p>
                        One or more conditions use a clause data type that isn&apos;t in the system&apos;s
                        predefined list. Edit the rule to replace or remove them before approving.
                      </p>
                    </div>
                  )}

                  <div className="mt-5 flex items-center gap-2">
                    <p className="text-sm font-medium text-gray-800">Included Clauses</p>
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-700">
                      {aiIncludedClauses.length}
                    </span>
                  </div>
                  {aiIncludedClauses.length === 0 ? (
                    <div className="mt-2 flex items-start gap-2 rounded-md border border-blue-100 bg-blue-50 px-4 py-2 text-xs text-blue-900">
                      <Info size={14} aria-hidden="true" className="mt-0.5 shrink-0 text-blue-600" />
                      <p>No clauses included.</p>
                    </div>
                  ) : (
                    <ul className="mt-2 divide-y divide-gray-100 rounded-md border border-gray-200">
                      {aiIncludedClauses.map(clause => (
                        <li key={clause.id} className="px-4 py-2 text-sm">
                          <span className="font-semibold text-gray-900">{clause.number}</span>
                          <span className="ml-2 text-gray-700">{clause.title}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  <div className="mt-5 flex items-center gap-2">
                    <p className="text-sm font-medium text-gray-800">Excluded Clauses</p>
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-700">
                      {aiExcludedClauses.length}
                    </span>
                  </div>
                  {aiExcludedClauses.length === 0 ? (
                    <div className="mt-2 flex items-start gap-2 rounded-md border border-blue-100 bg-blue-50 px-4 py-2 text-xs text-blue-900">
                      <Info size={14} aria-hidden="true" className="mt-0.5 shrink-0 text-blue-600" />
                      <p>No clauses excluded.</p>
                    </div>
                  ) : (
                    <ul className="mt-2 divide-y divide-gray-100 rounded-md border border-gray-200">
                      {aiExcludedClauses.map(clause => (
                        <li key={clause.id} className="px-4 py-2 text-sm">
                          <span className="font-semibold text-gray-900">{clause.number}</span>
                          <span className="ml-2 text-gray-700">{clause.title}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              </div>
            </>
          ) : (
            <>
          <div className="rounded-md border border-gray-200 bg-white">
            {/* Rule header row: Name (read-only) on the left, Status (always editable) on the right. */}
            <div className="grid grid-cols-1 gap-x-6 gap-y-4 border-b border-gray-200 px-5 py-4 md:grid-cols-[2fr_1fr] md:items-start">
              <TextField
                label="Name"
                required={true}
                value={nameInput}
                saveInto={value => {
                  setNameInput(value)
                  setDirty(true)
                }}
                marginBelow="NONE"
              />
              <RadioButtonField
                label="Status"
                required={true}
                choiceLabels={['Active', 'Inactive']}
                choiceValues={['Active', 'Inactive']}
                value={activeStatusInput}
                saveInto={value => {
                  if (!value) return
                  setActiveStatusInput(value as RuleActiveStatus)
                  setDirty(true)
                }}
                choiceLayout="COMPACT"
                marginBelow="NONE"
              />
            </div>

            <div className="px-5 py-4">
              <div className="mb-4 flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <HeadingField
                    text="Conditions"
                    size="MEDIUM_PLUS"
                    headingTag="H3"
                    fontWeight="SEMI_BOLD"
                    marginBelow="EVEN_LESS"
                  />
                  <p className="text-xs text-gray-600">
                    {conditionsMode === 'EDIT'
                      ? "Ensure multiple conditions of the same clause data type aren't pointing to multiple different values"
                      : `${pluralize(conditionTotal, 'condition')} · ${pluralize(review.groups.length, 'group')}`}
                  </p>
                </div>
                <div className="shrink-0 inline-flex items-center gap-1 rounded-md bg-gray-100 p-1">
                  <ButtonWidget
                    label="EDIT"
                    style={conditionsMode === 'EDIT' ? 'OUTLINE' : 'GHOST'}
                    color={conditionsMode === 'EDIT' ? 'ACCENT' : 'STANDARD'}
                    size="SMALL"
                    icon="SquarePen"
                    iconPosition="START"
                    onClick={() => setConditionsMode('EDIT')}
                  />
                  <ButtonWidget
                    label="PREVIEW"
                    style={conditionsMode === 'PREVIEW' ? 'OUTLINE' : 'GHOST'}
                    color={conditionsMode === 'PREVIEW' ? 'ACCENT' : 'STANDARD'}
                    size="SMALL"
                    icon="ListChecks"
                    iconPosition="START"
                    onClick={() => setConditionsMode('PREVIEW')}
                  />
                </div>
              </div>

              {/* AI generation banner — links to a summary of how this rule was built by AI. */}
              <div className="mb-4 flex items-center gap-2 rounded-md border border-indigo-100 bg-indigo-50 px-4 py-2 text-sm text-gray-700">
                <Sparkles size={16} aria-hidden="true" className="shrink-0 text-indigo-600" />
                <p className="min-w-0">
                  Generated with AI Rule Builder. Refer to AI Summary for details.{' '}
                  <button
                    type="button"
                    onClick={() => setViewingAiSummary(true)}
                    className="font-semibold text-indigo-700 hover:underline focus:outline-none focus-visible:underline"
                  >
                    View AI Generation Summary.
                  </button>
                </p>
              </div>

              {conditionsMode === 'EDIT' ? (
                <ConditionsEditor
                  content={toContent(review)}
                  onChange={handleConditionsChange}
                />
              ) : (
                <>
                  {conditionTotal === 0 && (
                    <p className="text-sm text-gray-700">
                      This rule has no conditions, so it applies to every clause set.
                    </p>
                  )}

                  <div className="space-y-4">
                    {review.conditions.length > 0 && (
                      <div className="rounded-md border border-gray-200 bg-gray-50 p-4">
                        <ConditionStack conditions={review.conditions} join={review.join} />
                      </div>
                    )}

                    {review.groups.map((group, groupIndex) => (
                      <div key={group.id}>
                        {(review.conditions.length > 0 || groupIndex > 0) && (
                          <p className="pb-2 text-xs font-semibold text-gray-600">{review.join}</p>
                        )}
                        <div className="rounded-md border border-gray-200 bg-gray-50 p-4">
                          <p className="mb-3 text-xs text-gray-700">
                            Condition Group {groupIndex + 1}
                          </p>
                          <ConditionStack conditions={group.conditions} join={group.join} />
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Included and excluded clauses, one row each */}
          {[
            { label: 'Included Clauses', items: includedClauses },
            { label: 'Excluded Clauses', items: excludedClauses },
          ].map(group => (
            <div key={group.label} className="mt-6 overflow-hidden rounded-md border border-gray-200 bg-white">
              <div className="px-5 py-4">
                <HeadingField
                  text={group.label}
                  size="MEDIUM_PLUS"
                  headingTag="H3"
                  fontWeight="SEMI_BOLD"
                  marginBelow="NONE"
                />
              </div>
              <div className="border-t border-gray-200">
                {group.items.length === 0 && (
                  <div className="m-3 flex items-start gap-2 rounded-md border border-blue-100 bg-blue-50 px-4 py-2 text-xs text-blue-900">
                    <Info size={14} aria-hidden="true" className="mt-0.5 shrink-0 text-blue-600" />
                    <p>
                      No clauses {group.label === 'Included Clauses' ? 'included' : 'excluded'}.
                    </p>
                  </div>
                )}
                {group.items.map(clause => (
                  <ClauseRow
                    key={clause.id}
                    clause={clause}
                    onView={() => setViewingClauseId(clause.id)}
                  />
                ))}
              </div>
            </div>
          ))}
            </>
          )}
        </section>

        {/* Right pane: the selected clause */}
        <section
          aria-label="Clause details"
          className="min-w-0 flex-[2] overflow-y-auto border-l border-gray-200 bg-white px-6 py-6"
        >
          {selectedClause ? (
            <div className="space-y-4">
              <HeadingField
                text="Prescription Text"
                size="MEDIUM"
                headingTag="H2"
                fontWeight="SEMI_BOLD"
                marginBelow="NONE"
              />

              <div className="rounded-md border border-gray-200 bg-white px-4 py-3">
                <p className="mb-2 text-base">
                  <span className="mr-2 text-sm font-semibold text-gray-700">
                    {selectedClause.number}
                  </span>
                  <span className="text-lg font-semibold text-gray-900">
                    {selectedClause.title}
                  </span>
                </p>
                <div className="border-t border-gray-200 pt-3">
                  <TextBlock text={selectedClause.prescription} />
                </div>
              </div>
            </div>
          ) : (
            <MessageBanner
              primaryText="No clause selected"
              secondaryText={
                review.clauses.length === 0
                  ? 'This rule does not include or exclude any clauses.'
                  : 'Pick a clause from the list to review its text.'
              }
              backgroundColor="INFO"
              highlightColor="INFO"
              icon="info"
              showDecorativeBar={false}
              marginBelow="NONE"
            />
          )}
        </section>
      </div>

      {/* Footer actions — Cancel on the left discards edits and returns to the Rules list. */}
      <div className="flex shrink-0 items-center justify-between gap-4 border-t border-gray-200 bg-white px-8 py-3">
        <div className="flex items-center gap-4">
          <ButtonWidget
            label="Cancel"
            style="OUTLINE"
            color="ACCENT"
            onClick={goToList}
          />
        </div>
        <div className="flex items-center gap-3">
          <ButtonWidget
            label="Save"
            style="OUTLINE"
            color="ACCENT"
            disabled={busy || (rule.status === 'Approved' && !dirty)}
            onClick={handleSave}
          />
          <ButtonWidget
            label="Save and Approve"
            style="SOLID"
            color="ACCENT"
            disabled={busy || (rule.status === 'Approved' && !dirty)}
            onClick={handleSaveAndApprove}
          />
        </div>
      </div>

      {viewingClauseId !== null &&
        (() => {
          const clause = review.clauses.find(c => c.id === viewingClauseId)
          if (!clause) return null
          return (
            <DialogField
              open={true}
              onOpenChange={open => {
                if (!open) setViewingClauseId(null)
              }}
              title={`${clause.number} — ${clause.title}`}
              width="FIT"
              height="EXTRA_TALL"
              marginBelow="NONE"
            >
              <div className="dialog-size-60 flex h-full min-h-0 flex-col">
                <div className="min-h-0 flex-1 overflow-y-auto break-words pr-2 text-sm leading-relaxed text-gray-800">
                  <TextBlock text={clause.text} />
                </div>
                <div className="mt-4 flex shrink-0 justify-end border-t border-gray-200 pt-4">
                  <ButtonWidget
                    label="Close"
                    style="OUTLINE"
                    color="ACCENT"
                    onClick={() => setViewingClauseId(null)}
                  />
                </div>
              </div>
            </DialogField>
          )
        })()}

    </>,
  )
}

/** Review any rule, Pending or Approved. */
export default function RuleReviewPage() {
  return <RuleReviewScreen pendingOnly={false} />
}

/** Review only the rules that are still Pending, one after another. */
export function PendingRuleReviewPage() {
  return <RuleReviewScreen pendingOnly={true} />
}
