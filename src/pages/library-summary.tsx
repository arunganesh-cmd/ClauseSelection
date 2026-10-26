import { useLocation } from 'wouter'
import {
  SiteNav,
  HeadingField,
  CardLayout,
  ReadOnlyGrid,
  GridColumn,
  TagField,
  TabsField,
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
 * Library import summary page.
 *
 * Appian clause-record style:
 *   - Record title + pill tabs (Summary / Import history) at the top.
 *   - Summary tab: left column Details + Package contents; right column has
 *     a Changes applied overview and three sub-tabs (Rules / Questions /
 *     Questionnaires) listing the imported items with change + version.
 */

const navPages = [
  { label: 'Clause Sets', icon: LayoutGrid },
  { label: 'Clauses', icon: List },
  { label: 'Templates', icon: Layers },
  { label: 'Questionnaires', icon: CircleHelp },
  { label: 'Rules', icon: Shuffle },
  { label: 'Library', icon: BookOpen, isSelected: true },
]

const details = [
  { label: 'Previous version', value: '4.1.0' },
  { label: 'FAR/DFARS baseline', value: 'FAC 2025-06' },
  { label: 'Minimum GCA version', value: '4.1' },
  { label: 'Imported by', value: 'Privilege User' },
  { label: 'Imported on', value: 'Oct 23, 2026 8:12 PM' },
]

const sections = [
  { label: 'Rules', value: '1,184' },
  { label: 'Questions', value: '412' },
  { label: 'Questionnaires', value: '1' },
]

const changes = [
  { label: 'Rules', added: 43, changed: 118, retired: 6 },
  { label: 'Questions', added: 12, changed: 9, retired: 2 },
  { label: 'Questionnaire placements', added: 12, changed: 9, retired: 2 },
]

type ChangeKind = 'Created' | 'Updated' | 'Retired' | 'Unchanged'

interface ImportedRule {
  id: number
  /** Clause number, e.g. "FAR 52.219-9 Alt II". */
  clause: string
  /** Rule name without the clause prefix. */
  name: string
  change: ChangeKind
  version: string
}

interface ImportedQuestion {
  id: number
  name: string
  type: 'Radio Button' | 'Dropdown'
  change: ChangeKind
  version: string
}

interface ImportedQuestionnaire {
  id: number
  name: string
  description: string
  isDefault: boolean
  change: ChangeKind
  version: string
}

const importedRules: ImportedRule[] = [
  { id: 1, clause: 'FAR 52.219-9 Alt II', name: 'Small Business Subcontracting Plan Inclusion', change: 'Created', version: '4.1.2' },
  { id: 2, clause: 'FAR 52.204-21', name: 'Basic Safeguarding of Covered Contractor Information Systems Inclusion', change: 'Updated', version: '4.1.0 → 4.1.2' },
  { id: 3, clause: 'FAR 52.219-14', name: 'Limitations on Subcontracting Inclusion', change: 'Updated', version: '4.1.0 → 4.1.2' },
  { id: 4, clause: 'DFARS 252.204-7008', name: 'Compliance with Safeguarding Covered Defense Information Controls Inclusion', change: 'Retired', version: '4.1.2' },
  { id: 5, clause: 'FAR 52.212-4', name: 'Commercial Products Baseline', change: 'Unchanged', version: '4.1.0' },
  { id: 6, clause: 'FAR 52.222-50', name: 'Combating Trafficking in Persons', change: 'Created', version: '4.1.2' },
  { id: 7, clause: 'FAR 52.222-26', name: 'Equal Opportunity', change: 'Updated', version: '4.1.0 → 4.1.2' },
  { id: 8, clause: 'FAR 52.225-1', name: 'Buy American—Supplies', change: 'Created', version: '4.1.2' },
  { id: 9, clause: 'FAR 52.232-33', name: 'Payment by Electronic Funds Transfer', change: 'Unchanged', version: '4.1.0' },
  { id: 10, clause: 'FAR 52.249-2', name: 'Termination for Convenience', change: 'Updated', version: '4.1.0 → 4.1.2' },
  { id: 11, clause: 'DFARS 252.225-7001', name: 'Buy American Balance of Payments', change: 'Updated', version: '4.1.0 → 4.1.2' },
  { id: 12, clause: 'FAR 52.223-99', name: 'Legacy Chemicals Clause', change: 'Retired', version: '4.1.2' },
]

const importedQuestions: ImportedQuestion[] = [
  { id: 1, name: 'Will the contract involve covered defense information?', type: 'Radio Button', change: 'Retired', version: '4.1.2' },
  { id: 2, name: 'Does this acquisition require compliance banner verification?', type: 'Radio Button', change: 'Created', version: '4.1.2' },
  { id: 3, name: 'What is the primary contract type?', type: 'Dropdown', change: 'Updated', version: '4.1.0 → 4.1.2' },
  { id: 4, name: 'Is this a small business set-aside?', type: 'Radio Button', change: 'Unchanged', version: '4.1.0' },
  { id: 5, name: 'What is the primary place of performance?', type: 'Dropdown', change: 'Updated', version: '4.1.0 → 4.1.2' },
  { id: 6, name: 'Does the requirement include a security clearance?', type: 'Radio Button', change: 'Created', version: '4.1.2' },
  { id: 7, name: 'Identify the issuing Government Agency.', type: 'Dropdown', change: 'Updated', version: '4.1.0 → 4.1.2' },
  { id: 8, name: 'What is the NAICS code for this acquisition?', type: 'Dropdown', change: 'Created', version: '4.1.2' },
  { id: 9, name: 'Is this subject to the Trade Agreements Act?', type: 'Radio Button', change: 'Unchanged', version: '4.1.0' },
  { id: 10, name: 'Will Government Furnished Property be provided?', type: 'Radio Button', change: 'Unchanged', version: '4.1.0' },
]

const importedQuestionnaires: ImportedQuestionnaire[] = [
  {
    id: 1,
    name: 'GCA System Questionnaire',
    description: 'The default system questionnaire shipped with the OOTB library.',
    isDefault: true,
    change: 'Updated',
    version: '4.1.0 → 4.1.2',
  },
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
        {/* Record title */}
        <div className="shrink-0 border-b border-gray-200 bg-white px-8 pt-5">
          <HeadingField
            text="Library import 4.1.2"
            size="LARGE"
            headingTag="H1"
            fontWeight="SEMI_BOLD"
            marginBelow="LESS"
          />
          <div className="flex items-center gap-1.5 pb-3">
            {[
              { value: 'summary', label: 'Summary', active: true },
              { value: 'history', label: 'Import history', active: false },
            ].map(tab => (
              <button
                key={tab.value}
                type="button"
                aria-pressed={tab.active}
                className={
                  tab.active
                    ? 'rounded-md bg-blue-700 px-3 py-1 text-sm font-semibold text-white'
                    : 'rounded-md px-3 py-1 text-sm font-medium text-blue-700 hover:bg-blue-50'
                }
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-8 py-6">
          {/* Success banner */}
          <div
            className="mb-6 flex items-start gap-3 rounded-md px-4 py-3"
            style={{ backgroundColor: '#EAF7EC' }}
            role="status"
          >
            <CheckCircle2
              size={18}
              className="mt-0.5 shrink-0 text-green-700"
              aria-hidden="true"
            />
            <p className="text-sm text-gray-900">
              <span className="font-semibold">Import completed.</span> Library 4.1.2
              is installed. Library rules aren&apos;t on yet.
            </p>
          </div>

          <div className="grid w-full grid-cols-1 gap-6 lg:grid-cols-[20rem_minmax(0,1fr)]">
            {/* Left column: Details + Package contents */}
            <aside className="space-y-6">
              <section>
                <HeadingField
                  text="Details"
                  size="MEDIUM"
                  headingTag="H2"
                  fontWeight="SEMI_BOLD"
                  marginBelow="LESS"
                />
                <div className="rounded-md border border-gray-200 bg-white">
                  <div className="flex items-start gap-6 px-4 py-3">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-gray-500">
                        Status
                      </p>
                      <div className="mt-1">
                        <TagField
                          size="SMALL"
                          tags={[
                            {
                              text: 'Completed',
                              backgroundColor: '#D7F3E0',
                              textColor: '#166534',
                            },
                          ]}
                          marginBelow="NONE"
                        />
                      </div>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-gray-500">
                        Version
                      </p>
                      <p className="mt-1 text-sm font-medium text-gray-900">4.1.2</p>
                    </div>
                  </div>
                  <dl className="divide-y divide-gray-100 border-t border-gray-100">
                    {details.map(row => (
                      <div
                        key={row.label}
                        className="flex justify-between gap-4 px-4 py-2.5"
                      >
                        <dt className="text-sm text-gray-600">{row.label}</dt>
                        <dd className="text-sm font-medium text-gray-900">
                          {row.value}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </section>

              <section>
                <HeadingField
                  text="Package contents"
                  size="MEDIUM"
                  headingTag="H2"
                  fontWeight="SEMI_BOLD"
                  marginBelow="LESS"
                />
                <div className="rounded-md border border-gray-200 bg-white">
                  <dl className="divide-y divide-gray-100">
                    {sections.map(row => (
                      <div
                        key={row.label}
                        className="flex justify-between gap-4 px-4 py-2.5"
                      >
                        <dt className="text-sm text-gray-600">{row.label}</dt>
                        <dd className="text-sm font-medium text-gray-900">
                          {row.value}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </section>
            </aside>

            {/* Right column: Changes + imported items */}
            <div className="space-y-6">
              <section>
                <HeadingField
                  text="Changes applied"
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
                  <div className="grid grid-cols-1 divide-y divide-gray-200 md:grid-cols-3 md:divide-x md:divide-y-0">
                    {changes.map(group => (
                      <div key={group.label} className="px-4 py-1 first:pl-0 last:pr-0">
                        <p className="mb-1.5 text-xs uppercase tracking-wide text-gray-500">
                          {group.label}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <Pill tone="added" count={group.added} label="new" />
                          <Pill tone="changed" count={group.changed} label="changed" />
                          <Pill tone="retired" count={group.retired} label="retired" />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardLayout>
              </section>

              <section>
                <HeadingField
                  text="Imported items"
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
                  <TabsField
                    defaultValue="rules"
                    contentsPadding="LESS"
                    tabs={[
                      {
                        value: 'rules',
                        label: `Rules (${importedRules.length})`,
                        content: (
                          <ReadOnlyGrid
                            data={importedRules}
                            spacing="STANDARD"
                            borderStyle="LIGHT"
                            shadeAlternateRows={true}
                            pageSize={10}
                            pagingControls="ROW_COUNT"
                          >
                            <GridColumn
                              label="Rule"
                              value={row => {
                                const r = row as ImportedRule
                                return (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setLocation(`/library-rule/${r.id}`)
                                    }
                                    className="text-left font-medium text-blue-700 underline hover:text-blue-800"
                                  >
                                    {r.name}
                                  </button>
                                )
                              }}
                            />
                            <GridColumn
                              label="Clause"
                              value={row => (row as ImportedRule).clause}
                              width="MEDIUM"
                            />
                            <GridColumn
                              label="Change"
                              value={row => (
                                <ChangeBadge change={(row as ImportedRule).change} />
                              )}
                              width="NARROW"
                            />
                            <GridColumn
                              label="Version"
                              value={row => (row as ImportedRule).version}
                              width="NARROW_PLUS"
                            />
                          </ReadOnlyGrid>
                        ),
                      },
                      {
                        value: 'questions',
                        label: `Questions (${importedQuestions.length})`,
                        content: (
                          <ReadOnlyGrid
                            data={importedQuestions}
                            spacing="STANDARD"
                            borderStyle="LIGHT"
                            shadeAlternateRows={true}
                            pageSize={10}
                            pagingControls="ROW_COUNT"
                          >
                            <GridColumn
                              label="Question"
                              value={row => (row as ImportedQuestion).name}
                            />
                            <GridColumn
                              label="Response type"
                              value={row => (row as ImportedQuestion).type}
                              width="NARROW_PLUS"
                            />
                            <GridColumn
                              label="Change"
                              value={row => (
                                <ChangeBadge
                                  change={(row as ImportedQuestion).change}
                                />
                              )}
                              width="NARROW"
                            />
                            <GridColumn
                              label="Version"
                              value={row => (row as ImportedQuestion).version}
                              width="NARROW_PLUS"
                            />
                          </ReadOnlyGrid>
                        ),
                      },
                      {
                        value: 'questionnaires',
                        label: `Questionnaires (${importedQuestionnaires.length})`,
                        content: (
                          <ReadOnlyGrid
                            data={importedQuestionnaires}
                            spacing="STANDARD"
                            borderStyle="LIGHT"
                            shadeAlternateRows={true}
                            pageSize={10}
                            pagingControls="ROW_COUNT"
                          >
                            <GridColumn
                              label="Name"
                              value={row => {
                                const q = row as ImportedQuestionnaire
                                return (
                                  <span className="inline-flex items-center gap-2">
                                    <span>{q.name}</span>
                                    {q.isDefault && (
                                      <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-800">
                                        Default
                                      </span>
                                    )}
                                  </span>
                                )
                              }}
                            />
                            <GridColumn
                              label="Description"
                              value={row => (row as ImportedQuestionnaire).description}
                            />
                            <GridColumn
                              label="Change"
                              value={row => (
                                <ChangeBadge
                                  change={(row as ImportedQuestionnaire).change}
                                />
                              )}
                              width="NARROW"
                            />
                            <GridColumn
                              label="Version"
                              value={row => (row as ImportedQuestionnaire).version}
                              width="NARROW_PLUS"
                            />
                          </ReadOnlyGrid>
                        ),
                      },
                    ]}
                  />
                </CardLayout>
              </section>
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
    added: 'bg-green-50 text-green-800',
    changed: 'bg-amber-50 text-amber-800',
    retired: 'bg-red-50 text-red-800',
  }[tone]
  const symbol = { added: '+', changed: '~', retired: '−' }[tone]
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md px-2.5 py-0.5 text-xs font-medium ${styles}`}
    >
      <span aria-hidden="true">{symbol}</span>
      <span>
        {count} {label}
      </span>
    </span>
  )
}

function ChangeBadge({ change }: { change: ChangeKind }) {
  const styles = {
    Created: 'bg-green-50 text-green-800',
    Updated: 'bg-amber-50 text-amber-800',
    Retired: 'bg-red-50 text-red-800',
    Unchanged: 'bg-gray-50 text-gray-700',
  }[change]
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${styles}`}
    >
      {change}
    </span>
  )
}
