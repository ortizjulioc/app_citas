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
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'

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
  const [isConfirmPasswordShown, setIsConfirmPasswordShown] = useState(false)
  const [confirmPassword, setConfirmPassword] = useState('')
  const [tipoRegistro, setTipoRegistro] = useState<'cliente' | 'empresa'>('cliente')
  const [step, setStep] = useState(1)

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
    direccion: '',
    categoriaServicio: '',
    sucursal: ''
  })

  const categorias = [
    { value: 'SALUD', label: 'Salud' },
    { value: 'BELLEZA', label: 'Belleza' },
    { value: 'AUTOMOTRIZ', label: 'Automotriz' },
    { value: 'PROFESIONAL', label: 'Profesional' },
    { value: 'EDUCACION', label: 'Educación' },
    { value: 'HOGAR', label: 'Hogar' },
    { value: 'TECNOLOGIA', label: 'Tecnología' },
    { value: 'FITNESS', label: 'Fitness' },
    { value: 'OTROS', label: 'Otros' }
  ]

  const [isLoading, setIsLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateUser = () => {
    const newErrors: Record<string, string> = {}
    if (!formData.nombre.trim()) newErrors.nombre = 'Requerido'
    if (!formData.apellido.trim()) newErrors.apellido = 'Requerido'
    if (!formData.email.trim()) newErrors.email = 'Requerido'
    if (!formData.password) newErrors.password = 'Requerido'
    if (!confirmPassword) newErrors.confirmPassword = 'Requerido'
    else if (confirmPassword !== formData.password) newErrors.confirmPassword = 'Las contraseñas no coinciden'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validateEmpresa = (includeSucursal: boolean = false) => {
    const newErrors: Record<string, string> = {}
    if (!negocioData.nombre.trim()) newErrors.nombreNegocio = 'Requerido'
    if (!negocioData.categoriaServicio) newErrors.categoriaServicio = 'Requerido'
    if (includeSucursal && !negocioData.sucursal.trim()) {
      newErrors.sucursal = 'Requerido'
    }

    setErrors(prev => ({ ...prev, ...newErrors }))
    return Object.keys(newErrors).length === 0
  }

  const router = useRouter()
  const theme = useTheme()
  const hidden = useMediaQuery(theme.breakpoints.down('md'))

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()

    if (step === 1) {
      setStep(2)
      return
    }

    if (step === 2 && tipoRegistro === 'empresa') {
      if (validateUser()) setStep(3)
      return
    }

    if (step === 3 && tipoRegistro === 'empresa') {
      if (validateEmpresa(false)) setStep(4)
      return
    }

    if (step === 4 && tipoRegistro === 'empresa') {
      const isUserValid = validateUser()
      if (!isUserValid) return
      const isEmpresaValid = validateEmpresa(true)
      if (!isEmpresaValid) return
    }

    let isValid = validateUser()

    if (!isValid) return

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
    <div className='flex flex-col justify-center items-center min-bs-[100dvh] bg-backgroundPaper w-full'>
      <Logo />

      <div className='flex justify-center items-center bs-full is-full max-is-[800px] p-4 md:p-12 relative'>
        <div className='flex flex-col gap-4 is-full mbs-11 sm:mbs-14 md:mbs-0 max-h-[90vh] overflow-y-auto px-1 hide-scrollbar'>
          <div className='flex flex-col gap-1'>
            <Typography variant='h4'>{`Crea tu cuenta en ${themeConfig.templateName} 🚀`}</Typography>

            <Typography>Empieza a gestionar tus servicios de forma fácil</Typography>
          </div>

          <form noValidate autoComplete='off' onSubmit={handleRegister} className='flex flex-col gap-4'>
            {step === 1 && (
              <>
                <div className='flex flex-col gap-3 mbe-4'>
                  <Typography variant='subtitle2'>¿Qué tipo de cuenta deseas crear?</Typography>
                  <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                    <div
                      onClick={() => setTipoRegistro('cliente')}
                      className='cursor-pointer rounded-xl border-2 p-5 flex flex-col items-center gap-2 transition-all'
                      style={{
                        borderColor:
                          tipoRegistro === 'cliente' ? 'var(--mui-palette-primary-main)' : 'var(--mui-palette-divider)',
                        backgroundColor:
                          tipoRegistro === 'cliente'
                            ? 'var(--mui-palette-primary-lightOpacity, rgba(102, 108, 255, 0.08))'
                            : 'transparent'
                      }}
                    >
                      <div
                        className='flex justify-center items-center rounded-full p-3'
                        style={{
                          backgroundColor:
                            tipoRegistro === 'cliente'
                              ? 'var(--mui-palette-primary-main)'
                              : 'var(--mui-palette-action-selected)',
                          color: tipoRegistro === 'cliente' ? '#fff' : 'var(--mui-palette-text-secondary)'
                        }}
                      >
                        <i className='tabler-user text-3xl' />
                      </div>
                      <Typography variant='h6' color={tipoRegistro === 'cliente' ? 'primary.main' : 'text.primary'}>
                        Soy Cliente
                      </Typography>
                      <Typography variant='body2' align='center' color='text.secondary'>
                        Para reservar citas y servicios
                      </Typography>
                    </div>

                    <div
                      onClick={() => setTipoRegistro('empresa')}
                      className='cursor-pointer rounded-xl border-2 p-5 flex flex-col items-center gap-2 transition-all'
                      style={{
                        borderColor:
                          tipoRegistro === 'empresa' ? 'var(--mui-palette-primary-main)' : 'var(--mui-palette-divider)',
                        backgroundColor:
                          tipoRegistro === 'empresa'
                            ? 'var(--mui-palette-primary-lightOpacity, rgba(102, 108, 255, 0.08))'
                            : 'transparent'
                      }}
                    >
                      <div
                        className='flex justify-center items-center rounded-full p-3'
                        style={{
                          backgroundColor:
                            tipoRegistro === 'empresa'
                              ? 'var(--mui-palette-primary-main)'
                              : 'var(--mui-palette-action-selected)',
                          color: tipoRegistro === 'empresa' ? '#fff' : 'var(--mui-palette-text-secondary)'
                        }}
                      >
                        <i className='tabler-building-store text-3xl' />
                      </div>
                      <Typography variant='h6' color={tipoRegistro === 'empresa' ? 'primary.main' : 'text.primary'}>
                        Soy Empresa
                      </Typography>
                      <Typography variant='body2' align='center' color='text.secondary'>
                        Para gestionar mi negocio
                      </Typography>
                    </div>
                  </div>
                </div>
              </>
            )}

            {step === 2 && (
              <>
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
                    label='Teléfono (Opcional)'
                    placeholder='809-000-0000'
                    value={formData.telefono}
                    onChange={e => {
                      setFormData({ ...formData, telefono: e.target.value })
                      if (errors.telefono) setErrors(prev => ({ ...prev, telefono: '' }))
                    }}
                    error={!!errors.telefono}
                    helperText={errors.telefono}
                  />
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
                            <IconButton
                              edge='end'
                              onClick={() => setIsPasswordShown(!isPasswordShown)}
                              onMouseDown={e => e.preventDefault()}
                            >
                              <i className={isPasswordShown ? 'tabler-eye-off' : 'tabler-eye'} />
                            </IconButton>
                          </InputAdornment>
                        )
                      }
                    }}
                  />
                  <CustomTextField
                    fullWidth
                    label='Confirmar Contraseña *'
                    placeholder='············'
                    type={isConfirmPasswordShown ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={e => {
                      setConfirmPassword(e.target.value)
                      if (errors.confirmPassword) setErrors(prev => ({ ...prev, confirmPassword: '' }))
                    }}
                    error={!!errors.confirmPassword}
                    helperText={errors.confirmPassword}
                    slotProps={{
                      input: {
                        endAdornment: (
                          <InputAdornment position='end'>
                            <IconButton
                              edge='end'
                              onClick={() => setIsConfirmPasswordShown(!isConfirmPasswordShown)}
                              onMouseDown={e => e.preventDefault()}
                            >
                              <i className={isConfirmPasswordShown ? 'tabler-eye-off' : 'tabler-eye'} />
                            </IconButton>
                          </InputAdornment>
                        )
                      }
                    }}
                  />
                </div>
              </>
            )}

            {step === 3 && tipoRegistro === 'empresa' && (
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
                  <FormControl fullWidth error={!!errors.categoriaServicio}>
                    <InputLabel>Categoría del Servicio *</InputLabel>
                    <Select
                      value={negocioData.categoriaServicio}
                      label='Categoría del Servicio *'
                      onChange={e => {
                        setNegocioData({ ...negocioData, categoriaServicio: e.target.value as string })
                        if (errors.categoriaServicio) setErrors(prev => ({ ...prev, categoriaServicio: '' }))
                      }}
                    >
                      {categorias.map(cat => (
                        <MenuItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </MenuItem>
                      ))}
                    </Select>
                    {errors.categoriaServicio && (
                      <Typography variant='caption' color='error' sx={{ ml: 2, mt: 0.5 }}>
                        {errors.categoriaServicio}
                      </Typography>
                    )}
                  </FormControl>
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

            {step === 4 && tipoRegistro === 'empresa' && (
              <>
                <Divider className='my-2'>Datos de la Sucursal</Divider>
                <div className='grid grid-cols-1 gap-4'>
                  <CustomTextField
                    fullWidth
                    label='Nombre de la Sucursal *'
                    placeholder='Casa Matriz'
                    value={negocioData.sucursal}
                    onChange={e => {
                      setNegocioData({ ...negocioData, sucursal: e.target.value })
                      if (errors.sucursal) setErrors(prev => ({ ...prev, sucursal: '' }))
                    }}
                    error={!!errors.sucursal}
                    helperText={errors.sucursal}
                  />
                </div>
              </>
            )}

            <div className='flex gap-4 mt-2'>
              {(step === 2 || step === 3 || step === 4) && (
                <Button
                  fullWidth
                  variant='outlined'
                  type='button'
                  onClick={() => setStep(step - 1)}
                  disabled={isLoading}
                >
                  Atrás
                </Button>
              )}
              <Button fullWidth variant='contained' type='submit' disabled={isLoading}>
                {isLoading ? (
                  <CircularProgress size={24} color='inherit' />
                ) : step === 1 || (step === 2 && tipoRegistro === 'empresa') || (step === 3 && tipoRegistro === 'empresa') ? (
                  'Siguiente'
                ) : (
                  'Registrarse'
                )}
              </Button>
            </div>

            {step === 1 && (
              <div className='flex justify-center items-center flex-wrap gap-2'>
                <Typography>¿Ya tienes una cuenta?</Typography>
                <Typography component={Link} href='/login' color='primary.main'>
                  Iniciar Sesión
                </Typography>
              </div>
            )}
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
