// Type Imports
import type { ChildrenType, Direction } from '@core/types'

// Context Imports
import { VerticalNavProvider } from '@menu/contexts/verticalNavContext'
import { SettingsProvider } from '@core/contexts/settingsContext'
import ThemeProvider from '@components/theme'
import { ConfirmDialogProvider } from '@/components/shared/confirm-dialog'
import { AuthProvider } from '@/contexts/AuthContext'
import { SucursalProvider } from '@/contexts/SucursalContext'

// Util Imports
import { getMode, getSettingsFromCookie, getSystemMode } from '@core/utils/serverHelpers'

type Props = ChildrenType & {
  direction: Direction
}

const Providers = async (props: Props) => {
  // Props
  const { children, direction } = props

  // Vars
  const mode = await getMode()
  const settingsCookie = await getSettingsFromCookie()
  const systemMode = await getSystemMode()

  return (
    <AuthProvider>
      <SucursalProvider>
        <VerticalNavProvider>
          <SettingsProvider settingsCookie={settingsCookie} mode={mode}>
            <ThemeProvider direction={direction} systemMode={systemMode}>
              <ConfirmDialogProvider>{children}</ConfirmDialogProvider>
            </ThemeProvider>
          </SettingsProvider>
        </VerticalNavProvider>
      </SucursalProvider>
    </AuthProvider>
  )
}

export default Providers
