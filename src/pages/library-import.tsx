import { useState } from 'react'
import { useLocation } from 'wouter'
import {
  SiteNav,
  HeadingField,
  RichTextDisplayField,
  TextItem,
  ButtonWidget,
  CardLayout,
  FileCard,
} from '@pglevy/sailwind'
import {
  LayoutGrid,
  List,
  Layers,
  CircleHelp,
  Shuffle,
  BookOpen,
  UploadCloud,
  RefreshCw,
  Info,
  CheckCircle2,
  XCircle,
} from 'lucide-react'

/**
 * Library import wizard.
 *
 * Three steps:
 *   1. Upload package — drop zone for the .json file.
 *   2. Confirm — summary of what's about to be imported.
 *   3. Review import — in-progress state with refresh + "View details".
 *
 * This is a full-page view (not a dialog) because the user wants it to take
 * roughly the whole page. The /library route hosts the empty state; this
 * route hosts the wizard.
 */

const navPages = [
  { label: 'Clause Sets', icon: LayoutGrid },
  { label: 'Clauses', icon: List },
  { label: 'Templates', icon: Layers },
  { label: 'Questionnaires', icon: CircleHelp },
  { label: 'Rules', icon: Shuffle },
  { label: 'Library', icon: BookOpen, isSelected: true },
]

type Step = 0 | 1

/** Outcome state after the user clicks "Import". */
type ImportStatus = 'idle' | 'importing' | 'success' | 'failed'

export default function LibraryImport() {
  const [, setLocation] = useLocation()
  const [step, setStep] = useState<Step>(0)
  const [status, setStatus] = useState<ImportStatus>('idle')
  const [refreshCount, setRefreshCount] = useState(0)
  const [fileName, setFileName] = useState<string | null>(null)

  const next = () => setStep(prev => Math.min(1, (prev + 1) as Step) as Step)
  const back = () => setStep(prev => Math.max(0, (prev - 1) as Step) as Step)
  const cancel = () => setLocation('/library')
  const startImport = () => {
    setStatus('importing')
    setRefreshCount(0)
  }
  /**
   * Simulate polling the import status. Each click of Refresh flips between
   * success and failed so both outcomes can be demoed from the same screen.
   */
  const handleRefresh = () => {
    const nextCount = refreshCount + 1
    setRefreshCount(nextCount)
    setStatus(nextCount % 2 === 1 ? 'failed' : 'success')
  }
  const retryImport = () => {
    setStatus('idle')
    setStep(0)
    setFileName(null)
    setRefreshCount(0)
  }
  const importing = status !== 'idle'

  const canContinue = step === 0 ? fileName !== null : true

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
        <div className="min-h-0 flex-1 overflow-y-auto px-8 py-8">
          <div className="mx-auto w-full max-w-5xl">
            <CardLayout
              padding="NONE"
              shape="SEMI_ROUNDED"
              style="#FFFFFF"
              showBorder={true}
              marginBelow="NONE"
            >
              {/* Header */}
              <div className="border-b border-gray-200 px-8 py-6">
                <HeadingField
                  text="Import library"
                  size="LARGE"
                  headingTag="H1"
                  fontWeight="SEMI_BOLD"
                  marginBelow="NONE"
                />
              </div>

              {/* Body */}
              <div className="min-h-[22rem] px-8 py-8">
                {status === 'importing' && (
                  <ImportingPanel
                    onRefresh={handleRefresh}
                    onViewSummary={() => setLocation('/library/import/summary')}
                  />
                )}
                {status === 'success' && (
                  <SuccessPanel
                    onViewSummary={() => setLocation('/library/import/summary')}
                  />
                )}
                {status === 'failed' && <FailedPanel onRetry={retryImport} />}
                {status === 'idle' &&
                  (step === 0 ? (
                    <UploadStep
                      fileName={fileName}
                      onFileChosen={setFileName}
                      onFileCleared={() => setFileName(null)}
                    />
                  ) : (
                    <ConfirmStep />
                  ))}
              </div>

              {/* Footer */}
              {!importing && (
                <div className="flex items-center justify-between border-t border-gray-200 px-8 py-4">
                  <div className="flex items-center gap-3">
                    <ButtonWidget
                      label="Cancel"
                      style="LINK"
                      color="ACCENT"
                      onClick={cancel}
                    />
                    {step === 1 && (
                      <ButtonWidget
                        label="Back"
                        style="OUTLINE"
                        color="ACCENT"
                        onClick={back}
                      />
                    )}
                  </div>
                  <div>
                    {step === 0 && (
                      <ButtonWidget
                        label="Next"
                        style="SOLID"
                        color="ACCENT"
                        disabled={!canContinue}
                        onClick={next}
                      />
                    )}
                    {step === 1 && (
                      <ButtonWidget
                        label="Import"
                        style="SOLID"
                        color="ACCENT"
                        onClick={startImport}
                      />
                    )}
                  </div>
                </div>
              )}
            </CardLayout>
          </div>
        </div>
      </main>
    </div>
  )
}

/* --------------------------------- Step 1 --------------------------------- */

function UploadStep({
  fileName,
  onFileChosen,
  onFileCleared,
}: {
  fileName: string | null
  onFileChosen: (name: string) => void
  onFileCleared: () => void
}) {
  const handleChoose = () => {
    // Prototype only — simulate a chosen file.
    onFileChosen('clause-automation-library-4.1.2.json')
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="text-center">
        <HeadingField
          text="Upload package"
          size="MEDIUM"
          headingTag="H2"
          fontWeight="SEMI_BOLD"
          align="CENTER"
          marginBelow="EVEN_LESS"
        />
        <RichTextDisplayField
          value={[
            <TextItem
              key="s"
              text="Select the JSON file downloaded from the Forum."
              color="SECONDARY"
              size="STANDARD"
            />,
          ]}
          align="CENTER"
          marginBelow="STANDARD"
        />
      </div>

      <p className="mb-1.5 text-sm font-semibold text-gray-900">
        Library package <span className="text-red-600">*</span>
      </p>
      {fileName ? (
        <FileCard
          fileName={fileName}
          fileSize={482_314}
          showRemove={true}
          onRemove={onFileCleared}
        />
      ) : (
        <div
          className="flex flex-col items-center justify-center rounded-md border-2 border-dashed border-gray-300 px-6 py-10"
          style={{ backgroundColor: '#FAFAFC' }}
        >
          <UploadCloud
            size={28}
            style={{ color: '#3938F2' }}
            aria-hidden="true"
            className="mb-3"
          />
          <p className="mb-3 text-sm text-gray-700">Drop the package here or</p>
          <ButtonWidget
            label="Choose file"
            style="OUTLINE"
            color="ACCENT"
            size="SMALL"
            onClick={handleChoose}
          />
        </div>
      )}
      <p className="mt-2 text-sm">
        <a
          href="#"
          className="font-medium text-blue-700 underline hover:text-blue-800"
        >
          Forum download page
        </a>
      </p>
    </div>
  )
}

/* --------------------------------- Step 2 --------------------------------- */

/** Small color-coded pill for diff counts (new / changed / retired). */
function DiffPill({
  tone,
  count,
  label,
}: {
  tone: 'added' | 'changed' | 'retired'
  count: number
  label: string
}) {
  const styles = {
    added: 'bg-green-50 text-green-800 ring-green-200',
    changed: 'bg-amber-50 text-amber-800 ring-amber-200',
    retired: 'bg-red-50 text-red-800 ring-red-200',
  }[tone]
  const symbol = { added: '+', changed: '~', retired: '−' }[tone]
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${styles}`}
    >
      <span aria-hidden="true">{symbol}</span>
      <span>
        {count} {label}
      </span>
    </span>
  )
}

function ConfirmStep() {
  const metadata = [
    { label: 'Incoming version', value: '4.1.2' },
    { label: 'Installed version', value: '4.1.0' },
    { label: 'FAR/DFARS baseline', value: 'FAC 2025-06' },
    { label: 'Minimum GCA version', value: '4.1' },
  ]

  // Scannable "what's in the box" numbers instead of a comma sentence.
  const totals: { label: string; value: string }[] = [
    { label: 'Rules', value: '1,184' },
    { label: 'Questions', value: '412' },
    { label: 'Questionnaires', value: '1' },
  ]

  // Changes grouped by object type with +/~/− pills so the user can skim them.
  const changes: {
    label: string
    added: number
    changed: number
    retired: number
  }[] = [
    { label: 'Rules', added: 43, changed: 118, retired: 6 },
    { label: 'Questions', added: 12, changed: 9, retired: 2 },
  ]

  return (
    <div>
      <div
        className="mb-5 flex items-start gap-3 rounded-md px-4 py-3"
        style={{ backgroundColor: '#E9E9FE' }}
        role="status"
      >
        <Info
          size={18}
          aria-hidden="true"
          className="mt-0.5 shrink-0"
          fill="#2322F0"
          stroke="#FFFFFF"
          strokeWidth={2}
        />
        <p className="text-sm text-gray-900">
          Importing doesn&apos;t change your custom rules, questions or questionnaires.
        </p>
      </div>
      <HeadingField
        text="Import summary"
        size="MEDIUM"
        headingTag="H2"
        fontWeight="SEMI_BOLD"
        marginBelow="STANDARD"
      />
      <div className="rounded-md border border-gray-200 bg-white p-5">
        {/* Metadata */}
        <dl className="space-y-3 text-sm">
          {metadata.map(row => (
            <div key={row.label} className="grid grid-cols-[12rem_minmax(0,1fr)] gap-3">
              <dt className="text-gray-600">{row.label}</dt>
              <dd className="text-gray-900">{row.value}</dd>
            </div>
          ))}
        </dl>

        {/* Package contents as stat chips */}
        <div className="mt-5 border-t border-gray-100 pt-5">
          <p className="mb-2.5 text-sm text-gray-600">Package contents</p>
          <div className="flex flex-wrap gap-2.5">
            {totals.map(t => (
              <div
                key={t.label}
                className="flex items-baseline gap-2 rounded-md border border-gray-200 bg-gray-50 px-3 py-1.5"
              >
                <span className="text-base font-semibold text-gray-900">{t.value}</span>
                <span className="text-sm text-gray-600">{t.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Changes from previous version as colour-coded diff pills */}
        <div className="mt-5 border-t border-gray-100 pt-5">
          <p className="mb-2.5 text-sm text-gray-600">Changes from 4.1.0</p>
          <div className="space-y-2">
            {changes.map(group => (
              <div key={group.label} className="flex items-center gap-3">
                <span className="w-24 text-sm text-gray-900">{group.label}</span>
                <div className="flex flex-wrap gap-2">
                  <DiffPill tone="added" count={group.added} label="new" />
                  <DiffPill tone="changed" count={group.changed} label="changed" />
                  <DiffPill tone="retired" count={group.retired} label="retired" />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-5 border-t border-gray-100 pt-4">
          <a
            href="#"
            className="text-sm font-medium text-blue-700 underline hover:text-blue-800"
          >
            Read the README
          </a>
        </div>
      </div>
    </div>
  )
}

/* ----------------------------- In-progress panel --------------------------- */

function ImportingPanel({
  onRefresh,
  onViewSummary,
}: {
  onRefresh: () => void
  onViewSummary: () => void
}) {
  return (
    <div className="mx-auto max-w-2xl py-6 text-center">
      <div
        className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full"
        style={{ backgroundColor: '#E9E9FE' }}
      >
        <RefreshCw
          size={28}
          strokeWidth={2}
          style={{ color: '#3938F2' }}
          aria-hidden="true"
          className="animate-spin"
        />
      </div>
      <HeadingField
        text="Package is importing"
        size="MEDIUM"
        headingTag="H2"
        fontWeight="SEMI_BOLD"
        align="CENTER"
        marginBelow="LESS"
      />
      <RichTextDisplayField
        value={[
          <TextItem
            key="s"
            text="This can take a few minutes. You can view more details on the summary page."
            color="SECONDARY"
            size="STANDARD"
          />,
        ]}
        align="CENTER"
        marginBelow="STANDARD"
      />
      <div className="flex items-center justify-center gap-3">
        <ButtonWidget
          label="Refresh status"
          icon="RefreshCw"
          iconPosition="START"
          style="OUTLINE"
          color="ACCENT"
          onClick={onRefresh}
        />
        <ButtonWidget
          label="View summary"
          style="SOLID"
          color="ACCENT"
          onClick={onViewSummary}
        />
      </div>
    </div>
  )
}

/* ----------------------------- Success panel ------------------------------ */

function SuccessPanel({ onViewSummary }: { onViewSummary: () => void }) {
  return (
    <div className="mx-auto max-w-2xl py-6 text-center">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-50">
        <CheckCircle2
          size={32}
          strokeWidth={2}
          className="text-green-600"
          aria-hidden="true"
        />
      </div>
      <HeadingField
        text="Import complete"
        size="MEDIUM"
        headingTag="H2"
        fontWeight="SEMI_BOLD"
        align="CENTER"
        marginBelow="LESS"
      />
      <RichTextDisplayField
        value={[
          <TextItem
            key="s"
            text="Version 4.1.2 is installed. Review the changes on the summary page."
            color="SECONDARY"
            size="STANDARD"
          />,
        ]}
        align="CENTER"
        marginBelow="STANDARD"
      />
      <div className="flex items-center justify-center">
        <ButtonWidget
          label="View summary"
          style="SOLID"
          color="ACCENT"
          onClick={onViewSummary}
        />
      </div>
    </div>
  )
}

/* ------------------------------ Failed panel ------------------------------ */

function FailedPanel({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="mx-auto max-w-2xl py-6 text-center">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
        <XCircle size={32} strokeWidth={2} className="text-red-600" aria-hidden="true" />
      </div>
      <HeadingField
        text="Import failed"
        size="MEDIUM"
        headingTag="H2"
        fontWeight="SEMI_BOLD"
        align="CENTER"
        marginBelow="LESS"
      />
      <RichTextDisplayField
        value={[
          <TextItem
            key="s"
            text="Something went wrong while importing the package. The installed version remains unchanged, and no changes have been partially applied."
            color="SECONDARY"
            size="STANDARD"
          />,
        ]}
        align="CENTER"
        marginBelow="STANDARD"
      />
      <div className="flex items-center justify-center">
        <ButtonWidget
          label="Retry import"
          style="SOLID"
          color="ACCENT"
          onClick={onRetry}
        />
      </div>
    </div>
  )
}
