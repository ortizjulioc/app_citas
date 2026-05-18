'use client'

import Link from 'next/link'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Container from '@mui/material/Container'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'

const PURPLE   = '#7C3AED'
const PURPLE_L = '#A78BFA'
const PURPLE_D = '#5B21B6'
const BG_DARK  = '#0F0A1E'
const BG_CARD  = '#1A1130'
const MUTED    = 'rgba(255,255,255,0.65)'

const features = [
  { icon: 'tabler-calendar-check',  title: 'Agenda Online',    desc: 'Tus clientes reservan citas 24/7 desde cualquier dispositivo, sin llamadas.' },
  { icon: 'tabler-cash-register',   title: 'Caja y Cobros',    desc: 'Abre turnos, registra ventas en efectivo o tarjeta y cuadra la caja al final del día.' },
  { icon: 'tabler-receipt',         title: 'Facturación',      desc: 'Las facturas se generan solas al finalizar cada cita. Con ITBIS si lo necesitas.' },
  { icon: 'tabler-users',           title: 'Empleados',        desc: 'Controla horarios, servicios por especialista y la agenda de todo tu equipo.' },
]

export default function Landing() {
  return (
    <Box sx={{ bgcolor: BG_DARK, color: 'white', minHeight: '100vh', overflowX: 'hidden' }}>

      {/* ── NAV ─────────────────────────────────────────────── */}
      <Box component='nav' sx={{
        position: 'sticky', top: 0, zIndex: 100,
        bgcolor: 'rgba(15,10,30,0.9)', backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)'
      }}>
        <Container maxWidth='lg'>
          <Box display='flex' justifyContent='space-between' alignItems='center' py={2}>
            {/* Logo */}
            <Box display='flex' alignItems='center' gap={1}>
              <Box sx={{ width: 34, height: 34, borderRadius: 1.5, bgcolor: PURPLE, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <i className='tabler-calendar-check' style={{ fontSize: 18, color: 'white' }} />
              </Box>
              <Typography variant='h6' fontWeight={800} sx={{
                background: `linear-gradient(90deg, #fff 0%, ${PURPLE_L} 100%)`,
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
              }}>
                Vínculo
              </Typography>
            </Box>

            {/* Botones */}
            <Box display='flex' gap={1.5}>
              <Button component={Link} href='/login' variant='outlined' size='small'
                sx={{ borderColor: 'rgba(255,255,255,0.18)', color: 'white', borderRadius: 2,
                  '&:hover': { borderColor: PURPLE_L, bgcolor: 'rgba(124,58,237,0.08)' } }}>
                Iniciar sesión
              </Button>
              <Button component={Link} href='/register' variant='contained' size='small'
                sx={{ bgcolor: PURPLE, borderRadius: 2, fontWeight: 700, '&:hover': { bgcolor: PURPLE_D } }}>
                Registrarse
              </Button>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* ── HERO ────────────────────────────────────────────── */}
      <Box sx={{
        position: 'relative', textAlign: 'center',
        pt: { xs: 12, md: 18 }, pb: { xs: 10, md: 16 },
        '&::before': {
          content: '""', position: 'absolute', top: '-30%', left: '50%', transform: 'translateX(-50%)',
          width: '120%', height: '100%',
          background: `radial-gradient(ellipse at center, rgba(124,58,237,0.28) 0%, transparent 65%)`,
          pointerEvents: 'none',
        }
      }}>
        <Container maxWidth='sm' sx={{ position: 'relative' }}>
          <Typography variant='h1' fontWeight={900} sx={{
            fontSize: { xs: '2.6rem', md: '3.8rem' }, lineHeight: 1.1, mb: 3,
            background: 'linear-gradient(135deg, #ffffff 20%, #c084fc 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
          }}>
            El sistema de citas para tu negocio
          </Typography>

          <Typography sx={{ color: 'rgba(255,255,255,0.75)', fontSize: '1.1rem', lineHeight: 1.8, mb: 5, maxWidth: 460, mx: 'auto' }}>
            Agenda, factura y maneja tu caja — todo desde un solo lugar. Sin complicaciones.
          </Typography>

          <Box display='flex' gap={2} justifyContent='center' flexWrap='wrap'>
            <Button component={Link} href='/register' size='large' variant='contained'
              sx={{
                bgcolor: PURPLE, px: 5, py: 1.8, fontWeight: 800, borderRadius: 3,
                boxShadow: `0 8px 32px rgba(124,58,237,0.45)`,
                '&:hover': { bgcolor: PURPLE_D, transform: 'translateY(-2px)', boxShadow: `0 12px 40px rgba(124,58,237,0.55)` },
                transition: 'all 0.2s'
              }}>
              Comenzar gratis →
            </Button>
            <Button component={Link} href='/login' size='large' variant='outlined'
              sx={{
                px: 4, py: 1.8, fontWeight: 700, borderRadius: 3,
                borderColor: 'rgba(255,255,255,0.18)', color: 'white',
                '&:hover': { borderColor: PURPLE_L, bgcolor: 'rgba(124,58,237,0.08)' }
              }}>
              Iniciar sesión
            </Button>
          </Box>

          <Typography sx={{ color: 'rgba(255,255,255,0.3)', mt: 2.5, fontSize: 13 }}>
            Sin tarjeta de crédito · Listo en menos de 5 minutos
          </Typography>
        </Container>
      </Box>

      {/* ── CARACTERÍSTICAS ─────────────────────────────────── */}
      <Box sx={{ py: { xs: 8, md: 12 } }}>
        <Container maxWidth='lg'>
          <Typography variant='h4' fontWeight={800} textAlign='center' mb={1}
            sx={{ background: 'linear-gradient(135deg, #fff 30%, #c084fc 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Todo lo que necesitas
          </Typography>
          <Typography textAlign='center' sx={{ color: 'rgba(255,255,255,0.7)', mb: 7 }}>
            Deja de usar WhatsApp y hojas de Excel. Vínculo lo integra todo.
          </Typography>

          <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4'>
            {features.map((f, i) => (
              <Card key={i} sx={{
                bgcolor: BG_CARD, border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 3, height: '100%',
                transition: 'all 0.2s',
                '&:hover': { borderColor: 'rgba(124,58,237,0.35)', transform: 'translateY(-4px)', boxShadow: '0 16px 40px rgba(0,0,0,0.4)' }
              }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{
                    width: 46, height: 46, borderRadius: 2, mb: 2.5,
                    bgcolor: 'rgba(124,58,237,0.14)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: '1px solid rgba(124,58,237,0.22)'
                  }}>
                    <i className={f.icon} style={{ fontSize: 22, color: PURPLE_L }} />
                  </Box>
                  <Typography variant='h6' fontWeight={700} mb={1} sx={{ color: '#fff' }}>{f.title}</Typography>
                  <Typography variant='body2' sx={{ color: MUTED, lineHeight: 1.7 }}>{f.desc}</Typography>
                </CardContent>
              </Card>
            ))}
          </div>
        </Container>
      </Box>

      {/* ── CTA ─────────────────────────────────────────────── */}
      <Box sx={{ py: { xs: 10, md: 14 }, position: 'relative', overflow: 'hidden' }}>
        <Box sx={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse at center, rgba(124,58,237,0.22) 0%, transparent 70%)`, pointerEvents: 'none' }} />
        <Container maxWidth='sm' sx={{ position: 'relative', textAlign: 'center' }}>
          <Typography variant='h3' fontWeight={900} mb={2}
            sx={{ background: 'linear-gradient(135deg, #fff 20%, #c084fc 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            ¿Listo para empezar?
          </Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.75)', mb: 4, lineHeight: 1.8 }}>
            Crea tu cuenta gratis y organiza tu negocio desde hoy.
          </Typography>
          <Button component={Link} href='/register' size='large' variant='contained'
            sx={{
              bgcolor: PURPLE, px: 6, py: 2, fontWeight: 800, borderRadius: 3,
              boxShadow: `0 8px 32px rgba(124,58,237,0.45)`,
              '&:hover': { bgcolor: PURPLE_D, transform: 'translateY(-2px)' }, transition: 'all 0.2s'
            }}>
            Crear mi cuenta gratis
          </Button>
        </Container>
      </Box>

      {/* ── FOOTER ──────────────────────────────────────────── */}
      <Box component='footer' sx={{ borderTop: '1px solid rgba(255,255,255,0.06)', py: 4 }}>
        <Container maxWidth='lg'>
          <Box display='flex' justifyContent='space-between' alignItems='center' flexWrap='wrap' gap={2}>
            <Box display='flex' alignItems='center' gap={1}>
              <Box sx={{ width: 28, height: 28, borderRadius: 1, bgcolor: PURPLE, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <i className='tabler-calendar-check' style={{ fontSize: 15, color: 'white' }} />
              </Box>
              <Typography variant='body2' fontWeight={700}>Vínculo</Typography>
            </Box>
            <Typography variant='body2' sx={{ color: MUTED, fontSize: 13 }}>
              © {new Date().getFullYear()} Vínculo · Hecho en República Dominicana 🇩🇴
            </Typography>
            <Box display='flex' gap={2.5}>
              {['Iniciar sesión', 'Registrarse'].map(l => (
                <Typography key={l} component={Link}
                  href={l === 'Iniciar sesión' ? '/login' : '/register'}
                  sx={{ color: MUTED, fontSize: 13, textDecoration: 'none', '&:hover': { color: 'white' }, transition: 'color 0.2s' }}>
                  {l}
                </Typography>
              ))}
            </Box>
          </Box>
        </Container>
      </Box>

    </Box>
  )
}
