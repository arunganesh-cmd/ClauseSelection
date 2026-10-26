import { useState, useRef, type ReactNode } from 'react'
import { useLocation } from 'wouter'
import {
  HeadingField,
  CardLayout,
  ButtonWidget,
  FileCard,
  MessageBanner,
  RichTextDisplayField,
  TextItem,
  TabsField,
} from '@pglevy/sailwind'
import { Library, PencilLine, Zap, Award, Settings2 } from 'lucide-react'
import QuestionsShell from '../components/questions-shell'
import { importSystemQuestions, importCustomQuestions } from '../db/questions'
import { EXCEL_ACCEPT, isExcelFile } from '../lib/excel-file'

/** Reasons to pick system questions, shown as benefit cards in Option 3.
 *  Each benefit uses its own tint so the cards read as a visual trio. */
const systemBenefits: Array<{
  icon: ReactNode
  title: string
  description: string
  stat: string
  tintBg: string
  tintBorder: string
  tintText: string
}> = [
  {
    icon: <Zap size={26} aria-hidden="true" />,
    title: 'Save hours of setup',
    description: 'Dozens of questions ready to use out of the box.',
    stat: 'Setup in minutes',
    tintBg: '#FEF3C7',
    tintBorder: '#FCD34D',
    tintText: '#92400E',
  },
  {
    icon: <Award size={26} aria-hidden="true" />,
    title: 'Built on best practices',
    description: 'Curated from real GCA acquisition workflows.',
    stat: 'Field-tested',
    tintBg: '#D1FAE5',
    tintBorder: '#6EE7B7',
    tintText: '#065F46',
  },
  {
    icon: <Settings2 size={26} aria-hidden="true" />,
    title: 'Fully editable',
    description: 'Add, remove, or edit any question anytime.',
    stat: 'Yours to shape',
    tintBg: '#DBEAFE',
    tintBorder: '#93C5FD',
    tintText: '#1E40AF',
  },
]

export default function QuestionsLanding() {
  const [, setLocation] = useLocation()
  const [excelFile, setExcelFile] = useState<File | null>(null)
  const [fileError, setFileError] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const triggerSystemImport = () => {
    importSystemQuestions().then(() => setLocation('/questions'))
  }

  const triggerUploadPicker = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (isExcelFile(file)) {
        setExcelFile(file)
        setFileError(false)
      } else {
        setFileError(true)
      }
    }
    // Reset so choosing the same file again still fires onChange.
    event.target.value = ''
  }

  /* ------------------------------------------------------------------------ */
  /* Reusable blocks                                                           */
  /* ------------------------------------------------------------------------ */

  /** A compact, horizontal System Questions card used across all three options. */
  const CompactSystemCard = () => (
    <div className="flex items-center gap-6 rounded-md border border-gray-200 bg-white px-8 py-10 shadow-sm">
      <div
        className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full"
        style={{ backgroundColor: '#E8E7FD', color: '#2322F0' }}
      >
        <Library size={36} aria-hidden="true" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-lg font-semibold text-gray-900">
          Import system questions
        </p>
        <p className="mt-1 text-sm text-gray-600">
          Add the standard questions that ship with the solution. You can
          review, edit, or remove them later.
        </p>
      </div>
      <ButtonWidget
        label="Import"
        style="SOLID"
        color="ACCENT"
        size="MEDIUM"
        icon="Download"
        iconPosition="START"
        onClick={triggerSystemImport}
      />
    </div>
  )

  /** The subtle "import manually" row used in Options 2 and 3. */
  const ManualInlineCard = () => (
    <div className="flex items-center justify-between gap-4 rounded-md border border-dashed border-gray-300 bg-gray-50 px-6 py-6">
      <div className="flex items-start gap-3">
        <PencilLine
          size={20}
          aria-hidden="true"
          className="mt-0.5 shrink-0 text-gray-500"
        />
        <div>
          <p className="text-sm font-semibold text-gray-900">
            Have your own questions ready?
          </p>
          <p className="text-xs text-gray-600">
            Upload a spreadsheet to add many questions at once.
          </p>
        </div>
      </div>
      <ButtonWidget
        label="Upload Excel"
        style="OUTLINE"
        color="ACCENT"
        size="SMALL"
        icon="Upload"
        iconPosition="START"
        onClick={triggerUploadPicker}
      />
    </div>
  )

  /* ------------------------------------------------------------------------ */
  /* Tab contents                                                              */
  /* ------------------------------------------------------------------------ */

  /** Option 1 — compact system card on top, matching compact manual card below. */
  const option1Content = (
    <div className="flex flex-col gap-4 pt-2">
      <CompactSystemCard />
      <div className="flex items-center gap-6 rounded-md border border-gray-200 bg-white px-8 py-10 shadow-sm">
        <div
          className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full"
          style={{ backgroundColor: '#F3F4F6', color: '#4B5563' }}
        >
          <PencilLine size={36} aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-lg font-semibold text-gray-900">
            Import manually
          </p>
          <p className="mt-1 text-sm text-gray-600">
            Upload your own spreadsheet of questions. You can review, edit, or
            remove them before saving.
          </p>
        </div>
        <ButtonWidget
          label="Upload"
          style="OUTLINE"
          color="ACCENT"
          size="MEDIUM"
          icon="Upload"
          iconPosition="START"
          onClick={triggerUploadPicker}
        />
      </div>
    </div>
  )

  /** Option 2 — compact system card up top, subtle dashed manual row below. */
  const option2Content = (
    <div className="pt-2">
      <CompactSystemCard />
      <div className="mt-6">
        <ManualInlineCard />
      </div>
    </div>
  )

  /** Option 3 — compact system card at top, three visual benefit cards, then the manual row. */
  const option3Content = (
    <div className="pt-2">
      <CompactSystemCard />

      <div className="mt-10 mb-5 text-center">
        <HeadingField
          text="Why system questions?"
          size="MEDIUM_PLUS"
          headingTag="H3"
          fontWeight="SEMI_BOLD"
          align="CENTER"
          marginBelow="NONE"
        />
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        {systemBenefits.map(benefit => (
          <div
            key={benefit.title}
            className="relative overflow-hidden rounded-lg border bg-white px-6 py-6 shadow-sm transition-shadow hover:shadow-md"
            style={{ borderColor: benefit.tintBorder }}
          >
            {/* Decorative tint blob in the top-right corner */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full opacity-40"
              style={{ backgroundColor: benefit.tintBg }}
            />
            {/* Smaller accent dot */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute right-6 top-8 h-3 w-3 rounded-full opacity-60"
              style={{ backgroundColor: benefit.tintBorder }}
            />

            <div
              className="relative mb-4 flex h-14 w-14 items-center justify-center rounded-xl"
              style={{ backgroundColor: benefit.tintBg, color: benefit.tintText }}
            >
              {benefit.icon}
            </div>

            <p
              className="relative mb-1 text-xs font-semibold uppercase tracking-wide"
              style={{ color: benefit.tintText }}
            >
              {benefit.stat}
            </p>
            <p className="relative mb-2 text-base font-semibold text-gray-900">
              {benefit.title}
            </p>
            <p className="relative text-sm text-gray-600">{benefit.description}</p>
          </div>
        ))}
      </div>

      <div className="mt-8">
        <ManualInlineCard />
      </div>
    </div>
  )

  return (
    <QuestionsShell>
      <div className="px-8 py-12">
        <div>
          <div className="text-center mb-8">
            <HeadingField
              text="Add your first questions"
              size="LARGE_PLUS"
              headingTag="H1"
              fontWeight="REGULAR"
              align="CENTER"
              marginBelow="EVEN_LESS"
            />
            <RichTextDisplayField
              align="CENTER"
              value={[
                <TextItem
                  key="subtitle"
                  text="You haven't added any questions yet. Choose how you want to get started."
                  color="SECONDARY"
                  size="MEDIUM_PLUS"
                />,
              ]}
              marginBelow="NONE"
            />
          </div>

          {fileError && (
            <div className="mx-auto mb-6 max-w-xl">
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

          <TabsField
            tabs={[
              { value: 'option1', label: 'Option 1', content: option1Content },
              { value: 'option2', label: 'Option 2', content: option2Content },
              { value: 'option3', label: 'Option 3', content: option3Content },
            ]}
            defaultValue="option1"
            variant="UNDERLINE"
            contentsPadding="MORE"
            fullWidthSeparator={true}
            marginBelow="NONE"
          />

          <input
            ref={fileInputRef}
            type="file"
            accept={EXCEL_ACCEPT}
            onChange={handleFileChange}
            className="hidden"
            aria-label="Upload Excel sheet"
            tabIndex={-1}
          />

          {excelFile && (
            <div className="mx-auto mt-8 max-w-xl">
              <CardLayout
                padding="STANDARD"
                showBorder={true}
                showShadow={false}
                shape="SEMI_ROUNDED"
              >
                <HeadingField
                  text="Ready to import"
                  size="SMALL"
                  headingTag="H2"
                  fontWeight="SEMI_BOLD"
                  marginBelow="LESS"
                />
                <FileCard
                  fileName={excelFile.name}
                  fileSize={excelFile.size}
                  showRemove={true}
                  onRemove={() => setExcelFile(null)}
                />
                <div className="mt-4 flex justify-end">
                  <ButtonWidget
                    label="Import questions"
                    style="SOLID"
                    color="ACCENT"
                    onClick={async () => {
                      await importCustomQuestions(excelFile.name, 'john.smith')
                      setLocation('/questions')
                    }}
                  />
                </div>
              </CardLayout>
            </div>
          )}
        </div>
      </div>
    </QuestionsShell>
  )
}
