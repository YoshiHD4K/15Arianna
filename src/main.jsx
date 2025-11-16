import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './assets/css/index.css'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Admin from './pages/Admin'
import Invitaciones from './pages/Invitaciones'
import Invitacion from './pages/Invitacion'
import { ToastProvider } from './context/ToastContext'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/admin" replace />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/invitaciones" element={<Invitaciones />} />
          <Route path="/invitacion/:id" element={<Invitacion />} />
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  </StrictMode>,
)
