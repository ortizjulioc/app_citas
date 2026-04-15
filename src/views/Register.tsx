'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import useMediaQuery from '@mui/material/useMediaQuery'
import { styled, useTheme } from '@mui/material/styles'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Radio from '@mui/material/Radio'
import RadioGroup from '@mui/material/RadioGroup'
import FormControlLabel from '@mui/material/FormControlLabel'
import Snackbar from '@mui/material/Snackbar'
import Alert from '@mui/material/Alert'
import Divider from '@mui/material/Divider'

import type { SystemMode } from '@core/types'
import Link from '@components/Link'
import Logo from '@components/layout/shared/Logo'
import CustomTextField from '@core/components/mui/TextField'
import themeConfig from '@configs/themeConfig'

// Layout styled components removed to make the view wider

const Register = ({ mode }: { mode: SystemMode }) => {
  const [isPasswordShown, setIsPasswordShown] = useState(false)
  const [tipoRegistro, setTipoRegistro] = useState<'cliente' | 'empresa'>('cliente')
  
  // Usuario State
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    password: ''
  })
  
  // Negocio State
  const [negocioData, setNegocioData] = useState({
    nombre: '',
    descripcion: '',
    RNC: '',
    telefono: '',
    email: '',
    direccion: ''
  })

  const [isLoading, setIsLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = () => {
    const newErrors: Record<string, string> = {}
    if (!formData.nombre.trim()) newErrors.nombre = 'Requerido'
    if (!formData.apellido.trim()) newErrors.apellido = 'Requerido'
    if (!formData.email.trim()) newErrors.email = 'Requerido'
    if (!formData.telefono.trim()) newErrors.telefono = 'Requerido'
    if (!formData.password) newErrors.password = 'Requerido'
    
    if (tipoRegistro === 'empresa') {
      if (!negocioData.nombre.trim()) newErrors.nombreNegocio = 'Requerido'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const router = useRouter()
  const theme = useTheme()
  const hidden = useMediaQuery(theme.breakpoints.down('md'))

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setIsLoading(true)
    setErrorMsg(null)

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipoRegistro,
          usuario: formData,
          ...(tipoRegistro === 'empresa' && { negocio: negocioData })
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error?.message || data.message || 'Error al registrar')
      }

      router.push('/login')
    } catch (error: any) {
      setErrorMsg(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className='flex justify-center items-center min-bs-[100dvh] bg-backgroundPaper w-full'>
      <div className='flex justify-center items-center bs-full is-full max-is-[800px] p-4 md:p-12 relative'>
        <Link href='/' className='absolute block-start-5 sm:block-start-[33px] inline-start-6 sm:inline-start-[38px]'>
          <Logo />
        </Link>
        
        <div className='flex flex-col gap-4 is-full mbs-11 sm:mbs-14 md:mbs-0 max-h-[90vh] overflow-y-auto px-1 hide-scrollbar'>
          <div className='flex flex-col gap-1'>
            <Typography variant='h4'>{`Crea tu cuenta en ${themeConfig.templateName} 🚀`}</Typography>
            <Typography>Empieza a gestionar tus servicios de forma fácil</Typography>
          </div>
          
          <form noValidate autoComplete='off' onSubmit={handleRegister} className='flex flex-col gap-4'>
            
            <div className='flex flex-col gap-2'>
              <Typography variant="subtitle2">¿Qué tipo de cuenta deseas crear?</Typography>
              <RadioGroup
                row
                value={tipoRegistro}
                onChange={(e) => setTipoRegistro(e.target.value as 'cliente' | 'empresa')}
              >
                <FormControlLabel value="cliente" control={<Radio />} label="Soy Cliente" />
                <FormControlLabel value="empresa" control={<Radio />} label="Soy Empresa" />
              </RadioGroup>
            </div>
            
            <Divider className='my-2'>Datos del Usuario</Divider>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <CustomTextField
                fullWidth
                label='Nombre *'
                placeholder='Juan'
                value={formData.nombre}
                onChange={e => {
                  setFormData({ ...formData, nombre: e.target.value })
                  if (errors.nombre) setErrors(prev => ({ ...prev, nombre: '' }))
                }}
                error={!!errors.nombre}
                helperText={errors.nombre}
              />
              <CustomTextField
                fullWidth
                label='Apellido *'
                placeholder='Pérez'
                value={formData.apellido}
                onChange={e => {
                  setFormData({ ...formData, apellido: e.target.value })
                  if (errors.apellido) setErrors(prev => ({ ...prev, apellido: '' }))
                }}
                error={!!errors.apellido}
                helperText={errors.apellido}
              />
              <CustomTextField
                fullWidth
                label='Email *'
                type='email'
                placeholder='usuario@gmail.com'
                value={formData.email}
                onChange={e => {
                  setFormData({ ...formData, email: e.target.value })
                  if (errors.email) setErrors(prev => ({ ...prev, email: '' }))
                }}
                error={!!errors.email}
                helperText={errors.email}
              />
              <CustomTextField
                fullWidth
                label='Teléfono *'
                placeholder='809-000-0000'
                value={formData.telefono}
                onChange={e => {
                  setFormData({ ...formData, telefono: e.target.value })
                  if (errors.telefono) setErrors(prev => ({ ...prev, telefono: '' }))
                }}
                error={!!errors.telefono}
                helperText={errors.telefono}
              />
            </div>
            
            <CustomTextField
              fullWidth
              label='Contraseña *'
              placeholder='············'
              type={isPasswordShown ? 'text' : 'password'}
              value={formData.password}
              onChange={e => {
                setFormData({ ...formData, password: e.target.value })
                if (errors.password) setErrors(prev => ({ ...prev, password: '' }))
              }}
              error={!!errors.password}
              helperText={errors.password}
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position='end'>
                      <IconButton edge='end' onClick={() => setIsPasswordShown(!isPasswordShown)} onMouseDown={e => e.preventDefault()}>
                        <i className={isPasswordShown ? 'tabler-eye-off' : 'tabler-eye'} />
                      </IconButton>
                    </InputAdornment>
                  )
                }
              }}
            />

            {tipoRegistro === 'empresa' && (
              <>
                <Divider className='my-2'>Datos de la Empresa</Divider>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <CustomTextField
                    fullWidth
                    label='Nombre del Negocio *'
                    placeholder='Mi Tienda SRL'
                    value={negocioData.nombre}
                    onChange={e => {
                      setNegocioData({ ...negocioData, nombre: e.target.value })
                      if (errors.nombreNegocio) setErrors(prev => ({ ...prev, nombreNegocio: '' }))
                    }}
                    error={!!errors.nombreNegocio}
                    helperText={errors.nombreNegocio}
                  />
                  <CustomTextField
                    fullWidth
                    label='RNC (Opcional)'
                    placeholder='1-30-00000-1'
                    value={negocioData.RNC}
                    onChange={e => setNegocioData({ ...negocioData, RNC: e.target.value })}
                  />
                  <CustomTextField
                    fullWidth
                    label='Teléfono Empresa (Opcional)'
                    placeholder='809-000-0000'
                    value={negocioData.telefono}
                    onChange={e => setNegocioData({ ...negocioData, telefono: e.target.value })}
                  />
                  <CustomTextField
                    fullWidth
                    label='Email de la Empresa (Opcional)'
                    type='email'
                    placeholder='empresa@gmail.com'
                    value={negocioData.email}
                    onChange={e => setNegocioData({ ...negocioData, email: e.target.value })}
                  />
                  <CustomTextField
                    fullWidth
                    className='md:col-span-2'
                    label='Dirección Comercial (Opcional)'
                    placeholder='Av. Central #400'
                    value={negocioData.direccion}
                    onChange={e => setNegocioData({ ...negocioData, direccion: e.target.value })}
                  />
                </div>
              </>
            )}

            <Button fullWidth variant='contained' type='submit' disabled={isLoading}>
              {isLoading ? <CircularProgress size={24} color='inherit' /> : 'Registrarse'}
            </Button>
            
            <div className='flex justify-center items-center flex-wrap gap-2'>
              <Typography>¿Ya tienes una cuenta?</Typography>
              <Typography component={Link} href='/login' color='primary.main'>
                Iniciar Sesión
              </Typography>
            </div>
          </form>
        </div>
      </div>
      
      <Snackbar open={!!errorMsg} autoHideDuration={6000} onClose={() => setErrorMsg(null)}>
        <Alert onClose={() => setErrorMsg(null)} severity='error' sx={{ width: '100%' }}>
          {errorMsg}
        </Alert>
      </Snackbar>
    </div>
  )
}

export default Register
