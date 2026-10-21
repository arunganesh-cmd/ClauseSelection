import { useState } from 'react'
import {
  DialogField,
  MessageBanner,
  HeadingField,
  TextField,
  DropdownField,
  ButtonWidget,
  ReadOnlyGrid,
  GridColumn,
} from '@pglevy/sailwind'
import { X as CloseIcon, Trash2 } from 'lucide-react'
import {
  createQuestion,
  updateQuestion,
  type Question,
  type QuestionResponseType,
} from '../db/questions'
import {
  getRulesUsingResponse,
  type RuleDependency,
} from '../db/question-dependencies'

const responseTypeChoices: QuestionResponseType[] = ['Radio Button', 'Dropdown']

/** Username recorded as the modifier when the prototype user saves a question. */
const CURRENT_USER = 'john.smith'

/** One row in the dependencies grid. */
interface DependencyRow {
  id: string
  /** Rule name, shown only on the first row of each rule's conditions. */
  ruleLabel: string
  condition: string
  operator: string
  value: string
}

/** Flatten the nested rule / conditions structure into one row per condition. */
function flattenDependencies(deps: RuleDependency[]): DependencyRow[] {
  const rows: DependencyRow[] = []
  for (const dep of deps) {
    dep.conditions.forEach((c, index) => {
      const left =
        c.clauseData === 'Questionnaire Question'
          ? c.question ?? ''
          : c.clauseData
      rows.push({
        id: `${dep.ruleId}-${c.id}`,
        ruleLabel: index === 0 ? dep.ruleName : '',
        condition: left,
        operator: c.operator,
        value: c.value,
      })
    })
  }
  return rows
}

interface UpdateQuestionDialogProps {
  /** The question to edit. Leave out to create a new Custom question. */
  question?: Question
  onClose: () => void
  onSaved: (saved: Question) => void
}

/**
 * Create / Update Question dialog.
 *
 * - New questions are Custom and Approved (they skip review), with everything editable.
 * - Custom questions are always fully editable.
 * - Standard (system) questions can only have their response edited while
 *   Pending. Approved and Rejected ones show a banner and lock the response.
 */
export default function UpdateQuestionDialog({ question, onClose, onSaved }: UpdateQuestionDialogProps) {
  const isNew = question === undefined
  const [text, setText] = useState(question?.question ?? '')
  const [responseType, setResponseType] = useState<QuestionResponseType>(question?.responseType ?? 'Radio Button')
  const [options, setOptions] = useState<string[]>(question?.responseOptions ?? ['', ''])

  // Dependencies side-pane state. `null` means closed.
  const [dependencyPane, setDependencyPane] = useState<
    | { option: string; loading: boolean; dependencies: RuleDependency[] }
    | null
  >(null)

  const isStandard = question?.source === 'Standard'
  const responseEditable = isNew || !isStandard || question.status === 'Pending'
  const optionsValid = !responseEditable || (options.length > 0 && options.every(o => o.trim() !== ''))
  const canSave = text.trim() !== '' && optionsValid

  const handleSave = async () => {
    if (!canSave) return
    const values = {
      question: text.trim(),
      responseType,
      responseOptions: options.map(o => o.trim()),
      lastModified: new Date().toISOString(),
      modifiedBy: CURRENT_USER,
    }
    const saved = isNew
      ? await createQuestion({ ...values, source: 'Custom', status: 'Approved' })
      : await updateQuestion(question.id, values)
    if (saved) onSaved(saved)
  }

  const openDependencies = async (option: string) => {
    const questionText = text.trim()
    const responseOption = option.trim()
    setDependencyPane({ option: responseOption, loading: true, dependencies: [] })
    const dependencies = await getRulesUsingResponse(questionText, responseOption)
    // Keep only the question-condition rows that reference the selected
    // response — regardless of operator. That way the pane shows the
    // Equals / Does not equal combinations each rule uses.
    const filtered = dependencies
      .map(dep => ({
        ...dep,
        conditions: dep.conditions.filter(
          c =>
            c.clauseData === 'Questionnaire Question' &&
            c.question === questionText &&
            c.value === responseOption,
        ),
      }))
      .filter(dep => dep.conditions.length > 0)
    setDependencyPane({ option: responseOption, loading: false, dependencies: filtered })
  }

  const closeDependencies = () => setDependencyPane(null)

  return (
    <DialogField
      open={true}
      onOpenChange={open => {
        if (!open) onClose()
      }}
      title={isNew ? 'New Question' : 'Update Question'}
      width="FIT"
      height="EXTRA_TALL"
      closeOnOutsideClick={false}
      marginBelow="NONE"
    >
      <div
        className="flex flex-col justify-between"
        style={{ minHeight: 'calc(85vh - 7rem)' }}
      >
        <div className="flex gap-6">
          {/* Main form */}
          <div className={dependencyPane ? 'flex-1 min-w-0' : 'w-full'}>
            {isStandard && question.status === 'Approved' && (
              <div className="mb-3">
                <MessageBanner
                  primaryText="This question has already been approved."
                  secondaryText="Its responses can't be edited."
                  backgroundColor="SUCCESS"
                  highlightColor="POSITIVE"
                  icon="success"
                  marginBelow="NONE"
                />
              </div>
            )}
            {isStandard && question.status === 'Rejected' && (
              <div className="mb-3">
                <MessageBanner
                  primaryText="This question has been rejected."
                  secondaryText="Its responses can't be edited."
                  backgroundColor="ERROR"
                  highlightColor="NEGATIVE"
                  icon="error"
                  marginBelow="NONE"
                />
              </div>
            )}

            {!isNew && (
              <div className="mb-4">
                <MessageBanner
                  primaryText="Edits to this question will be reflected on all questionnaire templates that reference it."
                  backgroundColor="WARN"
                  highlightColor="WARN"
                  icon="warning"
                  shape="SEMI_ROUNDED"
                  showDecorativeBar={false}
                  marginBelow="NONE"
                  className="[&_svg]:text-yellow-500"
                />
              </div>
            )}

            <HeadingField
              text="Question"
              size="MEDIUM"
              headingTag="H2"
              fontWeight="SEMI_BOLD"
              color="ACCENT"
              marginBelow="LESS"
            />
            <TextField
              label="Question Text"
              required={true}
              value={text}
              saveInto={setText}
              marginBelow="STANDARD"
            />

            <HeadingField
              text="Response"
              size="MEDIUM"
              headingTag="H2"
              fontWeight="SEMI_BOLD"
              color="ACCENT"
              marginBelow="LESS"
            />
            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-x-10 gap-y-4 max-w-5xl">
              <DropdownField
                label="Type"
                required={true}
                disabled={!responseEditable}
                choiceLabels={responseTypeChoices}
                choiceValues={responseTypeChoices}
                value={responseType}
                saveInto={value => value && setResponseType(value)}
                marginBelow="NONE"
              />

              <div>
                {/* Column headers for the response-options table.
                    Padding and gap mirror the row cards below so the header
                    labels line up with the inputs underneath. */}
                <div
                  className={`mb-2 grid items-center gap-3 px-3 ${
                    !isNew ? 'grid-cols-[1fr_auto_auto]' : 'grid-cols-[1fr_auto]'
                  }`}
                >
                  <HeadingField
                    text="Response Options"
                    size="SMALL"
                    headingTag="H3"
                    fontWeight="SEMI_BOLD"
                    marginBelow="NONE"
                  />
                  {!isNew && (
                    <div className="justify-self-start">
                      <HeadingField
                        text="Dependencies"
                        size="SMALL"
                        headingTag="H3"
                        fontWeight="SEMI_BOLD"
                        align="START"
                        marginBelow="NONE"
                      />
                    </div>
                  )}
                  <span aria-hidden="true" className="w-7" />
                </div>

                <div className="space-y-2">
                  {options.map((option, index) => (
                    <div
                      key={index}
                      className={`grid items-center gap-3 rounded-md bg-white px-3 py-2 shadow-sm ring-1 ring-gray-200 ${
                        !isNew
                          ? 'grid-cols-[1fr_auto_auto]'
                          : 'grid-cols-[1fr_auto]'
                      }`}
                    >
                      <TextField
                        label={`Response option ${index + 1}`}
                        labelPosition="COLLAPSED"
                        value={option}
                        disabled={!responseEditable}
                        saveInto={value =>
                          setOptions(prev => prev.map((o, i) => (i === index ? value : o)))
                        }
                        marginBelow="NONE"
                      />
                      {!isNew && (
                        <ButtonWidget
                          label="View Dependencies"
                          style="LINK"
                          color="ACCENT"
                          size="SMALL"
                          disabled={!option.trim()}
                          onClick={() => openDependencies(option)}
                        />
                      )}
                      {responseEditable ? (
                        <button
                          type="button"
                          onClick={() => setOptions(prev => prev.filter((_, i) => i !== index))}
                          disabled={options.length <= 1}
                          aria-label={`Remove response option ${index + 1}`}
                          title="Remove option"
                          style={{ color: '#6564F5' }}
                          className="shrink-0 rounded p-1 hover:bg-blue-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6564F5] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
                        >
                          <Trash2 size={18} aria-hidden="true" />
                        </button>
                      ) : (
                        <span aria-hidden="true" className="w-7" />
                      )}
                    </div>
                  ))}
                </div>
                {responseEditable && (
                  <div className="mt-3">
                    <ButtonWidget
                      label="ADD OPTION"
                      style="OUTLINE"
                      color="ACCENT"
                      size="SMALL"
                      icon="Plus"
                      iconPosition="START"
                      onClick={() => setOptions(prev => [...prev, ''])}
                    />
                  </div>
                )}
              </div>

              {!responseEditable && (
                <div className="lg:col-span-2">
                  <MessageBanner
                    primaryText="Responses cannot be edited"
                    secondaryText="Responses can only be edited while a question is pending."
                    backgroundColor="INFO"
                    highlightColor="INFO"
                    icon="info"
                    showDecorativeBar={false}
                    marginBelow="NONE"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Dependencies side pane */}
          {dependencyPane && (
            <aside
              aria-label="Response dependencies"
              className="w-[32rem] shrink-0 self-start rounded-md border border-gray-200 bg-gray-50"
            >
              <div className="flex items-start justify-between gap-3 border-b border-gray-200 px-5 py-4">
                <div className="min-w-0">
                  <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                    Dependencies for response
                  </p>
                  <p
                    className="mt-1 truncate text-base font-semibold text-gray-900"
                    title={dependencyPane.option}
                  >
                    {dependencyPane.option || '(empty)'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeDependencies}
                  aria-label="Close dependencies"
                  className="shrink-0 rounded p-1 text-gray-500 hover:bg-gray-200 hover:text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                  <CloseIcon size={16} aria-hidden="true" />
                </button>
              </div>
              <div className="max-h-[60vh] overflow-y-auto px-5 py-5">
                {dependencyPane.loading ? (
                  <p className="text-base text-gray-700">Loading dependencies...</p>
                ) : dependencyPane.dependencies.length === 0 ? (
                  <p className="text-base text-gray-700">
                    No rules currently reference this response.
                  </p>
                ) : (
                  <ReadOnlyGrid
                    data={flattenDependencies(dependencyPane.dependencies)}
                    spacing="DENSE"
                    borderStyle="LIGHT"
                    pageSize={50}
                  >
                    <GridColumn
                      label="Rule"
                      value={row => (
                        <span className="font-semibold text-gray-900">
                          {(row as DependencyRow).ruleLabel}
                        </span>
                      )}
                      width="MEDIUM"
                    />
                    <GridColumn
                      label="Condition"
                      value={row => {
                        const r = row as DependencyRow
                        return (
                          <span>
                            {r.condition}{' '}
                            <span className="text-gray-500">{r.operator}</span>{' '}
                            {r.value}
                          </span>
                        )
                      }}
                    />
                  </ReadOnlyGrid>
                )}
              </div>
            </aside>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-gray-200 pt-4 mt-8">
          <ButtonWidget label="CANCEL" style="OUTLINE" color="ACCENT" onClick={onClose} />
          <ButtonWidget
            label={isNew ? 'CREATE QUESTION' : 'UPDATE QUESTION'}
            style="SOLID"
            color="ACCENT"
            disabled={!canSave}
            onClick={handleSave}
          />
        </div>
      </div>
    </DialogField>
  )
}
