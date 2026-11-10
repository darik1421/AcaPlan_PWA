import { useState } from 'react'
import { Calendar, Users, Building2, BookOpen } from 'lucide-react'

const days = [
  ['Lunes', 'Lunes'],
  ['Martes', 'Martes'],
  ['Miercoles', 'Miércoles'],
  ['Jueves', 'Jueves'],
  ['Viernes', 'Viernes'],
  ['Sabado', 'Sábado'],
  ['Domingo', 'Domingo'],
]
const partName = { general: 'Clase', teoria: 'Teoría', practica: 'Práctica' }

export default function VistaSemanalBorrador({ detail, onEdit, disabled }) {
  const [selection, setSelection] = useState('')
  const groups = [
    ...new Map(
      detail.asignaciones.map(a => [
        `${a.id_carrera}:${a.ano_estudio}`,
        {
          key: `${a.id_carrera}:${a.ano_estudio}`,
          label: `${a.carrera} · Año ${a.ano_estudio}`,
        },
      ])
    ).values(),
  ]
  const selected = groups.some(g => g.key === selection) ? selection : groups[0]?.key
  const assignments = detail.asignaciones.filter(a => `${a.id_carrera}:${a.ano_estudio}` === selected)
  const rows = detail.clases
    .filter(c => assignments.some(a => a.id === c.id_asignacion))
    .sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio) || a.id - b.id)
  const ranges = [...new Set(rows.map(c => `${c.hora_inicio.slice(0, 5)}–${c.hora_fin.slice(0, 5)}`))].sort()

  return (
    <section aria-label="Vista semanal del borrador" className="surface-card" style={{ padding: '24px' }}>
      {/* Encabezado de la vista semanal */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '16px',
          paddingBottom: '18px',
          borderBottom: '1px solid #E2E8F0',
          marginBottom: '20px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: '#EFEEFA',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Calendar size={20} color="#302C91" />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#1B2C48' }}>
              Vista semanal por carrera y año
            </h3>
            <p className="muted" style={{ margin: '2px 0 0 0', fontSize: '13px' }}>
              Horario en revisión. Las celdas vacías no indican disponibilidad.
            </p>
          </div>
        </div>

        {/* Selector de Carrera y Año estilizado como tarjeta de filtro */}
        {groups.length > 0 && (
          <label
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              background: '#F8FAFC',
              border: '1.5px solid #8B5CF6',
              borderRadius: '10px',
              padding: '6px 14px',
              minWidth: '240px',
            }}
          >
            <span
              style={{
                fontSize: '10.5px',
                fontWeight: 700,
                color: '#637086',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
              }}
            >
              <BookOpen size={11} color="#302C91" />
              Carrera y año de la vista
            </span>
            <select
              value={selected}
              onChange={e => setSelection(e.target.value)}
              style={{
                border: 'none',
                background: 'transparent',
                padding: '2px 0',
                fontSize: '13.5px',
                fontWeight: 600,
                color: '#1B2C48',
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              {groups.map(g => (
                <option key={g.key} value={g.key}>
                  {g.label}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      {groups.length ? (
        rows.length ? (
          <div
            className="table-scroll weekly-timetable"
            style={{
              border: '1px solid #E2E8F0',
              borderRadius: '12px',
              overflow: 'hidden',
              boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
            }}
          >
            <table style={{ minWidth: '1080px', width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
              <caption
                style={{
                  textAlign: 'left',
                  padding: '14px 20px',
                  background: '#F8FAFC',
                  color: '#1E293B',
                  fontSize: '14px',
                  fontWeight: 700,
                  borderBottom: '1px solid #E2E8F0',
                }}
              >
                {groups.find(g => g.key === selected)?.label} · {detail.borrador.nombre}
              </caption>
              <thead>
                <tr>
                  <th
                    scope="col"
                    style={{
                      width: '120px',
                      background: '#EFEEFA',
                      color: '#302C91',
                      fontSize: '12px',
                      fontWeight: 700,
                      letterSpacing: '0.05em',
                      textTransform: 'uppercase',
                      padding: '12px',
                      textAlign: 'center',
                      borderRight: '1px solid #D6D3F2',
                      borderBottom: '1px solid #D6D3F2',
                    }}
                  >
                    Hora
                  </th>
                  {days.map(([key, name]) => (
                    <th
                      scope="col"
                      key={key}
                      style={{
                        background: '#EFEEFA',
                        color: '#302C91',
                        fontSize: '12px',
                        fontWeight: 700,
                        letterSpacing: '0.05em',
                        textTransform: 'uppercase',
                        padding: '12px 10px',
                        textAlign: 'center',
                        borderRight: '1px solid #E2E8F0',
                        borderBottom: '1px solid #D6D3F2',
                      }}
                    >
                      {name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ranges.map(range => (
                  <tr key={range} style={{ borderBottom: '1px solid #E2E8F0' }}>
                    <th
                      scope="row"
                      style={{
                        width: '120px',
                        padding: '14px 10px',
                        background: '#FFFFFF',
                        color: '#1E293B',
                        fontSize: '12.5px',
                        fontWeight: 700,
                        textAlign: 'center',
                        verticalAlign: 'top',
                        borderRight: '1px solid #E2E8F0',
                        fontVariantNumeric: 'tabular-nums',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      <span
                        style={{
                          display: 'inline-block',
                          background: '#F1F5F9',
                          color: '#334155',
                          padding: '4px 8px',
                          borderRadius: '6px',
                          fontSize: '11.5px',
                        }}
                      >
                        {range}
                      </span>
                    </th>
                    {days.map(([day]) => {
                      const dayClasses = rows.filter(
                        c => c.dia === day && `${c.hora_inicio.slice(0, 5)}–${c.hora_fin.slice(0, 5)}` === range
                      )
                      return (
                        <td
                          key={day}
                          data-day={day}
                          style={{
                            padding: '10px',
                            verticalAlign: 'top',
                            background: dayClasses.length ? '#FFFFFF' : '#FAFBFE',
                            borderRight: '1px solid #F1F5F9',
                            minHeight: '120px',
                          }}
                        >
                          {dayClasses.map(c => {
                            const a = assignments.find(a => a.id === c.id_asignacion)
                            const room = detail.espacios.find(r => r.id_aula === c.id_aula)
                            const teacherIds =
                              a.componentes?.find(p => p.tipo === c.componente)?.docentes ||
                              (!a.componentes ? a.docentes?.map(d => d.id) : [])
                            const teachers =
                              a.docentes?.filter(d => teacherIds?.includes(d.id)).map(d => d.nombre).join(', ') ||
                              'Revisar docentes'
                            const isPinned = c.fijada

                            return (
                              <article
                                key={c.id}
                                className="weekly-class"
                                style={{
                                  background: isPinned ? '#FEFCE8' : '#FFFFFF',
                                  border: isPinned ? '1.5px solid #CA8A04' : '1px solid #E2E8F0',
                                  borderTop: isPinned ? '3px solid #CA8A04' : '3px solid #302C91',
                                  borderRadius: '10px',
                                  padding: '12px 14px',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: '6px',
                                  boxShadow: '0 2px 5px rgba(27, 44, 72, 0.05)',
                                  transition: 'box-shadow 0.15s ease',
                                }}
                              >
                                {/* Header: Subject Name */}
                                <strong
                                  style={{
                                    fontSize: '13.5px',
                                    color: '#1B2C48',
                                    lineHeight: '1.3',
                                    fontWeight: 700,
                                  }}
                                >
                                  {a.nombre}
                                </strong>

                                {/* Component badge */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                  <span
                                    style={{
                                      fontSize: '11px',
                                      fontWeight: 700,
                                      background: '#EFEEFA',
                                      color: '#302C91',
                                      padding: '2px 7px',
                                      borderRadius: '4px',
                                      textTransform: 'uppercase',
                                    }}
                                  >
                                    {partName[c.componente] || c.componente}
                                  </span>
                                  <span
                                    className={isPinned ? 'status-pill warning' : 'status-pill active'}
                                    style={{ fontSize: '10.5px', padding: '1px 6px', height: 'auto' }}
                                  >
                                    <span className="status-dot">●</span>
                                    <span>{isPinned ? 'Fijada' : 'Editable'}</span>
                                  </span>
                                </div>

                                {/* Docente */}
                                <div
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '5px',
                                    fontSize: '12px',
                                    color: '#475569',
                                    marginTop: '2px',
                                  }}
                                >
                                  <Users size={12} color="#94A3B8" style={{ flexShrink: 0 }} />
                                  <span style={{ overflowWrap: 'anywhere' }}>{teachers}</span>
                                </div>

                                {/* Aula */}
                                <div
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '5px',
                                    fontSize: '12px',
                                    color: '#475569',
                                  }}
                                >
                                  <Building2 size={12} color="#94A3B8" style={{ flexShrink: 0 }} />
                                  <span
                                    style={{
                                      color: room?.codigo ? '#15803D' : '#D97706',
                                      fontWeight: 600,
                                      background: room?.codigo ? '#DCFCE7' : '#FEF3C7',
                                      padding: '1px 6px',
                                      borderRadius: '4px',
                                      fontSize: '11.5px',
                                    }}
                                  >
                                    {room ? `${room.sede || 'Sede pendiente'} · ${room.codigo}` : 'Aula pendiente'}
                                  </span>
                                </div>
                              </article>
                            )
                          })}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div
            style={{
              padding: '32px',
              textAlign: 'center',
              background: '#F8FAFC',
              borderRadius: '12px',
              border: '1px dashed #CBD5E1',
            }}
          >
            <p className="muted" style={{ margin: 0, fontSize: '14px', fontWeight: 500 }}>
              Este año todavía no tiene clases en el borrador.
            </p>
          </div>
        )
      ) : (
        <div
          style={{
            padding: '32px',
            textAlign: 'center',
            background: '#F8FAFC',
            borderRadius: '12px',
            border: '1px dashed #CBD5E1',
          }}
        >
          <p className="muted" style={{ margin: 0, fontSize: '14px', fontWeight: 500 }}>
            No hay asignaciones para mostrar en esta propuesta.
          </p>
        </div>
      )}
    </section>
  )
}
