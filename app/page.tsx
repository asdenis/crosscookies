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

    console.log('Environment variables:', { baseUrl, params });

    if (baseUrl && params) {
      // SIEMPRE usar el proxy API para forzar el funcionamiento del iframe
      const fullUrl = `${baseUrl}?${params}`;
      const proxyUrl = `/api/proxy?url=${encodeURIComponent(fullUrl)}`;
      
      setFormUrl(proxyUrl);
      debugLogger.info('Usando proxy API forzado', { proxyUrl, originalUrl: fullUrl });
      
      // Con el proxy API, establecer la sesión como lista automáticamente
      setSessionReady(true);
      setStorageStatus('granted');
    } else {
      console.error('Missing environment variables:', { baseUrl, params });
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

      {/* Información del proxy */}
      <div style={{
        background: '#d4edda',
        border: '2px solid #c3e6cb',
        padding: '15px',
        borderRadius: '8px',
        marginBottom: '20px',
        textAlign: 'center'
      }}>
        <p>🔄 Usando proxy API para forzar funcionamiento del iframe</p>
        <p style={{ fontSize: '14px', marginTop: '5px', color: '#666' }}>
          Todas las peticiones se procesan a través del servidor Next.js
        </p>
      </div>

      {/* Iframe - siempre visible con proxy API */}
      <div style={{ position: 'relative', minHeight: '800px', border: '1px solid #ddd', borderRadius: '8px' }}>
        <IframeLoader
          ref={iframeRef}
          src={formUrl}
          width="100%"
          height="800px"
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-top-navigation allow-storage-access-by-user-activation allow-downloads allow-modals"
        />
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
          <p><strong>Form URL:</strong> {formUrl}</p>
          <p><strong>Storage Access API:</strong> {typeof window !== 'undefined' && typeof document.requestStorageAccess === 'function' ? 'Disponible' : 'No disponible'}</p>
          <p><strong>User Agent:</strong> {navigator.userAgent.substring(0, 100)}...</p>
          <button 
            onClick={() => {
              if (iframeRef.current) {
                console.log('Iframe src:', iframeRef.current.src);
                console.log('Iframe contentWindow:', iframeRef.current.contentWindow);
                try {
                  console.log('Iframe document:', iframeRef.current.contentDocument);
                } catch (e) {
                  console.log('Cannot access iframe document:', e instanceof Error ? e.message : String(e));
                }
              }
            }}
            style={{
              marginTop: '10px',
              padding: '5px 10px',
              background: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '3px',
              cursor: 'pointer',
              marginRight: '10px'
            }}
          >
            Debug Iframe
          </button>
          <button 
            onClick={async () => {
              const originalUrl = formUrl.replace('/api/proxy?url=', '');
              const debugUrl = `/api/debug-html?url=${encodeURIComponent(originalUrl)}`;
              try {
                const response = await fetch(debugUrl);
                const analysis = await response.json();
                console.log('HTML Analysis:', analysis);
                alert('Análisis del HTML completado. Revisa la consola para ver los detalles.');
              } catch (error) {
                console.error('Error analyzing HTML:', error);
                alert('Error analizando el HTML. Revisa la consola.');
              }
            }}
            style={{
              marginTop: '10px',
              padding: '5px 10px',
              background: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '3px',
              cursor: 'pointer'
            }}
          >
            Analizar HTML
          </button>
        </div>
      )}
    </div>
  );
}