'use client';

import { useEffect, useState, useRef } from 'react';
import IframeLoader from './components/IframeLoader';
import DebugPanel from './components/DebugPanel';
import { debugLogger } from './utils/debug';

export default function Home() {
  const [formUrl, setFormUrl] = useState<string>('');
  const [storageStatus, setStorageStatus] = useState<'idle' | 'granted' | 'denied'>('idle');
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const requestStorage = async () => {
    debugLogger.storageAccessRequested();

    if (!document.requestStorageAccess) {
      alert('Tu navegador no soporta Storage Access API');
      setStorageStatus('denied');
      return;
    }

    try {
      await document.requestStorageAccess();
      debugLogger.storageAccessGranted();
      setStorageStatus('granted');

      // Recargar iframe con cookies disponibles
      if (iframeRef.current) {
        iframeRef.current.src = iframeRef.current.src;
      }
    } catch (err: any) {
      debugLogger.storageAccessDenied(err.message);
      setStorageStatus('denied');
    }
  };

  useEffect(() => {
    const baseUrl = process.env.NEXT_PUBLIC_FORM_BASE_URL;
    const params = process.env.NEXT_PUBLIC_FORM_PARAMS;

    if (baseUrl && params) {
      setFormUrl(`${baseUrl}?${params}`);
    }

    checkBrowserCapabilities();
  }, []);

  const checkBrowserCapabilities = () => {
    // tu función original...
  };

  return (
    <div style={{ padding: '30px' }}>
      <h1>Formulario Tickets Plus</h1>

      {storageStatus === 'idle' && (
        <div style={{
          background: '#fff3cd',
          border: '2px solid #ffeeba',
          padding: '30px',
          borderRadius: '12px',
          marginBottom: '30px',
          textAlign: 'center'
        }}>
          <h2>¡Permiso necesario!</h2>
          <p style={{ fontSize: '18px', margin: '20px 0' }}>
            Para que el botón "Iniciar" funcione y los adjuntos se actualicen,
            <strong> debes permitir el acceso a cookies</strong>.
          </p>
          <button
            onClick={requestStorage}
            style={{
              padding: '18px 50px',
              fontSize: '22px',
              background: '#ffc107',
              color: '#212529',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 'bold',
              cursor: 'pointer',
              boxShadow: '0 6px 12px rgba(0,0,0,0.2)'
            }}
          >
            PERMITIR COOKIES Y CONTINUAR
          </button>
        </div>
      )}

      {storageStatus === 'denied' && (
        <div style={{ color: 'red', marginBottom: '20px', fontSize: '18px' }}>
          Permiso denegado → el formulario no funcionará correctamente
        </div>
      )}

      {storageStatus === 'granted' && (
        <IframeLoader
          ref={iframeRef}
          src={formUrl}
          width="100%"
          height="900px"
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-top-navigation allow-storage-access"
        />
      )}

      {/* Debug panel y resto de tu UI */}
      {/* ... */}
    </div>
  );
}