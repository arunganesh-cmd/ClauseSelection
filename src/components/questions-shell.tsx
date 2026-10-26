import { useState, type ReactNode } from 'react'
import { TabsField } from '@pglevy/sailwind'
import AppNav from './app-nav'

/**
 * Shared frame for the Questions pages: site navigation on the left and the
 * Questionnaires / Questions tab bar on top. Pages render their content as children.
 */
export default function QuestionsShell({ children }: { children: ReactNode }) {
  const [activeTab, setActiveTab] = useState('questions')

  return (
    <div className="flex h-screen bg-white">
      <AppNav selected="Questionnaires" />

      <main className="flex-1 overflow-y-auto border-l border-gray-200 bg-gray-50">
        {/* Tab triggers only pad 24px per side by default; the variant widens them to 48px so the tabs read as wider blocks. */}
        <div className="[&_[role=tab]]:px-12">
          <TabsField
            tabs={[
              { value: 'questionnaires', label: 'Questionnaires' },
              { value: 'questions', label: 'Questions' },
            ]}
            value={activeTab}
            onValueChange={setActiveTab}
            variant="UNDERLINE"
            size="MEDIUM"
            navigationOnly={true}
            fullWidthSeparator={true}
          />
        </div>

        {children}
      </main>
    </div>
  )
}
