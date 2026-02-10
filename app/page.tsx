'use client';

import { useEffect, useState, useRef } from 'react';
import IframeLoader from './components/IframeLoader';
import DebugPanel from './components/DebugPanel';
import { debugLogger } from './utils/debug';

export default function Home() {
  const [formUrl, setFormUrl] = useState<string>('');
  const [storageStatus, setStorageStatus] = useState<'idle' | 'requesting' | 'granted' | 'denied' | 'establishing-session'>('idle');
  const [sessionReady, setSessionReady] = useState<boolean>(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const establishSessionWithFetch = async () => {
    setStorageStatus('establishing-session');
    debugLogger.info('Estableciendo sesión con fetch');

    try {
      // Hacer una petición inicial para establecer cookies
      const response = await fetch(formUrl, {
        method: 'GET',
        credentials: 'include', // Importante: incluir cookies
        mode: 'cors',
        headers: {
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'User-Agent': navigator.userAgent
        }
      });

      debugLogger.info('Respuesta inicial recibida', { status: response.status });

      if (response.ok) {
        // Esperar un poco para que las cookies se establezcan
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setSessionReady(true);
        setStorageStatus('granted');
        debugLogger.success('Sesión establecida correctamente');

        // Cargar el iframe después de establecer la sesión
        setTimeout(() => {
          if (iframeRef.current) {
            iframeRef.current.src = formUrl;
            debugLogger.info('Iframe cargado con sesión establecida');
          }
        }, 500);
      } else {
        debugLogger.warning('Respuesta no exitosa, intentando con Storage Access API');
        await requestStorageAccessFallback();
      }
    } catch (error) {
      debugLogger.error('Error estableciendo sesión con fetch', error);
      await requestStorageAccessFallback();
    }
  };

  const requestStorageAccessFallback = async () => {
    debugLogger.info('Intentando Storage Access API como fallback');

    if (typeof window === 'undefined' || typeof document === 'undefined') {
      debugLogger.warning('No estamos en el cliente');
      setStorageStatus('denied');
      return;
    }

    if (typeof document.requestStorageAccess !== 'function') {
      debugLogger.warning('Storage Access API no disponible');
      setStorageStatus('denied');
      return;
    }

    try {
      const hasAccess = await document.hasStorageAccess?.() || false;
      if (hasAccess) {
        debugLogger.info('Ya tenemos acceso a storage');
        setStorageStatus('granted');
        setSessionReady(true);
        return;
      }

      await document.requestStorageAccess();
      setStorageStatus('granted');
      setSessionReady(true);
      debugLogger.success('Storage Access concedido');
      
      setTimeout(() => {
        if (iframeRef.current) {
          iframeRef.current.src = formUrl;
          debugLogger.info('Iframe cargado después de Storage Access');
        }
      }, 500);
      
    } catch (err: any) {
      debugLogger.error('Storage Access denegado', err);
      setStorageStatus('denied');
    }
  };

  const requestStorageAccess = async () => {
    setStorageStatus('requesting');
    debugLogger.info('Iniciando proceso de establecimiento de sesión');

    // Primero intentar establecer sesión con fetch
    await establishSessionWithFetch();
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
            Para que el formulario GeneXus funcione correctamente en el iframe,
            <br/><strong>necesitas establecer una sesión válida</strong>.
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
            CONFIGURAR SESIÓN PARA IFRAME
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
          <p>🔄 Solicitando permisos de cookies... Acepta en el popup del navegador si aparece</p>
        </div>
      )}

      {storageStatus === 'establishing-session' && (
        <div style={{
          background: '#d1ecf1',
          border: '2px solid #bee5eb',
          padding: '15px',
          borderRadius: '8px',
          marginBottom: '20px',
          textAlign: 'center'
        }}>
          <p>🔄 Estableciendo sesión con el servidor GeneXus...</p>
        </div>
      )}

      {storageStatus === 'granted' && sessionReady && (
        <div style={{
          background: '#d4edda',
          border: '2px solid #c3e6cb',
          padding: '15px',
          borderRadius: '8px',
          marginBottom: '20px',
          textAlign: 'center'
        }}>
          <p>✅ Sesión establecida - El iframe debería funcionar correctamente</p>
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
          <p>❌ No se pudo establecer la sesión - El iframe puede no funcionar correctamente</p>
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

      {/* Iframe - solo cargar cuando la sesión esté lista */}
      <IframeLoader
        ref={iframeRef}
        src={sessionReady ? formUrl : 'about:blank'}
        width="100%"
        height="800px"
        sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-top-navigation allow-storage-access-by-user-activation"
      />

      {!sessionReady && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'rgba(255, 255, 255, 0.9)',
          padding: '20px',
          borderRadius: '8px',
          textAlign: 'center',
          zIndex: 10
        }}>
          <p>El iframe se cargará una vez establecida la sesión</p>
        </div>
      )}

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
          <p><strong>Session Ready:</strong> {sessionReady ? 'Sí' : 'No'}</p>
          <p><strong>Form URL:</strong> {formUrl.substring(0, 100)}...</p>
          <p><strong>Storage Access API:</strong> {typeof window !== 'undefined' && typeof document.requestStorageAccess === 'function' ? 'Disponible' : 'No disponible'}</p>
          <p><strong>User Agent:</strong> {navigator.userAgent.substring(0, 100)}...</p>
        </div>
      )}
    </div>
  );
}