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

      // Recargar iframe para aplicar cookies
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
    // Construir URL
    const baseUrl = process.env.NEXT_PUBLIC_FORM_BASE_URL;
    const params = process.env.NEXT_PUBLIC_FORM_PARAMS;

    if (!baseUrl || !params) {
      debugLogger.error('Variables de entorno faltantes');
      return;
    }

    const fullUrl = `${baseUrl}?${params}`;
    setFormUrl(fullUrl);

    debugLogger.info('Aplicación inicializada', {
      baseUrl,
      paramsLength: params.length,
      fullUrl: fullUrl.substring(0, 100) + '...'
    });

    checkBrowserCapabilities();
  }, []);

  const checkBrowserCapabilities = () => {
    // ... tu función original sin cambios ...
  };

  if (!formUrl) {
    return (
      <div className="container">
        <DebugPanel />
        <div className="header">
          <h1>Error de Configuración</h1>
          <p>No se pudo construir la URL del formulario.</p>
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

      {/* Área obligatoria de permiso */}
      <div style={{
        margin: '30px 0',
        padding: '30px',
        background: storageAccess === 'granted' ? '#d4edda' : '#fff3cd',
        border: `2px solid ${storageAccess === 'granted' ? '#28a745' : '#ffeeba'}`,
        borderRadius: '12px',
        textAlign: 'center'
      }}>
        {storageAccess !== 'granted' && (
          <>
            <h2 style={{ marginTop: 0, color: '#856404' }}>
              Permiso requerido para usar el formulario
            </h2>
            <p style={{ fontSize: '18px', margin: '15px 0', color: '#856404' }}>
              El botón "Iniciar" da 401 y los adjuntos no se actualizan sin este permiso.
            </p>
            <p style={{ fontWeight: 'bold', marginBottom: '25px' }}>
              Haz clic abajo y acepta el permiso en el popup del navegador.
            </p>

            <button
              onClick={requestStorageAccess}
              disabled={storageAccess === 'requested'}
              style={{
                padding: '18px 40px',
                fontSize: '20px',
                fontWeight: 'bold',
                background: storageAccess === 'requested' ? '#6c757d' : '#ffc107',
                color: '#212529',
                border: 'none',
                borderRadius: '8px',
                cursor: storageAccess === 'requested' ? 'not-allowed' : 'pointer',
                boxShadow: '0 6px 12px rgba(0,0,0,0.15)'
              }}
            >
              {storageAccess === 'requested' ? 'Esperando tu permiso...' : 'Permitir cookies y cargar formulario'}
            </button>
          </>
        )}

        {storageAccess === 'granted' && (
          <h3 style={{ color: '#28a745', margin: 0 }}>
            ✅ Permiso concedido – formulario listo
          </h3>
        )}

        {storageAccess === 'denied' && (
          <div>
            <h3 style={{ color: '#dc3545', marginTop: 0 }}>❌ Permiso denegado</h3>
            <p style={{ color: '#721c24', marginBottom: '20px' }}>
              Sin permiso no se puede iniciar ni actualizar adjuntos.
            </p>
            <button
              onClick={requestStorageAccess}
              style={{
                padding: '14px 30px',
                fontSize: '18px',
                background: '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              Intentar nuevamente
            </button>
          </div>
        )}
      </div>

      {/* Iframe solo se muestra cuando se concedió el permiso */}
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
          marginTop: '40px',
          padding: '20px',
          background: 'rgba(255, 255, 255, 0.08)',
          borderRadius: '10px',
          color: 'white',
          fontSize: '13px'
        }}>
          <h3>Debug Info</h3>
          <p><strong>URL formulario:</strong> {formUrl.substring(0, 80)}...</p>
          <p><strong>Estado Storage Access:</strong> {storageAccess}</p>
          {/* ... resto del debug original ... */}
        </div>
      )}
    </div>
  );
}