import { Route, Router, Switch } from 'wouter'
import { useHashLocation } from 'wouter/use-hash-location'

import KanbanBoard from './pages/kanban-board'
import Home from './pages/home'
import NotFound from './pages/not-found'
import ValidateClauseSet from './pages/validate-clause-set'
import ValidateClauseSetOption2 from './pages/validate-clause-set-option-2'
import ValidateClauseSetOption3 from './pages/validate-clause-set-option-3'
import ValidateClauseSetOption4 from './pages/validate-clause-set-option-4'
import ValidateClauseSetOption5 from './pages/validate-clause-set-option-5'
import ValidateClauseSetEmpty from './pages/validate-clause-set-empty'
import AiClauseSelection from './pages/ai-clause-selection'
import AddSuggestedClauses from './pages/add-suggested-clauses'
import Rules from './pages/rules'
import RulesReview from './pages/rules-review'
import RuleReviewPage, { PendingRuleReviewPage } from './pages/rule-review'
import QuestionsLanding from './pages/questions-landing'
import Questions from './pages/questions'
import QuestionsReview from './pages/questions-review'
import ClauseHistory from './pages/clause-history'
import Library from './pages/library'
import LibraryImport from './pages/library-import'
import LibrarySummary from './pages/library-summary'

const pages = [
  { path: '/', title: 'Kanban Board', component: KanbanBoard },
  { path: '/home', title: 'Home', component: Home },
  { path: '/validate-clause-set', title: 'Validate Clause Set (Option 1)', component: ValidateClauseSet },
  { path: '/validate-clause-set-option-2', title: 'Validate Clause Set (Option 2)', component: ValidateClauseSetOption2 },
  { path: '/validate-clause-set-option-3', title: 'Validate Clause Set (Option 3)', component: ValidateClauseSetOption3 },
  { path: '/validate-clause-set-option-4', title: 'Validate Clause Set (Option 4)', component: ValidateClauseSetOption4 },
  { path: '/validate-clause-set-option-5', title: 'Validate Clause Set (Option 5)', component: ValidateClauseSetOption5 },
  { path: '/validate-clause-set-empty', title: 'Validate Clause Set (Empty States)', component: ValidateClauseSetEmpty },
  { path: '/ai-clause-selection', title: 'AI Clause Selection', component: AiClauseSelection },
  { path: '/add-suggested-clauses', title: 'Add Suggested Clauses', component: AddSuggestedClauses },
  { path: '/rules', title: 'Rules', component: Rules },
  { path: '/rules-review', title: 'Rules (Approval Status)', component: RulesReview },
  { path: '/rules-review/pending/:id', title: 'Pending Rule Review', component: PendingRuleReviewPage },
  { path: '/rules-review/:id', title: 'Rule Review', component: RuleReviewPage },
  { path: '/questions-landing', title: 'Questions Landing', component: QuestionsLanding },
  { path: '/questions', title: 'Questions', component: Questions },
  { path: '/questions-review', title: 'Review System Questions', component: QuestionsReview },
  { path: '/clause-history', title: 'Clause History', component: ClauseHistory },
  { path: '/library', title: 'Library', component: Library },
  { path: '/library/import', title: 'Import Library', component: LibraryImport },
  { path: '/library/import/summary', title: 'Library Import Summary', component: LibrarySummary },
]

function App() {
  return (
    <Router hook={useHashLocation}>
      <div className="min-h-screen bg-gray-50">
        <Switch>
          {pages.map(({ path, component: Component }) => (
            <Route key={path} path={path} component={Component} />
          ))}
          <Route component={NotFound} />
        </Switch>
      </div>
    </Router>
  )
}

export default App
