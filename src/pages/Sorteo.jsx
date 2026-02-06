import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import '../assets/css/admin.css'
import GoldenParticles from '../components/GoldenParticles'

const PASTEL_COLORS = [
  '#FFB3BA', '#FFDFBA', '#FFFFBA', '#BAFFC9', '#BAE1FF', 
  '#E6B3FF', '#FFB3E6', '#E2F0CB', '#FFDAC1', '#FF9AA2', 
  '#B5EAD7', '#C7CEEA', '#F6EAC2', '#E0BBE4', '#957DAD'
]

function Roulette({ items, onComplete }) {
  const canvasRef = useRef(null)
  const [rotation, setRotation] = useState(0)
  const [isSpinning, setIsSpinning] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const width = canvas.width
    const height = canvas.height
    const centerX = width / 2
    const centerY = height / 2
    const radius = width / 2 - 10
    const total = items.length
    const arc = 2 * Math.PI / total

    ctx.clearRect(0, 0, width, height)

    ctx.font = "bold 24px 'Arial', sans-serif"
    ctx.textBaseline = 'middle'

    items.forEach((item, i) => {
      const angle = i * arc
      ctx.beginPath()
      ctx.fillStyle = PASTEL_COLORS[i % PASTEL_COLORS.length]
      ctx.moveTo(centerX, centerY)
      ctx.arc(centerX, centerY, radius, angle, angle + arc)
      ctx.lineTo(centerX, centerY)
      ctx.fill()
      ctx.stroke()
      
      ctx.save()
      ctx.translate(centerX, centerY)
      // Ajuste de rotación para texto legible
      ctx.rotate(angle + arc / 2)
      ctx.textAlign = "right"
      ctx.fillStyle = "#4a4a4a"
      
      // Ajustar tamaño fuente según longitud del texto
      const fontSize = item.length > 15 ? 16 : 22
      ctx.font = `bold ${fontSize}px 'Arial', sans-serif`
      
      ctx.fillText(item, radius - 40, 0)
      ctx.restore()
    })
  }, [items])

  const spin = () => {
    if (isSpinning) return
    setIsSpinning(true)
    // Girar entre 5 y 10 vueltas (360 * 5) más un valor aleatorio
    const randomOffset = Math.random() * 360
    const newRotation = rotation + 1800 + randomOffset
    setRotation(newRotation)
    
    // Calcular ganador
    const total = items.length
    const arcDegrees = 360 / total
    // El puntero está en 270 grados (arriba)
    // Cuando el canvas rota -R grados, el ángulo del canvas que queda en 270 es: (270 + R) % 360
    const normalizedRotation = newRotation % 360
    const winningAngle = (270 + normalizedRotation) % 360
    const winningIndex = Math.floor(winningAngle / arcDegrees) % total
    
    setTimeout(() => {
      setIsSpinning(false)
      if (onComplete) onComplete(items[winningIndex])
    }, 5000)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
      <div style={{ position: 'relative', width: '500px', height: '500px', maxWidth: '90vw', maxHeight: '90vw' }}>
        {/* Puntero */}
        <div style={{
          position: 'absolute',
          top: '-15px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 0, 
          height: 0, 
          borderLeft: '20px solid transparent',
          borderRight: '20px solid transparent',
          borderTop: '40px solid #d4af37',
          zIndex: 10,
          filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.3))'
        }} />
        
        {/* Contenedor circular con overflow hidden para evitar scrollbars durante la rotación */}
        <div style={{ width: '100%', height: '100%', overflow: 'hidden', borderRadius: '50%' }}>
          <canvas 
            ref={canvasRef} 
            width={500} 
            height={500}
            style={{
              width: '100%',
              height: '100%',
              transform: `rotate(-${rotation}deg)`,
              transition: 'transform 5s cubic-bezier(0.25, 0.1, 0.25, 1)' // Curva de desaceleración realista
            }}
          />
        </div>

        {/* Botón Central Overlay */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 20,
          transition: 'all 0.5s ease',
          opacity: isSpinning ? 0 : 1,
          pointerEvents: isSpinning ? 'none' : 'auto',
          transform: isSpinning ? 'translate(-50%, -50%) scale(0.5)' : 'translate(-50%, -50%) scale(1)'
        }}>
           <button 
            className="btn-primary" 
            style={{ 
              fontSize: '1.2rem', 
              padding: '0', 
              borderRadius: '50%',
              width: '80px',
              height: '80px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 15px rgba(0,0,0,0.5)',
              border: '3px solid white',
              fontFamily: 'var(--font-ui)',
              fontWeight: 'bold',
              minWidth: 'auto'
            }} 
            onClick={spin}
          >
            GIRAR
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Sorteo() {
  const [mesas, setMesas] = useState([])
  const [invitadosPorMesa, setInvitadosPorMesa] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [winner, setWinner] = useState(null)
  const [isClosing, setIsClosing] = useState(false)

  const closeModal = () => {
    setIsClosing(true)
    setTimeout(() => {
      setWinner(null)
      setIsClosing(false)
    }, 300)
  }
  
  // Estado para selección de mesa específica
  const [selectedTable, setSelectedTable] = useState(null)

  useEffect(() => {
    fetchInfo()
  }, [])

  async function fetchInfo() {
    setLoading(true)
    setError(null)
    try {
      const { data, error: err } = await supabase
        .from('invitations')
        .select('id, names, table')
        .eq('accepted', true)
        .not('table', 'is', null)

      if (err) throw err

      console.log('--- DEBUG SORTEO ---')
      console.log('Datos crudos recibidos de Supabase:', data)

      // Normalización robusta de datos en memoria
      const validData = (data || []).map(inv => ({
        ...inv,
        // Convertir a string y quitar espacios para evitar duplicados " 1" vs "1"
        safeTable: inv.table ? String(inv.table).trim() : ''
      })).filter(inv => 
        inv.safeTable !== '' && 
        inv.safeTable !== '-' && 
        inv.safeTable !== '7'
      )
      
      console.log('Datos válidos procesados (con mesa):', validData)

      // 1. Obtener lista de mesas únicas ordenadas

      // 1. Obtener lista de mesas únicas ordenadas
      const uniqueMesas = [...new Set(validData.map(d => d.safeTable))]
        .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))

      // 2. Agrupar invitados por mesa usando la clave normalizada
      const agrupados = {}
      // Inicializar claves para asegurar existencia
      uniqueMesas.forEach(m => agrupados[m] = [])
      
      validData.forEach(inv => {
        const t = inv.safeTable
        if (agrupados[t]) {
          agrupados[t].push(inv.names || 'Invitado')
        }
      })

      // Formatear nombres: Solo nombre, o Nombre + Inicial Apellido si se repite el nombre
      Object.keys(agrupados).forEach(table => {
        const rawList = agrupados[table]
        // Parsear para obtener primer nombre y apellido
        const parsedList = rawList.map(name => {
          const parts = name.trim().split(/\s+/)
          const firstName = parts[0]
          // Tomar todo lo que sobro como posible fuente del apellido, pero cogeremos solo la primera letra del siguiente token
          // Si el nombre es "Juan Perez", lastNamePart = "Perez". Si "Juan De la Cruz", parts[1] = "De"
          // El requerimiento dice "primera letra del apellido", asumimos el token inmediato al nombre.
          const lastNamePart = parts.length > 1 ? parts[1] : '' 
          return { original: name, firstName, lastNamePart }
        })

        // Contar ocurrencias de cada firstName
        const nameCounts = {}
        parsedList.forEach(p => {
          const key = p.firstName.toLowerCase()
          nameCounts[key] = (nameCounts[key] || 0) + 1
        })

        // Reconstruir lista
        agrupados[table] = parsedList.map(p => {
          const key = p.firstName.toLowerCase()
          if (nameCounts[key] > 1 && p.lastNamePart) {
            return `${p.firstName} ${p.lastNamePart.charAt(0)}.`
          }
          return p.firstName
        })
      })
      
      // Debug
      console.log('Mesas detectadas:', uniqueMesas)
      console.log('Invitados Agrupados por Mesa:', agrupados)
      console.log('--- FIN DEBUG SORTEO ---')

      setMesas(uniqueMesas)
      setInvitadosPorMesa(agrupados)
    } catch (err) {
      console.error(err)
      setError('Error al cargar la información del sorteo')
    } finally {
      setLoading(false)
    }
  }

  // Lista de items para la ruleta
  // Si hay mesa seleccionada, son los invitados de esa mesa
  const rouletteItems = selectedTable ? (invitadosPorMesa[selectedTable] || []) : []

  return (
    <div className="admin-page">
      <GoldenParticles />
      <div className="admin-card admin-card--wide">
        <div className="admin-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <h1 style={{ margin: 0 }}>
            {selectedTable ? `Sorteo Mesa ${selectedTable}` : 'Sorteo de Centro de Mesas'}
          </h1>
          {selectedTable && (
            <button 
              className="btn-ghost" 
              onClick={() => setSelectedTable(null)}
              style={{ padding: '0.4rem 1rem', fontSize: '0.85rem', minWidth: 'auto' }}
            >
              ← Volver
            </button>
          )}
        </div>

        {loading && <p className="loading-text">Cargando...</p>}
        {error && <p className="error-message">{error}</p>}

        {!loading && !error && (
          <div className="admin-content" style={{ marginTop: '2rem' }}>
            {selectedTable ? (
               // Vista Ruleta de una Mesa Específica
               rouletteItems.length > 0 ? (
                 <Roulette items={rouletteItems} onComplete={(w) => setWinner(w)} />
               ) : (
                 <p style={{textAlign:'center'}}>No hay participantes en esta mesa.</p>
               )
            ) : (
              // Vista Lista de Mesas
              <>
                <h2 style={{ textAlign: 'center', color: 'var(--inv-gold)', marginBottom: '2rem', fontFamily: 'var(--font-script)', fontSize: '2rem' }}>
                  Selecciona una mesa
                </h2>
                {mesas.length === 0 ? (
                  <p style={{ textAlign: 'center' }}>No hay mesas disponibles.</p>
                ) : (
                  <div style={{ 
                    display: 'flex', 
                    flexWrap: 'wrap',
                    justifyContent: 'center',
                    gap: '2rem',
                    padding: '1rem'
                  }}>
                    {mesas.map((mesa) => (
                      <div 
                        key={mesa} 
                        onClick={() => setSelectedTable(mesa)}
                        style={{
                          background: 'rgba(255, 255, 255, 0.05)',
                          border: '1px solid var(--inv-gold)',
                          borderRadius: '16px',
                          padding: '1.5rem',
                          textAlign: 'center',
                          boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '150px',
                          height: '150px',
                          backdropFilter: 'blur(5px)',
                          transition: 'all 0.3s ease',
                          cursor: 'pointer'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-5px)'
                          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)'
                          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
                        }}
                      >
                        <span style={{ 
                          fontSize: '0.85rem', 
                          color: 'var(--inv-gold)',
                          textTransform: 'uppercase',
                          letterSpacing: '2px',
                          fontWeight: '600',
                          marginBottom: '0.5rem'
                        }}>Mesa</span>
                        <span style={{ 
                          fontSize: '3.5rem', 
                          lineHeight: 1,
                          color: '#ffffff',
                          fontFamily: 'var(--font-script)',
                          textShadow: '0 2px 4px rgba(0,0,0,0.5)'
                        }}>{mesa}</span>
                        <span style={{
                          fontSize: '0.7rem',
                          color: 'rgba(255,255,255,0.5)',
                          marginTop: '0.5rem'
                        }}>
                          {(invitadosPorMesa[mesa] || []).length} participantes
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {winner && (
        <div className={`modal-overlay ${isClosing ? 'closing' : ''}`} onClick={closeModal}>
          <div className="modal" 
            style={{ 
              textAlign: 'center', 
              padding: '3rem', 
              maxWidth: '600px', 
              border: '2px solid var(--inv-gold)',
              background: 'radial-gradient(circle at center, #2c0e3a 0%, #1a0b26 100%)' 
            }} 
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ 
              color: 'var(--inv-gold)', 
              fontFamily: 'var(--font-script)', 
              fontSize: '2.5rem', 
              marginBottom: '1rem' 
            }}>
              ¡Ganador de {selectedTable ? `Mesa ${selectedTable}` : 'la Mesa'}!
            </h2>
            <div style={{ 
              fontSize: '3.5rem', 
              color: '#ffffff', 
              margin: '2rem 0', 
              fontWeight: 'bold',
              textShadow: '0 0 20px rgba(212, 175, 55, 0.5)' 
            }}>
              {winner}
            </div>
            <button 
              className="btn-primary" 
              onClick={closeModal}
              style={{ padding: '0.8rem 2.5rem', fontSize: '1.2rem' }}
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
