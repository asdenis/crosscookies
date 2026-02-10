'use client';

import { useEffect, useState, useRef } from 'react';
import IframeLoader from './components/IframeLoader';
import DebugPanel from './components/DebugPanel';
import { debugLogger } from './utils/debug';

export default function Home() {
  const [formUrl, setFormUrl] = useState<string>('');
  const [storageStatus, setStorageStatus] = useState<'idle' | 'requesting' | 'granted' | 'denied'>('idle');
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const requestStorageAccess = async () => {
    setStorageStatus('requesting');
    debugLogger.info('Solicitando Storage Access API');

    if (!document.requestStorageAccess) {
      debugLogger.warning('Storage Access API no disponible');
      setStorageStatus('denied');
      return;
    }

    try {
      await document.requestStorageAccess();
      setStorageStatus('granted');
      debugLogger.success('Storage Access concedido');
      
      // Recargar iframe
      if (iframeRef.current) {
        const currentSrc = iframeRef.current.src;
        iframeRef.current.src = '';
        setTimeout(() => {
          if (iframeRef.current) {
            iframeRef.current.src = currentSrc;
          }
        }, 100);
      }
    } catch (err: any) {
      debugLogger.error('Storage Access denegado', err);
      setStorageStatus('denied');
    }
  };

  useEffect(() => {
    const baseUrl = process.env.NEXT_PUBLIC_FORM_BASE_URL;
    const params = process.env.NEXT_PUBLIC_FORM_PARAMS;

    if (baseUrl && params) {
      setFormUrl(`${baseUrl}?${params}`);
      debugLogger.info('Formulario configurado', { baseUrl });
    }
  }, []);

  if (!formUrl) {
    return (
      <div style={{ padding: '20px' }}>
        <h1>Error de Configuración</h1>
        <p>Variables de entorno no configuradas.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'system-ui' }}>
      <DebugPanel />
      
      <h1>Formulario Tickets Plus - Gobierno de Mendoza</h1>

      {/* Storage Access Control */}
      {storageStatus === 'idle' && (
        <div style={{
          background: '#fff3cd',
          border: '2px solid #ffeeba',
          padding: '20px',
          borderRadius: '8px',
          marginBottom: '20px',
          textAlign: 'center'
        }}>
          <h3>🍪 Permisos de Cookies Requeridos</h3>
          <p style={{ margin: '15px 0' }}>
            Para que el formulario GeneXus funcione correctamente (botón "Iniciar" y adjuntos),
            <br/><strong>debes permitir el acceso a cookies cross-site</strong>.
          </p>
          <button
            onClick={requestStorageAccess}
            style={{
              padding: '15px 30px',
              fontSize: '16px',
              background: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            PERMITIR COOKIES PARA GENEXUS
          </button>
        </div>
      )}

      {storageStatus === 'requesting' && (
        <div style={{
          background: '#d1ecf1',
          border: '2px solid #bee5eb',
          padding: '15px',
          borderRadius: '8px',
          marginBottom: '20px',
          textAlign: 'center'
        }}>
          <p>🔄 Solicitando permisos... Acepta en el popup del navegador</p>
        </div>
      )}

      {storageStatus === 'granted' && (
        <div style={{
          background: '#d4edda',
          border: '2px solid #c3e6cb',
          padding: '15px',
          borderRadius: '8px',
          marginBottom: '20px',
          textAlign: 'center'
        }}>
          <p>✅ Cookies habilitadas - El formulario debería funcionar correctamente</p>
        </div>
      )}

      {storageStatus === 'denied' && (
        <div style={{
          background: '#f8d7da',
          border: '2px solid #f5c6cb',
          padding: '15px',
          borderRadius: '8px',
          marginBottom: '20px',
          textAlign: 'center'
        }}>
          <p>❌ Permisos denegados - El formulario puede no funcionar correctamente</p>
          <button
            onClick={requestStorageAccess}
            style={{
              marginTop: '10px',
              padding: '8px 16px',
              background: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '3px',
              cursor: 'pointer'
            }}
          >
            Reintentar
          </button>
        </div>
      )}

      {/* Iframe - siempre visible */}
      <IframeLoader
        ref={iframeRef}
        src={formUrl}
        width="100%"
        height="800px"
        sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-top-navigation allow-storage-access-by-user-activation"
      />

      {/* Debug info */}
      {debugLogger.isDebugEnabled() && (
        <div style={{
          marginTop: '20px',
          padding: '15px',
          background: '#f8f9fa',
          border: '1px solid #dee2e6',
          borderRadius: '5px',
          fontSize: '12px'
        }}>
          <h4>Debug Info</h4>
          <p><strong>Storage Status:</strong> {storageStatus}</p>
          <p><strong>Form URL:</strong> {formUrl.substring(0, 100)}...</p>
          <p><strong>Storage Access API:</strong> {typeof document.requestStorageAccess === 'function' ? 'Disponible' : 'No disponible'}</p>
          <p><strong>User Agent:</strong> {navigator.userAgent.substring(0, 100)}...</p>
        </div>
      )}
    </div>
  );
}