import { useState, useEffect, useMemo } from 'react'
import { useLocation } from 'wouter'
import {
  SiteNav,
  HeadingField,
  CardLayout,
  ReadOnlyGrid,
  GridColumn,
  ButtonWidget,
  ButtonArrayLayout,
  TextField,
  DropdownField,
  RichTextDisplayField,
  TextItem,
  TagField,
  MessageBanner,
} from '@pglevy/sailwind'
import {
  LayoutGrid,
  List,
  Layers,
  CircleHelp,
  Shuffle,
} from 'lucide-react'
import {
  getRules,
  formatRuleTimestamp,
  formatRuleConditions,
  type Rule,
} from '../db/rules'
import { getPendingLibraryReviewCount } from '../db/library-rule-reviews'

const navPages = [
  { label: 'Clause Sets', icon: LayoutGrid },
  { label: 'Clauses', icon: List },
  { label: 'Templates', icon: Layers },
  { label: 'Questionnaires', icon: CircleHelp },
  { label: 'Rules', icon: Shuffle, isSelected: true },
]

const statusChoices = ['Active', 'Inactive']

type DisplayStatus = 'Active' | 'Inactive'

const statusTagColors: Record<DisplayStatus, { background: string; text: string }> = {
  Active: { background: '#D7F3E0', text: '#166534' },
  Inactive: { background: '#FDE2E2', text: '#991B1B' },
}

/** The data layer uses "Draft" for not-yet-active rules; display as "Inactive". */
const displayStatus = (status: Rule['status']): DisplayStatus =>
  status === 'Active' ? 'Active' : 'Inactive'

/** Display Source: data layer "Standard" → "System". */
const displaySource = (source: Rule['source']): string =>
  source === 'Standard' ? 'System' : 'Custom'

/**
 * Pulls a FAR/DFARS clause number off the start of a rule name. Rules without
 * a leading clause reference return an empty string so the Clause column
 * stays blank for them.
 */
const CLAUSE_RE = /^(FAR|DFARS)\s+[\d.\-A-Za-z]+(?:\s+Alt\s+[IVX]+)?/i
function splitRuleName(name: string): { clause: string; title: string } {
  const match = name.match(CLAUSE_RE)
  if (!match) return { clause: '', title: name }
  return { clause: match[0], title: name.slice(match[0].length).trim() }
}

/**
 * A row displayed in the grid. If a rule has both included and excluded
 * clauses, it becomes two rows: one for the included side, one for the
 * excluded side.
 */
interface RuleRow {
  key: string
  rule: Rule
  side: 'Included' | 'Excluded' | null
  includedClauses: number
  excludedClauses: number
}

/** Explode rules into one row per clause side when a rule has both. */
function expandRows(rules: Rule[]): RuleRow[] {
  const rows: RuleRow[] = []
  for (const rule of rules) {
    const hasInc = rule.includedClauses > 0
    const hasExc = rule.excludedClauses > 0
    if (hasInc && hasExc) {
      rows.push({
        key: `${rule.id}-inc`,
        rule,
        side: 'Included',
        includedClauses: rule.includedClauses,
        excludedClauses: 0,
      })
      rows.push({
        key: `${rule.id}-exc`,
        rule,
        side: 'Excluded',
        includedClauses: 0,
        excludedClauses: rule.excludedClauses,
      })
    } else {
      rows.push({
        key: `${rule.id}`,
        rule,
        side: null,
        includedClauses: rule.includedClauses,
        excludedClauses: rule.excludedClauses,
      })
    }
  }
  return rows
}

export default function Rules() {
  const [, setLocation] = useLocation()
  const [rules, setRules] = useState<Rule[]>([])
  const [loading, setLoading] = useState(true)
  const [searchInput, setSearchInput] = useState('')
  const [appliedSearch, setAppliedSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('Any')
  const [pendingReviewCount, setPendingReviewCount] = useState(0)

  useEffect(() => {
    getRules().then(data => {
      setRules(data)
      setLoading(false)
    })
    getPendingLibraryReviewCount().then(setPendingReviewCount)
  }, [])

  // Refresh the pending count whenever the user navigates back here, so
  // decisions made during the review flow collapse the banner.
  useEffect(() => {
    const refresh = () => getPendingLibraryReviewCount().then(setPendingReviewCount)
    window.addEventListener('focus', refresh)
    return () => window.removeEventListener('focus', refresh)
  }, [])

  const filteredRows = useMemo(() => {
    const term = appliedSearch.trim().toLowerCase()
    const matching = rules.filter(rule => {
      const matchesSearch = term === '' || rule.name.toLowerCase().includes(term)
      const matchesStatus =
        statusFilter === 'Any' || displayStatus(rule.status) === statusFilter
      return matchesSearch && matchesStatus
    })
    return expandRows(matching)
  }, [rules, appliedSearch, statusFilter])

  const handleSearch = () => setAppliedSearch(searchInput)

  const handleRefresh = async () => {
    setSearchInput('')
    setAppliedSearch('')
    setStatusFilter('Any')
    setRules(await getRules())
  }

  return (
    <div className="flex h-screen bg-white">
      <SiteNav
        displayName="Clause Automation"
        pages={navPages}
        userName="Arun Ganesh"
        appianLogoSrc="/images/icon-appian-header.png"
        highlightColor="#C7C4F4"
      />

      <main className="flex-1 overflow-y-auto border-l border-gray-200">
        <div className="px-8 py-6">
          <div className="flex items-start justify-between gap-6 mb-6">
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
                    text="Create conditional rules to include or exclude clauses based on clause set data"
                    color="SECONDARY"
                    size="STANDARD"
                  />,
                ]}
                marginBelow="NONE"
              />
            </div>

            <div className="shrink-0">
              <ButtonArrayLayout
                align="END"
                buttons={[
                  {
                    label: 'Create Rule',
                    style: 'OUTLINE',
                    color: 'ACCENT',
                    icon: 'Plus',
                    iconPosition: 'START',
                    onClick: () => alert('Create Rule is not wired up in this prototype.'),
                  },
                  {
                    label: 'Create Rules with AI',
                    style: 'SOLID',
                    color: 'ACCENT',
                    icon: 'Sparkles',
                    iconPosition: 'START',
                    onClick: () => alert('Create Rules with AI is not wired up in this prototype.'),
                  },
                ]}
              />
            </div>
          </div>

          {pendingReviewCount > 0 && (
            <div className="mb-6">
              <MessageBanner
                primaryText={`You have ${pendingReviewCount} new library ${pendingReviewCount === 1 ? 'rule' : 'rules'} from version 4.1.2.`}
                secondaryText="Review and accept each one to add it to your active rules."
                backgroundColor="INFO"
                highlightColor="INFO"
                icon="info"
                shape="SEMI_ROUNDED"
                buttons={[
                  {
                    label: 'Start review',
                    style: 'SOLID',
                    color: 'ACCENT',
                    onClick: () => setLocation('/library/rules-review'),
                  },
                ]}
                marginBelow="NONE"
              />
            </div>
          )}

          <CardLayout padding="STANDARD" showBorder={true} shape="SEMI_ROUNDED">
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
                onClick={handleSearch}
              />

              <div className="w-60 shrink-0">
                <DropdownField
                  label="STATUS"
                  labelPosition="ADJACENT"
                  placeholder="Any"
                  choiceLabels={statusChoices}
                  choiceValues={statusChoices}
                  value={statusFilter === 'Any' ? null : statusFilter}
                  saveInto={value => setStatusFilter(value ?? 'Any')}
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
              data={filteredRows}
              pageSize={10}
              pagingControls="ROW_COUNT"
              borderStyle="LIGHT"
              rowHeader={0}
              emptyGridMessage={
                loading ? 'Loading rules...' : 'No rules match your search.'
              }
              accessibilityText="Rules that include or exclude clauses based on clause set data"
            >
              <GridColumn
                label="Rule"
                width="WIDE"
                value={(row: RuleRow) => {
                  const { title } = splitRuleName(row.rule.name)
                  return (
                    <button
                      type="button"
                      onClick={() => setLocation(`/library-rule/${row.rule.id}`)}
                      className="text-left font-medium text-blue-700 underline hover:text-blue-800"
                    >
                      {title || row.rule.name}
                    </button>
                  )
                }}
              />
              <GridColumn
                label="Clause"
                width="MEDIUM"
                value={(row: RuleRow) => splitRuleName(row.rule.name).clause}
              />
              <GridColumn
                label="Source"
                width="NARROW"
                value={(row: RuleRow) => displaySource(row.rule.source)}
              />
              <GridColumn
                label="Status"
                width="NARROW"
                value={(row: RuleRow) => {
                  const s = displayStatus(row.rule.status)
                  return (
                    <TagField
                      size="SMALL"
                      tags={[
                        {
                          text: s,
                          backgroundColor: statusTagColors[s].background,
                          textColor: statusTagColors[s].text,
                        },
                      ]}
                      marginBelow="NONE"
                    />
                  )
                }}
              />
              <GridColumn
                label="Conditions"
                width="MEDIUM"
                value={(row: RuleRow) => formatRuleConditions(row.rule)}
              />
              <GridColumn
                label="Included Clauses"
                width="NARROW"
                align="CENTER"
                value={(row: RuleRow) => row.includedClauses}
              />
              <GridColumn
                label="Excluded Clauses"
                width="NARROW"
                align="CENTER"
                value={(row: RuleRow) => row.excludedClauses}
              />
              <GridColumn
                label="Last Updated"
                width="MEDIUM_PLUS"
                value={(row: RuleRow) => (
                  <RichTextDisplayField
                    value={[
                      <TextItem
                        key="updated"
                        text={formatRuleTimestamp(row.rule.lastUpdated)}
                      />,
                    ]}
                    preventWrapping={true}
                    marginBelow="NONE"
                  />
                )}
              />
              <GridColumn
                label="Edit"
                width="ICON"
                align="CENTER"
                value={(row: RuleRow) => (
                  <ButtonWidget
                    style="GHOST"
                    color="ACCENT"
                    size="SMALL"
                    icon="Pencil"
                    tooltip="Edit rule"
                    accessibilityText={`Edit ${row.rule.name}`}
                    onClick={() => alert(`Edit rule: ${row.rule.name}`)}
                  />
                )}
              />
            </ReadOnlyGrid>
          </CardLayout>
        </div>
      </main>
    </div>
  )
}
