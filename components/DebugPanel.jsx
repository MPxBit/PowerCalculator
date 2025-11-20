'use client';

import { useState, useEffect } from 'react';
import debugLogger from '../lib/debug';

export default function DebugPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [logs, setLogs] = useState([]);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    if (!isOpen) return;

    const updateLogs = () => {
      setLogs(debugLogger.getLogs());
    };

    updateLogs();

    if (autoRefresh) {
      const interval = setInterval(updateLogs, 500);
      return () => clearInterval(interval);
    }
  }, [isOpen, autoRefresh]);

  const handleDownload = () => {
    debugLogger.downloadLogs();
  };

  const handleClear = () => {
    debugLogger.clear();
    setLogs([]);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          padding: '10px 15px',
          backgroundColor: '#667eea',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          zIndex: 10000,
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
        }}
      >
        🐛 Debug
      </button>
    );
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        width: '500px',
        maxHeight: '600px',
        backgroundColor: '#1a1a1a',
        color: '#00ff00',
        border: '2px solid #667eea',
        borderRadius: '8px',
        padding: '15px',
        zIndex: 10000,
        boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
        fontFamily: 'monospace',
        fontSize: '12px',
        overflow: 'auto'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <h3 style={{ margin: 0, color: '#667eea' }}>🐛 Debug Panel</h3>
        <button
          onClick={() => setIsOpen(false)}
          style={{
            background: 'transparent',
            border: '1px solid #667eea',
            color: '#667eea',
            padding: '5px 10px',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          ✕
        </button>
      </div>

      <div style={{ marginBottom: '10px', display: 'flex', gap: '10px' }}>
        <button
          onClick={handleDownload}
          style={{
            background: '#667eea',
            border: 'none',
            color: 'white',
            padding: '5px 10px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '11px'
          }}
        >
          📥 Download Logs
        </button>
        <button
          onClick={handleClear}
          style={{
            background: '#ff4444',
            border: 'none',
            color: 'white',
            padding: '5px 10px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '11px'
          }}
        >
          🗑️ Clear
        </button>
        <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px' }}>
          <input
            type="checkbox"
            checked={autoRefresh}
            onChange={(e) => setAutoRefresh(e.target.checked)}
          />
          Auto-refresh
        </label>
      </div>

      <div
        style={{
          maxHeight: '450px',
          overflowY: 'auto',
          backgroundColor: '#0a0a0a',
          padding: '10px',
          borderRadius: '4px',
          border: '1px solid #333'
        }}
      >
        {logs.length === 0 ? (
          <div style={{ color: '#666' }}>No logs yet...</div>
        ) : (
          logs.slice(-50).map((log, index) => (
            <div
              key={index}
              style={{
                marginBottom: '8px',
                padding: '5px',
                borderLeft: `3px solid ${log.level === 'ERROR' ? '#ff4444' : '#667eea'}`,
                paddingLeft: '8px'
              }}
            >
              <div style={{ color: log.level === 'ERROR' ? '#ff6666' : '#00ff00' }}>
                [{log.elapsed}] [{log.component}]
                {log.level && ` [${log.level}]`} {log.message}
              </div>
              {log.data && (
                <pre
                  style={{
                    margin: '5px 0 0 0',
                    color: '#aaa',
                    fontSize: '10px',
                    overflow: 'auto',
                    maxHeight: '100px'
                  }}
                >
                  {JSON.stringify(log.data, null, 2)}
                </pre>
              )}
              {log.error && (
                <pre
                  style={{
                    margin: '5px 0 0 0',
                    color: '#ff6666',
                    fontSize: '10px',
                    overflow: 'auto'
                  }}
                >
                  {JSON.stringify(log.error, null, 2)}
                </pre>
              )}
            </div>
          ))
        )}
      </div>
      <div style={{ marginTop: '10px', fontSize: '10px', color: '#666', textAlign: 'center' }}>
        Showing last 50 of {logs.length} logs
      </div>
    </div>
  );
}

