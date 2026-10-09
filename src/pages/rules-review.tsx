import { useState, useEffect, useMemo } from 'react'
import { useLocation } from 'wouter'
import {
  SiteNav,
  HeadingField,
  CardLayout,
  ReadOnlyGrid,
  GridColumn,
  ButtonWidget,
  TextField,
  DropdownField,
  RichTextDisplayField,
  TextItem,
  TagField,
  DialogField,
  CheckboxField,
  ToggleField,
} from '@pglevy/sailwind'
import {
  LayoutGrid,
  List,
  Layers,
  CircleHelp,
  Shuffle,
} from 'lucide-react'
import {
  getRuleApprovals,
  formatRuleApprovalConditions,
  type RuleApproval,
  type RuleApprovalStatus,
} from '../db/rule-approvals'
import { formatRuleTimestamp } from '../db/rules'

const navPages = [
  { label: 'Clause Sets', icon: LayoutGrid },
  { label: 'Clauses', icon: List },
  { label: 'Templates', icon: Layers },
  { label: 'Questionnaires', icon: CircleHelp },
  { label: 'Rules', icon: Shuffle, isSelected: true },
]

const statusChoices: RuleApprovalStatus[] = ['Accepted', 'Rejected', 'Pending']

const statusTagColors: Record<RuleApprovalStatus, { background: string; text: string }> = {
  Accepted: { background: '#D7F3E0', text: '#166534' },
  Rejected: { background: '#FDE2E2', text: '#991B1B' },
  Pending: { background: '#DBEAFE', text: '#1E40AF' },
}

const exportFormats = ['Appian App Package (.zip)', 'JSON', 'CSV']

export default function RulesReview() {
  const [, setLocation] = useLocation()
  const [rules, setRules] = useState<RuleApproval[]>([])
  const [loading, setLoading] = useState(true)
  const [exportOpen, setExportOpen] = useState(false)
  const [searchInput, setSearchInput] = useState('')
  const [appliedSearch, setAppliedSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string | null>(null)

  useEffect(() => {
    getRuleApprovals().then(data => {
      setRules(data)
      setLoading(false)
    })
  }, [])

  const filteredRules = useMemo(() => {
    const term = appliedSearch.trim().toLowerCase()
    return rules.filter(rule => {
      const matchesSearch = term === '' || rule.name.toLowerCase().includes(term)
      const matchesStatus = statusFilter === null || rule.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [rules, appliedSearch, statusFilter])

  const handleRefresh = async () => {
    setSearchInput('')
    setAppliedSearch('')
    setStatusFilter(null)
    // The data layer returns the same array each time, so copy it to trigger a re-render.
    setRules([...(await getRuleApprovals())])
  }

  return (
    <div className="flex h-screen bg-white">
      <SiteNav
        displayName="Clause Automation"
        pages={navPages}
        userName="Pradhima P M"
        appianLogoSrc="/images/icon-appian-header.png"
        highlightColor="#C7C4F4"
      />

      <main className="flex-1 overflow-y-auto border-l border-gray-200 bg-gray-50">
        <div className="border-b border-gray-200 bg-white px-8 py-6">
          <div className="flex items-start justify-between gap-6">
            <div>
              <HeadingField
                text="Rules"
                size="LARGE"
                headingTag="H1"
                fontWeight="REGULAR"
                marginBelow="EVEN_LESS"
              />
              <RichTextDisplayField
                value={[
                  <TextItem
                    key="subtitle"
                    text="Review the rules and accept them to add to the library"
                    color="SECONDARY"
                    size="STANDARD"
                  />,
                ]}
                marginBelow="NONE"
              />
            </div>
            <div className="shrink-0 pt-1">
              <ButtonWidget
                label="Export Package"
                style="OUTLINE"
                color="ACCENT"
                icon="Package"
                iconPosition="START"
                onClick={() => setExportOpen(true)}
              />
            </div>
          </div>
        </div>

        <div className="px-8 py-6">
          <CardLayout padding="STANDARD" showBorder={true} shape="SEMI_ROUNDED" style="#FFFFFF">
            <div className="flex items-center gap-3 mb-4 flex-nowrap">
              <div className="w-64 shrink-0">
                <TextField
                  label="Search Rules"
                  labelPosition="COLLAPSED"
                  placeholder="Search Rules"
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

              <div className="w-60 shrink-0">
                <DropdownField
                  label="STATUS"
                  labelPosition="ADJACENT"
                  placeholder="Any"
                  choiceLabels={statusChoices}
                  choiceValues={statusChoices}
                  value={statusFilter}
                  saveInto={value => setStatusFilter(value ?? null)}
                  marginBelow="NONE"
                />
              </div>

              <div className="ml-auto flex items-center gap-2 shrink-0">
                <ButtonWidget
                  style="OUTLINE"
                  color="SECONDARY"
                  icon="Download"
                  tooltip="Export"
                  accessibilityText="Export"
                  onClick={() => alert('Export is not wired up in this prototype.')}
                />
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

            <ReadOnlyGrid
              className="[&_tbody_td]:py-3"
              data={filteredRules}
              pageSize={10}
              pagingControls="ROW_COUNT"
              borderStyle="LIGHT"
              rowHeader={0}
              initialSorts={[{ field: 'lastUpdated', ascending: false }]}
              emptyGridMessage={loading ? 'Loading rules...' : 'No rules match your search.'}
              accessibilityText="Rules that include or exclude clauses based on clause set data, with approval status"
            >
              <GridColumn
                label="Name"
                sortField="name"
                width="WIDE"
                value={(row: RuleApproval) => (
                  <RichTextDisplayField
                    value={[
                      <TextItem
                        key="name"
                        text={row.name}
                        color="ACCENT"
                        link={() => setLocation(`/rules-review/${row.id}`)}
                        linkStyle="STANDALONE"
                      />,
                    ]}
                    marginBelow="NONE"
                  />
                )}
              />
              <GridColumn
                label="Status"
                sortField="status"
                width="NARROW"
                value={(row: RuleApproval) => (
                  <TagField
                    size="SMALL"
                    tags={[
                      {
                        text: row.status,
                        backgroundColor: statusTagColors[row.status].background,
                        textColor: statusTagColors[row.status].text,
                      },
                    ]}
                    marginBelow="NONE"
                  />
                )}
              />
              <GridColumn
                label="Conditions"
                sortField="conditions"
                width="MEDIUM"
                value={(row: RuleApproval) => formatRuleApprovalConditions(row)}
              />
              <GridColumn
                label="Included Clauses"
                sortField="includedClauses"
                width="MEDIUM"
                align="START"
                value="includedClauses"
              />
              <GridColumn
                label="Excluded Clauses"
                sortField="excludedClauses"
                width="MEDIUM"
                align="START"
                value="excludedClauses"
              />
              <GridColumn
                label="Last Updated"
                sortField="lastUpdated"
                width="MEDIUM_PLUS"
                align="END"
                value={(row: RuleApproval) => (
                  <RichTextDisplayField
                    value={[
                      <TextItem key="updated" text={formatRuleTimestamp(row.lastUpdated)} />,
                    ]}
                    align="RIGHT"
                    preventWrapping={true}
                    marginBelow="NONE"
                  />
                )}
              />
              <GridColumn
                label=""
                width="MEDIUM"
                align="START"
                value={(row: RuleApproval) =>
                  row.status === 'Pending' ? (
                    <RichTextDisplayField
                      value={[
                        <TextItem
                          key="start-review"
                          text="Start Review"
                          color="ACCENT"
                          link={() => setLocation(`/rules-review/${row.id}`)}
                          linkStyle="STANDALONE"
                        />,
                      ]}
                      preventWrapping={true}
                      marginBelow="NONE"
                    />
                  ) : (
                    '-'
                  )
                }
              />
            </ReadOnlyGrid>
          </CardLayout>
        </div>
      </main>

      {exportOpen && (
        <ExportPackageDialog
          rules={rules}
          onClose={() => setExportOpen(false)}
        />
      )}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Export Package dialog                                                      */
/* -------------------------------------------------------------------------- */

const scopeChoices: RuleApprovalStatus[] = ['Accepted', 'Pending', 'Rejected']
const environmentChoices = ['Development', 'Test', 'Production']

function ExportPackageDialog({
  rules,
  onClose,
}: {
  rules: RuleApproval[]
  onClose: () => void
}) {
  const today = new Date()
  const defaultName = `clause-rules-${today.toISOString().slice(0, 10)}`

  const [name, setName] = useState(defaultName)
  const [format, setFormat] = useState<string | null>(exportFormats[0])
  const [scope, setScope] = useState<RuleApprovalStatus[]>(['Accepted'])
  const [includeClauseText, setIncludeClauseText] = useState(true)
  const [includeHistory, setIncludeHistory] = useState(false)
  const [sendToEnv, setSendToEnv] = useState(false)
  const [targetEnv, setTargetEnv] = useState<string | null>('Development')
  const [exporting, setExporting] = useState(false)

  const selectedRules = rules.filter(r => scope.includes(r.status))
  const clauseCount = selectedRules.reduce(
    (sum, r) => sum + r.includedClauses + r.excludedClauses,
    0,
  )

  const handleDownload = async () => {
    setExporting(true)
    // Prototype only: pretend to package and let the dialog close.
    await new Promise(resolve => setTimeout(resolve, 600))
    setExporting(false)
    onClose()
    alert(
      `Package "${name}" prepared.\n\n${selectedRules.length} rules · ${clauseCount} clauses\nFormat: ${format}${
        sendToEnv ? `\nSent to: ${targetEnv}` : ''
      }`,
    )
  }

  return (
    <DialogField
      open={true}
      onOpenChange={open => {
        if (!open) onClose()
      }}
      title="Export Rules Package"
      description="Bundle rules and their clauses to share or deploy."
      width="MEDIUM"
      height="FIT"
      closeOnOutsideClick={false}
      marginBelow="NONE"
    >
      <div className="space-y-5">
        <TextField
          label="Package Name"
          required={true}
          value={name}
          saveInto={setName}
          marginBelow="NONE"
        />

        <DropdownField
          label="Format"
          required={true}
          choiceLabels={exportFormats}
          choiceValues={exportFormats}
          value={format}
          saveInto={setFormat}
          marginBelow="NONE"
        />

        <div>
          <CheckboxField
            label="Include Rules With Status"
            choiceLabels={scopeChoices}
            choiceValues={scopeChoices}
            value={scope}
            saveInto={value => setScope((value as RuleApprovalStatus[]) ?? [])}
            choiceLayout="COMPACT"
            marginBelow="NONE"
          />
        </div>

        <div className="space-y-3 rounded-md border border-gray-200 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-600">
            What to include
          </p>
          <ToggleField
            choiceLabel="Include full clause text"
            value={includeClauseText}
            saveInto={setIncludeClauseText}
            marginBelow="NONE"
          />
          <ToggleField
            choiceLabel="Include version history"
            value={includeHistory}
            saveInto={setIncludeHistory}
            marginBelow="NONE"
          />
          <ToggleField
            choiceLabel="Send to Appian environment after download"
            value={sendToEnv}
            saveInto={setSendToEnv}
            marginBelow="NONE"
          />
          {sendToEnv && (
            <div className="pt-2">
              <DropdownField
                label="Target Environment"
                choiceLabels={environmentChoices}
                choiceValues={environmentChoices}
                value={targetEnv}
                saveInto={setTargetEnv}
                marginBelow="NONE"
              />
            </div>
          )}
        </div>

        <hr className="border-gray-200" />
        <div className="flex items-center justify-between">
          <ButtonWidget
            label="CANCEL"
            style="LINK"
            color="ACCENT"
            disabled={exporting}
            onClick={onClose}
          />
          <ButtonWidget
            label={exporting ? 'PREPARING...' : 'DOWNLOAD PACKAGE'}
            style="SOLID"
            color="ACCENT"
            icon="Download"
            iconPosition="START"
            disabled={exporting || selectedRules.length === 0 || !name.trim()}
            onClick={handleDownload}
          />
        </div>
      </div>
    </DialogField>
  )
}
