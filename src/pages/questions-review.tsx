import { useState, useEffect, useMemo } from 'react'
import { useLocation } from 'wouter'
import {
  HeadingField,
  MessageBanner,
  ReadOnlyGrid,
  GridColumn,
  ButtonWidget,
  RichTextDisplayField,
  TextItem,
} from '@pglevy/sailwind'
import QuestionsShell from '../components/questions-shell'
import QuestionStatusTag from '../components/question-status-tag'
import UpdateQuestionDialog from '../components/update-question-dialog'
import { getSystemQuestions, reviewQuestions, type Question } from '../db/questions'

/** Username recorded as the reviewer in this prototype. */
const CURRENT_USER = 'john.smith'

export default function QuestionsReview() {
  const [, setLocation] = useLocation()
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedIds, setSelectedIds] = useState<(string | number)[]>([])
  const [openQuestion, setOpenQuestion] = useState<Question | null>(null)

  useEffect(() => {
    getSystemQuestions().then(data => {
      setQuestions([...data])
      setLoading(false)
    })
  }, [])

  const counts = useMemo(
    () => ({
      pending: questions.filter(q => q.status === 'Pending').length,
      approved: questions.filter(q => q.status === 'Approved').length,
      rejected: questions.filter(q => q.status === 'Rejected').length,
    }),
    [questions],
  )

  /** Only pending rows that are also selected can be acted on in bulk. */
  const pendingSelectedIds = useMemo(
    () =>
      questions
        .filter(q => q.status === 'Pending' && selectedIds.includes(q.id))
        .map(q => q.id),
    [questions, selectedIds],
  )

  const review = async (ids: number[], status: 'Approved' | 'Rejected') => {
    await reviewQuestions(ids, status, CURRENT_USER)
    // The data layer returns the same array each time, so copy it to trigger a re-render.
    setQuestions([...(await getSystemQuestions())])
    setSelectedIds([])
  }

  const allReviewed = !loading && questions.length > 0 && counts.pending === 0

  return (
    <QuestionsShell>
      <div className="px-8 py-6">
        {/* Header: title + subtitle on the left, a cross-nav button on the right that
            jumps to the Questions tab. Trailing arrow icon signals "go to next page",
            and OUTLINE style keeps it secondary to the per-row review actions. */}
        <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <HeadingField
              text="Review system questions"
              size="MEDIUM_PLUS"
              headingTag="H1"
              fontWeight="SEMI_BOLD"
              marginBelow="EVEN_LESS"
            />
            <RichTextDisplayField
              value={[
                <TextItem
                  key="sub"
                  text="Approve or reject each imported question. Approved questions are added to your Questions tab — come back anytime to review more."
                  color="SECONDARY"
                  size="MEDIUM"
                />,
              ]}
              marginBelow="NONE"
            />
          </div>
          <div className="shrink-0">
            <ButtonWidget
              label={
                counts.approved > 0
                  ? `View ${counts.approved} approved question${counts.approved === 1 ? '' : 's'}`
                  : 'View questions'
              }
              style="OUTLINE"
              color="ACCENT"
              icon="ArrowRight"
              iconPosition="END"
              tooltip="Open the Questions tab. You can come back to continue reviewing."
              onClick={() => setLocation('/questions')}
            />
          </div>
        </div>

        {/* Completion banner — carries its own CTA so the user does not have to hunt for Done. */}
        {allReviewed && (
          <div className="mb-4">
            <MessageBanner
              primaryText="Review complete"
              secondaryText={`${counts.approved} approved, ${counts.rejected} rejected. Approved questions are now available in your Questions tab.`}
              backgroundColor="SUCCESS"
              highlightColor="POSITIVE"
              icon="success"
              buttons={[
                {
                  label: 'Go to questions',
                  style: 'SOLID',
                  color: 'ACCENT',
                  size: 'SMALL',
                  onClick: () => setLocation('/questions'),
                },
              ]}
              marginBelow="NONE"
            />
          </div>
        )}

        {/* Selection action strip — appears only when the user has selected pending rows. */}
        {pendingSelectedIds.length > 0 && (
          <div
            className="mb-3 flex flex-wrap items-center gap-3 rounded-md border px-4 py-2.5"
            style={{ borderColor: '#C7D2FE', backgroundColor: '#EEF2FF' }}
          >
            <RichTextDisplayField
              value={[
                <TextItem
                  key="n"
                  text={`${pendingSelectedIds.length} selected`}
                  style="STRONG"
                  color="#3730A3"
                />,
              ]}
              marginBelow="NONE"
            />
            <ButtonWidget
              label="Approve"
              style="SOLID"
              color="POSITIVE"
              size="SMALL"
              icon="Check"
              iconPosition="START"
              onClick={() => review(pendingSelectedIds, 'Approved')}
            />
            <ButtonWidget
              label="Reject"
              style="OUTLINE"
              color="NEGATIVE"
              size="SMALL"
              icon="X"
              iconPosition="START"
              onClick={() => review(pendingSelectedIds, 'Rejected')}
            />
            <div className="ml-auto">
              <ButtonWidget
                label="Clear"
                style="GHOST"
                color="SECONDARY"
                size="SMALL"
                onClick={() => setSelectedIds([])}
              />
            </div>
          </div>
        )}

        <ReadOnlyGrid
          data={questions}
          pageSize={20}
          pagingControls="ROW_COUNT"
          borderStyle="LIGHT"
          rowHeader={0}
          selectable={true}
          selectionStyle="CHECKBOX_SUBTLE_HIGHLIGHT"
          selectionValue={selectedIds}
          selectionSaveInto={setSelectedIds}
          emptyGridMessage={loading ? 'Loading questions…' : 'No questions to review.'}
          accessibilityText="Imported system questions waiting for review, with response type and approval status"
        >
          <GridColumn
            label="Question"
            sortField="question"
            width="6X"
            value={(row: Question) => (
              <RichTextDisplayField
                value={[
                  <TextItem
                    key="q"
                    text={row.question}
                    color="ACCENT"
                    link={() => setOpenQuestion(row)}
                    linkStyle="STANDALONE"
                  />,
                ]}
                marginBelow="NONE"
              />
            )}
          />
          <GridColumn
            label="Response type"
            sortField="responseType"
            width="2X"
            value="responseType"
          />
          {/* Merged status + review column — pending rows show inline action icons,
              reviewed rows show their final status tag. One column, no "Reviewed" filler. */}
          <GridColumn
            label="Status"
            sortField="status"
            width="3X"
            value={(row: Question) =>
              row.status === 'Pending' ? (
                <div className="flex items-center gap-1">
                  <ButtonWidget
                    style="GHOST"
                    color="POSITIVE"
                    size="SMALL"
                    icon="Check"
                    tooltip="Approve"
                    accessibilityText={`Approve: ${row.question}`}
                    onClick={() => review([row.id], 'Approved')}
                  />
                  <ButtonWidget
                    style="GHOST"
                    color="NEGATIVE"
                    size="SMALL"
                    icon="X"
                    tooltip="Reject"
                    accessibilityText={`Reject: ${row.question}`}
                    onClick={() => review([row.id], 'Rejected')}
                  />
                </div>
              ) : (
                <QuestionStatusTag status={row.status} />
              )
            }
          />
        </ReadOnlyGrid>
      </div>

      {openQuestion && (
        <UpdateQuestionDialog
          key={openQuestion.id}
          question={openQuestion}
          onClose={() => setOpenQuestion(null)}
          onSaved={async () => {
            setQuestions([...(await getSystemQuestions())])
            setOpenQuestion(null)
          }}
        />
      )}
    </QuestionsShell>
  )
}
