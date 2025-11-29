import { useState, useEffect } from 'react'
import '../assets/css/admin.css'
import { useToast } from '../context/ToastContext'
import { supabase } from '../lib/supabase'
import { logout } from '../utils/auth'
import { useNavigate } from 'react-router-dom'

export default function Invitaciones() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const toast = useToast()
  const navigate = useNavigate()
  const [showModal, setShowModal] = useState(false)
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem('theme') || (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    } catch { return 'light' }
  })
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [participantsInput, setParticipantsInput] = useState(1)
  const [creating, setCreating] = useState(false)

  async function fetchRows() {
    setLoading(true)
    setError(null)
    try {
      const { data, error: err } = await supabase
        .from('invitations')
        .select('id, names, participants, view, accepted, created_at')
        .order('created_at', { ascending: false })

      if (err) throw err
      // Map DB rows to UI shape
      const mapped = (data || []).map((r) => {
        // intentar dividir names en nombre y apellido (split por último espacio)
        const names = (r.names || '').trim()
        let nombre = names
        let apellido = ''
        if (names) {
          const parts = names.split(' ')
          if (parts.length > 1) {
            apellido = parts.slice(-1).join(' ')
            nombre = parts.slice(0, -1).join(' ')
          }
        }
        return {
          id: r.id,
          nombre,
          apellido,
          participants: r.participants,
          visto: !!r.view,
          aceptado: !!r.accepted,
          created_at: r.created_at,
        }
      })
      setRows(mapped)
    } catch (err) {
      console.error(err)
      setError(err.message ?? 'Error al cargar invitaciones')
      toast.add({ title: 'Error', message: err.message ?? 'Error al cargar', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchRows() }, [])

  useEffect(() => {
    try {
      if (theme === 'dark') document.documentElement.setAttribute('data-theme', 'dark')
      else document.documentElement.removeAttribute('data-theme')
      localStorage.setItem('theme', theme)
    } catch (e) { /* ignore */ }
  }, [theme])

  // Copiar link de invitación al portapapeles
  async function copyLink(id) {
    try {
      const url = `${location.origin}/invitacion/${id}`
      await navigator.clipboard.writeText(url)
      toast.add({ title: 'Copiado', message: 'Enlace copiado al portapapeles', type: 'success' })
    } catch (err) {
      console.error(err)
      toast.add({ title: 'Error', message: 'No se pudo copiar el enlace', type: 'error' })
    }
  }

  function viewLink(id) {
    const url = `${location.origin}/invitacion/${id}`
    window.open(url, '_blank', 'noopener')
  }

  async function handleLogout() {
    await logout()
    navigate('/admin')
  }

  return (
    <main className="admin-page">
      <div className="admin-card">
        <div className="admin-header">
          <h1 style={{display:'flex',alignItems:'center',gap:12, flexWrap: 'wrap'}}>
            <span style={{flex: 1}}>Invitaciones</span>
            <div style={{display:'flex', gap: 8}}>
              <button className="icon-btn" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} title="Alternar tema" aria-label="Alternar tema">
                {theme === 'dark' ? (
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6.76 4.84l-1.8-1.79L3.17 4.84l1.79 1.8 1.8-1.8zM1 13h3v-2H1v2zm10 9h2v-3h-2v3zM17.24 4.84l1.8-1.79 1.79 1.79-1.79 1.79-1.8-1.79zM20 11v2h3v-2h-3zM6.76 19.16l-1.8 1.79L3.17 19.16l1.79-1.8 1.8 1.8zM17.24 19.16l1.8 1.79 1.79-1.79-1.79-1.8-1.8 1.8zM12 5a7 7 0 100 14 7 7 0 000-14z" fill="currentColor"/></svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M21.64 13a9 9 0 11-10.63-10.63A7 7 0 0021.64 13z" fill="currentColor"/></svg>
                )}
              </button>
              <button className="icon-btn" onClick={handleLogout} title="Cerrar sesión" aria-label="Cerrar sesión">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
              </button>
            </div>
          </h1>
          <p className="meta">Lista de invitados</p>
        </div>

        <section style={{ marginTop: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
            <div className="meta">Gestiona las invitaciones</div>
            <div className="buttons">
              <button className="btn-ghost" onClick={fetchRows} disabled={loading}>{loading ? 'Cargando...' : 'Refrescar'}</button>
              <button className="btn-primary" onClick={() => setShowModal(true)}>Crear invitación</button>
            </div>
          </div>

          <div style={{ marginTop: 14 }}>
            <div className="table-wrap">
              <table className="invit-table">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Apellido</th>
                    <th>Participantes</th>
                    <th>Visto</th>
                    <th>Aceptado</th>
                    <th>Creado</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 ? (
                    <tr><td colSpan={7} style={{ textAlign: 'center', padding: 24, color: 'var(--muted)' }}>{loading ? 'Cargando...' : 'No hay registros.'}</td></tr>
                  ) : rows.map(r => (
                    <tr key={r.id}>
                      <td>{r.nombre}</td>
                      <td>{r.apellido}</td>
                      <td>{r.participants ?? '-'}</td>
                      <td><span className={`badge ${r.visto ? 'badge--true' : 'badge--false'}`}>{r.visto ? 'Sí' : 'No'}</span></td>
                      <td><span className={`badge ${r.aceptado ? 'badge--true' : 'badge--false'}`}>{r.aceptado ? 'Sí' : 'No'}</span></td>
                      <td>{r.created_at ? new Date(r.created_at).toLocaleString() : '-'}</td>
                      <td style={{ textAlign: 'right' }}>
                        <div className="actions-inline">
                          <button className="btn-ghost" onClick={() => viewLink(r.id)} title="Ver invitación" aria-label={`Ver invitación ${r.id}`}>Ver</button>
                          <button className="btn-primary" style={{ marginLeft: 8 }} onClick={() => copyLink(r.id)} title="Copiar enlace" aria-label={`Copiar enlace ${r.id}`}>Copiar</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
      {showModal && (
        <div className="modal-overlay" onMouseDown={() => setShowModal(false)}>
          <div className="modal" onMouseDown={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <div className="modal-header">
              <div className="modal-title">Crear invitación</div>
              <button className="modal-close" onClick={() => setShowModal(false)} aria-label="Cerrar">×</button>
            </div>

            <form onSubmit={async (e) => {
              e.preventDefault()
              if (!firstName.trim() || !lastName.trim()) {
                toast.add({ title: 'Error', message: 'Nombre y apellido son obligatorios', type: 'error' })
                return
              }
              const participants = Number(participantsInput) || 1
              if (participants < 1) {
                toast.add({ title: 'Error', message: 'Participantes debe ser al menos 1', type: 'error' })
                return
              }

              setCreating(true)
              try {
                const names = `${firstName.trim()} ${lastName.trim()}`
                const { data, error: err } = await supabase
                  .from('invitations')
                  .insert([{ names, participants, view: false, accepted: false }])
                  .select()

                if (err) throw err
                toast.add({ title: 'Creado', message: 'Invitación agregada', type: 'success' })
                setShowModal(false)
                setFirstName('')
                setLastName('')
                setParticipantsInput(1)
                fetchRows()
              } catch (err) {
                console.error(err)
                toast.add({ title: 'Error', message: err.message ?? 'No se pudo crear', type: 'error' })
              } finally {
                setCreating(false)
              }
            }}>
              <div className="row">
                <label style={{flex:1}}>
                  Nombre
                  <input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Nombre" />
                </label>
                <label style={{flex:1}}>
                  Apellido
                  <input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Apellido" />
                </label>
              </div>
              <label>
                Participantes
                <input type="number" min={1} value={participantsInput} onChange={(e) => setParticipantsInput(e.target.value)} />
              </label>
              <div className="actions">
                <button type="button" className="btn-ghost" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn-primary" disabled={creating}>{creating ? 'Creando...' : 'Crear'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  )
}
