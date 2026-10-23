import { useLocation } from 'wouter'
import {
  SiteNav,
  HeadingField,
  RichTextDisplayField,
  TextItem,
  ButtonWidget,
  CardLayout,
  ReadOnlyGrid,
  GridColumn,
} from '@pglevy/sailwind'
import {
  LayoutGrid,
  List,
  Layers,
  CircleHelp,
  Shuffle,
  BookOpen,
  CheckCircle2,
} from 'lucide-react'

/**
 * Library import summary / review screen.
 *
 * Two-column layout:
 *   - Left sidebar: compact metadata and status chips.
 *   - Right column: success banner, next steps, changes applied, summary.
 *
 * Reached from the "View summary" button on the import success panel.
 */

const navPages = [
  { label: 'Clause Sets', icon: LayoutGrid },
  { label: 'Clauses', icon: List },
  { label: 'Templates', icon: Layers },
  { label: 'Questionnaires', icon: CircleHelp },
  { label: 'Rules', icon: Shuffle },
  { label: 'Library', icon: BookOpen, isSelected: true },
]

const overview = [
  { label: 'Installed version', value: '4.1.2' },
  { label: 'Previous version', value: '4.1.0' },
  { label: 'FAR/DFARS baseline', value: 'FAC 2025-06' },
  { label: 'Minimum GCA version', value: '4.1' },
  { label: 'Imported by', value: 'Privilege User' },
  { label: 'Imported on', value: 'Oct 23, 2026 8:12 PM' },
]

const changes = [
  { label: 'Rules', added: 43, changed: 118, retired: 6 },
  { label: 'Questions', added: 12, changed: 9, retired: 2 },
  { label: 'Questionnaire placements', added: 12, changed: 9, retired: 2 },
]

interface SummaryRow {
  id: string
  objectType: string
  created: number
  updated: number
  retired: number
  skipped: number
  failed: number
}

const summaryRows: SummaryRow[] = [
  { id: 'rules', objectType: 'Rules', created: 1141, updated: 0, retired: 0, skipped: 0, failed: 0 },
  { id: 'questions', objectType: 'Questions', created: 402, updated: 0, retired: 0, skipped: 0, failed: 0 },
  { id: 'responses', objectType: 'Responses', created: 1036, updated: 0, retired: 0, skipped: 0, failed: 0 },
  { id: 'placements', objectType: 'Questionnaire placements', created: 402, updated: 0, retired: 0, skipped: 0, failed: 0 },
]

export default function LibrarySummary() {
  const [, setLocation] = useLocation()
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
        {/* Header */}
        <div className="shrink-0 border-b border-gray-200 bg-white px-8 py-5">
          <HeadingField
            text="Library import 4.1.2"
            size="LARGE"
            headingTag="H1"
            fontWeight="SEMI_BOLD"
            marginBelow="NONE"
          />
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-8 py-6">
          <div className="grid w-full grid-cols-1 gap-6 lg:grid-cols-[18rem_minmax(0,1fr)]">
            {/* -------- Left sidebar: metadata + status chips -------- */}
            <aside className="space-y-6">
              <CardLayout
                padding="NONE"
                shape="SEMI_ROUNDED"
                style="#FFFFFF"
                showBorder={true}
                marginBelow="NONE"
              >
                <div className="border-b border-gray-200 px-5 py-3">
                  <HeadingField
                    text="Overview"
                    size="MEDIUM"
                    headingTag="H2"
                    fontWeight="SEMI_BOLD"
                    marginBelow="NONE"
                  />
                </div>
                <dl className="divide-y divide-gray-100">
                  {overview.map(row => (
                    <div key={row.label} className="px-5 py-3">
                      <dt className="text-xs uppercase tracking-wide text-gray-500">
                        {row.label}
                      </dt>
                      <dd className="mt-0.5 text-sm font-medium text-gray-900">
                        {row.value}
                      </dd>
                    </div>
                  ))}
                </dl>
              </CardLayout>

              <CardLayout
                padding="NONE"
                shape="SEMI_ROUNDED"
                style="#FFFFFF"
                showBorder={true}
                marginBelow="NONE"
              >
                <div className="border-b border-gray-200 px-5 py-3">
                  <HeadingField
                    text="Status"
                    size="MEDIUM"
                    headingTag="H2"
                    fontWeight="SEMI_BOLD"
                    marginBelow="NONE"
                  />
                </div>
                <div className="space-y-2 px-5 py-4">
                  <StatusChip tone="success" label="Import completed" />
                  <StatusChip tone="warn" label="Library rules off" />
                  <StatusChip tone="warn" label="System questionnaire not default" />
                </div>
              </CardLayout>
            </aside>

            {/* -------- Right column: main content -------- */}
            <div className="space-y-6">
              {/* Success banner */}
              <div
                className="flex items-start gap-3 rounded-md px-4 py-3"
                style={{ backgroundColor: '#EAF7EC' }}
                role="status"
              >
                <CheckCircle2
                  size={18}
                  className="mt-0.5 shrink-0 text-green-700"
                  aria-hidden="true"
                />
                <p className="text-sm text-gray-900">
                  <span className="font-semibold">Import completed.</span> Library
                  4.1.2 is installed. Library rules aren&apos;t on yet.
                </p>
              </div>

              {/* Next steps */}
              <CardLayout
                padding="NONE"
                shape="SEMI_ROUNDED"
                style="#FFFFFF"
                showBorder={true}
                marginBelow="NONE"
              >
                <div className="border-b border-gray-200 px-6 py-4">
                  <HeadingField
                    text="Next steps"
                    size="MEDIUM"
                    headingTag="H2"
                    fontWeight="SEMI_BOLD"
                    marginBelow="NONE"
                  />
                </div>
                <div className="grid grid-cols-1 gap-6 px-6 py-5 md:grid-cols-2">
                  <div className="rounded-md border border-gray-200 p-4">
                    <HeadingField
                      text="Turn on library rules"
                      size="SMALL"
                      headingTag="H3"
                      fontWeight="SEMI_BOLD"
                      marginBelow="EVEN_LESS"
                    />
                    <RichTextDisplayField
                      value={[
                        <TextItem
                          key="s"
                          text="Active library rules will be used when clause sets are created."
                          color="SECONDARY"
                          size="STANDARD"
                        />,
                      ]}
                      marginBelow="STANDARD"
                    />
                    <ButtonWidget
                      label="Open Solution Hub"
                      style="OUTLINE"
                      color="ACCENT"
                      size="SMALL"
                    />
                  </div>
                  <div className="rounded-md border border-gray-200 p-4">
                    <HeadingField
                      text="Make the system questionnaire the default"
                      size="SMALL"
                      headingTag="H3"
                      fontWeight="SEMI_BOLD"
                      marginBelow="EVEN_LESS"
                    />
                    <RichTextDisplayField
                      value={[
                        <TextItem
                          key="s"
                          text="Library rules only run when the system questionnaire is the default."
                          color="SECONDARY"
                          size="STANDARD"
                        />,
                      ]}
                      marginBelow="STANDARD"
                    />
                    <ButtonWidget
                      label="Set as default"
                      style="OUTLINE"
                      color="ACCENT"
                      size="SMALL"
                    />
                  </div>
                </div>
                <div className="flex justify-center border-t border-gray-100 px-6 py-3">
                  <ButtonWidget
                    label="Skip for now"
                    style="LINK"
                    color="ACCENT"
                    onClick={() => setLocation('/library')}
                  />
                </div>
              </CardLayout>

              {/* Changes applied */}
              <CardLayout
                padding="NONE"
                shape="SEMI_ROUNDED"
                style="#FFFFFF"
                showBorder={true}
                marginBelow="NONE"
              >
                <div className="border-b border-gray-200 px-6 py-4">
                  <HeadingField
                    text="Changes applied"
                    size="MEDIUM"
                    headingTag="H2"
                    fontWeight="SEMI_BOLD"
                    marginBelow="NONE"
                  />
                </div>
                <div className="space-y-3 px-6 py-5">
                  {changes.map(group => (
                    <div key={group.label} className="flex items-center gap-3">
                      <span className="w-56 text-sm text-gray-900">{group.label}</span>
                      <div className="flex flex-wrap gap-2">
                        <Pill tone="added" count={group.added} label="new" />
                        <Pill tone="changed" count={group.changed} label="changed" />
                        <Pill tone="retired" count={group.retired} label="retired" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardLayout>

              {/* Summary counts */}
              <CardLayout
                padding="NONE"
                shape="SEMI_ROUNDED"
                style="#FFFFFF"
                showBorder={true}
                marginBelow="NONE"
              >
                <div className="border-b border-gray-200 px-6 py-4">
                  <HeadingField
                    text="Summary"
                    size="MEDIUM"
                    headingTag="H2"
                    fontWeight="SEMI_BOLD"
                    marginBelow="NONE"
                  />
                </div>
                <div className="px-4 py-2">
                  <ReadOnlyGrid
                    data={summaryRows}
                    spacing="STANDARD"
                    borderStyle="LIGHT"
                    pageSize={10}
                  >
                    <GridColumn
                      label="Object type"
                      value={row => (row as SummaryRow).objectType}
                    />
                    <GridColumn
                      label="Created"
                      align="END"
                      value={row => (row as SummaryRow).created.toLocaleString()}
                      width="NARROW"
                    />
                    <GridColumn
                      label="Updated"
                      align="END"
                      value={row => (row as SummaryRow).updated.toLocaleString()}
                      width="NARROW"
                    />
                    <GridColumn
                      label="Retired"
                      align="END"
                      value={row => (row as SummaryRow).retired.toLocaleString()}
                      width="NARROW"
                    />
                    <GridColumn
                      label="Skipped"
                      align="END"
                      value={row => (row as SummaryRow).skipped.toLocaleString()}
                      width="NARROW"
                    />
                    <GridColumn
                      label="Failed"
                      align="END"
                      value={row => (row as SummaryRow).failed.toLocaleString()}
                      width="NARROW"
                    />
                  </ReadOnlyGrid>
                </div>
              </CardLayout>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

function Pill({
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

function StatusChip({
  tone,
  label,
}: {
  tone: 'success' | 'warn' | 'neutral'
  label: string
}) {
  const styles = {
    success: 'bg-green-50 text-green-800 ring-green-200',
    warn: 'bg-amber-50 text-amber-800 ring-amber-200',
    neutral: 'bg-gray-50 text-gray-700 ring-gray-200',
  }[tone]
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${styles}`}
    >
      {label}
    </span>
  )
}
