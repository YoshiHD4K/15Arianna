import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import '../assets/css/invitation.css'
import GoldenParticles from '../components/GoldenParticles'
import { useToast } from '../context/ToastContext'
import { supabase } from '../lib/supabase'

export default function Invitacion() {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const [inv, setInv] = useState(null)
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState('intro') // intro | parents | invitation
  const [introExiting, setIntroExiting] = useState(false)
  const [parentsExiting, setParentsExiting] = useState(false)
  // dentro de la vista 'invitation' gestionamos dos sub-pantallas: 'cover' (header) y 'details' (info)
  const [invSection, setInvSection] = useState('cover') // 'cover' | 'details'
  const containerRef = useRef(null)
  const [showMapModal, setShowMapModal] = useState(false)

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
      setView('parents')
    }, 500) // debe coincidir con la duración de .intro-exit en CSS
  }

  // Pantalla intermedia: mensaje de los padres (15s)
  useEffect(() => {
    if (view !== 'parents') return
    let exitTimer
    exitTimer = setTimeout(() => {
      setParentsExiting(true)
      setTimeout(() => setView('invitation'), 700) // coincide con animación de salida
    }, 20000)
    return () => { if (exitTimer) clearTimeout(exitTimer) }
  }, [view])

  // Simplificamos: el usuario cambiará entre 'cover' y 'details' mediante clicks
  function handleArrowClick() {
    setInvSection('details')
    // opcional: asegurarnos que el scroll de la tarjeta quede al tope
    if (containerRef.current) containerRef.current.scrollTop = 0
  }

  function handleBackToCover() {
    setInvSection('cover')
    if (containerRef.current) containerRef.current.scrollTop = 0
  }

  // Acciones para los nuevos botones
  function handleConfirmClick() {
    // marcar en UI como aceptado (local) y emitir log; idealmente aquí se llamaría a supabase
    setInv(prev => prev ? { ...prev, aceptado: true } : prev)
    console.log('Confirmar asistencia')
    toast.add({ title: 'Confirmado', message: 'Gracias por confirmar tu asistencia', type: 'success' })
  }

  function handleOpenMap() {
    // abrir modal con mapa embebido. Si `inv.location` existe, se usará; si no, se usa una búsqueda genérica.
    setShowMapModal(true)
  }

  function handleCloseMap() {
    setShowMapModal(false)
  }

  function handleOpenDetails() {
    // mostrar más detalles: por ahora navegar a una sección o mostrar un toast
    toast.add({ title: 'Detalles', message: 'Aquí puedes ver más información sobre el evento', type: 'info' })
  }


  return (
    <div className={"invitation-container" + (view === 'invitation' ? " invitation-mode" : "") }>
      <GoldenParticles />
      {loading ? (
        <div className="loading-text">Cargando...</div>
      ) : view === 'intro' ? (
        <div className={"intro-container" + (introExiting ? " intro-exit" : "") }>
          <img
            className="intro-image"
            src="/Diseño_sin_título-removebg-preview.png"
            alt="15's Arianna"
          />
          <button className="btn-gold" onClick={handleContinue} disabled={introExiting}>
            Continuar
          </button>
          {/* Esquinas decorativas en la pantalla de intro */}
          <img src="/Esquina.png" className="corner-decoration corner-top-left" alt="Esquina arriba izquierda" />
          <img src="/Esquina.png" className="corner-decoration corner-top-right" alt="Esquina arriba derecha" />
          <img src="/Esquina.png" className="corner-decoration corner-bottom-left" alt="Esquina abajo izquierda" />
          <img src="/Esquina.png" className="corner-decoration corner-bottom-right" alt="Esquina abajo derecha" />
        </div>
      ) : view === 'parents' ? (
        <div className={"parents-screen" + (parentsExiting ? " parents-exit" : " parents-enter") }>
          <div className="parents-box">
            <div className="parents-title">Con amor de tus padres</div>
            <ParentsMessage />
          </div>
          <img src="/Esquina.png" className="corner-decoration corner-top-left" alt="Esquina arriba izquierda" />
          <img src="/Esquina.png" className="corner-decoration corner-top-right" alt="Esquina arriba derecha" />
          <img src="/Esquina.png" className="corner-decoration corner-bottom-left" alt="Esquina abajo izquierda" />
          <img src="/Esquina.png" className="corner-decoration corner-bottom-right" alt="Esquina abajo derecha" />
        </div>
      ) : (
        <div className={"invitation-view card-enter"}>
          <div className="invitation-card" ref={containerRef}>
            {/* Esquinas decorativas dentro de la tarjeta */}
            <img src="/Esquina.png" className="corner-decoration corner-top-left" alt="Esquina arriba izquierda" />
            <img src="/Esquina.png" className="corner-decoration corner-top-right" alt="Esquina arriba derecha" />
            <img src="/Esquina.png" className="corner-decoration corner-bottom-left" alt="Esquina abajo izquierda" />
            <img src="/Esquina.png" className="corner-decoration corner-bottom-right" alt="Esquina abajo derecha" />

            {/* Two separate screens inside the card: cover (header) and details (invitation info) */}
            <div className={"cover-screen " + (invSection === 'cover' ? 'show' : 'hide')}>
              <div className="invitation-header">
                <img
                  src="/Diseño_sin_título__1_-removebg-preview.png"
                  alt="Corona"
                  className="crown-image"
                />
                <h1 className="invitation-name">Mis 15 años</h1>
                <div className="invitation-divider">
                  <div className="divider-diamond"></div>
                </div>
                <div className={"invitation-subtitle" + (invSection === 'details' ? " header-fade-up" : "")}>Arianna Sofía</div>
                <img
                  src="/Diseño_sin_título-removebg-preview.png"
                  alt="Lámpara"
                  className="lamp-image"
                />
                <img
                src="/Diseño_sin_título__2_-removebg-preview.png"
                alt="Desplazar hacia abajo"
                className="scroll-down-img"
                aria-hidden
                onClick={handleArrowClick}
              />
              </div>

            </div>

            <div className={"details-screen " + (invSection === 'details' ? 'show' : 'hide')}>
              {/* Flecha de volver (misma imagen que la de abajo, pero volteada) centrada encima de la sección de invitado */}
              <img
                src="/Diseño_sin_título__2_-removebg-preview.png"
                alt="Volver al encabezado"
                className="back-arrow"
                role="button"
                onClick={handleBackToCover}
              />
              {/* Corona encima de la sección "Invitación especial" */}
              <img
                src="/Diseño_sin_título__1_-removebg-preview.png"
                alt="Corona"
                className="crown-image crown-details"
              />
              <div className="invitation-body">
                  <p className="guest-label">Invitación especial para:</p>
                  {(() => {
                    const nombreCompleto = `${inv?.nombre ?? ''}${inv?.apellido ? ' ' + inv.apellido : ''}`.trim()
                    const parts = Number(inv?.participants)
                    // Ahora tratamos `participants` como el número de acompañantes (no incluimos al invitado)
                    const companions = Number.isFinite(parts) ? Math.max(0, parts) : null
                    let companionSubtitle = ''
                    if (companions === null) {
                      companionSubtitle = ''
                    } else if (companions === 0) {
                      companionSubtitle = 'sin acompañantes'
                    } else if (companions === 1) {
                      companionSubtitle = 'junto a 1 invitado'
                    } else {
                      companionSubtitle = `junto a ${companions} invitados`
                    }
                    return (
                      <>
                        <h2 className="guest-name">{nombreCompleto}</h2>
                        {companionSubtitle ? <p className="companion-subtitle">{companionSubtitle}</p> : null}
                      </>
                    )
                  })()}
                  <div className="invitation-details-text">
                    <p className="event-datetime">
                      Te esperamos el<span className="event-date">28 de febrero del 2026</span>a las<span className="event-time">8:00 p.m.</span>
                    </p>
                  </div>
              </div>
              <div className="invitation-footer">
                <div className="invitation-actions" role="group" aria-label="Acciones de invitación">
                  <div className="action-button">
                    <button
                      className="action-btn"
                      onClick={handleConfirmClick}
                      aria-pressed={!!inv?.aceptado}
                      title="Confirmar asistencia"
                    >
                      {/* Check icon */}
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                        <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                    <div className="action-label">{inv?.aceptado ? 'Confirmado' : 'Confirmar'}</div>
                  </div>

                  <div className="action-button">
                      {/* Map modal overlay */}
                      {showMapModal && (
                        <div className="map-modal-overlay" role="dialog" aria-modal="true" onClick={handleCloseMap}>
                          <div className="map-modal" onClick={(e) => e.stopPropagation()}>
                            <button className="map-modal-close" onClick={handleCloseMap} aria-label="Cerrar mapa">×</button>
                            <div className="map-modal-body">
                              <iframe
                                title="Mapa del lugar"
                                className="map-iframe"
                                src={`https://www.google.com/maps?q=${encodeURIComponent(inv?.location ?? 'Lugar de la celebración Arianna')}&output=embed`}
                                loading="lazy"
                                referrerPolicy="no-referrer-when-downgrade"
                              ></iframe>
                            </div>
                            <div className="map-modal-footer">
                              <button className="btn-gold" onClick={() => { window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(inv?.location ?? 'Lugar de la celebración Arianna')}`, '_blank') }}>Abrir en Google Maps</button>
                            </div>
                          </div>
                        </div>
                      )}
                    <button
                      className="action-btn"
                      onClick={handleOpenMap}
                      title="Lugar"
                    >
                      {/* Map pin icon */}
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 1 1 18 0z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                        <circle cx="12" cy="10" r="2.5" fill="currentColor" />
                      </svg>
                    </button>
                    <div className="action-label">Lugar</div>
                  </div>

                  <div className="action-button">
                    <button
                      className="action-btn"
                      onClick={handleOpenDetails}
                      title="Detalles"
                    >
                      {/* Dots / list icon */}
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                        <path d="M5 6h14M5 12h14M5 18h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                    <div className="action-label">Detalles</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// --- Componentes auxiliares ---
function ParentsMessage() {
  const message = `Querida Arianna, hoy celebramos tus quince años con el corazón lleno de orgullo y alegría.\nHas crecido con una luz única que ilumina a quienes te rodean.\nQue cada paso que des esté guiado por tus sueños y valores, y que nunca olvides cuánto te amamos.\nSiempre estaremos a tu lado, acompañándote en cada nuevo comienzo.`
  return (
    <div className="parents-message">
      {/* elemento fantasma para ocupar el alto total y evitar saltos */}
      <p className="parents-message-ghost" aria-hidden>{message}</p>
      <Typewriter text={message} speed={35} />
    </div>
  )
}

function Typewriter({ text, speed = 35 }) {
  const [display, setDisplay] = useState('')
  useEffect(() => {
    let i = 0
    let cancelled = false
    function tick() {
      if (cancelled) return
      setDisplay(text.slice(0, i))
      if (i < text.length) {
        i++
        setTimeout(tick, speed)
      }
    }
    tick()
    return () => { cancelled = true }
  }, [text, speed])
  return <p className="typewriter"><span>{display}</span></p>
}
