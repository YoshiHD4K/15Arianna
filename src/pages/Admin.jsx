import { useState, useEffect } from 'react'
import { registerAdmin, loginAdmin, logout, getSession, getAdmin, isAuthenticated } from '../utils/auth'
import '../assets/css/admin.css'
import { useToast } from '../context/ToastContext'
import { useNavigate } from 'react-router-dom'

export default function Admin() {
  const [mode, setMode] = useState('login') // 'login' | 'register'
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [message, setMessage] = useState(null)
  const [error, setError] = useState(null)
  const [user, setUser] = useState(null)

  const toast = useToast()
  const navigate = useNavigate()
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem('theme') || (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    } catch { return 'light' }
  })

  useEffect(() => {
    let mounted = true
    ;(async () => {
      const session = await getSession()
      if (mounted && session) {
        setUser(session.user ?? session)
        // si ya hay sesión, redirigir a invitaciones
        try { navigate('/invitaciones') } catch {}
      }
    })()
    return () => { mounted = false }
  }, [])

  useEffect(() => {
    try {
      if (theme === 'dark') document.documentElement.setAttribute('data-theme', 'dark')
      else document.documentElement.removeAttribute('data-theme')
      localStorage.setItem('theme', theme)
    } catch (e) { }
  }, [theme])

  function clearForm() {
    setName('')
    setEmail('')
    setPassword('')
    setConfirm('')
    setError(null)
    setMessage(null)
  }

  async function handleRegister(e) {
    e?.preventDefault()
    setError(null)
    setLoading(true)
    if (password !== confirm) {
      setLoading(false)
      return setError('Las contraseñas no coinciden.')
    }
    const res = await registerAdmin({ name: name.trim(), email: email.trim(), password })
    setLoading(false)
    if (!res.ok) {
      setError(res.message)
      toast.add({ title: 'Error', message: res.message, type: 'error' })
      return
    }
    setMessage(res.message)
    toast.add({ title: 'OK', message: res.message, type: 'success' })
    clearForm()
    setMode('login')
  }

  async function handleLogin(e) {
    e?.preventDefault()
    setError(null)
    setLoading(true)
    const res = await loginAdmin(email.trim(), password)
    setLoading(false)
    if (!res.ok) {
      setError(res.message)
      toast.add({ title: 'Error', message: res.message, type: 'error' })
      return
    }
    // res.session es un objeto con access_token y user
    setUser(res.session.user ?? res.session)
    setMessage(res.message)
    toast.add({ title: 'OK', message: res.message, type: 'success' })
    clearForm()
    // redirigir a /invitaciones
    navigate('/invitaciones')
  }

  async function handleLogout() {
    await logout()
    setUser(null)
    setMessage('Sesión cerrada.')
    toast.add({ title: 'OK', message: 'Sesión cerrada', type: 'info' })
  }

  const [checkingAdmin, setCheckingAdmin] = useState(true)
  const [adminExists, setAdminExists] = useState(false)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      const a = await getAdmin()
      if (!mounted) return
      setAdminExists(!!a)
      setCheckingAdmin(false)
    })()
    return () => { mounted = false }
  }, [])

  const [loading, setLoading] = useState(false)

  return (
    <main className="admin-page">
      <div className="admin-card">
        <div className="admin-header">
          <h1 style={{display:'flex',alignItems:'center',gap:12}}>
            Panel de administrador
            <button className="icon-btn" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} title="Alternar tema" aria-label="Alternar tema">
              {theme === 'dark' ? (
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6.76 4.84l-1.8-1.79L3.17 4.84l1.79 1.8 1.8-1.8zM1 13h3v-2H1v2zm10 9h2v-3h-2v3zM17.24 4.84l1.8-1.79 1.79 1.79-1.79 1.79-1.8-1.79zM20 11v2h3v-2h-3zM6.76 19.16l-1.8 1.79L3.17 19.16l1.79-1.8 1.8 1.8zM17.24 19.16l1.8 1.79 1.79-1.79-1.79-1.8-1.8 1.8zM12 5a7 7 0 100 14 7 7 0 000-14z" fill="currentColor"/></svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M21.64 13a9 9 0 11-10.63-10.63A7 7 0 0021.64 13z" fill="currentColor"/></svg>
              )}
            </button>
          </h1>
          <p className="meta">Gestión básica — demo</p>
        </div>

        <div className="split">
          <div className="panel">
            {user ? (
              <div className="sessionBox">
                <h2 style={{margin:0}}>Bienvenido, {user.name}</h2>
                <p className="small">Conectado como <strong>{user.email}</strong></p>
                <div className="buttons">
                  <button className="btn-primary" onClick={handleLogout}>Cerrar sesión</button>
                </div>
                <div style={{marginTop:8}} className="small">Sesión iniciada: {new Date(user.startedAt).toLocaleString()}</div>
              </div>
            ) : (
              <>
                <div className="toggle" style={{marginBottom:12}}>
                  <button onClick={() => { setMode('login'); setError(null); setMessage(null) }} disabled={mode==='login'}>Iniciar sesión</button>
                  <button onClick={() => { setMode('register'); setError(null); setMessage(null) }} disabled={mode==='register'}>Registrarse</button>
                </div>

                {error && <div className="msg msg--error">{error}</div>}
                {message && <div className="msg msg--ok">{message}</div>}

                {mode === 'register' ? (
                  <form onSubmit={handleRegister}>
                    <label>
                      Nombre
                      <input value={name} onChange={e => setName(e.target.value)} placeholder="Nombre completo" />
                    </label>
                    <label>
                      Email
                      <input value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@ejemplo.com" />
                    </label>
                    <label>
                      Contraseña
                      <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Contraseña" />
                    </label>
                    <label>
                      Confirmar contraseña
                      <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Confirmar contraseña" />
                    </label>
                    <div className="buttons">
                      <button className="btn-primary" type="submit" disabled={loading}>{loading ? 'Creando...' : 'Crear administrador'}</button>
                      <button className="btn-ghost" type="button" onClick={() => { setMode('login'); clearForm() }}>Volver</button>
                    </div>
                  </form>
                ) : (
                  <form onSubmit={handleLogin}>
                    <label>
                      Email
                      <input value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@ejemplo.com" />
                    </label>
                    <label>
                      Contraseña
                      <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Contraseña" />
                    </label>
                    <div className="buttons">
                      <button className="btn-primary" type="submit" disabled={loading}>{loading ? 'Entrando...' : 'Entrar'}</button>
                      <button className="btn-ghost" type="button" onClick={() => { setMode('register'); clearForm() }} disabled={checkingAdmin ? true : undefined}>Crear cuenta</button>
                    </div>
                  </form>
                )}
              </>
            )}
          </div>

          <aside className="panel">
            <h3 style={{marginTop:0}}>Información</h3>
            <p className="small">Esta sección está pensada para un demo local. Los datos se guardan en <code>localStorage</code>. Para producción integra un backend y hashing seguro.</p>
            <hr />
            <p className="small"><strong>Estado:</strong> {isAuthenticated() ? 'Autenticado' : 'Desconectado'}</p>
            <p className="small">Administrador registrado: {getAdmin() ? getAdmin().email : 'No'}</p>
          </aside>
        </div>

      </div>
    </main>
  )
}
