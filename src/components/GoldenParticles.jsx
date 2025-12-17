import React, { useMemo } from 'react'

export default function GoldenParticles({ count = 28 }) {
  // Generamos propiedades aleatorias por partícula (posición, tamaño, duración, delay, opacidad, blur)
  const particles = useMemo(() => {
    return Array.from({ length: count }).map(() => {
      const left = Math.random() * 100
      const size = Math.round(6 + Math.random() * 20) // 6-26px
      const delay = (Math.random() * 6).toFixed(2) + 's'
      const duration = (8 + Math.random() * 14).toFixed(2) + 's'
      const opacity = (0.45 + Math.random() * 0.6).toFixed(2)
      const blur = (Math.random() * 1.5).toFixed(2) + 'px' // Menos blur para que se definan mejor los destellos
      const type = Math.random() > 0.7 ? 'sparkle' : 'dust'
      return { left, size, delay, duration, opacity, blur, type, id: Math.random().toString(36).slice(2) }
    })
  }, [count])

  return (
    <div className="golden-particles" aria-hidden>
      {particles.map(p => (
        <span
          key={p.id}
          className={`gold-particle ${p.type}`}
          style={{
            left: `${p.left}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            animationDelay: p.delay,
            animationDuration: p.duration,
            opacity: p.opacity,
            filter: p.type === 'dust' ? `blur(${p.blur})` : 'none' // Destellos nítidos
          }}
        />
      ))}
    </div>
  )
}
