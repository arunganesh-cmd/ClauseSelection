import { useLocation } from 'wouter'
import {
  SiteNav,
  HeadingField,
  RichTextDisplayField,
  TextItem,
  ButtonWidget,
  CardLayout,
} from '@pglevy/sailwind'
import { LayoutGrid, List, Layers, CircleHelp, Shuffle, BookOpen } from 'lucide-react'

/**
 * Library page.
 *
 * Empty state for the OOTB Rules & Questions library. The customer downloads
 * the latest package from Forum, then imports it here. Button hierarchy is
 * reversed on the empty state (Forum download = primary, Import library =
 * secondary) because downloading is the required first step.
 */

const navPages = [
  { label: 'Clause Sets', icon: LayoutGrid },
  { label: 'Clauses', icon: List },
  { label: 'Templates', icon: Layers },
  { label: 'Questionnaires', icon: CircleHelp },
  { label: 'Rules', icon: Shuffle },
  { label: 'Library', icon: BookOpen, isSelected: true },
]

export default function Library() {
  const [, setLocation] = useLocation()
  const goToImport = () => setLocation('/library/import')
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
        {/* Page header */}
        <div className="shrink-0 border-b border-gray-200 bg-white px-8 py-5">
          <HeadingField
            text="Library"
            size="LARGE"
            headingTag="H1"
            fontWeight="REGULAR"
            marginBelow="NONE"
          />
          <RichTextDisplayField
            value={[
              <TextItem
                key="subtitle"
                text="Import and manage the OOTB Rules & Questions Library."
                color="SECONDARY"
                size="STANDARD"
              />,
            ]}
            marginBelow="NONE"
          />
        </div>

        {/* Empty state */}
        <div className="min-h-0 flex-1 overflow-y-auto px-8 py-8">
          <div className="mx-auto max-w-2xl">
          <CardLayout
            padding="EVEN_MORE"
            shape="SEMI_ROUNDED"
            style="#FFFFFF"
            showBorder={true}
            marginBelow="NONE"
          >
            <div className="flex flex-col items-center py-10">
              <div
                className="mb-4 flex h-16 w-16 items-center justify-center rounded-full"
                style={{ backgroundColor: '#E9E9FE' }}
              >
                <BookOpen
                  size={32}
                  strokeWidth={2}
                  style={{ color: '#3938F2' }}
                  aria-hidden="true"
                />
              </div>
              <HeadingField
                text="No library installed"
                size="MEDIUM"
                headingTag="H2"
                fontWeight="SEMI_BOLD"
                marginBelow="LESS"
              />
              <RichTextDisplayField
                value={[
                  <TextItem
                    key="sub"
                    text="Download the latest package from Forum, then import it to get started."
                    color="SECONDARY"
                    size="STANDARD"
                  />,
                ]}
                align="CENTER"
                marginBelow="STANDARD"
              />
              <div className="flex items-center">
                <ButtonWidget
                  label="Import library"
                  icon="Upload"
                  iconPosition="START"
                  style="SOLID"
                  color="ACCENT"
                  onClick={goToImport}
                />
              </div>
            </div>
          </CardLayout>
          </div>
        </div>
      </main>
    </div>
  )
}
