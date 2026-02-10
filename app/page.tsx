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
  const [showBigButton, setShowBigButton] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Detectar navegador y capacidades específicas para GeneXus
  const detectBrowser = () => {
    const ua = navigator.userAgent;
    const isChrome = /Chrome/.test(ua) && !/Edg/.test(ua);
    const isEdge = /Edg/.test(ua);
    const isBrave = (navigator as any).brave !== undefined;
    const isFirefox = /Firefox/.test(ua);
    const isSafari = /Safari/.test(ua) && !/Chrome/.test(ua);

    // Navegadores que aplican CHIPS (state partitioning)
    const appliesChips = isChrome || isEdge || isBrave;
    const needsStorageAccess = appliesChips || isSafari;
    const supportsStorageAccess = !!document.requestStorageAccess;

    const info = {
      isChrome,
      isEdge,
      isBrave,
      isFirefox,
      isSafari,
      appliesChips,
      needsStorageAccess,
      supportsStorageAccess,
      userAgent: ua,
      cookiesEnabled: navigator.cookieEnabled,
      // Detectar si estamos en contexto cross-site
      isCrossSite: (() => {
        try {
          const currentDomain = window.location.hostname;
          const parentDomain = window.top?.location.hostname;

          // Extraer registrable domain (ej: mendoza.gov.ar)
          const getRegistrableDomain = (hostname: string) => {
            const parts = hostname.split('.');
            return parts.length >= 2 ? parts.slice(-2).join('.') : hostname;
          };

          return getRegistrableDomain(currentDomain) !== getRegistrableDomain(parentDomain || '');
        } catch {
          return true; // Si no podemos acceder, asumimos cross-site
        }
      })()
    };

    setBrowserInfo(info);
    debugLogger.info('Información del navegador para GeneXus', info);

    return info;
  };

  const requestStorageAccess = async (userGesture = false) => {
    debugLogger.storageAccessRequested();

    if (!userGesture) {
      debugLogger.warning('Storage Access sin user gesture - puede fallar en Chrome/Edge');
    }

    if (!document.requestStorageAccess) {
      debugLogger.storageAccessNotSupported();

      // Para Firefox, no necesitamos Storage Access API
      if (browserInfo.isFirefox) {
        debugLogger.info('Firefox: usando estrategia alternativa para cookies cross-site');
        setStorageAccess('not-needed');
        return;
      }

      setStorageAccess('denied');
      return;
    }

    try {
      // Verificar si ya tenemos acceso
      const hasAccess = await document.hasStorageAccess?.() || false;
      if (hasAccess) {
        debugLogger.success('Storage Access ya concedido previamente');
        setStorageAccess('granted');
        setShowBigButton(false);
        return;
      }

      debugLogger.info('Solicitando Storage Access API para cookies GeneXus...');
      await document.requestStorageAccess();

      setStorageAccess('granted');
      setShowBigButton(false);
      debugLogger.storageAccessGranted();
      console.log('✅ Storage Access concedido – cookies GX_SESSION_ID disponibles');

      // Recargar iframe después de un breve delay
      setTimeout(() => {
        if (iframeRef.current) {
          debugLogger.iframeReloaded('Storage Access concedido - cookies GeneXus habilitadas');
          iframeRef.current.src = iframeRef.current.src;
        }
      }, 500);

    } catch (err: any) {
      debugLogger.storageAccessDenied(err.message);
      console.error('Storage Access denegado:', err);

      if (err.name === 'NotAllowedError') {
        setStorageAccess('denied');
        debugLogger.error('Usuario denegó explícitamente Storage Access');
      } else if (err.name === 'InvalidStateError') {
        debugLogger.warning('Storage Access llamado en contexto inválido - reintentando con botón grande');
        setShowBigButton(true);
      } else {
        setStorageAccess('denied');
      }
    }
  };

  // Estrategia de pre-carga específica para GeneXus
  const preloadGeneXusStrategy = async () => {
    if (!browserInfo.needsStorageAccess) return;

    debugLogger.info('Ejecutando pre-carga para GeneXus + Tomcat');

    try {
      const baseUrl = process.env.NEXT_PUBLIC_FORM_BASE_URL?.split('/').slice(0, 3).join('/');
      if (baseUrl) {
        // Intentar establecer cookies con una petición previa
        await fetch(`${baseUrl}/favicon.ico`, {
          method: 'GET',
          mode: 'no-cors',
          credentials: 'include'
        });

        debugLogger.success('Pre-carga GeneXus ejecutada');
      }
    } catch (error) {
      debugLogger.warning('Pre-carga GeneXus falló', { error });
    }
  };

  const handleUserInteraction = () => {
    if (!userInteracted) {
      setUserInteracted(true);
      debugLogger.info('Primera interacción del usuario - habilitando Storage Access con user gesture');

      // Si necesitamos Storage Access y no lo tenemos, intentar ahora con user gesture válido
      if ((storageAccess === 'pending' || storageAccess === 'denied') && browserInfo.needsStorageAccess) {
        requestStorageAccess(true);
      }
    }
  };

  useEffect(() => {
    // Construir URL del formulario
    const baseUrl = process.env.NEXT_PUBLIC_FORM_BASE_URL;
    const params = process.env.NEXT_PUBLIC_FORM_PARAMS;

    if (!baseUrl || !params) {
      debugLogger.error('Variables de entorno no configuradas para GeneXus');
      return;
    }

    const fullUrl = `${baseUrl}?${params}`;
    setFormUrl(fullUrl);

    debugLogger.info('Aplicación GeneXus inicializada', {
      baseUrl,
      paramsLength: params.length,
      fullUrl: fullUrl.substring(0, 100) + '...'
    });

    // Detectar navegador y capacidades
    const browser = detectBrowser();

    // Verificar configuración específica para GeneXus
    checkGeneXusCapabilities();

    // Ejecutar estrategia de pre-carga
    preloadGeneXusStrategy();

    // Determinar estrategia según navegador
    if (!browser.isCrossSite) {
      // Same-site: no necesitamos Storage Access
      setStorageAccess('not-needed');
      debugLogger.info('Same-site context - Storage Access no necesario');
    } else if (browser.isFirefox) {
      // Firefox: funciona diferente, no necesita Storage Access API
      setStorageAccess('not-needed');
      debugLogger.info('Firefox cross-site - usando estrategia nativa');
    } else if (browser.needsStorageAccess && browser.supportsStorageAccess) {
      // Chrome/Edge/Brave/Safari: necesitan Storage Access API
      debugLogger.info('Cross-site context con CHIPS - Storage Access requerido');

      // Intentar automáticamente (puede fallar sin user gesture)
      setTimeout(() => {
        if (storageAccess === 'pending') {
          requestStorageAccess(false);
        }
      }, 1000);
    } else {
      // Navegador sin soporte
      setStorageAccess('denied');
      debugLogger.warning('Navegador sin soporte para Storage Access en contexto cross-site');
    }

  }, []);

  const checkGeneXusCapabilities = () => {
    const capabilities = {
      cookiesEnabled: navigator.cookieEnabled,
      userAgent: navigator.userAgent,
      storageAccessAPI: !!document.requestStorageAccess,
      hasStorageAccessAPI: !!document.hasStorageAccess,
      isInIframe: window !== window.top,
      isCrossSite: browserInfo.isCrossSite,
      // Específico para GeneXus
      geneXusCompatible: navigator.cookieEnabled && window.fetch,
      tomcatVersion: 'Detectado: Tomcat 10.1.52 (basado en configuración)',
      recommendedConfig: 'SAMESITE_COOKIE=Undefined, sin CookieProcessor'
    };

    debugLogger.info('Capacidades para GeneXus + Tomcat verificadas', capabilities);

    // Advertencias críticas para GeneXus
    if (!capabilities.cookiesEnabled) {
      debugLogger.error('CRÍTICO: Cookies deshabilitadas - GeneXus no funcionará (GX_SESSION_ID no disponible)');
    }

    if (capabilities.isCrossSite && browserInfo.appliesChips && !capabilities.storageAccessAPI) {
      debugLogger.error('CRÍTICO: Chrome/Edge sin Storage Access API - cookies GX particionadas');
    }
  };

  if (!formUrl) {
    return (
      <div className="container">
        <DebugPanel />
        <div className="header">
          <h1>Error de Configuración GeneXus</h1>
          <p>Variables de entorno no configuradas correctamente.</p>
        </div>
      </div>
    );
  }

  const getStatusInfo = () => {
    if (storageAccess === 'not-needed') {
      return {
        color: '#48dbfb',
        icon: 'ℹ️',
        title: 'Configuración compatible',
        message: browserInfo.isFirefox
          ? 'Firefox: Las cookies cross-site funcionan nativamente'
          : 'Same-site context: No se requieren permisos especiales',
        problems: []
      };
    }

    if (storageAccess === 'pending') {
      return {
        color: '#feca57',
        icon: '🔄',
        title: 'Permisos de cookies requeridos',
        message: 'GeneXus necesita cookies cross-site para mantener la sesión',
        problems: ['Botón "Iniciar" puede dar 401', 'Adjuntos no se marcarán como completados']
      };
    }

    if (storageAccess === 'granted') {
      return {
        color: '#1dd1a1',
        icon: '✅',
        title: 'Cookies GeneXus habilitadas',
        message: 'GX_SESSION_ID y GX_CLIENT_ID disponibles para peticiones cross-site',
        problems: []
      };
    }

    return {
      color: '#ff6b6b',
      icon: '❌',
      title: 'Cookies bloqueadas',
      message: 'Las cookies de sesión GeneXus no se enviarán en peticiones cross-site',
      problems: [
        'Botón "Iniciar" → Error 401 Unauthorized',
        'Adjuntos no se marcan como completados (tilde ✓)',
        'Global Events fallan por pérdida de sesión',
        'wcresponderformulariointernoarchivo sin cookies GX'
      ]
    };
  };

  const statusInfo = getStatusInfo();

  // Mostrar botón grande si es necesario
  if (showBigButton || (storageAccess === 'pending' && browserInfo.needsStorageAccess && userInteracted)) {
    return (
      <div style={{
        padding: '40px',
        textAlign: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        minHeight: '100vh',
        color: 'white'
      }}>
        <DebugPanel />

        <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          color: '#333',
          padding: '40px',
          borderRadius: '15px',
          maxWidth: '600px',
          margin: '0 auto',
          boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
        }}>
          <h1 style={{ marginBottom: '20px', color: '#333' }}>🍪 Permisos Requeridos</h1>

          <div style={{ marginBottom: '30px', fontSize: '18px', lineHeight: '1.6' }}>
            <p><strong>Para que el formulario GeneXus funcione correctamente:</strong></p>
            <ul style={{ textAlign: 'left', marginTop: '15px' }}>
              <li>✅ Botón "Iniciar" funcionará sin error 401</li>
              <li>✅ Adjuntos se marcarán como completados (tilde ✓)</li>
              <li>✅ Sesión GX_SESSION_ID mantenida en peticiones AJAX</li>
              <li>✅ Global Events funcionarán correctamente</li>
            </ul>
          </div>

          <button
            onClick={() => requestStorageAccess(true)}
            style={{
              padding: '20px 40px',
              fontSize: '20px',
              background: '#667eea',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              cursor: 'pointer',
              fontWeight: 'bold',
              boxShadow: '0 8px 16px rgba(0,0,0,0.2)',
              transition: 'transform 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            🚀 HABILITAR COOKIES PARA GENEXUS
          </button>

          <p style={{ marginTop: '20px', fontSize: '14px', color: '#666' }}>
            Navegador: {browserInfo.isChrome ? 'Chrome' : browserInfo.isEdge ? 'Edge' : browserInfo.isBrave ? 'Brave' : 'Otro'} |
            Contexto: Cross-site |
            CHIPS: {browserInfo.appliesChips ? 'Activo' : 'Inactivo'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container" onClick={handleUserInteraction}>
      <DebugPanel />

      <div className="header">
        <h1>Formulario Tickets Plus</h1>
        <p>Gobierno de Mendoza - GeneXus + Tomcat 10.1.52</p>
      </div>

      {/* Información del navegador específica para GeneXus */}
      <div style={{
        marginBottom: '15px',
        padding: '12px',
        background: 'rgba(255, 255, 255, 0.05)',
        borderRadius: '6px',
        color: 'white',
        fontSize: '13px'
      }}>
        <strong>Navegador:</strong> {
          browserInfo.isChrome ? 'Chrome (CHIPS activo)' :
            browserInfo.isEdge ? 'Edge (CHIPS activo)' :
              browserInfo.isBrave ? 'Brave (CHIPS activo)' :
                browserInfo.isFirefox ? 'Firefox (cookies cross-site nativas)' :
                  browserInfo.isSafari ? 'Safari' : 'Otro'
        } |
        <strong> Contexto:</strong> {browserInfo.isCrossSite ? 'Cross-site' : 'Same-site'} |
        <strong> GeneXus:</strong> {browserInfo.cookiesEnabled ? 'Compatible' : 'Incompatible'}
      </div>

      {/* Status de Storage Access específico para GeneXus */}
      <div style={{
        marginBottom: '20px',
        padding: '18px',
        background: 'rgba(255, 255, 255, 0.1)',
        borderRadius: '8px',
        color: 'white',
        border: `2px solid ${statusInfo.color}`
      }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
          <span style={{ fontSize: '24px', marginRight: '12px' }}>{statusInfo.icon}</span>
          <strong style={{ fontSize: '18px' }}>{statusInfo.title}</strong>
        </div>

        <p style={{ marginBottom: '12px', fontSize: '15px' }}>{statusInfo.message}</p>

        {statusInfo.problems.length > 0 && (
          <div style={{
            background: 'rgba(255, 107, 107, 0.1)',
            padding: '12px',
            borderRadius: '6px',
            marginBottom: '12px'
          }}>
            <strong style={{ color: '#ff6b6b' }}>Problemas esperados:</strong>
            <ul style={{ marginTop: '8px', marginLeft: '20px' }}>
              {statusInfo.problems.map((problem, index) => (
                <li key={index} style={{ color: '#ff6b6b', fontSize: '14px' }}>{problem}</li>
              ))}
            </ul>
          </div>
        )}

        {storageAccess === 'pending' && browserInfo.needsStorageAccess && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              requestStorageAccess(true);
            }}
            style={{
              padding: '12px 24px',
              fontSize: '16px',
              background: '#667eea',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            🍪 Habilitar cookies para GeneXus
          </button>
        )}

        {storageAccess === 'denied' && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              requestStorageAccess(true);
            }}
            style={{
              padding: '10px 20px',
              fontSize: '14px',
              background: '#ff6b6b',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            🔄 Reintentar permisos
          </button>
        )}

        {storageAccess === 'granted' && (
          <div style={{ color: '#1dd1a1', fontSize: '14px' }}>
            <strong>✅ Funcionalidades GeneXus habilitadas:</strong><br />
            • Botón "Iniciar" funcionará correctamente<br />
            • Adjuntos se marcarán con tilde ✓<br />
            • Sesión GX mantenida en Global Events<br />
            • wcresponderformulariointernoarchivo con cookies
          </div>
        )}
      </div>

      {/* Solo mostrar iframe si tenemos permisos o no los necesitamos */}
      {(storageAccess === 'granted' || storageAccess === 'not-needed') && (
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
          <h3>Debug - GeneXus + Tomcat Configuration</h3>
          <p><strong>URL:</strong> {formUrl.substring(0, 80)}...</p>
          <p><strong>Storage Access:</strong> {storageAccess}</p>
          <p><strong>User Interaction:</strong> {userInteracted ? 'Detectada' : 'Pendiente'}</p>
          <p><strong>Cross-site:</strong> {browserInfo.isCrossSite ? 'Sí' : 'No'}</p>
          <p><strong>CHIPS Applied:</strong> {browserInfo.appliesChips ? 'Sí' : 'No'}</p>
          <p><strong>Recomendación Tomcat:</strong> SAMESITE_COOKIE=Undefined, sin CookieProcessor</p>
          <p><strong>GeneXus Build:</strong> 186073 compatible</p>
        </div>
      )}
    </div>
  );
}