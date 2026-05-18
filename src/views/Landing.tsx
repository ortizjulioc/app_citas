'use client'

import Link from 'next/link'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Container from '@mui/material/Container'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import { useTheme, alpha } from '@mui/material/styles'

const features = [
  { icon: 'tabler-calendar-check',  title: 'Agenda Online',    desc: 'Tus clientes reservan citas 24/7 desde cualquier dispositivo, sin llamadas.' },
  { icon: 'tabler-cash-register',   title: 'Caja y Cobros',    desc: 'Abre turnos, registra ventas y cuadra la caja al final del día.' },
  { icon: 'tabler-receipt',         title: 'Facturación',      desc: 'Genera facturas al finalizar cada cita. Soporte para comprobantes fiscales.' },
  { icon: 'tabler-users',           title: 'Equipo',           desc: 'Controla horarios, servicios y la agenda de todo tu equipo.' },
]

export default function Landing() {
  const theme = useTheme()

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', overflowX: 'hidden' }}>

      {/* ── NAV ─────────────────────────────────────────────── */}
      <Box component='nav' sx={{
        position: 'sticky', top: 0, zIndex: 100,
        bgcolor: alpha(theme.palette.background.paper, 0.9),
        backdropFilter: 'blur(8px)',
        borderBottom: `1px solid ${theme.palette.divider}`
      }}>
        <Container maxWidth='lg'>
          <Box display='flex' justifyContent='space-between' alignItems='center' py={2}>
            {/* Logo */}
            <Box display='flex' alignItems='center' gap={1.5}>
              <Box sx={{ 
                width: 34, height: 34, borderRadius: 1.5, 
                bgcolor: 'primary.main', display: 'flex', alignItems: 'center', justifyContent: 'center' 
              }}>
                <i className='tabler-calendar-check' style={{ fontSize: 18, color: 'white' }} />
              </Box>
              <Typography variant='h6' fontWeight={700} color='text.primary'>
                Vínculo
              </Typography>
            </Box>

            {/* Botones */}
            <Box display='flex' gap={2}>
              <Button component={Link} href='/login' variant='text' color='primary' sx={{ fontWeight: 600 }}>
                Iniciar sesión
              </Button>
              <Button component={Link} href='/register' variant='contained' color='primary' disableElevation sx={{ fontWeight: 600 }}>
                Registrarse
              </Button>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* ── HERO ────────────────────────────────────────────── */}
      <Box sx={{
        textAlign: 'center',
        pt: { xs: 10, md: 16 }, pb: { xs: 8, md: 12 },
      }}>
        <Container maxWidth='md'>
          <Typography variant='h2' fontWeight={800} color='text.primary' sx={{
            fontSize: { xs: '2.5rem', md: '3.5rem' }, lineHeight: 1.2, mb: 3
          }}>
            Gestión inteligente para tu negocio de servicios
          </Typography>

          <Typography variant='h6' color='text.secondary' sx={{ mb: 6, fontWeight: 400, maxWidth: 600, mx: 'auto' }}>
            Agenda, facturación y control de equipo en una sola plataforma. Diseñado para simplificar tu día a día.
          </Typography>

          <Box display='flex' gap={2} justifyContent='center' flexWrap='wrap'>
            <Button component={Link} href='/register' size='large' variant='contained' disableElevation
              sx={{ px: 4, py: 1.5, fontWeight: 600, fontSize: '1.1rem' }}>
              Comenzar gratis
            </Button>
            <Button component={Link} href='/login' size='large' variant='outlined'
              sx={{ px: 4, py: 1.5, fontWeight: 600, fontSize: '1.1rem' }}>
              Iniciar sesión
            </Button>
          </Box>
        </Container>
      </Box>

      {/* ── CARACTERÍSTICAS ─────────────────────────────────── */}
      <Box sx={{ py: { xs: 8, md: 12 }, bgcolor: 'background.paper', borderTop: `1px solid ${theme.palette.divider}` }}>
        <Container maxWidth='lg'>
          <Typography variant='h4' fontWeight={700} textAlign='center' mb={2} color='text.primary'>
            Todo lo que necesitas
          </Typography>
          <Typography textAlign='center' color='text.secondary' sx={{ mb: 8, fontSize: '1.1rem' }}>
            Las herramientas esenciales para hacer crecer tu negocio.
          </Typography>

          <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6'>
            {features.map((f, i) => (
              <Card key={i} elevation={0} sx={{
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 2, height: '100%',
              }}>
                <CardContent sx={{ p: 4 }}>
                  <Box sx={{
                    width: 48, height: 48, borderRadius: 2, mb: 3,
                    bgcolor: alpha(theme.palette.primary.main, 0.1), 
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'primary.main'
                  }}>
                    <i className={f.icon} style={{ fontSize: 24 }} />
                  </Box>
                  <Typography variant='h6' fontWeight={600} mb={1.5} color='text.primary'>{f.title}</Typography>
                  <Typography variant='body2' color='text.secondary' sx={{ lineHeight: 1.6, fontSize: '0.95rem' }}>{f.desc}</Typography>
                </CardContent>
              </Card>
            ))}
          </div>
        </Container>
      </Box>

      {/* ── CTA ─────────────────────────────────────────────── */}
      <Box sx={{ py: { xs: 10, md: 14 }, textAlign: 'center' }}>
        <Container maxWidth='sm'>
          <Typography variant='h3' fontWeight={700} mb={3} color='text.primary'>
            ¿Listo para empezar?
          </Typography>
          <Typography color='text.secondary' sx={{ mb: 5, fontSize: '1.1rem' }}>
            Únete y optimiza la gestión de tus citas hoy mismo.
          </Typography>
          <Button component={Link} href='/register' size='large' variant='contained' disableElevation
            sx={{ px: 5, py: 1.5, fontWeight: 600 }}>
            Crear cuenta
          </Button>
        </Container>
      </Box>

      {/* ── FOOTER ──────────────────────────────────────────── */}
      <Box component='footer' sx={{ borderTop: `1px solid ${theme.palette.divider}`, py: 4, bgcolor: 'background.paper' }}>
        <Container maxWidth='lg'>
          <Box display='flex' justifyContent='space-between' alignItems='center' flexWrap='wrap' gap={2}>
            <Box display='flex' alignItems='center' gap={1}>
              <Box sx={{ width: 24, height: 24, borderRadius: 1, bgcolor: 'primary.main', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <i className='tabler-calendar-check' style={{ fontSize: 14, color: 'white' }} />
              </Box>
              <Typography variant='body1' fontWeight={600} color='text.primary'>Vínculo</Typography>
            </Box>
            <Typography variant='body2' color='text.secondary'>
              © {new Date().getFullYear()} Vínculo.
            </Typography>
          </Box>
        </Container>
      </Box>

    </Box>
  )
}
