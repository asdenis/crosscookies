'use client';

import { useEffect, useState, useRef } from 'react';
import IframeLoader from './components/IframeLoader';
import DebugPanel from './components/DebugPanel';
import { debugLogger } from './utils/debug';

export default function Home() {
  const [formUrl, setFormUrl] = useState<string>('');
  const [storageAccess, setStorageAccess] = useState<'pending' | 'granted' | 'denied' | 'not-needed'>('pending');
  const [userInteracted, setUserInteracted] = useState(false);
  const [browserInfo, setBrowserInfo] = useState<any>({});
  const [showBigButton, setShowBigButton] = useState(true); // Empezar con botón grande
  const [cookieTestResult, setCookieTestResult] = useState<string>('');
  const [retryCount, setRetryCount] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Detectar navegador y capacidades específicas para GeneXus
  const detectBrowser = () => {
    const ua = navigator.userAgent;
    const isChrome = /Chrome/.test(ua) && !/Edg/.test(ua);
    const isEdge = /Edg/.test(ua);
    const isBrave = (navigator as any).brave !== undefined;
    const isFirefox = /Firefox/.test(ua);
    const isSafari = /Safari/.test(ua) && !/Chrome/.test(ua);

    const info = {
      isChrome,
      isEdge,
      isBrave,
      isFirefox,
      isSafari,
      appliesChips: isChrome || isEdge || isBrave,
      needsStorageAccess: true, // Siempre intentar en cross-site
      supportsStorageAccess: !!document.requestStorageAccess,
      userAgent: ua,
      cookiesEnabled: navigator.cookieEnabled,
      isCrossSite: true // Asumir siempre cross-site para ser más agresivos
    };

    setBrowserInfo(info);
    debugLogger.info('Navegador detectado para GeneXus', info);
    return info;
  };

  // Test de cookies más agresivo
  const testCookieAccess = async () => {
    debugLogger.info('Ejecutando test de cookies cross-site');
    
    try {
      const baseUrl = process.env.NEXT_PUBLIC_FORM_BASE_URL?.split('/').slice(0, 3).join('/');
      if (!baseUrl) return;

      // Múltiples estrategias de test
      const tests = [
        // Test 1: Fetch con credentials
        fetch(`${baseUrl}/favicon.ico`, {
          method: 'GET',
          mode: 'no-cors',
          credentials: 'include',
          cache: 'no-cache'
        }),
        
        // Test 2: Imagen con credentials
        new Promise((resolve) => {
          const img = new Image();
          img.crossOrigin = 'use-credentials';
          img.onload = () => resolve('image-loaded');
          img.onerror = () => resolve('image-error');
          img.src = `${baseUrl}/favicon.ico?t=${Date.now()}`;
        }),
        
        // Test 3: Script tag approach
        new Promise((resolve) => {
          const script = document.createElement('script');
          script.src = `${baseUrl}/gx/gx.js?t=${Date.now()}`;
          script.onload = () => resolve('script-loaded');
          script.onerror = () => resolve('script-error');
          document.head.appendChild(script);
          setTimeout(() => {
            document.head.removeChild(script);
            resolve('script-timeout');
          }, 3000);
        })
      ];

      const results = await Promise.allSettled(tests);
      setCookieTestResult(`Tests: ${results.map(r => r.status).join(', ')}`);
      debugLogger.info('Resultados test de cookies', results);
      
    } catch (error) {
      debugLogger.error('Error en test de cookies', error);
      setCookieTestResult('Test failed');
    }
  };

  // Storage Access más agresivo con múltiples intentos
  const requestStorageAccess = async (userGesture = false, attempt = 1) => {
    debugLogger.info(`Intento ${attempt} de Storage Access (user gesture: ${userGesture})`);
    
    if (!document.requestStorageAccess) {
      debugLogger.warning('Storage Access API no disponible');
      
      // Para Firefox, usar estrategia alternativa
      if (browserInfo.isFirefox) {
        debugLogger.info('Firefox: intentando estrategia de cookies alternativa');
        await testCookieAccess();
        setStorageAccess('not-needed');
        setShowBigButton(false);
        return;
      }
      
      setStorageAccess('denied');
      return;
    }

    try {
      // Verificar estado actual
      const hasAccess = await document.hasStorageAccess?.() || false;
      debugLogger.info(`hasStorageAccess: ${hasAccess}`);
      
      if (hasAccess) {
        debugLogger.success('Storage Access ya disponible');
        setStorageAccess('granted');
        setShowBigButton(false);
        return;
      }

      // Intentar solicitar acceso
      debugLogger.info('Solicitando Storage Access...');
      await document.requestStorageAccess();
      
      // Verificar que realmente se concedió
      const accessGranted = await document.hasStorageAccess?.() || false;
      debugLogger.info(`Acceso concedido: ${accessGranted}`);
      
      if (accessGranted) {
        setStorageAccess('granted');
        setShowBigButton(false);
        debugLogger.success('✅ Storage Access CONCEDIDO - cookies disponibles');
        
        // Test de cookies después del acceso
        await testCookieAccess();
        
        // Recargar iframe con delay más largo
        setTimeout(() => {
          if (iframeRef.current) {
            debugLogger.info('Recargando iframe con cookies habilitadas');
            const currentSrc = iframeRef.current.src;
            iframeRef.current.src = '';
            setTimeout(() => {
              if (iframeRef.current) {
                iframeRef.current.src = currentSrc;
              }
            }, 100);
          }
        }, 1000);
        
      } else {
        throw new Error('Storage Access no se concedió realmente');
      }
      
    } catch (err: any) {
      debugLogger.error(`Storage Access falló (intento ${attempt})`, err);
      
      // Reintentar hasta 3 veces con user gesture
      if (attempt < 3 && userGesture) {
        debugLogger.info(`Reintentando Storage Access en 2 segundos...`);
        setTimeout(() => {
          setRetryCount(attempt);
          requestStorageAccess(true, attempt + 1);
        }, 2000);
        return;
      }
      
      if (err.name === 'NotAllowedError') {
        debugLogger.error('Usuario denegó Storage Access');
        setStorageAccess('denied');
      } else if (err.name === 'InvalidStateError') {
        debugLogger.warning('Contexto inválido - manteniendo botón grande');
        setShowBigButton(true);
      } else {
        debugLogger.error('Error desconocido en Storage Access');
        setStorageAccess('denied');
      }
    }
  };

  // Estrategia de pre-establecimiento de cookies más agresiva
  const aggressiveCookieStrategy = async () => {
    debugLogger.info('Ejecutando estrategia agresiva de cookies');
    
    const baseUrl = process.env.NEXT_PUBLIC_FORM_BASE_URL?.split('/').slice(0, 3).join('/');
    if (!baseUrl) return;

    try {
      // Múltiples peticiones para establecer cookies
      const requests = [
        // Petición principal
        fetch(baseUrl, {
          method: 'GET',
          mode: 'no-cors',
          credentials: 'include',
          cache: 'no-cache'
        }),
        
        // Petición a recursos comunes de GeneXus
        fetch(`${baseUrl}/gx/gx.js`, {
          method: 'GET',
          mode: 'no-cors',
          credentials: 'include',
          cache: 'no-cache'
        }),
        
        // Petición al servlet principal
        fetch(`${baseUrl}/servlet/com.ticketsplus.responderformularioif`, {
          method: 'GET',
          mode: 'no-cors',
          credentials: 'include',
          cache: 'no-cache'
        })
      ];

      await Promise.allSettled(requests);
      debugLogger.success('Estrategia agresiva de cookies ejecutada');
      
    } catch (error) {
      debugLogger.warning('Estrategia agresiva falló parcialmente', error);
    }
  };

  const handleUserInteraction = () => {
    if (!userInteracted) {
      setUserInteracted(true);
      debugLogger.info('Primera interacción del usuario detectada');
    }
  };

  useEffect(() => {
    // Construir URL del formulario
    const baseUrl = process.env.NEXT_PUBLIC_FORM_BASE_URL;
    const params = process.env.NEXT_PUBLIC_FORM_PARAMS;

    if (!baseUrl || !params) {
      debugLogger.error('Variables de entorno no configuradas');
      return;
    }

    const fullUrl = `${baseUrl}?${params}`;
    setFormUrl(fullUrl);

    debugLogger.info('Aplicación inicializada', {
      baseUrl,
      paramsLength: params.length
    });

    // Detectar navegador
    const browser = detectBrowser();
    
    // Ejecutar estrategias de pre-carga
    aggressiveCookieStrategy();
    testCookieAccess();
    
    // Mostrar siempre el botón grande inicialmente para garantizar user gesture
    setShowBigButton(true);
    
  }, []);

  if (!formUrl) {
    return (
      <div className="container">
        <DebugPanel />
        <div className="header">
          <h1>Error de Configuración</h1>
          <p>Variables de entorno no configuradas.</p>
        </div>
      </div>
    );
  }

  // Siempre mostrar botón grande hasta que tengamos acceso confirmado
  if (showBigButton && storageAccess !== 'granted') {
    return (
      <div style={{
        padding: '20px',
        textAlign: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        minHeight: '100vh',
        color: 'white'
      }} onClick={handleUserInteraction}>
        <DebugPanel />

        <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          color: '#333',
          padding: '30px',
          borderRadius: '15px',
          maxWidth: '700px',
          margin: '50px auto',
          boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
        }}>
          <h1 style={{ marginBottom: '20px', color: '#d32f2f' }}>🚨 ACCIÓN REQUERIDA</h1>

          <div style={{ marginBottom: '25px', fontSize: '16px', lineHeight: '1.6', textAlign: 'left' }}>
            <p><strong>PROBLEMA DETECTADO:</strong></p>
            <ul style={{ marginTop: '10px', color: '#d32f2f' }}>
              <li>Chrome/Edge: Botón "Iniciar" da error 401</li>
              <li>Firefox: Adjuntos no marcan tilde ✓</li>
              <li>Cookies GeneXus bloqueadas en iframe cross-site</li>
            </ul>
            
            <p style={{ marginTop: '15px' }}><strong>SOLUCIÓN:</strong></p>
            <ul style={{ marginTop: '10px', color: '#2e7d32' }}>
              <li>✅ Habilitar cookies cross-site para GeneXus</li>
              <li>✅ Permitir GX_SESSION_ID y GX_CLIENT_ID</li>
              <li>✅ Funcionalidad completa del formulario</li>
            </ul>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              handleUserInteraction();
              requestStorageAccess(true, 1);
            }}
            style={{
              padding: '20px 40px',
              fontSize: '18px',
              background: '#d32f2f',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              cursor: 'pointer',
              fontWeight: 'bold',
              boxShadow: '0 8px 16px rgba(0,0,0,0.3)',
              transition: 'all 0.3s ease',
              textTransform: 'uppercase'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = '#b71c1c';
              e.currentTarget.style.transform = 'scale(1.05)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = '#d32f2f';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            🍪 HABILITAR COOKIES AHORA
          </button>

          {retryCount > 0 && (
            <p style={{ marginTop: '15px', color: '#ff9800' }}>
              Intento {retryCount + 1}/3 - Si falla, verifica la configuración del navegador
            </p>
          )}

          <div style={{ marginTop: '20px', fontSize: '12px', color: '#666', textAlign: 'left' }}>
            <p><strong>Información técnica:</strong></p>
            <p>Navegador: {browserInfo.isChrome ? 'Chrome' : browserInfo.isEdge ? 'Edge' : browserInfo.isBrave ? 'Brave' : browserInfo.isFirefox ? 'Firefox' : 'Otro'}</p>
            <p>CHIPS: {browserInfo.appliesChips ? 'Activo (bloquea cookies)' : 'Inactivo'}</p>
            <p>Storage Access API: {browserInfo.supportsStorageAccess ? 'Disponible' : 'No disponible'}</p>
            <p>Test cookies: {cookieTestResult || 'Pendiente'}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container" onClick={handleUserInteraction}>
      <DebugPanel />

      <div className="header">
        <h1>Formulario Tickets Plus</h1>
        <p>Gobierno de Mendoza - GeneXus + Tomcat</p>
      </div>

      {/* Status específico */}
      <div style={{
        marginBottom: '20px',
        padding: '15px',
        background: storageAccess === 'granted' ? 'rgba(46, 125, 50, 0.2)' : 'rgba(211, 47, 47, 0.2)',
        borderRadius: '8px',
        color: 'white',
        border: `2px solid ${storageAccess === 'granted' ? '#2e7d32' : '#d32f2f'}`
      }}>
        {storageAccess === 'granted' ? (
          <div>
            <h3 style={{ color: '#4caf50', marginBottom: '10px' }}>✅ Cookies Habilitadas</h3>
            <p>GeneXus debería funcionar correctamente:</p>
            <ul style={{ marginTop: '8px', marginLeft: '20px' }}>
              <li>Botón "Iniciar" funcionará</li>
              <li>Adjuntos marcarán tilde ✓</li>
              <li>Global Events con sesión</li>
            </ul>
          </div>
        ) : (
          <div>
            <h3 style={{ color: '#f44336', marginBottom: '10px' }}>❌ Cookies Bloqueadas</h3>
            <p>Problemas esperados:</p>
            <ul style={{ marginTop: '8px', marginLeft: '20px' }}>
              <li>Botón "Iniciar" → Error 401</li>
              <li>Adjuntos sin tilde ✓</li>
              <li>Pérdida de sesión GX</li>
            </ul>
            <button
              onClick={() => {
                setShowBigButton(true);
                setStorageAccess('pending');
              }}
              style={{
                marginTop: '10px',
                padding: '8px 16px',
                background: '#d32f2f',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer'
              }}
            >
              Intentar habilitar cookies
            </button>
          </div>
        )}
      </div>

      {/* Mostrar iframe solo si tenemos acceso */}
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
          marginTop: '20px',
          padding: '15px',
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '8px',
          color: 'white',
          fontSize: '12px'
        }}>
          <h3>Debug Avanzado</h3>
          <p><strong>Storage Access:</strong> {storageAccess}</p>
          <p><strong>User Interaction:</strong> {userInteracted ? 'Sí' : 'No'}</p>
          <p><strong>Retry Count:</strong> {retryCount}</p>
          <p><strong>Cookie Test:</strong> {cookieTestResult}</p>
          <p><strong>Show Big Button:</strong> {showBigButton ? 'Sí' : 'No'}</p>
          <p><strong>Navegador:</strong> {JSON.stringify(browserInfo, null, 2).substring(0, 200)}...</p>
        </div>
      )}
    </div>
  );
}