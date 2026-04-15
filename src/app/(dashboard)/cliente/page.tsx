import Typography from '@mui/material/Typography'

export default function ClientePage() {
  return (
    <div className='flex items-center justify-center bs-full'>
      <div className='flex flex-col items-center gap-4'>
        <Typography variant='h3'>¡Hola Cliente! 👋</Typography>
        <Typography>Bienvenido a tu panel de gestión de citas.</Typography>
      </div>
    </div>
  )
}
