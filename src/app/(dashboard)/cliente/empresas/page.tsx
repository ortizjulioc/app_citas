'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import InputAdornment from '@mui/material/InputAdornment'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardActions from '@mui/material/CardActions'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Pagination from '@mui/material/Pagination'

interface Negocio {
  id: string
  nombre: string
  descripcion: string | null
  telefono: string | null
  email: string | null
  direccion: string | null
  categoriaServicio: string
  sucursals: { id: string; nombre: string }[]
}

const categorias = [
  { value: '', label: 'Todas las categorías' },
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

const categoriaColores: Record<string, string> = {
  SALUD: '#4caf50',
  BELLEZA: '#e91e63',
  AUTOMOTRIZ: '#2196f3',
  PROFESIONAL: '#9c27b0',
  EDUCACION: '#ff9800',
  HOGAR: '#795548',
  TECNOLOGIA: '#00bcd4',
  FITNESS: '#f44336',
  OTROS: '#607d8b'
}

export default function EmpresasPage() {
  const { isAuthenticated, hasRole, isLoading } = useAuth()
  const router = useRouter()

  const [negocios, setNegocios] = useState<Negocio[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [categoria, setCategoria] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const fetchNegocios = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('page', page.toString())
      params.set('limit', '12')
      if (search) params.set('search', search)
      if (categoria) params.set('categoria', categoria)

      const res = await fetch(`/api/public/negocios?${params}`)
      const data = await res.json()

      if (data.success) {
        setNegocios(data.data.negocios)
        setTotalPages(data.data.pagination.totalPages)
      }
    } catch (error) {
      console.error('Error fetching negocios:', error)
    } finally {
      setLoading(false)
    }
  }, [page, search, categoria])

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !hasRole('cliente'))) {
      router.push('/login')
    }
  }, [isAuthenticated, hasRole, isLoading, router])

  useEffect(() => {
    if (isAuthenticated && hasRole('cliente')) {
      fetchNegocios()
    }
  }, [isAuthenticated, hasRole, fetchNegocios])

  if (isLoading || !isAuthenticated || !hasRole('cliente')) {
    return (
      <Box display='flex' justifyContent='center' alignItems='center' minHeight='100vh'>
        <CircularProgress />
      </Box>
    )
  }

  const formatTime = (time: string) => {
    if (!time) return 'No disponible'
    const [hours, minutes] = time.split(':')
    return `${hours}:${minutes}`
  }

  const formatDias = (dias: string[] | undefined) => {
    if (!dias || dias.length === 0) return 'No disponible'
    const diasMap: Record<string, string> = {
      LUNES: 'Lun',
      MARTES: 'Mar',
      MIERCOLES: 'Mié',
      JUEVES: 'Jue',
      VIERNES: 'Vie',
      SABADO: 'Sáb',
      DOMINGO: 'Dom'
    }
    return dias.map(d => diasMap[d] || d).join(', ')
  }

  return (
    <Box p={4}>
      <Typography variant='h4' gutterBottom>
        Empresas
      </Typography>
      <Typography variant='body1' color='text.secondary' sx={{ mb: 4 }}>
        Encuentra la empresa que buscas y agenda tu cita
      </Typography>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            placeholder='Buscar empresas...'
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position='start'>
                    <i className='tabler-search' />
                  </InputAdornment>
                )
              }
            }}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <FormControl fullWidth>
            <InputLabel>Categoría</InputLabel>
            <Select
              value={categoria}
              label='Categoría'
              onChange={(e) => {
                setCategoria(e.target.value)
                setPage(1)
              }}
            >
              {categorias.map((cat) => (
                <MenuItem key={cat.value} value={cat.value}>
                  {cat.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={2}>
          <Button
            fullWidth
            variant='outlined'
            onClick={() => {
              setSearch('')
              setCategoria('')
              setPage(1)
            }}
          >
            Limpiar
          </Button>
        </Grid>
      </Grid>

      {loading ? (
        <Box display='flex' justifyContent='center' py={8}>
          <CircularProgress />
        </Box>
      ) : negocios.length === 0 ? (
        <Box textAlign='center' py={8}>
          <Typography variant='h6' color='text.secondary'>
            No se encontraron empresas
          </Typography>
        </Box>
      ) : (
        <>
          <Grid container spacing={3}>
            {negocios.map((negocio) => (
              <Grid item xs={12} sm={6} md={4} key={negocio.id}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box display='flex' justifyContent='space-between' alignItems='start' mb={2}>
                      <Typography variant='h6' component='div'>
                        {negocio.nombre}
                      </Typography>
                      <Chip
                        label={negocio.categoriaServicio}
                        size='small'
                        sx={{
                          bgcolor: categoriaColores[negocio.categoriaServicio] || '#607d8b',
                          color: 'white'
                        }}
                      />
                    </Box>

                    {negocio.descripcion && (
                      <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
                        {negocio.descripcion}
                      </Typography>
                    )}

                    <Box sx={{ mb: 2 }}>
                      {negocio.direccion && (
                        <Typography variant='caption' display='block' color='text.secondary'>
                          <i className='tabler-map-pin' /> {negocio.direccion}
                        </Typography>
                      )}
                      {negocio.sucursals.length > 0 && (
                        <Typography variant='caption' display='block' color='text.secondary'>
                          <i className='tabler-building-store' /> {negocio.sucursals.length} sucursal(es)
                        </Typography>
                      )}
                    </Box>
                  </CardContent>
                  <CardActions>
                    <Button
                      fullWidth
                      variant='contained'
                      onClick={() => router.push(`/cliente/empresas/${negocio.id}`)}
                    >
                      Ver detalles
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>

          {totalPages > 1 && (
            <Box display='flex' justifyContent='center' mt={4}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={(_, value) => setPage(value)}
                color='primary'
              />
            </Box>
          )}
        </>
      )}
    </Box>
  )
}