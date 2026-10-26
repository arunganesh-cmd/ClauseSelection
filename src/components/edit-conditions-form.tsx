import {
  HeadingField,
  RadioButtonField,
  DropdownField,
  ButtonWidget,
  TextField,
} from '@pglevy/sailwind'
import {
  clauseDataTypes,
  conditionOperators,
  questionnaires,
  createCondition,
  changeConditionClauseData,
  changeConditionQuestionnaire,
  changeConditionQuestion,
  getConditionValueOptions,
  getQuestionnaireQuestions,
  countConditions,
  type ClauseDataType,
  type ConditionJoin,
  type ConditionOperator,
  type RuleCondition,
  type RuleReviewContent,
} from '../db/rule-reviews'

export type EditConditionsMode = 'EDIT' | 'PREVIEW'

const joinLabels = ['All conditions (AND)', 'Any condition (OR)']
const joinValues: ConditionJoin[] = ['AND', 'OR']
const questionnaireNames = questionnaires.map(q => q.name)

/** Dropdown with a required label above. The built-in clear icon is hidden because every condition field needs a value. */
function Select({
  label,
  options,
  value,
  onChange,
}: {
  label: string
  options: string[]
  value: string | null
  onChange: (value: string) => void
}) {
  return (
    <div className="[&_.lucide-x]:hidden">
      <DropdownField
        label={label}
        required={true}
        placeholder={`Select ${label.toLowerCase()}`}
        choiceLabels={options}
        choiceValues={options}
        value={value}
        saveInto={next => next && onChange(next)}
        marginBelow="NONE"
      />
    </div>
  )
}

function MatchRadio({
  value,
  onChange,
}: {
  value: ConditionJoin
  onChange: (join: ConditionJoin) => void
}) {
  return (
    <RadioButtonField
      label="Match"
      required={true}
      choiceLabels={joinLabels}
      choiceValues={joinValues}
      value={value}
      saveInto={next => next && onChange(next as ConditionJoin)}
      choiceLayout="COMPACT"
      marginBelow="NONE"
    />
  )
}

function Separator({ join }: { join: ConditionJoin }) {
  return (
    <p className="my-4 text-xs font-semibold uppercase tracking-wide text-gray-600">{join}</p>
  )
}

const rowClass = 'grid grid-cols-[repeat(3,minmax(0,1fr))_2rem] items-start gap-x-4'

interface ConditionFieldsProps {
  condition: RuleCondition
  canRemove: boolean
  onChange: (next: RuleCondition) => void
  onRemove: () => void
}

function ConditionFields({ condition, canRemove, onChange, onRemove }: ConditionFieldsProps) {
  const isQuestion = condition.clauseData === 'Questionnaire Question'

  const clauseDataSelect = (
    <Select
      label="Clause Data"
      options={clauseDataTypes}
      value={condition.clauseData}
      onChange={value =>
        value !== condition.clauseData &&
        onChange(changeConditionClauseData(condition, value as ClauseDataType))
      }
    />
  )
  const operatorSelect = (
    <Select
      label="Operator"
      options={conditionOperators}
      value={condition.operator}
      onChange={value => onChange({ ...condition, operator: value as ConditionOperator })}
    />
  )
  const valueSelect = (
    <Select
      label="Value"
      options={getConditionValueOptions(condition)}
      value={condition.value}
      onChange={value => onChange({ ...condition, value })}
    />
  )
  const removeButton = (
    <div className="pt-7">
      <ButtonWidget
        style="GHOST"
        color="SECONDARY"
        size="SMALL"
        icon="X"
        tooltip="Remove condition"
        accessibilityText={`Remove condition ${condition.clauseData}`}
        disabled={!canRemove}
        onClick={onRemove}
      />
    </div>
  )

  if (!isQuestion) {
    return (
      <div className={rowClass}>
        {clauseDataSelect}
        {operatorSelect}
        {valueSelect}
        {removeButton}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className={rowClass}>{clauseDataSelect}</div>
      <div className={rowClass}>
        <Select
          label="Questionnaire"
          options={questionnaireNames}
          value={condition.questionnaire}
          onChange={value => onChange(changeConditionQuestionnaire(condition, value))}
        />
      </div>
      <div className={rowClass}>
        <Select
          label="Question"
          options={getQuestionnaireQuestions(condition.questionnaire)}
          value={condition.question}
          onChange={value => onChange(changeConditionQuestion(condition, value))}
        />
        {operatorSelect}
        {valueSelect}
        {removeButton}
      </div>
    </div>
  )
}

type RuleActiveStatus = 'Active' | 'Inactive'

const activeStatusLabels = ['Active', 'Inactive']
const activeStatusValues: RuleActiveStatus[] = ['Active', 'Inactive']

interface EditConditionsFormProps {
  name: string
  onNameChange: (name: string) => void
  activeStatus: RuleActiveStatus
  onActiveStatusChange: (status: RuleActiveStatus) => void
  content: RuleReviewContent
  onChange: (content: RuleReviewContent) => void
  mode?: EditConditionsMode
  onModeChange?: (mode: EditConditionsMode) => void
}

/** Read-only rendering of one condition for the Preview tab. */
function PreviewRow({ condition }: { condition: RuleCondition }) {
  const isQuestion = condition.clauseData === 'Questionnaire Question'
  return (
    <div className="rounded-md border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900">
      <p>
        <span className="font-medium">
          {isQuestion ? condition.question : condition.clauseData}
        </span>{' '}
        <span className="text-gray-600">{condition.operator}</span>{' '}
        <span>{condition.value}</span>
      </p>
      {isQuestion && (
        <p className="mt-0.5 text-xs text-gray-600">{condition.questionnaire}</p>
      )}
    </div>
  )
}

function PreviewStack({
  conditions,
  join,
}: {
  conditions: RuleCondition[]
  join: ConditionJoin
}) {
  return (
    <div>
      {conditions.map((condition, index) => (
        <div key={condition.id}>
          {index > 0 && (
            <p className="py-1 text-xs font-semibold uppercase tracking-wide text-gray-600">
              {join}
            </p>
          )}
          <PreviewRow condition={condition} />
        </div>
      ))}
    </div>
  )
}

/** Read-only preview of the conditions, used when the toggle is set to PREVIEW. */
export function ConditionsPreview({ content }: { content: RuleReviewContent }) {
  const total = countConditions(content)
  if (total === 0) {
    return (
      <div className="rounded-md border border-dashed border-gray-300 bg-gray-50 p-6 text-center text-sm text-gray-600">
        No conditions yet. Switch to Edit to add some.
      </div>
    )
  }
  return (
    <div className="space-y-4">
      {content.conditions.length > 0 && (
        <div className="rounded-md border border-gray-200 bg-gray-50 p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-600">
            Match: {content.join === 'AND' ? 'All conditions (AND)' : 'Any condition (OR)'}
          </p>
          <PreviewStack conditions={content.conditions} join={content.join} />
        </div>
      )}
      {content.groups.map((group, groupIndex) => (
        <div key={group.id}>
          {(content.conditions.length > 0 || groupIndex > 0) && (
            <p className="pb-2 text-xs font-semibold uppercase tracking-wide text-gray-600">
              {content.join}
            </p>
          )}
          <div className="rounded-md border border-gray-200 bg-gray-50 p-4">
            <p className="mb-2 text-xs text-gray-700">
              Condition Group {groupIndex + 1} ·{' '}
              {group.join === 'AND' ? 'All conditions (AND)' : 'Any condition (OR)'}
            </p>
            <PreviewStack conditions={group.conditions} join={group.join} />
          </div>
        </div>
      ))}
    </div>
  )
}

/**
 * Editable conditions block only (no Name/Status wrapper). Use this when the
 * surrounding page already owns the rule header and only needs the conditions
 * portion to toggle between edit/preview inline.
 */
export function ConditionsEditor({
  content,
  onChange,
}: {
  content: RuleReviewContent
  onChange: (content: RuleReviewContent) => void
}) {
  const total = countConditions(content)

  const nextId = () =>
    Math.max(
      0,
      ...content.conditions.map(c => c.id),
      ...content.groups.flatMap(g => g.conditions.map(c => c.id)),
    ) + 1

  const mapList = (
    groupId: number | null,
    fn: (list: RuleCondition[]) => RuleCondition[],
  ) => {
    if (groupId === null) {
      onChange({ ...content, conditions: fn(content.conditions) })
    } else {
      onChange({
        ...content,
        groups: content.groups
          .map(g => (g.id === groupId ? { ...g, conditions: fn(g.conditions) } : g))
          .filter(g => g.conditions.length > 0),
      })
    }
  }

  const change = (groupId: number | null, next: RuleCondition) =>
    mapList(groupId, list => list.map(c => (c.id === next.id ? next : c)))
  const remove = (groupId: number | null, id: number) =>
    mapList(groupId, list => list.filter(c => c.id !== id))
  const add = (groupId: number | null) =>
    mapList(groupId, list => [...list, createCondition(nextId(), 'Contract Category')])

  const renderConditions = (
    groupId: number | null,
    list: RuleCondition[],
    join: ConditionJoin,
  ) =>
    list.map((condition, index) => (
      <div key={condition.id}>
        {index > 0 && <Separator join={join} />}
        <ConditionFields
          condition={condition}
          canRemove={total > 1}
          onChange={next => change(groupId, next)}
          onRemove={() => remove(groupId, condition.id)}
        />
      </div>
    ))

  const addButton = (groupId: number | null) => (
    <ButtonWidget
      label="Add Condition"
      style="LINK"
      color="ACCENT"
      size="SMALL"
      icon="CirclePlus"
      iconPosition="START"
      onClick={() => add(groupId)}
    />
  )

  return (
    <div className="rounded-md border border-gray-200 bg-gray-50 p-5">
      <MatchRadio value={content.join} onChange={join => onChange({ ...content, join })} />
      <hr className="my-5 border-gray-200" />

      {renderConditions(null, content.conditions, content.join)}

      {content.groups.map((group, groupIndex) => (
        <div key={group.id}>
          {(content.conditions.length > 0 || groupIndex > 0) && (
            <Separator join={content.join} />
          )}
          <div className="rounded-md border border-gray-300 bg-white p-4">
            <div className="mb-3 flex items-center justify-between">
              <HeadingField
                text={`Condition Group ${groupIndex + 1}`}
                size="SMALL"
                headingTag="H4"
                fontWeight="SEMI_BOLD"
                marginBelow="NONE"
              />
              <span className="text-xs text-gray-600">
                {group.conditions.length} condition
                {group.conditions.length === 1 ? '' : 's'} · {group.join}
              </span>
            </div>
            <MatchRadio
              value={group.join}
              onChange={join =>
                onChange({
                  ...content,
                  groups: content.groups.map(g => (g.id === group.id ? { ...g, join } : g)),
                })
              }
            />
            <hr className="my-4 border-gray-200" />
            {renderConditions(group.id, group.conditions, group.join)}
            <div className="mt-4">{addButton(group.id)}</div>
          </div>
        </div>
      ))}

      <div className="mt-5">{addButton(null)}</div>
    </div>
  )
}

/**
 * Inline edit form for a rule's name, status, and conditions. Mirrors the
 * Appian rule editor layout: Name + Status on one row, then a Match choice,
 * then one block per condition with labeled, required fields and AND/OR
 * between them.
 *
 * Changes bubble up to the parent as they happen. The parent persists them
 * through the regular page footer (Save Draft / Accept).
 */
export default function EditConditionsForm({
  name,
  onNameChange,
  activeStatus,
  onActiveStatusChange,
  content,
  onChange,
  mode = 'EDIT',
  onModeChange,
}: EditConditionsFormProps) {
  const isPreview = mode === 'PREVIEW'

  return (
    <div className="space-y-6 px-5 py-5">
      {/* Name on the left, Status radio on the right. Matches the Appian "Edit Rule" layout. */}
      <div className="grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-[2fr_1fr] md:items-start">
        <TextField
          label="Name"
          required={true}
          value={name}
          saveInto={onNameChange}
          marginBelow="NONE"
        />
        <RadioButtonField
          label="Status"
          required={true}
          choiceLabels={activeStatusLabels}
          choiceValues={activeStatusValues}
          value={activeStatus}
          saveInto={next => next && onActiveStatusChange(next as RuleActiveStatus)}
          choiceLayout="COMPACT"
          marginBelow="NONE"
        />
      </div>

      <div>
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <HeadingField
              text="Conditions"
              size="MEDIUM_PLUS"
              headingTag="H3"
              fontWeight="SEMI_BOLD"
              marginBelow="EVEN_LESS"
            />
            <p className="text-xs text-gray-600">
              Ensure multiple conditions of the same clause data type aren&apos;t pointing to
              multiple different values
            </p>
          </div>
          {onModeChange && (
            <div className="shrink-0 inline-flex items-center gap-1 rounded-md bg-gray-100 p-1">
              <ButtonWidget
                label="EDIT"
                style={isPreview ? 'GHOST' : 'OUTLINE'}
                color={isPreview ? 'STANDARD' : 'ACCENT'}
                size="SMALL"
                icon="SquarePen"
                iconPosition="START"
                onClick={() => onModeChange('EDIT')}
              />
              <ButtonWidget
                label="PREVIEW"
                style={isPreview ? 'OUTLINE' : 'GHOST'}
                color={isPreview ? 'ACCENT' : 'STANDARD'}
                size="SMALL"
                icon="ListChecks"
                iconPosition="START"
                onClick={() => onModeChange('PREVIEW')}
              />
            </div>
          )}
        </div>

        {isPreview ? (
          <ConditionsPreview content={content} />
        ) : (
          <ConditionsEditor content={content} onChange={onChange} />
        )}
      </div>
    </div>
  )
}
