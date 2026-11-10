import { useState, useEffect } from 'react'
import { api } from '../../services/management'
import Modal from '../../components/Modal'
import { Plus, BookOpen, User, Clock, GraduationCap, CheckCircle2, AlertCircle } from 'lucide-react'

export default function NuevaAsignacionModal({ isOpen, onClose, periodId, onSaved }) {
  const [carreras, setCarreras] = useState([])
  const [docentes, setDocentes] = useState([])
  const [loadingCatalogs, setLoadingCatalogs] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  // Form state
  const [carrera, setCarrera] = useState('')
  const [anoEstudio, setAnoEstudio] = useState('1')
  const [turno, setTurno] = useState('matutino')
  const [codigoAsignatura, setCodigoAsignatura] = useState('')
  const [nombreAsignatura, setNombreAsignatura] = useState('')
  const [docenteSeleccionado, setDocenteSeleccionado] = useState('')
  const [cedulaDocente, setCedulaDocente] = useState('')
  const [nombreDocente, setNombreDocente] = useState('')
  const [esDocenteManual, setEsDocenteManual] = useState(false)
  const [horasSemestre, setHorasSemestre] = useState('56')

  useEffect(() => {
    if (!isOpen) return
    setError('')
    setBusy(false)
    setLoadingCatalogs(true)

    // Load available careers and teachers
    Promise.all([
      api('/carreras').catch(() => []),
      api('/departamentos/docentes')
        .then(res => res.docentes || [])
        .catch(() => api('/docentes').then(res => (Array.isArray(res) ? res.map(d => ({ nombre: d.nombres || `${d.nombre || ''}`, cedula: d.cedula || '' })) : [])).catch(() => []))
    ])
      .then(([cars, docs]) => {
        const activeCareers = Array.isArray(cars) ? cars.filter(c => c.estado === 'activo') : []
        setCarreras(activeCareers)
        if (activeCareers.length > 0 && !carrera) {
          setCarrera(activeCareers[0].nombre)
        }
        setDocentes(Array.isArray(docs) ? docs : [])
      })
      .finally(() => setLoadingCatalogs(false))
  }, [isOpen])

  function handleTeacherSelect(e) {
    const val = e.target.value
    setDocenteSeleccionado(val)
    if (val === '__MANUAL__') {
      setEsDocenteManual(true)
      setCedulaDocente('')
      setNombreDocente('')
    } else {
      setEsDocenteManual(false)
      const found = docentes.find(d => (d.cedula || d.nombre) === val)
      if (found) {
        setCedulaDocente(found.cedula || '')
        setNombreDocente(found.nombre || found.nombres || '')
      } else {
        setCedulaDocente('')
        setNombreDocente('')
      }
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (busy) return
    setError('')

    const cleanCedula = cedulaDocente.replace(/[\s-]/g, '').toUpperCase()
    if (!cleanCedula) {
      setError('Indica la cédula del docente.')
      return
    }
    if (!nombreDocente.trim()) {
      setError('Indica el nombre del docente.')
      return
    }
    if (!codigoAsignatura.trim()) {
      setError('Indica el código de la asignatura.')
      return
    }
    if (!nombreAsignatura.trim()) {
      setError('Indica el nombre de la asignatura.')
      return
    }
    const horasNum = Number(horasSemestre)
    if (!horasNum || horasNum < 1) {
      setError('Indica las horas totales del semestre válidas.')
      return
    }

    setBusy(true)
    try {
      await api('/asignacion-academica/manual', {
        method: 'POST',
        data: {
          id_periodo: periodId,
          carrera,
          ano_estudio: Number(anoEstudio),
          turno,
          codigo_asignatura: codigoAsignatura.trim().toUpperCase(),
          nombre_asignatura: nombreAsignatura.trim(),
          cedula_docente: cleanCedula,
          nombre_docente: nombreDocente.trim(),
          horas_semestre: horasNum,
        },
      })
      onSaved?.()
      onClose?.()
    } catch (err) {
      setError(err.message || 'No se pudo guardar la asignación.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Nueva asignación académica" maxWidth={640}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px', margin: 0 }}>
        {error && (
          <div role="alert" className="error" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Carrera y Año de estudio */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '14px' }}>
          <label>
            Carrera académica
            <select
              required
              disabled={busy || loadingCatalogs}
              value={carrera}
              onChange={e => setCarrera(e.target.value)}
            >
              {carreras.map(c => (
                <option key={c.id_carrera || c.nombre} value={c.nombre}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </label>

          <label>
            Año de carrera
            <select
              required
              disabled={busy}
              value={anoEstudio}
              onChange={e => setAnoEstudio(e.target.value)}
            >
              {[1, 2, 3, 4, 5].map(y => (
                <option key={y} value={y}>
                  Año {y}
                </option>
              ))}
            </select>
          </label>
        </div>

        {/* Turno */}
        <div>
          <label>
            Turno académico
            <select
              required
              disabled={busy}
              value={turno}
              onChange={e => setTurno(e.target.value)}
            >
              <option value="matutino">Matutino</option>
              <option value="vespertino">Vespertino</option>
              <option value="nocturno">Nocturno</option>
              <option value="encuentros">Por encuentros (Sábados/Dominical)</option>
            </select>
          </label>
        </div>

        {/* Asignatura: Código y Nombre */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.8fr', gap: '14px' }}>
          <label>
            Código de asignatura
            <input
              type="text"
              required
              disabled={busy}
              placeholder="Ej: DEMO26-ADM-103"
              value={codigoAsignatura}
              onChange={e => setCodigoAsignatura(e.target.value)}
              style={{ textTransform: 'uppercase' }}
            />
          </label>

          <label>
            Nombre de la asignatura
            <input
              type="text"
              required
              disabled={busy}
              placeholder="Ej: Matemática Financiera"
              value={nombreAsignatura}
              onChange={e => setNombreAsignatura(e.target.value)}
            />
          </label>
        </div>

        {/* Docente */}
        <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <span style={{ fontSize: '13px', fontWeight: 600, color: '#1E293B', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <User size={15} color="var(--primary-indigo)" /> Docente de la asignatura
          </span>

          <label style={{ margin: 0 }}>
            <span style={{ fontSize: '12px', color: '#64748B' }}>Seleccionar del cuerpo docente registrado</span>
            <select
              disabled={busy || loadingCatalogs}
              value={docenteSeleccionado}
              onChange={handleTeacherSelect}
            >
              <option value="">Selecciona un docente de la lista…</option>
              {docentes.map(d => (
                <option key={d.cedula || d.nombre} value={d.cedula || d.nombre}>
                  {d.nombre || d.nombres} {d.cedula ? `(${d.cedula})` : ''}
                </option>
              ))}
              <option value="__MANUAL__">➕ Registrar otro docente (ingreso manual)</option>
            </select>
          </label>

          {esDocenteManual && (
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: '12px', marginTop: '4px' }}>
              <label style={{ margin: 0 }}>
                <span style={{ fontSize: '12px', color: '#64748B' }}>Cédula del docente</span>
                <input
                  type="text"
                  required
                  disabled={busy}
                  placeholder="Ej: 121-150880-0001A"
                  value={cedulaDocente}
                  onChange={e => setCedulaDocente(e.target.value)}
                />
              </label>

              <label style={{ margin: 0 }}>
                <span style={{ fontSize: '12px', color: '#64748B' }}>Nombre completo del docente</span>
                <input
                  type="text"
                  required
                  disabled={busy}
                  placeholder="Ej: Lic. Carlos Pérez Morales"
                  value={nombreDocente}
                  onChange={e => setNombreDocente(e.target.value)}
                />
              </label>
            </div>
          )}

          {!esDocenteManual && nombreDocente && (
            <div style={{ fontSize: '12.5px', color: '#334155', background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: '8px', padding: '8px 12px', display: 'flex', justifyContent: 'space-between' }}>
              <span><strong>Docente:</strong> {nombreDocente}</span>
              <span style={{ fontFamily: 'monospace', color: '#64748B' }}>{cedulaDocente}</span>
            </div>
          )}
        </div>

        {/* Horas semestrales */}
        <div>
          <label>
            Horas totales del semestre
            <input
              type="number"
              required
              min="1"
              max="1000"
              disabled={busy}
              placeholder="Ej: 56"
              value={horasSemestre}
              onChange={e => setHorasSemestre(e.target.value)}
            />
          </label>
          <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
            {['42', '56', '64', '70'].map(h => (
              <button
                key={h}
                type="button"
                className={`time-preset-chip ${horasSemestre === h ? 'selected' : ''}`}
                onClick={() => setHorasSemestre(h)}
                style={{ padding: '4px 10px', fontSize: '12px' }}
              >
                {h} hrs
              </button>
            ))}
          </div>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>
            Horas semestrales totales (ej. 42 o 56). La distribución en sesiones semanales de 90 minutos se realiza automáticamente.
          </span>
        </div>

        {/* Acciones */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px', paddingTop: '16px', borderTop: '1px solid #E2E8F0' }}>
          <button className="secondary" type="button" disabled={busy} onClick={onClose}>
            Cancelar
          </button>
          <button className="primary" type="submit" disabled={busy || loadingCatalogs}>
            {busy ? 'Guardando…' : 'Guardar asignación'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

