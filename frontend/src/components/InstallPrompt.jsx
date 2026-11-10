import { useEffect, useState } from 'react'
import { Download, X } from 'lucide-react'

/**
 * Banner de instalación PWA.
 * Captura el evento `beforeinstallprompt` del navegador y ofrece
 * un botón para instalar AcaPlan como aplicación en el dispositivo.
 */
export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [dismissed, setDismissed] = useState(false)
  const [installed, setInstalled] = useState(false)

  useEffect(() => {
    // Si ya está instalada como standalone, no mostrar el banner
    if (typeof window.matchMedia === 'function' &&
        window.matchMedia('(display-mode: standalone)').matches) {
      setInstalled(true)
      return
    }

    function onBeforeInstall(event) {
      event.preventDefault()
      setDeferredPrompt(event)
    }

    function onAppInstalled() {
      setInstalled(true)
      setDeferredPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstall)
    window.addEventListener('appinstalled', onAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall)
      window.removeEventListener('appinstalled', onAppInstalled)
    }
  }, [])

  async function handleInstall() {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      setInstalled(true)
    }
    setDeferredPrompt(null)
  }

  // No mostrar si ya está instalada, si el usuario cerró el banner, o si no hay prompt disponible
  if (installed || dismissed || !deferredPrompt) return null

  return (
    <div className="install-prompt-banner" role="alert">
      <div className="install-prompt-content">
        <Download size={20} />
        <div className="install-prompt-text">
          <strong>Instalar AcaPlan</strong>
          <span>Accede más rápido desde tu dispositivo</span>
        </div>
      </div>
      <div className="install-prompt-actions">
        <button className="primary install-prompt-btn" onClick={handleInstall}>
          Instalar
        </button>
        <button
          className="install-prompt-close"
          onClick={() => setDismissed(true)}
          aria-label="Cerrar aviso de instalación"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  )
}
