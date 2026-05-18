'use client'

import { useState } from 'react'
import {
  Button,
  Menu,
  MenuItem,
  CircularProgress,
  Typography,
  Box
} from '@mui/material'
import { useSucursal } from '@/contexts/SucursalContext'
import { useAuth } from '@/contexts/AuthContext'

const SucursalSelector = () => {
  const { sucursales, sucursalSeleccionada, setSucursalSeleccionada, isLoading } = useSucursal()
  const { hasRole } = useAuth()
  
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)

  // Solo mostrar el selector si es admin y hay sucursales
  if (!hasRole('admin')) return null

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', ml: 2, mr: 2 }}>
        <CircularProgress size={20} />
      </Box>
    )
  }

  if (sucursales.length === 0) {
    return null
  }

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  const handleSelect = (sucursal: any) => {
    setSucursalSeleccionada(sucursal)
    handleClose()
  }

  return (
    <>
      <Button
        variant="text"
        onClick={handleClick}
        sx={{ 
          textTransform: 'none',
          color: 'text.primary',
          display: 'flex',
          alignItems: 'center',
          gap: 1
        }}
      >
        <i className='tabler-building-store text-[22px]' />
        <Typography variant="body1" sx={{ display: { xs: 'none', sm: 'block' }, fontWeight: 500 }}>
          {sucursalSeleccionada?.nombre || 'Seleccionar Sucursal'}
        </Typography>
        <i className='tabler-chevron-down text-[16px]' />
      </Button>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        PaperProps={{
          elevation: 3,
          sx: {
            mt: 1.5,
            minWidth: 200,
            borderRadius: 2
          }
        }}
      >
        {sucursales.map((sucursal) => (
          <MenuItem 
            key={sucursal.id} 
            onClick={() => handleSelect(sucursal)}
            selected={sucursalSeleccionada?.id === sucursal.id}
            sx={{
              py: 1.5,
              px: 2,
              '&.Mui-selected': {
                backgroundColor: 'primary.light',
                color: 'primary.main',
                '&:hover': {
                  backgroundColor: 'primary.light',
                }
              }
            }}
          >
            {sucursal.nombre}
          </MenuItem>
        ))}
      </Menu>
    </>
  )
}

export default SucursalSelector
