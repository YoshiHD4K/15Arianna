import { createContext, useContext, useState, useCallback } from 'react'

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const remove = useCallback((id) => {
    setToasts((t) => t.filter((x) => x.id !== id))
  }, [])

  const add = useCallback(({ title, message, type = 'info', duration = 4000 }) => {
    const id = Date.now() + Math.random()
    setToasts((t) => [{ id, title, message, type }, ...t])
    setTimeout(() => remove(id), duration)
    return id
  }, [remove])

  return (
    <ToastContext.Provider value={{ add, remove }}>
      {children}
      <div className="toast-container" aria-live="polite">
        {toasts.map((to) => (
          <div key={to.id} className={`toast toast--${to.type}`}>
            {to.title && <div className="toast-title">{to.title}</div>}
            <div className="toast-message">{to.message}</div>
            <button className="toast-close" onClick={() => remove(to.id)} aria-label="Cerrar">×</button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast debe usarse dentro de ToastProvider')
  return ctx
}
