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
} from '@pglevy/sailwind'
import {
  List,
  CircleHelp,
  Shuffle,
  Pencil,
} from 'lucide-react'
import {
  getRuleApprovals,
  formatRuleApprovalConditions,
  type RuleApproval,
  type RuleApprovalStatus,
  type RuleActiveStatus,
} from '../db/rule-approvals'
import { formatRuleTimestamp } from '../db/rules'

const navPages = [
  { label: 'Clauses', icon: List },
  { label: 'Questionnaires', icon: CircleHelp },
  { label: 'Rules', icon: Shuffle, isSelected: true },
]

const reviewStatusChoices: RuleApprovalStatus[] = ['Pending', 'Approved']
const activeStatusChoices: RuleActiveStatus[] = ['Active', 'Inactive']

const statusTagColors: Record<RuleApprovalStatus, { background: string; text: string }> = {
  Pending: { background: '#DBEAFE', text: '#1E40AF' },
  Approved: { background: '#D7F3E0', text: '#166534' },
}

export default function RulesReview() {
  const [, setLocation] = useLocation()
  const [rules, setRules] = useState<RuleApproval[]>([])
  const [loading, setLoading] = useState(true)
  const [searchInput, setSearchInput] = useState('')
  const [appliedSearch, setAppliedSearch] = useState('')
  const [reviewStatusFilter, setReviewStatusFilter] = useState<string | null>(null)
  const [activeStatusFilter, setActiveStatusFilter] = useState<string | null>(null)
  const [confirmingExport, setConfirmingExport] = useState(false)

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
      const matchesReviewStatus =
        reviewStatusFilter === null || rule.status === reviewStatusFilter
      const matchesActiveStatus =
        activeStatusFilter === null || rule.activeStatus === activeStatusFilter
      return matchesSearch && matchesReviewStatus && matchesActiveStatus
    })
  }, [rules, appliedSearch, reviewStatusFilter, activeStatusFilter])

  const handleRefresh = async () => {
    setSearchInput('')
    setAppliedSearch('')
    setReviewStatusFilter(null)
    setActiveStatusFilter(null)
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
                size="SMALL"
                icon="Box"
                iconPosition="START"
                onClick={() => setConfirmingExport(true)}
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

              <div className="w-64 shrink-0">
                <DropdownField
                  label="REVIEW STATUS"
                  labelPosition="ADJACENT"
                  placeholder="Any"
                  choiceLabels={reviewStatusChoices}
                  choiceValues={reviewStatusChoices}
                  value={reviewStatusFilter}
                  saveInto={value => setReviewStatusFilter(value ?? null)}
                  marginBelow="NONE"
                />
              </div>

              <div className="w-56 shrink-0">
                <DropdownField
                  label="STATUS"
                  labelPosition="ADJACENT"
                  placeholder="Any"
                  choiceLabels={activeStatusChoices}
                  choiceValues={activeStatusChoices}
                  value={activeStatusFilter}
                  saveInto={value => setActiveStatusFilter(value ?? null)}
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
                value="name"
              />
              <GridColumn
                label="Review Status"
                sortField="status"
                width="MEDIUM"
                align="START"
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
                label="Status"
                sortField="activeStatus"
                width="NARROW"
                align="START"
                value="activeStatus"
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
                label="Edit"
                width="ICON"
                align="CENTER"
                value={(row: RuleApproval) => (
                  <button
                    type="button"
                    onClick={() => setLocation(`/rules-review/${row.id}`)}
                    aria-label={`Edit ${row.name}`}
                    className="inline-flex items-center justify-center rounded p-1 text-blue-700 hover:bg-blue-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                  >
                    <Pencil size={18} aria-hidden="true" />
                  </button>
                )}
              />
            </ReadOnlyGrid>
          </CardLayout>
        </div>

        {confirmingExport && (
          <DialogField
            open={true}
            onOpenChange={open => {
              if (!open) setConfirmingExport(false)
            }}
            title="Export package?"
            width="MEDIUM"
            height="FIT"
            closeOnOutsideClick={false}
            marginBelow="NONE"
          >
            <p className="text-sm text-gray-600">
              Only rules in the <span className="font-semibold text-gray-900">Approved</span>{' '}
              status will be included in the package.
            </p>
            <hr className="-mx-6 mt-6 border-gray-200" />
            <div className="mt-4 flex items-center justify-between gap-3">
              <ButtonWidget
                label="CANCEL"
                style="OUTLINE"
                color="ACCENT"
                onClick={() => setConfirmingExport(false)}
              />
              <ButtonWidget
                label="EXPORT"
                style="SOLID"
                color="ACCENT"
                onClick={() => {
                  setConfirmingExport(false)
                  alert(
                    'Export started (not wired up in this prototype). Only Approved rules would be included.',
                  )
                }}
              />
            </div>
          </DialogField>
        )}
      </main>
    </div>
  )
}
