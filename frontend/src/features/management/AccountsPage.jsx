import { useCallback, useEffect, useState } from 'react'
import { api } from '../../services/management'
import { useAuth } from '../auth/AuthContext'
import { FUNCTION_LABELS, roleLabel } from '../../lib/role-labels'
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
  ['coordinador', 'Coordinador de carrera'],
  ['planificador', 'Planificación'],
  ['aprobador', 'Aprobación'],
  ['jefe_departamento', 'Directores de departamento'],
]

export default function AccountsPage({ context, onChanged }) {
  const institutional = context.departmentScopeVersion >= 1
  const institutionalRole = account => account.rol !== 'docente' ? account.rol : account.funciones.includes('jefe_departamento') ? 'jefe_departamento' : account.funciones.includes('coordinador') ? 'coordinador' : 'docente'
  const { profile, retry } = useAuth()
  const [rows, setRows] = useState([])
  const [organization, setOrganization] = useState(null)
  const [form, setForm] = useState(null)
  const [query, setQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [loadFailed, setLoadFailed] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const load = useCallback(async (signal) => {
    setLoading(true)
    setLoadFailed(false)
    setError('')
    try {
      const [data, departments, directors] = await Promise.all([api('/accounts', { signal }), institutional ? api('/departamentos', {signal}) : Promise.resolve(null), institutional ? api('/departamentos/directores', {signal}) : Promise.resolve([])])
      if (!signal?.aborted) { setRows(data); setOrganization(departments ? {...departments, directors} : null) }
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
  }, [institutional])

  useEffect(() => {
    const c = new AbortController()
    load(c.signal)
    return () => c.abort()
  }, [load])

  useEffect(() => {
    if (!context.canCreateAccounts) setForm(current => (current?.id ? current : null))
  }, [context.canCreateAccounts])

  const field = (name, value) => setForm(current => ({ ...current, [name]: value }))
  const selectableCareers = context.catalogoCarreras.filter(c => c.estado !== 'inactivo' || form?.carreras.includes(c.id_carrera))

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
    if (institutional && institutionalRole(form) === 'jefe_departamento' && !organization?.departamentos.some(d => d.id === Number(form.departamento))) {
      setError('Selecciona el departamento del director antes de guardar la cuenta.')
      return
    }
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
      const { departamento, revisionDepartamento, ...account } = form
      const payload = institutional && institutionalRole(form) === 'jefe_departamento' ? {...account,id_departamento:Number(departamento),revision_departamento:revisionDepartamento || 0} : account
      await api('/accounts', { method: form.id ? 'PATCH' : 'POST', data: payload })
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
    const matchesRole = !roleFilter || (institutional ? institutionalRole(r) : r.rol) === roleFilter
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
                {institutional ? <select value={institutionalRole(form)} onChange={e=>{
                  const value=e.target.value
                  setForm(current=>({...current,rol:['coordinador','jefe_departamento'].includes(value)?'docente':value,funciones:['coordinador','jefe_departamento'].includes(value)?[value]:[],carreras:value==='coordinador'?current.carreras:[]}))
                }}>
                  <option value="administrador">Administrador</option><option value="director">Director</option><option value="jefe_departamento">Director de departamento</option><option value="coordinador">Coordinador de carrera</option><option value="docente">Docente</option>
                </select> : <select value={form.rol} onChange={e => field('rol', e.target.value)}>
                  <option value="docente">Docente</option>
                  <option value="administrador">Administrador</option>
                  {(context.institutionalRolesVersion >= 1 || form.rol === 'director') && <option value="director">Director</option>}
                </select>}
              </label>
              {institutional && institutionalRole(form) === 'jefe_departamento' && <label>Departamento del director<select required value={form.departamento || ''} onChange={e => field('departamento',e.target.value)}><option value="">Selecciona un departamento</option>{organization?.departamentos.map(d => <option key={d.id} value={d.id}>{d.nombre}</option>)}</select></label>}
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

            {!institutional && <fieldset className="choice-group">
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
            </fieldset>}

            <p className="muted" style={{ marginTop: '12px', fontSize: '13px' }}>
              {institutional ? 'El Director y el Administrador tienen acceso completo. Cada director de departamento registra restricciones y aprueba los borradores de su departamento; los coordinadores gestionan la entrega académica de sus carreras y los docentes consultan sus horarios.' : <>Los coordinadores de carrera gestionan la asignación académica de sus carreras.
              Planificación permite preparar y corregir borradores y enviarlos a revisión. Aprobación
              permite revisarlos, aprobarlos y publicarlos, sin editar sus clases.</>}
            </p>

            {!institutional && context.permissionVersion >= 2 && (
              <p className="muted" style={{ marginTop: '8px', fontSize: '13px' }}>
                Los directores de departamento registran las restricciones docentes. Los coordinadores de
                carrera pueden consultarlas. Los administradores conservan su acceso de gestión.
              </p>
            )}

            {form.funciones.includes('coordinador') && (
              <fieldset className="choice-group">
                <legend>Carreras asignadas (selecciona al menos una)</legend>
                {!selectableCareers.length && (
                  <p className="notice">
                    No hay carreras activas disponibles. Primero deben incorporarse o activarse en el catálogo.
                  </p>
                )}
                {selectableCareers.map(c => (
                  <label className="check-label" key={c.id_carrera}>
                    <input
                      type="checkbox"
                      checked={form.carreras.includes(c.id_carrera)}
                      onChange={() => toggle('carreras', c.id_carrera)}
                    />
                    {c.nombre}{c.estado === 'inactivo' ? ' (inactiva; asignación anterior)' : ''}
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
            {context.institutionalRolesVersion >= 1 && <option value="director">Director</option>}
            <option value="docente">Docente</option>
            {institutional && <><option value="jefe_departamento">Director de departamento</option><option value="coordinador">Coordinador de carrera</option></>}
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
                <th>{institutional ? 'Rol' : 'Rol y funciones'}</th>
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
                    <strong>{roleLabel(row)}</strong>
                    {!institutional && <span className="cell-detail">
                      {row.funciones
                        .map(
                          value =>
                            (FUNCTION_LABELS[value] || value)
                        )
                        .join(' · ') || 'Sin funciones adicionales'}
                    </span>}
                  </td>
                  <td>
                    {['administrador', 'director'].includes(row.rol)
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
                        const role = institutionalRole(row)
                        const relation = organization?.directors.find(d => d.id_usuario === row.id_usuario)
                        setForm({ ...row, id: row.id_usuario, password: '', departamento: relation?.id_departamento || '', revisionDepartamento: relation?.revision || 0, ...(institutional ? {funciones:['coordinador','jefe_departamento'].includes(role)?[role]:[],carreras:role==='coordinador'?row.carreras:[]} : {}) })
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
