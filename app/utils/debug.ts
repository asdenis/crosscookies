export type LogLevel = 'error' | 'warning' | 'info' | 'success' | 'debug';

export interface DebugLog {
  id: string;
  timestamp: Date;
  level: LogLevel;
  message: string;
  data?: any;
}

class DebugLogger {
  private logs: DebugLog[] = [];
  private listeners: ((logs: DebugLog[]) => void)[] = [];
  private isEnabled: boolean;
  private maxLogs: number = 100;

  constructor() {
    this.isEnabled = process.env.NEXT_PUBLIC_DEBUG_MODE === 'true';
  }

  private addLog(level: LogLevel, message: string, data?: any) {
    if (!this.isEnabled) return;

    const log: DebugLog = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
      level,
      message,
      data
    };

    this.logs.unshift(log);
    
    // Mantener solo los últimos maxLogs registros
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }

    // Notificar a los listeners
    this.listeners.forEach(listener => listener([...this.logs]));

    // También logear en la consola del navegador
    const consoleMethod = level === 'error' ? 'error' : 
                         level === 'warning' ? 'warn' : 
                         level === 'success' ? 'log' : 'log';
    
    console[consoleMethod](`[${level.toUpperCase()}] ${message}`, data || '');
  }

  error(message: string, data?: any) {
    this.addLog('error', message, data);
  }

  warning(message: string, data?: any) {
    this.addLog('warning', message, data);
  }

  info(message: string, data?: any) {
    this.addLog('info', message, data);
  }

  success(message: string, data?: any) {
    this.addLog('success', message, data);
  }

  debug(message: string, data?: any) {
    if (process.env.NEXT_PUBLIC_DEBUG_LEVEL === 'verbose') {
      this.addLog('debug', message, data);
    }
  }

  subscribe(listener: (logs: DebugLog[]) => void) {
    this.listeners.push(listener);
    // Enviar logs actuales inmediatamente
    listener([...this.logs]);
    
    // Retornar función de cleanup
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  getLogs(): DebugLog[] {
    return [...this.logs];
  }

  clear() {
    this.logs = [];
    this.listeners.forEach(listener => listener([]));
  }

  isDebugEnabled(): boolean {
    return this.isEnabled;
  }

  // Métodos específicos para Storage Access API
  storageAccessRequested() {
    this.info('Solicitando Storage Access API');
  }

  storageAccessGranted() {
    this.success('Storage Access API concedido - cookies disponibles');
  }

  storageAccessDenied(error?: string) {
    this.error('Storage Access API denegado', { error });
  }

  storageAccessNotSupported() {
    this.warning('Storage Access API no soportado por el navegador');
  }

  iframeReloaded(reason: string) {
    this.info('Iframe recargado', { reason });
  }

  // Métodos específicos para el iframe
  iframeStartLoading(url: string) {
    this.info('Iniciando carga del iframe', { url });
  }

  iframeLoaded(url: string, loadTime: number) {
    this.success(`Iframe cargado exitosamente en ${loadTime}ms`, { url });
  }

  iframeError(error: string, url: string) {
    this.error('Error al cargar iframe', { error, url });
  }

  iframeTimeout(url: string, timeout: number) {
    this.warning(`Timeout del iframe después de ${timeout}ms`, { url });
  }

  cookieCheck(cookies: string) {
    this.debug('Estado de cookies', { cookies: cookies || 'No cookies found' });
  }

  networkRequest(url: string, method: string = 'GET') {
    this.debug('Petición de red', { url, method });
  }

  networkResponse(url: string, status: number, statusText: string) {
    if (status >= 200 && status < 300) {
      this.success(`Respuesta exitosa: ${status}`, { url, statusText });
    } else if (status >= 400) {
      this.error(`Error de red: ${status} ${statusText}`, { url });
    } else {
      this.warning(`Respuesta inesperada: ${status}`, { url, statusText });
    }
  }

  environmentCheck() {
    const env = {
      baseUrl: process.env.NEXT_PUBLIC_FORM_BASE_URL,
      params: process.env.NEXT_PUBLIC_FORM_PARAMS ? '[CONFIGURADO]' : '[NO CONFIGURADO]',
      debugMode: process.env.NEXT_PUBLIC_DEBUG_MODE,
      debugLevel: process.env.NEXT_PUBLIC_DEBUG_LEVEL,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Server',
      cookiesEnabled: typeof navigator !== 'undefined' ? navigator.cookieEnabled : 'Unknown',
      platform: typeof navigator !== 'undefined' ? navigator.platform : 'Server'
    };
    
    this.info('Verificación del entorno', env);
    return env;
  }
}

export const debugLogger = new DebugLogger();