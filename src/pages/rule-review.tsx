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
} from '@pglevy/sailwind'
import {
  LayoutGrid,
  List,
  Layers,
  CircleHelp,
  Shuffle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import EditConditionsForm from '../components/edit-conditions-form'
import {
  getReviewQueue,
  getRuleReview,
  saveRuleReviewDraft,
  acceptRuleReview,
  rejectRuleReview,
  countConditions,
  type RuleReview,
  type RuleReviewContent,
  type RuleCondition,
  type ConditionJoin,
  type ReviewClause,
} from '../db/rule-reviews'
import { updateRuleApproval, type RuleApproval, type RuleApprovalStatus } from '../db/rule-approvals'

const navPages = [
  { label: 'Clause Sets', icon: LayoutGrid },
  { label: 'Clauses', icon: List },
  { label: 'Templates', icon: Layers },
  { label: 'Questionnaires', icon: CircleHelp },
  { label: 'Rules', icon: Shuffle, isSelected: true },
]

const statusTagColors: Record<RuleApprovalStatus, { background: string; text: string }> = {
  Accepted: { background: '#D7F3E0', text: '#166534' },
  Rejected: { background: '#FDE2E2', text: '#991B1B' },
  Pending: { background: '#DBEAFE', text: '#1E40AF' },
}

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

/**
 * A clause-detail card the reviewer can collapse. Both cards on the right pane
 * start collapsed so the pane stays short, and either one opens on click.
 */
function CollapsibleCard({
  title,
  children,
  defaultOpen = false,
}: {
  title: string
  children: ReactNode
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="rounded-md border border-gray-200 bg-white">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen(prev => !prev)}
        className="flex w-full items-center justify-between gap-3 rounded-md px-4 py-3 text-left hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
      >
        <span className="text-sm font-semibold text-gray-900">{title}</span>
        {open ? (
          <ChevronUp size={16} aria-hidden="true" className="text-gray-600" />
        ) : (
          <ChevronDown size={16} aria-hidden="true" className="text-gray-600" />
        )}
      </button>
      {open && <div className="border-t border-gray-200 px-4 py-3">{children}</div>}
    </div>
  )
}

/** A read-only row in the clause lists with a trailing "View" link. */
function ClauseRow({ clause, onView }: { clause: ReviewClause; onView: () => void }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-gray-100 px-4 py-3 last:border-b-0">
      <div className="min-w-0">
        <span className="block text-sm font-semibold text-gray-900">{clause.number}</span>
        <span className="mt-0.5 line-clamp-2 block text-sm text-gray-600">{clause.title}</span>
      </div>
      <button
        type="button"
        onClick={onView}
        aria-label={`View ${clause.number}`}
        className="shrink-0 text-sm font-medium text-blue-700 hover:underline focus:outline-none focus-visible:underline"
      >
        View
      </button>
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
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  // Draft state used only while the Edit Rule dialog is open.
  const [draftContent, setDraftContent] = useState<RuleReviewContent | null>(null)
  const [draftName, setDraftName] = useState('')
  const [editStep, setEditStep] = useState<0 | 1 | 2>(0)
  const [confirmingReject, setConfirmingReject] = useState(false)
  const [confirmingDecisionChange, setConfirmingDecisionChange] = useState(false)
  const [selectedClauseId, setSelectedClauseId] = useState<number | null>(null)
  const [viewingClauseId, setViewingClauseId] = useState<number | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoadState('loading')
    setDone(false)
    setEditDialogOpen(false)
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
  const selectedClause = review?.clauses.find(c => c.id === selectedClauseId) ?? null

  const conditionTotal = review ? countConditions(review) : 0

  const toContent = (r: RuleReview): RuleReviewContent => ({
    join: r.join,
    conditions: r.conditions,
    groups: r.groups,
  })

  /* --------------------------------- actions --------------------------------- */

  /** Open the Edit Rule wizard with a fresh draft seeded from the current review. */
  const openEditDialog = () => {
    if (!review || !rule) return
    setDraftContent(toContent(review))
    setDraftName(rule.name)
    setEditStep(0)
    setEditDialogOpen(true)
  }

  const closeEditDialog = () => {
    setEditDialogOpen(false)
    setDraftContent(null)
    setEditStep(0)
  }

  /** Save the dialog draft to the data layer and return to the Rules list. */
  const handleSaveEdit = async () => {
    if (!review || !rule || !draftContent) return
    setBusy(true)
    if (draftName !== rule.name) {
      await updateRuleApproval(ruleId, { name: draftName })
    }
    await saveRuleReviewDraft(ruleId, draftContent)
    setBusy(false)
    closeEditDialog()
    setLocation('/rules-review')
  }

  const handleDecision = async (decision: 'accept' | 'reject') => {
    if (!review) return
    setBusy(true)
    const content = toContent(review)
    if (decision === 'accept') await acceptRuleReview(ruleId, content)
    else await rejectRuleReview(ruleId, content)
    setBusy(false)
    // Return to the Rules list; the reviewer picks the next rule to open.
    setLocation('/rules-review')
  }

  /**
   * Flip an Accepted rule to Rejected (or vice versa). Called from the top-bar
   * Change Decision button after the reviewer confirms.
   */
  const handleChangeDecision = async () => {
    if (!review || !rule || rule.status === 'Pending') return
    setBusy(true)
    const content = toContent(review)
    if (rule.status === 'Accepted') {
      await rejectRuleReview(ruleId, content)
    } else {
      await acceptRuleReview(ruleId, content)
    }
    // Refresh queue so the status tag reflects the new decision.
    setQueue(await getReviewQueue())
    setBusy(false)
    setConfirmingDecisionChange(false)
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
      Accepted: queue.filter(r => r.status === 'Accepted').length,
      Rejected: queue.filter(r => r.status === 'Rejected').length,
      Pending: queue.filter(r => r.status === 'Pending').length,
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
          {rule.status !== 'Pending' && (
            <div className="shrink-0 flex items-center gap-2 pt-1">
              <ButtonWidget
                label="Edit Rule"
                style="OUTLINE"
                color="ACCENT"
                icon="Pencil"
                iconPosition="START"
                onClick={openEditDialog}
              />
              <ButtonWidget
                label="Change Decision"
                style="OUTLINE"
                color="ACCENT"
                icon="RefreshCw"
                iconPosition="START"
                onClick={() => setConfirmingDecisionChange(true)}
              />
            </div>
          )}
        </div>
      </div>

      {/* Back link spans the full width above both panes */}
      <div className="shrink-0 border-b border-gray-200 bg-gray-50 px-6 py-2">
        <ButtonWidget
          label="Back to Rules"
          style="LINK"
          color="ACCENT"
          size="SMALL"
          icon="ChevronLeft"
          iconPosition="START"
          onClick={() => setLocation('/rules-review')}
        />
      </div>

      {/* Two panes, each scrolling on its own */}
      <div className="flex min-h-0 flex-1">
        {/* Left pane: rule, conditions, included and excluded clauses */}
        <section aria-label="Rule" className="min-w-0 flex-[3] overflow-y-auto px-8 py-4">
          <div className="rounded-md border border-gray-200 bg-white">
            <div className="flex items-start justify-between gap-4 border-b border-gray-200 px-5 py-4">
              <div className="min-w-0">
                <HeadingField
                  text={rule.name}
                  size="MEDIUM_PLUS"
                  headingTag="H2"
                  fontWeight="SEMI_BOLD"
                  marginBelow="EVEN_LESS"
                />
                <p className="text-sm text-gray-600">
                  {pluralize(conditionTotal, 'condition')} ·{' '}
                  {pluralize(review.groups.length, 'group')}
                </p>
              </div>
              {rule.status === 'Pending' && (
                <div className="shrink-0">
                  <ButtonWidget
                    label="Edit Rule"
                    style="OUTLINE"
                    color="ACCENT"
                    icon="Pencil"
                    iconPosition="START"
                    size="SMALL"
                    onClick={openEditDialog}
                  />
                </div>
              )}
            </div>

            <div className="px-5 py-4">
              <HeadingField
                text="Conditions"
                size="MEDIUM_PLUS"
                headingTag="H3"
                fontWeight="SEMI_BOLD"
                marginBelow="EVEN_LESS"
              />
              <p className="mb-4 text-xs text-gray-600">
                Clause set data that triggers this rule
              </p>

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
                  text={`${group.label} (${group.items.length})`}
                  size="MEDIUM_PLUS"
                  headingTag="H3"
                  fontWeight="SEMI_BOLD"
                  marginBelow="NONE"
                />
              </div>
              <div className="border-t border-gray-200">
                {group.items.length === 0 && (
                  <p className="px-5 py-4 text-sm text-gray-600">
                    No {group.label.toLowerCase()} in this rule.
                  </p>
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
        </section>

        {/* Right pane: the selected clause */}
        <section
          aria-label="Clause details"
          className="min-w-0 flex-[2] overflow-y-auto border-l border-gray-200 bg-white px-6 py-6"
        >
          {selectedClause ? (
            <div className="space-y-4">
              <HeadingField
                text={`${selectedClause.number} ${selectedClause.title}`}
                size="MEDIUM"
                headingTag="H2"
                fontWeight="SEMI_BOLD"
                marginBelow="NONE"
              />

              <CollapsibleCard
                key={`${selectedClause.id}-clauses`}
                title={`Clauses Involved (${includedClauses.length})`}
                defaultOpen={false}
              >
                <ul className="list-disc space-y-1.5 pl-5 text-sm text-gray-800">
                  {includedClauses.map(clause => (
                    <li key={clause.id}>
                      <span className="font-medium">{clause.number}</span>
                      <span className="text-gray-600"> | {clause.title}</span>
                    </li>
                  ))}
                </ul>
              </CollapsibleCard>

              <div className="rounded-md border border-gray-200 bg-white px-4 py-3">
                <p className="text-sm font-semibold text-gray-900">Prescription Text</p>
                <div className="mt-3 border-t border-gray-200 pt-3">
                  <p className="mb-2 text-base">
                    <span className="mr-2 text-sm font-semibold text-gray-700">
                      {selectedClause.number}
                    </span>
                    <span className="text-lg font-semibold text-gray-900">
                      {selectedClause.title}
                    </span>
                  </p>
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

      {/* Footer actions — Pending rules get Cancel / Reject / Accept. */}
      {rule.status === 'Pending' && (
        <div className="flex shrink-0 items-center justify-between gap-4 border-t border-gray-200 bg-white px-8 py-3">
          <ButtonWidget
            label="Cancel"
            style="OUTLINE"
            color="SECONDARY"
            disabled={busy}
            onClick={() => setLocation('/rules-review')}
          />
          <div className="flex items-center gap-3">
            <ButtonWidget
              label="Reject"
              style="OUTLINE"
              color="NEGATIVE"
              disabled={busy}
              onClick={() => setConfirmingReject(true)}
            />
            <ButtonWidget
              label="Accept"
              style="SOLID"
              color="ACCENT"
              disabled={busy}
              onClick={() => handleDecision('accept')}
            />
          </div>
        </div>
      )}

      {confirmingReject && (
        <DialogField
          open={true}
          onOpenChange={open => {
            if (!open) setConfirmingReject(false)
          }}
          title="Reject this rule?"
          width="MEDIUM"
          height="FIT"
          closeOnOutsideClick={false}
          marginBelow="NONE"
        >
          <p className="text-base text-gray-700">
            Once rejected, this rule can&apos;t be edited or reviewed again.
          </p>
          <div className="mt-6 flex justify-end gap-3">
            <ButtonWidget
              label="CANCEL"
              style="OUTLINE"
              color="ACCENT"
              onClick={() => setConfirmingReject(false)}
            />
            <ButtonWidget
              label="REJECT RULE"
              style="SOLID"
              color="NEGATIVE"
              disabled={busy}
              onClick={async () => {
                setConfirmingReject(false)
                await handleDecision('reject')
              }}
            />
          </div>
        </DialogField>
      )}

      {confirmingDecisionChange && rule.status !== 'Pending' && (
        <DialogField
          open={true}
          onOpenChange={open => {
            if (!open) setConfirmingDecisionChange(false)
          }}
          title="Change decision?"
          width="MEDIUM"
          height="FIT"
          closeOnOutsideClick={false}
          marginBelow="NONE"
        >
          <p className="text-sm text-gray-600">
            This rule was previously {rule.status.toLowerCase()}. Would you like to{' '}
            {rule.status === 'Accepted' ? 'reject' : 'accept'} it instead?
          </p>
          <hr className="-mx-6 mt-6 border-gray-200" />
          <div className="mt-4 flex items-center justify-between gap-3">
            <ButtonWidget
              label="CANCEL"
              style="OUTLINE"
              color="ACCENT"
              onClick={() => setConfirmingDecisionChange(false)}
            />
            <ButtonWidget
              label={rule.status === 'Accepted' ? 'REJECT' : 'ACCEPT'}
              style="SOLID"
              color={rule.status === 'Accepted' ? 'NEGATIVE' : 'ACCENT'}
              disabled={busy}
              onClick={handleChangeDecision}
            />
          </div>
        </DialogField>
      )}

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

      {editDialogOpen && draftContent && (
        <EditRuleDialog
          step={editStep}
          onStepChange={setEditStep}
          name={draftName}
          onNameChange={setDraftName}
          content={draftContent}
          onContentChange={setDraftContent}
          clauses={review.clauses}
          busy={busy}
          onCancel={closeEditDialog}
          onSave={handleSaveEdit}
        />
      )}
    </>,
  )
}

/* -------------------------------------------------------------------------- */
/* Edit Rule wizard dialog                                                    */
/* -------------------------------------------------------------------------- */

const editSteps = ['Create Rule', 'Include Clauses', 'Exclude Clauses'] as const

interface EditRuleDialogProps {
  step: 0 | 1 | 2
  onStepChange: (step: 0 | 1 | 2) => void
  name: string
  onNameChange: (name: string) => void
  content: RuleReviewContent
  onContentChange: (content: RuleReviewContent) => void
  clauses: ReviewClause[]
  busy: boolean
  onCancel: () => void
  onSave: () => void
}

function EditRuleDialog({
  step,
  onStepChange,
  name,
  onNameChange,
  content,
  onContentChange,
  clauses,
  busy,
  onCancel,
  onSave,
}: EditRuleDialogProps) {
  const included = clauses.filter(c => c.outcome === 'Included')
  const excluded = clauses.filter(c => c.outcome === 'Excluded')

  const next = () => {
    if (step < 2) onStepChange((step + 1) as 0 | 1 | 2)
    else onSave()
  }
  const back = () => {
    if (step > 0) onStepChange((step - 1) as 0 | 1 | 2)
  }

  return (
    <DialogField
      open={true}
      onOpenChange={open => {
        if (!open) onCancel()
      }}
      title="Edit Rule"
      description="Required fields are marked with an asterisk (*)"
      width="FIT"
      height="EXTRA_TALL"
      closeOnOutsideClick={false}
      marginBelow="NONE"
    >
      <div
        className="flex w-full flex-col"
        style={{ height: 'calc(85vh - 7rem)' }}
      >
        {/* Stepper */}
        <div className="shrink-0 pb-6">
          <ol className="relative flex items-center justify-between">
            <div className="absolute left-0 right-0 top-3 h-0.5 bg-gray-200" aria-hidden="true" />
            {editSteps.map((label, idx) => {
              const active = idx === step
              const complete = idx < step
              return (
                <li key={label} className="relative z-10 flex flex-col items-center">
                  <span
                    className={`flex h-6 w-6 items-center justify-center rounded-full border-2 text-xs font-semibold ${
                      active
                        ? 'border-blue-700 bg-white text-blue-700'
                        : complete
                          ? 'border-blue-700 bg-blue-700 text-white'
                          : 'border-gray-300 bg-white text-gray-500'
                    }`}
                  >
                    {idx + 1}
                  </span>
                  <span
                    className={`mt-2 text-xs ${
                      active ? 'font-semibold text-gray-900' : 'text-gray-600'
                    }`}
                  >
                    {label}
                  </span>
                </li>
              )
            })}
          </ol>
        </div>

        {/* Step body */}
        <div className="min-h-0 flex-1 overflow-y-auto">
          {step === 0 && (
            <EditConditionsForm
              name={name}
              onNameChange={onNameChange}
              content={content}
              onChange={onContentChange}
            />
          )}
          {step === 1 && (
            <ClauseListStep
              title="Included Clauses"
              description="These clauses are added when the rule conditions are met."
              clauses={included}
            />
          )}
          {step === 2 && (
            <ClauseListStep
              title="Excluded Clauses"
              description="These clauses are removed when the rule conditions are met."
              clauses={excluded}
            />
          )}
        </div>

        {/* Footer */}
        <div className="mt-4 flex shrink-0 items-center justify-between border-t border-gray-200 pt-4">
          <ButtonWidget
            label="CANCEL"
            style="LINK"
            color="ACCENT"
            disabled={busy}
            onClick={onCancel}
          />
          <div className="flex items-center gap-3">
            {step > 0 && (
              <ButtonWidget
                label="BACK"
                style="OUTLINE"
                color="ACCENT"
                disabled={busy}
                onClick={back}
              />
            )}
            <ButtonWidget
              label={step === 2 ? 'SAVE' : 'NEXT'}
              style="SOLID"
              color="ACCENT"
              disabled={busy}
              onClick={next}
            />
          </div>
        </div>
      </div>
    </DialogField>
  )
}

/** Read-only clause list used for the Include / Exclude Clauses steps. */
function ClauseListStep({
  title,
  description,
  clauses,
}: {
  title: string
  description: string
  clauses: ReviewClause[]
}) {
  return (
    <div className="px-5 py-2">
      <HeadingField
        text={`${title} (${clauses.length})`}
        size="MEDIUM_PLUS"
        headingTag="H3"
        fontWeight="SEMI_BOLD"
        marginBelow="EVEN_LESS"
      />
      <p className="mb-4 text-xs text-gray-600">{description}</p>
      {clauses.length === 0 ? (
        <p className="rounded-md border border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-center text-sm text-gray-600">
          No clauses in this list.
        </p>
      ) : (
        <div className="overflow-hidden rounded-md border border-gray-200">
          {clauses.map((clause, idx) => (
            <div
              key={clause.id}
              className={`flex items-start gap-3 px-4 py-3 ${
                idx > 0 ? 'border-t border-gray-100' : ''
              }`}
            >
              <span className="shrink-0 text-sm font-semibold text-gray-900">{clause.number}</span>
              <span className="text-sm text-gray-700">{clause.title}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/** Review any rule. Accepted and Rejected rules open with the Change Decision top bar. */
export default function RuleReviewPage() {
  return <RuleReviewScreen pendingOnly={false} />
}

/** Review only the rules that are still Pending, one after another. */
export function PendingRuleReviewPage() {
  return <RuleReviewScreen pendingOnly={true} />
}
