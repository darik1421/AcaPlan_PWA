import { useEffect, useState } from 'react'
import { api } from '../../services/management'
import { useAuth } from '../auth/AuthContext'
import { Plus, RefreshCw, Pencil } from 'lucide-react'

const empty = () => ({
  nombre: '',
  correo: '',
  cedula: '',
  password: '',
  rol: 'docente',
  estado: 'activo',
  funciones: [],
  carreras: [],
})

const functions = [
  ['coordinador', 'Coordinadores de carrera'],
  ['planificador', 'Planificación'],
  ['aprobador', 'Aprobación'],
  ['jefe_departamento', 'Jefes de departamento'],
]

export default function AccountsPage({ context, onChanged }) {
  const { profile, retry } = useAuth()
  const [rows, setRows] = useState([])
  const [form, setForm] = useState(null)
  const [query, setQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [loadFailed, setLoadFailed] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  async function load(signal) {
    setLoading(true)
    setLoadFailed(false)
    setError('')
    try {
      const data = await api('/accounts', { signal })
      if (!signal?.aborted) setRows(data)
    } catch (e) {
      if (!signal?.aborted) {
        setError(e.message)
        setLoadFailed(true)
        setRows([])
        setForm(null)
      }
    } finally {
      if (!signal?.aborted) setLoading(false)
    }
  }

  useEffect(() => {
    const c = new AbortController()
    load(c.signal)
    return () => c.abort()
  }, [])

  useEffect(() => {
    if (!context.canCreateAccounts) setForm(current => (current?.id ? current : null))
  }, [context.canCreateAccounts])

  const field = (name, value) => setForm(current => ({ ...current, [name]: value }))

  function toggle(name, value) {
    field(
      name,
      form[name].includes(value)
        ? form[name].filter(item => item !== value)
        : [...form[name], value]
    )
  }

  async function save(event) {
    event.preventDefault()
    if (busy || loading || loadFailed || !form || (!form.id && !context.canCreateAccounts)) return
    if (
      form.id === profile.id_usuario &&
      (form.estado !== 'activo' || form.rol !== profile.rol) &&
      !window.confirm(
        'Cambiarás tu propio acceso. Tu sesión se volverá a comprobar. ¿Continuar?'
      )
    )
      return
    setBusy(true)
    setError('')
    setMessage('')
    try {
      await api('/accounts', { method: form.id ? 'PATCH' : 'POST', data: form })
      const self = form.id === profile.id_usuario
      setMessage(
        form.id
          ? 'Cuenta actualizada.'
          : 'Cuenta creada. Entrega la contraseña inicial por un canal privado.'
      )
      setForm(null)
      await load()
      onChanged()
      if (self) retry()
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  const filtered = rows.filter(r => {
    const matchesQuery = [r.nombre, r.correo, r.cedula]
      .join(' ')
      .toLowerCase()
      .includes(query.toLowerCase())
    const matchesRole = !roleFilter || r.rol === roleFilter
    const matchesStatus = !statusFilter || r.estado === statusFilter
    return matchesQuery && matchesRole && matchesStatus
  })

  return (
    <section className="management-page" aria-labelledby="accounts-title">
      <div className="section-heading">
        <div>
          <span className="screen-kicker">Acceso institucional</span>
          <h2 id="accounts-title">Gestión de cuentas</h2>
          <p className="muted">Personas autorizadas, rol y responsabilidades por carrera.</p>
        </div>
        <button
          className="primary"
          aria-label="Nueva cuenta"
          disabled={busy || loading || loadFailed || !context.canCreateAccounts}
          onClick={() => {
            setForm(empty())
            setMessage('')
          }}
        >
          <Plus size={16} aria-hidden="true" />
          <span>Nueva cuenta</span>
        </button>
      </div>

      {!context.canCreateAccounts && (
        <p className="notice">
          La creación de cuentas requiere completar la configuración del servidor.
        </p>
      )}

      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      {message && (
        <p role="status" className="success">
          {message}
        </p>
      )}

      {form && (
        <form className="management-form" onSubmit={save}>
          <h3>{form.id ? 'Editar cuenta' : 'Nueva cuenta'}</h3>
          <fieldset disabled={busy || loading || loadFailed}>
            <div className="form-grid">
              <label>
                Nombre completo
                <input
                  required
                  maxLength={100}
                  value={form.nombre}
                  onChange={e => field('nombre', e.target.value)}
                  autoComplete="name"
                />
              </label>
              <label>
                Cédula
                <input
                  required
                  maxLength={20}
                  value={form.cedula}
                  onChange={e => field('cedula', e.target.value)}
                />
              </label>
              <label>
                Correo
                <input
                  type="email"
                  required
                  maxLength={100}
                  value={form.correo}
                  readOnly={Boolean(form.id)}
                  onChange={e => field('correo', e.target.value)}
                  autoComplete="off"
                />
              </label>
              {!form.id && (
                <label>
                  Contraseña inicial
                  <input
                    type="password"
                    required
                    minLength={8}
                    maxLength={128}
                    autoComplete="new-password"
                    value={form.password}
                    onChange={e => field('password', e.target.value)}
                  />
                </label>
              )}
              <label>
                Rol
                <select value={form.rol} onChange={e => field('rol', e.target.value)}>
                  <option value="docente">Docente</option>
                  <option value="administrador">Administrador</option>
                </select>
              </label>
              {form.id && (
                <label>
                  Estado
                  <select value={form.estado} onChange={e => field('estado', e.target.value)}>
                    <option value="activo">Activo</option>
                    <option value="inactivo">Inactivo</option>
                  </select>
                </label>
              )}
            </div>

            {form.id && (
              <p className="muted" style={{ marginTop: '12px', fontSize: '13px' }}>
                El correo se conserva para mantener la vinculación con Supabase Auth.
              </p>
            )}

            <fieldset className="choice-group">
              <legend>Funciones adicionales</legend>
              {functions
                .filter(
                  ([id]) =>
                    id !== 'jefe_departamento' ||
                    context.permissionVersion >= 2 ||
                    form.funciones.includes(id)
                )
                .map(([id, label]) => (
                  <label className="check-label" key={id}>
                    <input
                      type="checkbox"
                      checked={form.funciones.includes(id)}
                      onChange={() => toggle('funciones', id)}
                    />
                    {label}
                  </label>
                ))}
            </fieldset>

            <p className="muted" style={{ marginTop: '12px', fontSize: '13px' }}>
              Los coordinadores de carrera gestionan la asignación académica de sus carreras.
              Planificación permite preparar y corregir borradores y enviarlos a revisión. Aprobación
              permite revisarlos, aprobarlos y publicarlos, sin editar sus clases.
            </p>

            {context.permissionVersion >= 2 && (
              <p className="muted" style={{ marginTop: '8px', fontSize: '13px' }}>
                Los jefes de departamento registran las restricciones docentes. Los coordinadores de
                carrera pueden consultarlas. Los administradores conservan su acceso de gestión.
              </p>
            )}

            {form.funciones.includes('coordinador') && (
              <fieldset className="choice-group">
                <legend>Carreras asignadas (selecciona al menos una)</legend>
                {!context.catalogoCarreras.length && (
                  <p className="notice">
                    No hay carreras registradas. Primero deben incorporarse al catálogo.
                  </p>
                )}
                {context.catalogoCarreras.map(c => (
                  <label className="check-label" key={c.id_carrera}>
                    <input
                      type="checkbox"
                      checked={form.carreras.includes(c.id_carrera)}
                      onChange={() => toggle('carreras', c.id_carrera)}
                    />
                    {c.nombre}
                  </label>
                ))}
              </fieldset>
            )}

            <div className="form-actions">
              <button className="primary" type="submit">
                {busy ? 'Guardando…' : 'Guardar cuenta'}
              </button>
              <button className="secondary" type="button" onClick={() => setForm(null)}>
                Cancelar
              </button>
            </div>
          </fieldset>
        </form>
      )}

      {/* Toolbar con filtros de Figma y botón de actualización */}
      <div className="filter-grid">
        <label className="filter-card">
          <span>Buscar cuentas</span>
          <input
            type="search"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Nombre, correo o cédula"
          />
        </label>
        <label className="filter-card">
          <span>Rol</span>
          <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
            <option value="">Todos los roles</option>
            <option value="administrador">Administrador</option>
            <option value="docente">Docente</option>
          </select>
        </label>
        <label className="filter-card">
          <span>Estado</span>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="">Activas e inactivas</option>
            <option value="activo">Activo</option>
            <option value="inactivo">Inactivo</option>
          </select>
        </label>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
        <button
          className="secondary"
          disabled={busy || loading}
          onClick={() => load()}
        >
          <RefreshCw size={14} aria-hidden="true" />
          <span>Actualizar lista</span>
        </button>
      </div>

      {loading ? (
        <p role="status">Cargando cuentas…</p>
      ) : loadFailed ? (
        <p className="notice">
          No se pudo cargar la lista. Pulsa «Actualizar lista» para volver a intentarlo.
        </p>
      ) : (
        <div className="table-scroll">
          <table>
            <caption>Personal autorizado · {filtered.length} cuentas</caption>
            <thead>
              <tr>
                <th>Persona</th>
                <th>Rol y funciones</th>
                <th>Carreras</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(row => (
                <tr key={row.id_usuario}>
                  <td>
                    <strong>{row.nombre}</strong>
                    <span className="cell-detail">{row.correo}</span>
                  </td>
                  <td>
                    <strong>{row.rol === 'administrador' ? 'Administradora' : 'Docente'}</strong>
                    <span className="cell-detail">
                      {row.funciones
                        .map(
                          value =>
                            ({
                              coordinador: 'Coordinación',
                              planificador: 'Planificación',
                              aprobador: 'Aprobación',
                              jefe_departamento: 'Jefes de departamento',
                            }[value] || value)
                        )
                        .join(' · ') || 'Sin funciones adicionales'}
                    </span>
                  </td>
                  <td>
                    {row.rol === 'administrador'
                      ? 'Todas'
                      : row.carreras
                          ?.map(id => context.catalogoCarreras?.find(c => c.id_carrera === id)?.nombre)
                          .filter(Boolean)
                          .join(', ') || 'Sin carreras asignadas'}
                  </td>
                  <td>
                    <span className={row.estado === 'activo' ? 'status-pill active' : 'status-pill inactive'}>
                      <span className="status-dot" aria-hidden="true">●</span>
                      <span>{row.estado === 'activo' ? 'Activa' : 'Inactiva'}</span>
                    </span>
                  </td>
                  <td>
                    <button
                      className="secondary"
                      disabled={busy || loading || loadFailed}
                      aria-label={`Editar cuenta de ${row.nombre}`}
                      onClick={() => {
                        setForm({ ...row, id: row.id_usuario, password: '' })
                        setMessage('')
                      }}
                    >
                      <Pencil size={13} aria-hidden="true" />
                      <span>Editar</span>
                    </button>
                  </td>
                </tr>
              ))}
              {!filtered.length && (
                <tr>
                  <td colSpan={5}>No hay cuentas que coincidan.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
