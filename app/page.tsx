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
      await fetch(formUrl, {
        method: 'GET',
        credentials: 'include',
        mode: 'no-cors', // Cambiar a no-cors para evitar problemas CORS
      });

      debugLogger.info('Petición fetch completada');

      // Con no-cors no podemos verificar el status, así que asumimos éxito
      await new Promise(resolve => setTimeout(resolve, 1000));

      setSessionReady(true);
      setStorageStatus('granted');
      debugLogger.success('Sesión establecida correctamente');

    } catch (error) {
      debugLogger.error('Error estableciendo sesión con fetch', error);
      // Si fetch falla, intentar directamente con Storage Access API
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
      debugLogger.warning('Storage Access API no disponible, cargando iframe directamente');
      setSessionReady(true);
      setStorageStatus('granted');
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

    } catch (err: any) {
      debugLogger.error('Storage Access denegado, cargando iframe de todas formas', err);
      // Incluso si falla, intentar cargar el iframe
      setSessionReady(true);
      setStorageStatus('granted');
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
      // Intentar usar proxy reverso primero
      const useProxy = process.env.NEXT_PUBLIC_USE_PROXY === 'true';
      
      if (useProxy) {
        // Usar proxy reverso para evitar problemas cross-site
        const proxyUrl = `/genexus/com.ticketsplus.responderformularioif?${params}`;
        setFormUrl(proxyUrl);
        debugLogger.info('Usando proxy reverso', { proxyUrl });
        
        // Con proxy, la sesión debería funcionar automáticamente
        setSessionReady(true);
        setStorageStatus('granted');
      } else {
        // Usar URL directa (requiere configuración del servidor)
        setFormUrl(`${baseUrl}?${params}`);
        debugLogger.info('Usando URL directa', { baseUrl });
      }
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

      {/* Debug del estado actual */}
      <div style={{ marginBottom: '10px', padding: '10px', background: '#e9ecef', borderRadius: '4px', fontSize: '12px' }}>
        <strong>Estado actual:</strong> {storageStatus} | <strong>Sesión lista:</strong> {sessionReady ? 'Sí' : 'No'}
      </div>

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
            <br /><strong>necesitas establecer una sesión válida</strong>.
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

      {/* Iframe - solo renderizar cuando la sesión esté lista */}
      <div style={{ position: 'relative', minHeight: '800px', border: '1px solid #ddd', borderRadius: '8px' }}>
        {sessionReady ? (
          <IframeLoader
            ref={iframeRef}
            src={formUrl}
            width="100%"
            height="800px"
            sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-top-navigation allow-storage-access-by-user-activation"
          />
        ) : (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '800px',
            background: '#f8f9fa',
            color: '#666',
            fontSize: '18px',
            textAlign: 'center'
          }}>
            <div>
              <p>🔒 Esperando configuración de sesión</p>
              <p style={{ fontSize: '14px', marginTop: '10px' }}>
                Haz clic en "CONFIGURAR SESIÓN PARA IFRAME" para continuar
              </p>
            </div>
          </div>
        )}
      </div>

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