import { describe, it, expect } from 'vitest'
import {
  solveScheduleAI,
  timeToMinutes,
  intervalsOverlap,
} from '../src/features/management/schedule-ai-solver'

describe('Motor Generador de Horarios con IA (schedule-ai-solver)', () => {
  it('convierte horas HH:MM a minutos correctamente', () => {
    expect(timeToMinutes('08:00')).toBe(480)
    expect(timeToMinutes('09:30')).toBe(570)
    expect(timeToMinutes('12:00')).toBe(720)
  })

  it('detecta solapamientos entre intervalos correctamente', () => {
    expect(intervalsOverlap(480, 570, 500, 590)).toBe(true)
    expect(intervalsOverlap(480, 570, 570, 660)).toBe(false)
    expect(intervalsOverlap(480, 570, 400, 480)).toBe(false)
  })

  it('genera una propuesta completa para secciones y necesidades válidas', () => {
    const sections = [
      { id_seccion: 1, codigo: 'SIS-31', turno: 'matutino', modalidad: 'regular', cantidad_estudiantes: 30 },
    ]
    const subjects = [
      { id_asignatura: 101, codigo: 'MAT', nombre: 'Cálculo I' },
      { id_asignatura: 102, codigo: 'PROG', nombre: 'Programación I' },
    ]
    const teachers = [
      { id_docente: 1, nombre: 'Prof. García', tipo_docente: 'planta' },
      { id_docente: 2, nombre: 'Prof. Rodríguez', tipo_docente: 'planta' },
    ]
    const blocks = [
      { id_bloque: 1, dia: 'Lunes', hora_inicio: '08:00', hora_fin: '09:30', turno: 'matutino', modalidad: 'regular' },
      { id_bloque: 2, dia: 'Lunes', hora_inicio: '09:45', hora_fin: '11:15', turno: 'matutino', modalidad: 'regular' },
      { id_bloque: 3, dia: 'Miercoles', hora_inicio: '08:00', hora_fin: '09:30', turno: 'matutino', modalidad: 'regular' },
      { id_bloque: 4, dia: 'Miercoles', hora_inicio: '09:45', hora_fin: '11:15', turno: 'matutino', modalidad: 'regular' },
    ]
    const needs = [
      { id_componente: 1, id_seccion: 1, id_asignatura: 101, id_docente: 1, sesiones_semana: 2 },
      { id_componente: 2, id_seccion: 1, id_asignatura: 102, id_docente: 2, sesiones_semana: 2 },
    ]

    const result = solveScheduleAI({
      sections,
      subjects,
      teachers,
      rooms: [],
      blocks,
      restrictions: [],
      needs,
    })

    expect(result.estado).toBe('propuesta')
    expect(result.clases).toHaveLength(4)
    expect(result.estadisticas.sesionesColocadas).toBe(4)
    expect(result.pendientes).toHaveLength(0)

    // No debe haber dos clases de la misma sección a la misma hora en el mismo día
    const keys = result.clases.map(c => `${c.dia}:${c.hora_inicio}`)
    expect(new Set(keys).size).toBe(4)
  })

  it('respeta las restricciones de horario de los docentes', () => {
    const sections = [
      { id_seccion: 1, codigo: 'SIS-31', turno: 'matutino', modalidad: 'regular', cantidad_estudiantes: 25 },
    ]
    const subjects = [{ id_asignatura: 101, codigo: 'MAT', nombre: 'Cálculo' }]
    const teachers = [{ id_docente: 1, nombre: 'Docente Horario', tipo_docente: 'horario' }]
    const blocks = [
      { id_bloque: 1, dia: 'Lunes', hora_inicio: '08:00', hora_fin: '09:30', turno: 'matutino', modalidad: 'regular' },
      { id_bloque: 2, dia: 'Miercoles', hora_inicio: '08:00', hora_fin: '09:30', turno: 'matutino', modalidad: 'regular' },
      { id_bloque: 3, dia: 'Viernes', hora_inicio: '08:00', hora_fin: '09:30', turno: 'matutino', modalidad: 'regular' },
    ]
    // Docente tiene restricción los Lunes de 08:00 a 10:00
    const restrictions = [
      { id_docente: 1, dia: 'Lunes', hora_inicio: '08:00', hora_fin: '10:00' },
    ]
    const needs = [
      { id_componente: 1, id_seccion: 1, id_asignatura: 101, id_docente: 1, sesiones_semana: 2 },
    ]

    const result = solveScheduleAI({
      sections,
      subjects,
      teachers,
      rooms: [],
      blocks,
      restrictions,
      needs,
    })

    expect(result.clases).toHaveLength(2)
    // Ninguna clase debe colocarse el Lunes debido a la restricción
    expect(result.clases.some(c => c.dia === 'Lunes')).toBe(false)
  })

  it('preserva clases fijadas y días bloqueados', () => {
    const sections = [
      { id_seccion: 1, codigo: 'SIS-31', turno: 'matutino', modalidad: 'regular', cantidad_estudiantes: 25 },
    ]
    const subjects = [{ id_asignatura: 101, codigo: 'MAT', nombre: 'Cálculo' }]
    const teachers = [{ id_docente: 1, nombre: 'Prof. García', tipo_docente: 'planta' }]
    const blocks = [
      { id_bloque: 1, dia: 'Lunes', hora_inicio: '08:00', hora_fin: '09:30', turno: 'matutino', modalidad: 'regular' },
      { id_bloque: 2, dia: 'Miercoles', hora_inicio: '08:00', hora_fin: '09:30', turno: 'matutino', modalidad: 'regular' },
      { id_bloque: 3, dia: 'Viernes', hora_inicio: '08:00', hora_fin: '09:30', turno: 'matutino', modalidad: 'regular' },
    ]
    const fixedClasses = [
      {
        id_horario: 'fijada-1',
        id_seccion: 1,
        id_asignatura: 101,
        id_docente: 1,
        id_bloque: 1,
        dia: 'Lunes',
        hora_inicio: '08:00',
        hora_fin: '09:30',
        numero_sesion: 1,
        es_fijada: true,
      },
    ]
    const needs = [
      { id_componente: 1, id_seccion: 1, id_asignatura: 101, id_docente: 1, sesiones_semana: 2 },
    ]

    const result = solveScheduleAI({
      sections,
      subjects,
      teachers,
      rooms: [],
      blocks,
      restrictions: [],
      needs,
      fixedClasses,
      lockedDays: ['Lunes'],
    })

    expect(result.estadisticas.sesionesFijadasPreservadas).toBe(1)
    expect(result.clases).toHaveLength(2)
    const lunesClass = result.clases.find(c => c.dia === 'Lunes')
    expect(lunesClass).toBeTruthy()
    expect(lunesClass.es_fijada).toBe(true)
  })

  it('devuelve estado con pendientes cuando no hay franjas suficientes', () => {
    const sections = [
      { id_seccion: 1, codigo: 'SIS-31', turno: 'matutino', modalidad: 'regular', cantidad_estudiantes: 25 },
    ]
    const subjects = [{ id_asignatura: 101, codigo: 'MAT', nombre: 'Cálculo' }]
    const teachers = [{ id_docente: 1, nombre: 'Prof. García', tipo_docente: 'planta' }]
    // Solo un bloque disponible pero se piden 2 sesiones
    const blocks = [
      { id_bloque: 1, dia: 'Lunes', hora_inicio: '08:00', hora_fin: '09:30', turno: 'matutino', modalidad: 'regular' },
    ]
    const needs = [
      { id_componente: 1, id_seccion: 1, id_asignatura: 101, id_docente: 1, sesiones_semana: 2 },
    ]

    const result = solveScheduleAI({
      sections,
      subjects,
      teachers,
      rooms: [],
      blocks,
      restrictions: [],
      needs,
    })

    expect(result.clases).toHaveLength(1)
    expect(result.pendientes.length).toBeGreaterThanOrEqual(1)
  })
})

