import { useState, useEffect, useMemo, useRef } from 'react'
import {
  ReadOnlyGrid,
  GridColumn,
  ButtonWidget,
  TextField,
  DropdownField,
  RichTextDisplayField,
  TextItem,
  MessageBanner,
  TabsField,
} from '@pglevy/sailwind'
import QuestionsShell from '../components/questions-shell'
import UpdateQuestionDialog from '../components/update-question-dialog'
import { EXCEL_ACCEPT, isExcelFile } from '../lib/excel-file'
import {
  getApprovedQuestions,
  importCustomQuestions,
  formatQuestionTimestamp,
  type Question,
  type QuestionResponseType,
} from '../db/questions'
import { getDisplayName } from '../db/users'

/** Username recorded as the importer in this prototype. */
const CURRENT_USER = 'john.smith'

const responseTypeChoices: QuestionResponseType[] = ['Radio Button', 'Dropdown']

export default function Questions() {
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [searchInput, setSearchInput] = useState('')
  const [appliedSearch, setAppliedSearch] = useState('')
  const [responseTypeFilter, setResponseTypeFilter] = useState<string | null>(null)
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null)
  const [creating, setCreating] = useState(false)
  const [importMessage, setImportMessage] = useState<string | null>(null)
  const [fileError, setFileError] = useState(false)
  const [view, setView] = useState<'option1' | 'option2'>('option1')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const loadData = async () => {
    const approved = await getApprovedQuestions()
    setQuestions(approved)
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    // Reset so choosing the same file again still fires onChange.
    event.target.value = ''
    if (!file) return
    if (!isExcelFile(file)) {
      setImportMessage(null)
      setFileError(true)
      return
    }
    setFileError(false)
    const created = await importCustomQuestions(file.name, CURRENT_USER)
    setImportMessage(`${created.length} questions imported from ${file.name}.`)
    await loadData()
  }

  const filteredQuestions = useMemo(() => {
    const term = appliedSearch.trim().toLowerCase()
    return questions.filter(q => {
      const matchesSearch = term === '' || q.question.toLowerCase().includes(term)
      const matchesType = responseTypeFilter === null || q.responseType === responseTypeFilter
      return matchesSearch && matchesType
    })
  }, [questions, appliedSearch, responseTypeFilter])

  const handleRefresh = async () => {
    setSearchInput('')
    setAppliedSearch('')
    setResponseTypeFilter(null)
    await loadData()
  }

  return (
    <QuestionsShell>
      <div className="px-8 py-6">
        {fileError && (
          <div className="mb-4">
            <MessageBanner
              primaryText="File must be an Excel file (.xlsx or .xls)."
              secondaryText="Choose a different file and try again."
              backgroundColor="ERROR"
              highlightColor="NEGATIVE"
              icon="error"
              announceBehavior="DISPLAY_AND_ANNOUNCE"
              showCloseButton={true}
              onClose={() => setFileError(false)}
              marginBelow="NONE"
            />
          </div>
        )}

        {importMessage && (
          <div className="mb-4">
            <MessageBanner
              primaryText={importMessage}
              secondaryText="They were added as custom questions."
              backgroundColor="SUCCESS"
              highlightColor="POSITIVE"
              icon="success"
              showCloseButton={true}
              onClose={() => setImportMessage(null)}
              marginBelow="NONE"
            />
          </div>
        )}

        <div className="flex items-center gap-3 mb-4 flex-nowrap">
          <div className="w-72 shrink-0">
            <TextField
              label="Search for a question by keyword"
              labelPosition="COLLAPSED"
              placeholder="Search for a question by keyword"
              value={searchInput}
              saveInto={setSearchInput}
              marginBelow="NONE"
            />
          </div>

          <ButtonWidget
            label="SEARCH"
            style="OUTLINE"
            color="ACCENT"
            onClick={() => setAppliedSearch(searchInput)}
          />

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs uppercase tracking-wide text-gray-500">Response type</span>
            <div className="w-56 shrink-0">
              <DropdownField
                label="Response type"
                labelPosition="COLLAPSED"
                placeholder="Any"
                choiceLabels={responseTypeChoices}
                choiceValues={responseTypeChoices}
                value={responseTypeFilter}
                saveInto={value => setResponseTypeFilter(value ?? null)}
                marginBelow="NONE"
              />
            </div>
          </div>

          <div className="ml-auto flex items-center gap-2 shrink-0">
            <ButtonWidget
              style="OUTLINE"
              color="SECONDARY"
              icon="Filter"
              tooltip="Filter"
              accessibilityText="Filter"
              onClick={() => alert('Filter is not wired up in this prototype.')}
            />
            <ButtonWidget
              style="OUTLINE"
              color="SECONDARY"
              icon="RefreshCw"
              tooltip="Refresh"
              accessibilityText="Refresh"
              onClick={handleRefresh}
            />
          </div>
        </div>

        <div className="flex items-center gap-2 mb-4">
          <ButtonWidget
            label="NEW QUESTION"
            style="OUTLINE"
            color="SECONDARY"
            size="SMALL"
            icon="Plus"
            iconPosition="START"
            onClick={() => setCreating(true)}
          />
          <ButtonWidget
            label="IMPORT QUESTIONS"
            style="OUTLINE"
            color="SECONDARY"
            size="SMALL"
            icon="Upload"
            iconPosition="START"
            onClick={() => fileInputRef.current?.click()}
          />
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept={EXCEL_ACCEPT}
          onChange={handleFileChange}
          className="hidden"
          aria-label="Import questions from an Excel file"
          tabIndex={-1}
        />

        <div className="mb-4">
          <TabsField
            tabs={[
              { value: 'option1', label: 'Option 1' },
              { value: 'option2', label: 'Option 2' },
            ]}
            value={view}
            onValueChange={v => setView(v as 'option1' | 'option2')}
            variant="UNDERLINE"
            navigationOnly={true}
            marginBelow="NONE"
          />
        </div>

        <ReadOnlyGrid
          data={filteredQuestions}
          pageSize={20}
          pagingControls="ROW_COUNT"
          borderStyle="LIGHT"
          rowHeader={0}
          initialSorts={[{ field: 'lastModified', ascending: false }]}
          emptyGridMessage={loading
              ? 'Loading questions...'
              : appliedSearch.trim() !== '' || responseTypeFilter !== null
                ? 'No approved questions match your search.'
                : 'No approved questions yet.'}
          accessibilityText="Questions available to clause sets, with response type, last modified date, and source"
        >
          <GridColumn
            label="Question"
            sortField="question"
            width={view === 'option2' ? '7X' : '6X'}
            value={(row: Question) => (
              <div className="flex flex-col gap-0.5">
                <RichTextDisplayField
                  value={[
                    <TextItem
                      key="question"
                      text={row.question}
                      color="ACCENT"
                      link={() => setSelectedQuestion(row)}
                      linkStyle="STANDALONE"
                    />,
                  ]}
                  marginBelow="NONE"
                />
                {view === 'option2' && (
                  <span className="text-xs text-gray-500">
                    {row.source === 'Standard' ? 'System' : row.source}
                  </span>
                )}
              </div>
            )}
          />
          {view === 'option1' && (
            <GridColumn
              label="Source"
              sortField="source"
              width="2X"
              value={(row: Question) => (row.source === 'Standard' ? 'System' : row.source)}
            />
          )}
          <GridColumn
            label="Response Type"
            sortField="responseType"
            width="2X"
            value="responseType"
          />
          <GridColumn
            label="Last Modified"
            sortField="lastModified"
            width="3X"
            value={(row: Question) => (
              <RichTextDisplayField
                value={[
                  <TextItem key="when" text={`${formatQuestionTimestamp(row.lastModified)} by `} />,
                  <TextItem key="who" text={getDisplayName(row.modifiedBy)} color="ACCENT" />,
                ]}
                marginBelow="NONE"
              />
            )}
          />
        </ReadOnlyGrid>
      </div>

      {selectedQuestion && (
        <UpdateQuestionDialog
          key={selectedQuestion.id}
          question={selectedQuestion}
          onClose={() => setSelectedQuestion(null)}
          onSaved={async () => {
            await loadData()
            setSelectedQuestion(null)
          }}
        />
      )}

      {creating && (
        <UpdateQuestionDialog
          onClose={() => setCreating(false)}
          onSaved={async () => {
            await loadData()
            setCreating(false)
          }}
        />
      )}
    </QuestionsShell>
  )
}
