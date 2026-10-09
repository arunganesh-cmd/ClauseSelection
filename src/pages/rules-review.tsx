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

export default function RulesReview() {
  const [, setLocation] = useLocation()
  const [rules, setRules] = useState<RuleApproval[]>([])
  const [loading, setLoading] = useState(true)
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
    </div>
  )
}
