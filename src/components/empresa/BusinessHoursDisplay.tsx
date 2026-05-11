'use client'

import React from 'react'
import { Box, Typography, Tooltip } from '@mui/material'

interface Horario {
  diaSemana: string
  horaInicio: string
  horaFin: string
  activo: boolean
}

interface Props {
  horarios: Horario[]
}

const DIAS_SEMANA_MAP: Record<string, { label: string; index: number }> = {
  LUNES: { label: 'Lun', index: 0 },
  MARTES: { label: 'Mar', index: 1 },
  MIERCOLES: { label: 'Mié', index: 2 },
  JUEVES: { label: 'Jue', index: 3 },
  VIERNES: { label: 'Vie', index: 4 },
  SABADO: { label: 'Sáb', index: 5 },
  DOMINGO: { label: 'Dom', index: 6 }
}

const DIAS_ORDERED = ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO', 'DOMINGO']

export default function BusinessHoursDisplay({ horarios }: Props) {
  if (!horarios || horarios.length === 0) {
    return (
      <Typography variant="caption" color="error">
        No configurado
      </Typography>
    )
  }

  const formatTime = (timeStr: string) => {
    if (!timeStr) return ''
    
    try {
      let hours: number
      let minutes: number

      if (timeStr.includes('T')) {
        // It's an ISO string or similar from Prisma
        const date = new Date(timeStr)
        hours = date.getUTCHours()
        minutes = date.getUTCMinutes()
      } else {
        // It's a string like "08:00" or "08:00:00"
        const parts = timeStr.split(':')
        hours = parseInt(parts[0], 10)
        minutes = parseInt(parts[1], 10)
      }

      const ampm = hours >= 12 ? 'PM' : 'AM'
      const h12 = hours % 12 || 12
      const mStr = minutes.toString().padStart(2, '0')
      
      return `${h12}:${mStr} ${ampm}`
    } catch (e) {
      return timeStr // Fallback to raw value if parsing fails
    }
  }

  const activeHorarios = horarios.filter(h => h.activo)

  if (activeHorarios.length === 0) {
    return (
      <Typography variant="caption" color="textSecondary">
        Cerrado
      </Typography>
    )
  }

  // Full text for tooltip
  const fullScheduleText = DIAS_ORDERED.map(key => {
    const h = horarios.find(x => x.diaSemana === key)
    const label = DIAS_SEMANA_MAP[key].label
    if (!h || !h.activo) return `${label}: Cerrado`
    return `${label}: ${formatTime(h.horaInicio)} - ${formatTime(h.horaFin)}`
  }).join('\n')

  // Group by hours
  const groupsByHours: Record<string, string[]> = {}
  activeHorarios.forEach(h => {
    const timeRange = `${formatTime(h.horaInicio)} - ${formatTime(h.horaFin)}`
    if (!groupsByHours[timeRange]) groupsByHours[timeRange] = []
    groupsByHours[timeRange].push(h.diaSemana)
  })

  const renderedGroups = Object.entries(groupsByHours).map(([timeRange, days]) => {
    const sortedDays = days.sort((a, b) => DIAS_SEMANA_MAP[a].index - DIAS_SEMANA_MAP[b].index)
    const ranges: string[] = []
    let start = 0

    for (let i = 0; i <= sortedDays.length; i++) {
      const currentDayIndex = sortedDays[i] ? DIAS_SEMANA_MAP[sortedDays[i]].index : -1
      const prevDayIndex = sortedDays[i - 1] ? DIAS_SEMANA_MAP[sortedDays[i - 1]].index : -1

      if (i > 0 && (currentDayIndex !== prevDayIndex + 1 || i === sortedDays.length)) {
        const rangeStart = sortedDays[start]
        const rangeEnd = sortedDays[i - 1]
        if (rangeStart === rangeEnd) {
          ranges.push(DIAS_SEMANA_MAP[rangeStart].label)
        } else {
          ranges.push(`${DIAS_SEMANA_MAP[rangeStart].label} - ${DIAS_SEMANA_MAP[rangeEnd].label}`)
        }
        start = i
      }
    }

    return { daysText: ranges.join(', '), timeRange }
  })

  return (
    <Tooltip title={<Box sx={{ whiteSpace: 'pre-line' }}>{fullScheduleText}</Box>} arrow>
      <Box display="flex" flexDirection="column" gap={0.5} sx={{ cursor: 'help' }}>
        {renderedGroups.map((group, idx) => (
          <Box key={idx} display="flex" alignItems="baseline" gap={1}>
            <Typography variant="caption" fontWeight="700" color="primary.main" sx={{ whiteSpace: 'nowrap' }}>
              {group.daysText}:
            </Typography>
            <Typography variant="caption" color="text.primary" sx={{ whiteSpace: 'nowrap' }}>
              {group.timeRange}
            </Typography>
          </Box>
        ))}
      </Box>
    </Tooltip>
  )
}
