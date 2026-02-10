'use client';

import { useEffect, useState, useRef } from 'react';
import IframeLoader from './components/IframeLoader';
import DebugPanel from './components/DebugPanel';
import { debugLogger } from './utils/debug';

export default function Home() {
  const [formUrl, setFormUrl] = useState<string>('');
  const [storageAccess, setStorageAccess] = useState<'idle' | 'requested' | 'granted' | 'denied'>('idle');
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const requestStorageAccess = async () => {
    debugLogger.storageAccessRequested();

    if (!document.requestStorageAccess) {
      debugLogger.storageAccessNotSupported();
      alert('Tu navegador no soporta Storage Access API. El formulario podría no funcionar correctamente.');
      setStorageAccess('denied');
      return;
    }

    setStorageAccess('requested');

    try {
      await document.requestStorageAccess();
      debugLogger.storageAccessGranted();
      setStorageAccess('granted');
      console.log('✅ Storage Access concedido – ahora el POST debería llevar cookies');

      // Recargamos el iframe para que use las cookies
      if (iframeRef.current) {
        debugLogger.iframeReloaded('Storage Access concedido');
        iframeRef.current.src = iframeRef.current.src;
      }
    } catch (err: any) {
      setStorageAccess('denied');
      debugLogger.storageAccessDenied(err.message);
      console.error('Usuario denegó Storage Access', err);
    }
  };

  useEffect(() => {
    // Construir la URL del formulario desde las variables de entorno
    const baseUrl = process.env.NEXT_PUBLIC_FORM_BASE_URL;
    const params = process.env.NEXT_PUBLIC_FORM_PARAMS;

    if (!baseUrl) {
      debugLogger.error('NEXT_PUBLIC_FORM_BASE_URL no está configurada');
      return;
    }

    if (!params) {
      debugLogger.error('NEXT_PUBLIC_FORM_PARAMS no está configurada');
      return;
    }

    const fullUrl = `${baseUrl}?${params}`;
    setFormUrl(fullUrl);

    debugLogger.info('Aplicación inicializada', {
      baseUrl,
      paramsLength: params.length,
      fullUrl: fullUrl.substring(0, 100) + '...'
    });

    // Verificar capacidades del navegador
    checkBrowserCapabilities();

    // NO llamamos automáticamente a requestStorageAccess() aquí
    // El usuario debe hacer clic en el botón visible

  }, []);

  const checkBrowserCapabilities = () => {
    const capabilities = {
      cookiesEnabled: navigator.cookieEnabled,
      javaScriptEnabled: true,
      userAgent: navigator.userAgent,
      language: navigator.language,
      onLine: navigator.onLine,
      storageAccessAPI: !!document.requestStorageAccess,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      localStorage: (() => {
        try {
          localStorage.setItem('test', 'test');
          localStorage.removeItem('test');
          return true;
        } catch {
          return false;
        }
      })(),
      sessionStorage: (() => {
        try {
          sessionStorage.setItem('test', 'test');
          sessionStorage.removeItem('test');
          return true;
        } catch {
          return false;
        }
      })()
    };

    debugLogger.info('Capacidades del navegador verificadas', capabilities);

    if (!capabilities.cookiesEnabled) {
      debugLogger.warning('Las cookies están deshabilitadas');
    }
    if (!capabilities.onLine) {
      debugLogger.error('Sin conexión detectada');
    }
    if (!capabilities.localStorage) {
      debugLogger.warning('localStorage no disponible');
    }
    if (!capabilities.sessionStorage) {
      debugLogger.warning('sessionStorage no disponible');
    }
    if (!capabilities.storageAccessAPI) {
      debugLogger.warning('Storage Access API no disponible');
    }
  };

  if (!formUrl) {
    return (
      <div className="container">
        <DebugPanel />
        <div className="header">
          <h1>Error de Configuración</h1>
          <p>No se pudo construir la URL del formulario. Verifica las variables de entorno.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <DebugPanel />

      <div className="header">
        <h1>Formulario Tickets Plus</h1>
        <p>Gobierno de Mendoza</p>
      </div>

      {/* Área de permiso obligatoria */}
      <div style={{
        margin: '20px 0',
        padding: '25px',
        background: storageAccess === 'granted' ? 'rgba(40, 167, 69, 0.15)' : 'rgba(255, 193, 7, 0.15)',
        border: `2px solid ${storageAccess === 'granted' ? '#28a745' : '#ffc107'}`,
        borderRadius: '12px',
        textAlign: 'center'
      }}>
        {storageAccess === 'idle' && (
          <>
            <h3 style={{ marginTop: 0, color: '#856404' }}>
              ¡Permiso necesario para continuar!
            </h3>
            <p style={{ fontSize: '16px', marginBottom: '20px', color: '#856404' }}>
              Para que el botón "Iniciar" funcione y los adjuntos se actualicen correctamente,
              <strong> debes permitir el acceso a cookies</strong>.
            </p>
            <p style={{ marginBottom: '25px', fontWeight: 'bold' }}>
              Haz clic en el botón y acepta el permiso en el popup del navegador.
            </p>
            <button
              onClick={requestStorageAccess}
              style={{
                padding: '16px 40px',
                fontSize: '18px',
                fontWeight: 'bold',
                background: '#ffc107',
                color: '#212529',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
              }}
            >
              Permitir cookies y cargar el formulario
            </button>
          </>
        )}

        {storageAccess === 'requested' && (
          <p style={{ fontSize: '18px', color: '#0d6efd' }}>
            Esperando tu permiso en el popup del navegador...
          </p>
        )}

        {storageAccess === 'granted' && (
          <>
            <h3 style={{ color: '#28a745', marginTop: 0 }}>
              ✅ Permiso concedido
            </h3>
            <p style={{ fontSize: '16px', color: '#155724' }}>
              Ahora el formulario debería funcionar completamente (incluyendo "Iniciar" y actualización de adjuntos).
            </p>
          </>
        )}

        {storageAccess === 'denied' && (
          <>
            <h3 style={{ color: '#dc3545', marginTop: 0 }}>
              ❌ Permiso denegado
            </h3>
            <p style={{ fontSize: '16px', color: '#721c24', marginBottom: '20px' }}>
              Sin este permiso el botón "Iniciar" dará error 401 y los adjuntos no se actualizarán.
            </p>
            <button
              onClick={requestStorageAccess}
              style={{
                padding: '14px 30px',
                fontSize: '16px',
                background: '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              Intentar nuevamente
            </button>
          </>
        )}
      </div>

      {/* El iframe solo se muestra cuando el permiso fue concedido */}
      {storageAccess === 'granted' && (
        <IframeLoader
          ref={iframeRef}
          src={formUrl}
          width={process.env.NEXT_PUBLIC_IFRAME_WIDTH}
          height={process.env.NEXT_PUBLIC_IFRAME_HEIGHT}
          sandbox={process.env.NEXT_PUBLIC_IFRAME_SANDBOX}
        />
      )}

      {debugLogger.isDebugEnabled() && (
        <div style={{
          marginTop: '30px',
          padding: '20px',
          background: 'rgba(255, 255, 255, 0.08)',
          borderRadius: '10px',
          color: 'white',
          fontSize: '13px'
        }}>
          <h3>Información de Debug</h3>
          <p><strong>URL del formulario:</strong> {formUrl.substring(0, 80)}...</p>
          <p><strong>Estado Storage Access:</strong> {storageAccess}</p>
          <p><strong>Modo debug:</strong> {process.env.NEXT_PUBLIC_DEBUG_MODE}</p>
          <p><strong>Nivel de debug:</strong> {process.env.NEXT_PUBLIC_DEBUG_LEVEL}</p>
          <p><strong>Timeout de carga:</strong> {process.env.NEXT_PUBLIC_LOAD_TIMEOUT}ms</p>
          <p><strong>Intentos de reintento:</strong> {process.env.NEXT_PUBLIC_RETRY_ATTEMPTS}</p>
        </div>
      )}
    </div>
  );
}