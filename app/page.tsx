'use client';

import { useEffect, useState, useRef } from 'react';
import IframeLoader from './components/IframeLoader';
import DebugPanel from './components/DebugPanel';
import { debugLogger } from './utils/debug';

export default function Home() {
  const [formUrl, setFormUrl] = useState<string>('');
  const [storageStatus, setStorageStatus] = useState<'idle' | 'requesting' | 'granted' | 'denied' | 'redirect'>('idle');
  const [showIframe, setShowIframe] = useState<boolean>(true);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const redirectToForm = () => {
    setStorageStatus('redirect');
    debugLogger.info('Redirigiendo al formulario directamente');
    
    // Redirigir a la página del formulario
    window.location.href = formUrl;
  };

  const requestStorageAccess = async () => {
    setStorageStatus('requesting');
    debugLogger.info('Solicitando Storage Access API');

    // Verificar si estamos en el cliente
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      debugLogger.warning('No estamos en el cliente');
      setStorageStatus('denied');
      return;
    }

    // Verificar si Storage Access API está disponible
    if (typeof document.requestStorageAccess !== 'function') {
      debugLogger.warning('Storage Access API no disponible, redirigiendo directamente');
      redirectToForm();
      return;
    }

    try {
      // Primero verificar si ya tenemos acceso
      const hasAccess = await document.hasStorageAccess?.() || false;
      if (hasAccess) {
        debugLogger.info('Ya tenemos acceso a storage');
        setStorageStatus('granted');
        return;
      }

      // Solicitar acceso
      await document.requestStorageAccess();
      setStorageStatus('granted');
      debugLogger.success('Storage Access concedido');
      
      // Recargar iframe después de un breve delay
      setTimeout(() => {
        if (iframeRef.current) {
          const currentSrc = iframeRef.current.src;
          iframeRef.current.src = '';
          setTimeout(() => {
            if (iframeRef.current) {
              iframeRef.current.src = currentSrc;
              debugLogger.info('Iframe recargado con acceso a cookies');
            }
          }, 200);
        }
      }, 500);
      
    } catch (err: any) {
      debugLogger.error('Storage Access denegado, redirigiendo directamente', err);
      redirectToForm();
    }
  };

  useEffect(() => {
    const baseUrl = process.env.NEXT_PUBLIC_FORM_BASE_URL;
    const params = process.env.NEXT_PUBLIC_FORM_PARAMS;

    if (baseUrl && params) {
      setFormUrl(`${baseUrl}?${params}`);
      debugLogger.info('Formulario configurado', { baseUrl });
    }

    // Verificar si ya tenemos acceso a storage
    const checkStorageAccess = async () => {
      if (typeof window !== 'undefined' && typeof document !== 'undefined' && document.hasStorageAccess) {
        try {
          const hasAccess = await document.hasStorageAccess();
          if (hasAccess) {
            setStorageStatus('granted');
            debugLogger.info('Ya tenemos acceso a storage al cargar');
          }
        } catch (err) {
          debugLogger.warning('Error verificando storage access', err);
        }
      }
    };

    checkStorageAccess();
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
          <h3>🍪 Configuración de Sesión Requerida</h3>
          <p style={{ margin: '15px 0' }}>
            Para que el formulario GeneXus funcione correctamente (botón "Iniciar" y adjuntos),
            <br/><strong>necesitas establecer una sesión válida</strong>.
          </p>
          <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', flexWrap: 'wrap' }}>
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
              CONFIGURAR COOKIES
            </button>
            <button
              onClick={redirectToForm}
              style={{
                padding: '15px 30px',
                fontSize: '16px',
                background: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              IR DIRECTAMENTE AL FORMULARIO
            </button>
          </div>
          <p style={{ fontSize: '14px', marginTop: '15px', color: '#666' }}>
            Si tienes problemas con el iframe, usa "IR DIRECTAMENTE AL FORMULARIO"
          </p>
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
          <button
            onClick={redirectToForm}
            style={{
              marginTop: '10px',
              padding: '8px 16px',
              background: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '3px',
              cursor: 'pointer'
            }}
          >
            Si aún tienes problemas, ir directamente al formulario
          </button>
        </div>
      )}

      {storageStatus === 'redirect' && (
        <div style={{
          background: '#d1ecf1',
          border: '2px solid #bee5eb',
          padding: '15px',
          borderRadius: '8px',
          marginBottom: '20px',
          textAlign: 'center'
        }}>
          <p>🔄 Redirigiendo al formulario...</p>
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
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap', marginTop: '10px' }}>
            <button
              onClick={requestStorageAccess}
              style={{
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
            <button
              onClick={redirectToForm}
              style={{
                padding: '8px 16px',
                background: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '3px',
                cursor: 'pointer'
              }}
            >
              Ir directamente al formulario
            </button>
          </div>
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
          <p><strong>Storage Access API:</strong> {typeof window !== 'undefined' && typeof document.requestStorageAccess === 'function' ? 'Disponible' : 'No disponible'}</p>
          <p><strong>User Agent:</strong> {navigator.userAgent.substring(0, 100)}...</p>
        </div>
      )}
    </div>
  );
}