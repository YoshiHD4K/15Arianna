import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useParams, useNavigate } from 'react-router-dom'
import '../assets/css/invitation.css'
import GoldenParticles from '../components/GoldenParticles'
import { useToast } from '../context/ToastContext'
import { supabase } from '../lib/supabase'

export default function Invitacion() {
  // ---------------------------------------------------------
  // CONFIGURACIÓN: Escribe aquí la dirección o las coordenadas (latitud, longitud)
  // Ejemplo coordenadas: "10.4806, -66.9036"
  const EVENT_LOCATION = "10.434377, -66.969000" 
  // ---------------------------------------------------------

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
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [openDetailId, setOpenDetailId] = useState(null)

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

        // Marcar como visto si aún no lo está
        if (!data.view) {
          supabase
            .from('invitations')
            .update({ view: true })
            .eq('id', id)
            .then(({ error }) => {
              if (error) console.error('Error al marcar visto:', error)
            })
        }
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
  async function handleConfirmClick() {
    if (!inv) return
    const newStatus = !inv.aceptado

    // Actualización optimista
    setInv(prev => ({ ...prev, aceptado: newStatus }))

    try {
      const { error } = await supabase
        .from('invitations')
        .update({ accepted: newStatus })
        .eq('id', id)

      if (error) {
        // Revertir si falla
        setInv(prev => ({ ...prev, aceptado: !newStatus }))
        throw error
      }

      if (newStatus) {
        toast.add({ title: 'Confirmado', message: 'Gracias por confirmar tu asistencia', type: 'success' })
      } else {
        toast.add({ title: 'Pendiente', message: 'Has cancelado tu confirmación', type: 'info' })
      }
    } catch (err) {
      console.error(err)
      toast.add({ title: 'Error', message: 'No se pudo actualizar', type: 'error' })
    }
  }

  function handleOpenMap() {
    // abrir modal con mapa embebido. Si `inv.location` existe, se usará; si no, se usa una búsqueda genérica.
    setShowMapModal(true)
  }

  function handleCloseMap() {
    setShowMapModal(false)
  }

  function handleOpenDetails() {
    setShowDetailsModal(true)
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
                <div className="parents-block">
                  <p className="parents-intro">Mis padres</p>
                  <h2 className="parents-names">Alexis Reveron<br/>Merlin Lopez</h2>
                  <p className="parents-intro">tenemos el honor de invitarles a</p>
                </div>
                <h1 className="invitation-name">Mis 15 años</h1>
                <div className="invitation-divider">
                  <div className="divider-diamond"></div>
                </div>
                <div className={"invitation-subtitle" + (invSection === 'details' ? " header-fade-up" : "")}>Arianna Sofia</div>
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
                      companionSubtitle = ''
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
                      <span className="event-date">Febrero</span><br/>Sabado <span className="event-day">(28)</span><span className="event-time">8:00 p.m.</span>
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

      {/* Modals rendered via Portal with exit animations */}
      <AnimatedModal 
        isOpen={showMapModal} 
        onClose={handleCloseMap} 
        className="inv-modal--map"
      >
        <div className="inv-modal-header">
          <h3 className="inv-modal-title">Ubicación</h3>
          <button className="inv-modal-close" onClick={handleCloseMap} aria-label="Cerrar mapa">×</button>
        </div>
        <div className="inv-modal-body inv-modal-body--map">
          <iframe
            title="Mapa del lugar"
            className="map-iframe"
            src={`https://www.google.com/maps?q=${encodeURIComponent(inv?.location ?? EVENT_LOCATION)}&output=embed`}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          ></iframe>
        </div>
        <div className="inv-modal-footer" style={{flexDirection: 'column', gap: 10}}>
          <button className="btn-gold" onClick={() => { window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(inv?.location ?? EVENT_LOCATION)}`, '_blank') }}>Abrir en Google Maps App</button>
          <p style={{margin:0, fontSize:'0.75rem', opacity:0.6, fontFamily:'var(--font-ui)'}}>Recomendado para una mejor experiencia en móviles</p>
        </div>
      </AnimatedModal>

      <AnimatedModal 
        isOpen={showDetailsModal} 
        onClose={() => setShowDetailsModal(false)}
      >
        <div className="inv-modal-header">
          <h3 className="inv-modal-title">Detalles del Evento</h3>
          <button className="inv-modal-close" onClick={() => setShowDetailsModal(false)} aria-label="Cerrar detalles">×</button>
        </div>
        <div className="inv-modal-body">
          <div className="detail-list">
            
            {/* Código de Vestimenta */}
            <div className={`detail-accordion ${openDetailId === 'dresscode' ? 'open' : ''}`}>
              <button 
                className="detail-accordion-header" 
                onClick={() => setOpenDetailId(openDetailId === 'dresscode' ? null : 'dresscode')}
              >
                <div className="detail-accordion-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.38 3.4a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2 2 2 0 0 0 2-2v-2a2 2 0 0 0-2-2zM4 22h16v-3h-2v-2h2v-3h-2v-2h2V9H4v3h2v2H4v3h2v2H4v3zM8 9h8v8H8V9z"/></svg>
                </div>
                <h3 className="detail-accordion-title">Código de Vestimenta</h3>
                <div className="detail-accordion-arrow">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                </div>
              </button>
              <div className="detail-accordion-content">
                <div className="detail-accordion-inner">
                  <p>Semiformal (No Jeans, no zapatos deportivos, se reserva el color azul turquesa para la homenajeada).</p>
                </div>
              </div>
            </div>

            {/* Lluvia de Sobres */}
            <div className={`detail-accordion ${openDetailId === 'gift' ? 'open' : ''}`}>
              <button 
                className="detail-accordion-header" 
                onClick={() => setOpenDetailId(openDetailId === 'gift' ? null : 'gift')}
              >
                <div className="detail-accordion-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 12v10H4V12M2 7h20v5H2zM12 22V7M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>
                </div>
                <h3 className="detail-accordion-title">Obsequios</h3>
                <div className="detail-accordion-arrow">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                </div>
              </button>
              <div className="detail-accordion-content">
                <div className="detail-accordion-inner">
                  <p>Lluvia de sobres</p>
                </div>
              </div>
            </div>

            {/* Puntualidad */}
            <div className={`detail-accordion ${openDetailId === 'time' ? 'open' : ''}`}>
              <button 
                className="detail-accordion-header" 
                onClick={() => setOpenDetailId(openDetailId === 'time' ? null : 'time')}
              >
                <div className="detail-accordion-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                </div>
                <h3 className="detail-accordion-title">Cronograma</h3>
                <div className="detail-accordion-arrow">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                </div>
              </button>
              <div className="detail-accordion-content">
                <div className="detail-accordion-inner">
                  <p>La magia inicia a las 9:00 PM, con la salida de la quinceañera</p>
                </div>
              </div>
            </div>

          </div>
        </div>
        <div className="inv-modal-footer">
          <button className="btn-gold" onClick={() => setShowDetailsModal(false)}>Entendido</button>
        </div>
      </AnimatedModal>
    </div>
  )
}

// --- Componentes auxiliares ---
function AnimatedModal({ isOpen, onClose, children, className = '' }) {
  const [render, setRender] = useState(isOpen)
  const [isClosing, setIsClosing] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setRender(true)
      setIsClosing(false)
    } else if (render) {
      setIsClosing(true)
      const timer = setTimeout(() => {
        setRender(false)
        setIsClosing(false)
      }, 300) // Duración de la animación en CSS
      return () => clearTimeout(timer)
    }
  }, [isOpen, render])

  // Bloquear scroll del body cuando el modal está abierto
  useEffect(() => {
    if (render) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [render])

  if (!render) return null

  return createPortal(
    <div 
      className={`inv-modal-overlay ${isClosing ? 'closing' : ''}`} 
      role="dialog" 
      aria-modal="true" 
      onClick={onClose}
    >
      <div 
        className={`inv-modal ${className}`} 
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>,
    document.body
  )
}

function ParentsMessage() {
  const message = `Nuestra niña ya pronto será una valiente y hermosa quinceañera, hoy florece como nunca, que la vida te regale caminos llenos de luz. \nHoy agradecemos a Dios por tus 15 años, por la vida que florece en ti y por el camino que empieza a abrirse ante tus pasos.`
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
