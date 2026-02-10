'use client';

import { useEffect, useState, useRef } from 'react';
import IframeLoader from './components/IframeLoader';
import DebugPanel from './components/DebugPanel';
import { debugLogger } from './utils/debug';

export default function Home() {
  const [formUrl, setFormUrl] = useState<string>('');
  const [storageStatus, setStorageStatus] = useState<'idle' | 'requesting' | 'granted' | 'denied' | 'session-setup'>('idle');
  const [sessionEstablished, setSessionEstablished] = useState<boolean>(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const establishSession = () => {
    setStorageStatus('session-setup');
    debugLogger.info('Abriendo ventana para establecer sesión');
    
    // Abrir el formulario en una nueva ventana
    const popup = window.open(formUrl, 'genexus-session', 'width=800,height=600,scrollbars=yes,resizable=yes');
    
    if (!popup) {
      debugLogger.error('No se pudo abrir la ventana popup');
      setStorageStatus('denied');
      return;
    }

    // Monitorear cuando se cierre la ventana
    const checkClosed = setInterval(() => {
      if (popup.closed) {
        clearInterval(checkClosed);
        debugLogger.info('Ventana cerrada, estableciendo sesión');
        setSessionEstablished(true);
        setStorageStatus('granted');
        
        // Recargar iframe después de establecer la sesión
        setTimeout(() => {
          if (iframeRef.current) {
            const currentSrc = iframeRef.current.src;
            iframeRef.current.src = '';
            setTimeout(() => {
              if (iframeRef.current) {
                iframeRef.current.src = currentSrc;
                debugLogger.info('Iframe recargado con sesión establecida');
              }
            }, 300);
          }
        }, 500);
      }
    }, 1000);

    // Auto-cerrar después de 30 segundos si no se cierra manualmente
    setTimeout(() => {
      if (!popup.closed) {
        popup.close();
        clearInterval(checkClosed);
      }
    }, 30000);
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
      debugLogger.warning('Storage Access API no disponible, usando método alternativo');
      establishSession();
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
      debugLogger.error('Storage Access denegado, usando método alternativo', err);
      establishSession();
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
            CONFIGURAR SESIÓN GENEXUS
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

      {storageStatus === 'session-setup' && (
        <div style={{
          background: '#d1ecf1',
          border: '2px solid #bee5eb',
          padding: '15px',
          borderRadius: '8px',
          marginBottom: '20px',
          textAlign: 'center'
        }}>
          <p>🔄 Estableciendo sesión... Se abrió una ventana nueva</p>
          <p style={{ fontSize: '14px', marginTop: '10px' }}>
            Interactúa con el formulario en la ventana nueva y luego ciérrala para continuar
          </p>
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
          <p>✅ {sessionEstablished ? 'Sesión establecida' : 'Cookies habilitadas'} - El formulario debería funcionar correctamente</p>
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
          <p><strong>Storage Access API:</strong> {typeof window !== 'undefined' && typeof document.requestStorageAccess === 'function' ? 'Disponible' : 'No disponible'}</p>
          <p><strong>User Agent:</strong> {navigator.userAgent.substring(0, 100)}...</p>
        </div>
      )}
    </div>
  );
}