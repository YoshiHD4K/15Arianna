import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import '../assets/css/admin.css'
import GoldenParticles from '../components/GoldenParticles'

export default function Sorteo() {
  const [mesas, setMesas] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchMesas()
  }, [])

  async function fetchMesas() {
    setLoading(true)
    setError(null)
    try {
      const { data, error: err } = await supabase
        .from('invitations')
        .select('table')
        .not('table', 'is', null)

      if (err) throw err

      // Procesar mesas únicas
      const uniqueMesas = [...new Set(
        (data || [])
          .map(r => r.table)
          .filter(t => {
            if (!t) return false
            const val = String(t).trim()
            return val !== '' && val !== '-' && val !== '7'
          })
      )].sort((a, b) => String(a).localeCompare(String(b), undefined, { numeric: true }))

      setMesas(uniqueMesas)
    } catch (err) {
      console.error(err)
      setError('Error al cargar las mesas')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="admin-page">
      <GoldenParticles />
      <div className="admin-card admin-card--wide">
        <div className="admin-header">
          <h1>Sorteo de Mesas</h1>
        </div>

        {loading && <p className="loading-text">Cargando mesas...</p>}
        {error && <p className="error-message">{error}</p>}

        {!loading && !error && (
          <div className="admin-content">
            <h2 style={{ textAlign: 'center', color: 'var(--inv-gold)', marginBottom: '2rem', fontFamily: 'var(--font-script)', fontSize: '2rem' }}>
              Mesas Participantes
            </h2>
            
            {mesas.length === 0 ? (
              <p style={{ textAlign: 'center' }}>No hay mesas disponibles para el sorteo.</p>
            ) : (
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', 
                gap: '1.5rem',
                padding: '1rem'
              }}>
                {mesas.map((mesa) => (
                  <div key={mesa} style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid var(--inv-gold)',
                    borderRadius: '12px',
                    padding: '2rem 1rem',
                    textAlign: 'center',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '120px'
                  }}>
                    <span style={{ 
                      fontSize: '0.9rem', 
                      color: 'rgba(255,255,255,0.7)',
                      textTransform: 'uppercase',
                      letterSpacing: '1px',
                      marginBottom: '0.5rem'
                    }}>Mesa</span>
                    <span style={{ 
                      fontSize: '2.5rem', 
                      fontWeight: 'bold', 
                      color: '#ffffff',
                      fontFamily: 'var(--font-script)'
                    }}>{mesa}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
