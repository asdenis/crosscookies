'use client';

import { useState, useEffect } from 'react';
import { debugLogger, DebugLog } from '../utils/debug';

export default function DebugPanel() {
  const [isVisible, setIsVisible] = useState(false);
  const [logs, setLogs] = useState<DebugLog[]>([]);

  useEffect(() => {
    if (!debugLogger.isDebugEnabled()) return;

    const unsubscribe = debugLogger.subscribe(setLogs);
    return unsubscribe;
  }, []);

  if (!debugLogger.isDebugEnabled()) {
    return null;
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('es-AR', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit'
    });
  };

  const formatData = (data: any) => {
    if (!data) return '';
    try {
      return typeof data === 'string' ? data : JSON.stringify(data, null, 2);
    } catch {
      return String(data);
    }
  };

  return (
    <>
      <button 
        className="debug-toggle"
        onClick={() => setIsVisible(!isVisible)}
        style={{ display: isVisible ? 'none' : 'block' }}
      >
        🐛 Debug
      </button>
      
      {isVisible && (
        <div className="debug-panel">
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '10px',
            borderBottom: '1px solid #333',
            paddingBottom: '10px'
          }}>
            <h3>Debug Panel</h3>
            <div>
              <button 
                onClick={() => debugLogger.clear()}
                style={{ 
                  background: '#ff6b6b', 
                  color: 'white', 
                  border: 'none', 
                  padding: '5px 10px', 
                  borderRadius: '3px',
                  marginRight: '10px',
                  cursor: 'pointer'
                }}
              >
                Clear
              </button>
              <button 
                onClick={() => setIsVisible(false)}
                style={{ 
                  background: '#666', 
                  color: 'white', 
                  border: 'none', 
                  padding: '5px 10px', 
                  borderRadius: '3px',
                  cursor: 'pointer'
                }}
              >
                ✕
              </button>
            </div>
          </div>
          
          <div style={{ fontSize: '11px', marginBottom: '10px', color: '#ccc' }}>
            Total logs: {logs.length} | Última actualización: {new Date().toLocaleTimeString('es-AR')}
          </div>
          
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {logs.length === 0 ? (
              <div style={{ color: '#666', fontStyle: 'italic' }}>
                No hay logs disponibles
              </div>
            ) : (
              logs.map((log) => (
                <div key={log.id} className={`debug-log ${log.level}`}>
                  <div style={{ fontWeight: 'bold' }}>
                    [{formatTime(log.timestamp)}] {log.level.toUpperCase()}
                  </div>
                  <div style={{ marginLeft: '10px' }}>
                    {log.message}
                  </div>
                  {log.data && (
                    <div style={{ 
                      marginLeft: '10px', 
                      fontSize: '10px', 
                      color: '#aaa',
                      whiteSpace: 'pre-wrap',
                      maxHeight: '100px',
                      overflowY: 'auto',
                      background: '#222',
                      padding: '5px',
                      borderRadius: '3px',
                      marginTop: '5px'
                    }}>
                      {formatData(log.data)}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </>
  );
}