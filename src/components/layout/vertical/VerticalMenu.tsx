'use client'

import { useAuth } from '@/contexts/AuthContext'
import { Menu, MenuItem } from '@menu/vertical-menu'
import PerfectScrollbar from 'react-perfect-scrollbar'
import type { VerticalMenuContextProps } from '@menu/components/vertical-menu/Menu'
import useVerticalNav from '@menu/hooks/useVerticalNav'
import StyledVerticalNavExpandIcon from '@menu/styles/vertical/StyledVerticalNavExpandIcon'
import menuItemStyles from '@core/styles/vertical/menuItemStyles'
import menuSectionStyles from '@core/styles/vertical/menuSectionStyles'
import { useTheme } from '@mui/material/styles'
import { usePathname } from 'next/navigation'

type RenderExpandIconProps = {
  open?: boolean
  transitionDuration?: VerticalMenuContextProps['transitionDuration']
}

type Props = {
  scrollMenu: (container: any, isPerfectScrollbar: boolean) => void
}

const RenderExpandIcon = ({ open, transitionDuration }: RenderExpandIconProps) => (
  <StyledVerticalNavExpandIcon open={open} transitionDuration={transitionDuration}>
    <i className='tabler-chevron-right' />
  </StyledVerticalNavExpandIcon>
)

const VerticalMenu = ({ scrollMenu }: Props) => {
  const theme = useTheme()
  const verticalNavOptions = useVerticalNav()
  const { isBreakpointReached, transitionDuration } = verticalNavOptions
  const { hasRole } = useAuth()
  const pathname = usePathname()

  const ScrollWrapper = isBreakpointReached ? 'div' : PerfectScrollbar

  const isAdmin = hasRole('admin')
  const isCliente = hasRole('cliente')
  const isEmpleado = hasRole('empleado')

  return (
    <ScrollWrapper
      {...(isBreakpointReached
        ? {
            className: 'bs-full overflow-y-auto overflow-x-hidden',
            onScroll: (container: any) => scrollMenu(container, false)
          }
        : {
            options: { wheelPropagation: false, suppressScrollX: true },
            onScrollY: (container: any) => scrollMenu(container, true)
          })}
    >
      <Menu
        popoutMenuOffset={{ mainAxis: 23 }}
        menuItemStyles={menuItemStyles(verticalNavOptions, theme)}
        renderExpandIcon={({ open }) => <RenderExpandIcon open={open} transitionDuration={transitionDuration} />}
        renderExpandedMenuItemIcon={{ icon: <i className='tabler-circle text-xs' /> }}
        menuSectionStyles={menuSectionStyles(verticalNavOptions, theme)}
      >
        {isCliente && (
          <>
            <MenuItem href='/cliente/empresas' icon={<i className='tabler-building-store' />}>
              Empresas
            </MenuItem>
            <MenuItem href='/cliente/citas' icon={<i className='tabler-calendar' />}>
              Mis Citas
            </MenuItem>
            <MenuItem href='/cliente/perfil' icon={<i className='tabler-user' />}>
              Perfil
            </MenuItem>
          </>
        )}

        {isEmpleado && (
          <>
            <MenuItem href='/empleado/citas' icon={<i className='tabler-calendar' />}>
              Mis Citas
            </MenuItem>
          </>
        )}

        {isAdmin && (
          <>
            <MenuItem href='/empresa' icon={<i className='tabler-smart-home' />}>
              Dashboard
            </MenuItem>
            <MenuItem href='/empresa/sucursales' icon={<i className='tabler-building-store' />}>
              Sucursales
            </MenuItem>
            <MenuItem href='/empresa/empleados' icon={<i className='tabler-users' />}>
              Empleados
            </MenuItem>
            <MenuItem href='/empresa/servicios' icon={<i className='tabler-scissors' />}>
              Servicios
            </MenuItem>
            <MenuItem href='/empresa/citas' icon={<i className='tabler-calendar' />}>
              Citas
            </MenuItem>
            <MenuItem href='/empresa/clientes' icon={<i className='tabler-user' />}>
              Clientes
            </MenuItem>
            <MenuItem href='/empresa/facturas' icon={<i className='tabler-receipt' />}>
              Facturación
            </MenuItem>
            <MenuItem href='/empresa/productos' icon={<i className='tabler-packages' />}>
              Productos
            </MenuItem>
            <MenuItem href='/empresa/caja' icon={<i className='tabler-cash' />}>
              Caja
            </MenuItem>
          </>
        )}

        {!isAdmin && !isCliente && !isEmpleado && (
          <>
            <MenuItem href='/' icon={<i className='tabler-smart-home' />}>
              Home
            </MenuItem>
            <MenuItem href='/about' icon={<i className='tabler-info-circle' />}>
              About
            </MenuItem>
          </>
        )}
      </Menu>
    </ScrollWrapper>
  )
}

export default VerticalMenu