import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import '../assets/css/invitation.css'
import { useToast } from '../context/ToastContext'
import { supabase } from '../lib/supabase'

export default function Invitacion() {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const [inv, setInv] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showInvitation, setShowInvitation] = useState(false)
  const [introExiting, setIntroExiting] = useState(false)

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

  function handleContinue() {
    if (introExiting) return
    setIntroExiting(true)
    // Espera a que termine la animación de salida antes de mostrar la tarjeta
    setTimeout(() => {
      setShowInvitation(true)
    }, 500) // debe coincidir con la duración de .intro-exit en CSS
  }

  return (
    <div className={"invitation-container" + (showInvitation ? " invitation-mode" : "") }>
      {loading ? (
        <div className="loading-text">Cargando...</div>
      ) : !showInvitation ? (
        <div className={"intro-container" + (introExiting ? " intro-exit" : "") }>
          <img
            className="intro-image"
            src="/Diseño_sin_título-removebg-preview.png"
            alt="15's Arianna"
          />
          <button className="btn-gold" onClick={handleContinue} disabled={introExiting}>
            Continuar
          </button>
        </div>
      ) : (
        <div className="invitation-view card-enter">
          {/* Elementos decorativos */}
          <div className="corner-decoration corner-top-left"></div>
          <div className="corner-decoration corner-top-right"></div>
          <div className="corner-decoration corner-bottom-left"></div>
          <div className="corner-decoration corner-bottom-right"></div>

          <div className="invitation-header">
            <h1 className="invitation-title">Mis 15 Años</h1>
            <div className="invitation-subtitle">Arianna</div>
          </div>

          <div className="invitation-body">
            <p className="guest-label">Invitación especial para:</p>
            <h2 className="guest-name">{inv.nombre} {inv.apellido}</h2>
            
            <div className="invitation-details-text">
              <p>Pases válidos: <strong>{inv.participants}</strong></p>
              <p>Te espero para celebrar juntos este día inolvidable.</p>
            </div>
          </div>

          <div className="invitation-footer">
            {!inv.aceptado ? (
              <button className="btn-gold" onClick={() => console.log('Confirmar')}>
                Confirmar Asistencia
              </button>
            ) : (
              <div style={{ color: 'var(--inv-gold)', fontSize: '1.2rem', border: '1px solid var(--inv-gold)', padding: '10px' }}>
                ¡Asistencia Confirmada!
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
