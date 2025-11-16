import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import '../assets/css/admin.css'
import { useToast } from '../context/ToastContext'
import { supabase } from '../lib/supabase'

export default function Invitacion() {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const [inv, setInv] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    let mounted = true
    async function load() {
      setLoading(true)
      try {
        const { data, error } = await supabase
          .from('invitations')
          .select('id, names, participants, view, accepted, created_at')
          .eq('id', id)
          .maybeSingle()

        if (error) throw error
        if (!data) {
          toast.add({ title: 'No encontrado', message: 'Invitación no encontrada', type: 'error' })
          navigate('/invitaciones')
          return
        }

        // split names into nombre/apellido
        const names = (data.names || '').trim()
        let nombre = names
        let apellido = ''
        if (names) {
          const parts = names.split(' ')
          if (parts.length > 1) {
            apellido = parts.slice(-1).join(' ')
            nombre = parts.slice(0, -1).join(' ')
          }
        }

        if (mounted) setInv({
          id: data.id,
          nombre,
          apellido,
          participants: data.participants,
          visto: !!data.view,
          aceptado: !!data.accepted,
          created_at: data.created_at,
        })
      } catch (err) {
        console.error(err)
        toast.add({ title: 'Error', message: err.message ?? 'Error al cargar', type: 'error' })
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [id])

  async function copyLink() {
    try {
      const url = `${location.origin}/invitacion/${id}`
      await navigator.clipboard.writeText(url)
      toast.add({ title: 'Copiado', message: 'Enlace copiado al portapapeles', type: 'success' })
    } catch (err) {
      console.error(err)
      toast.add({ title: 'Error', message: 'No se pudo copiar el enlace', type: 'error' })
    }
  }

  return (
    <main className="admin-page">
      <div className="admin-card">
        <div className="admin-header">
          <h1>Invitación</h1>
          <div style={{display:'flex',gap:8,alignItems:'center'}}>
            <button className="btn-ghost" onClick={() => navigate('/invitaciones')}>Volver</button>
            <button className="btn-primary" onClick={copyLink}>Copiar enlace</button>
          </div>
        </div>

        <section style={{ marginTop: 16 }}>
          {loading ? (
            <div style={{padding:20}}>Cargando...</div>
          ) : !inv ? (
            <div style={{padding:20}}>No se encontró la invitación.</div>
          ) : (
            <div>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:12}}>
                <div>
                  <h2 style={{margin:0}}>{inv.nombre} {inv.apellido}</h2>
                  <div className="meta" style={{marginTop:6}}>Creado: {inv.created_at ? new Date(inv.created_at).toLocaleString() : '-'}</div>
                </div>
                <div style={{textAlign:'right'}}>
                  <div style={{marginBottom:8}}><span className={`badge ${inv.visto ? 'badge--true' : 'badge--false'}`}>{inv.visto ? 'Visto' : 'No visto'}</span></div>
                  <div><span className={`badge ${inv.aceptado ? 'badge--true' : 'badge--false'}`}>{inv.aceptado ? 'Aceptado' : 'No aceptado'}</span></div>
                </div>
              </div>

              <div style={{marginTop:18}}>
                <div className="panel">
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                    <div>
                      <div className="small">Participantes</div>
                      <div style={{fontWeight:700,fontSize:'1.1rem'}}>{inv.participants ?? '-'}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
