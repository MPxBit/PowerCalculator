/**
 * Debug logging utility for troubleshooting
 * Logs to console and collects logs for file download
 */

class DebugLogger {
  constructor() {
    this.logs = [];
    this.startTime = Date.now();
    this.maxLogs = 1000; // Prevent memory issues
  }

  log(component, message, data = null) {
    const timestamp = new Date().toISOString();
    const elapsed = Date.now() - this.startTime;
    const logEntry = {
      timestamp,
      elapsed: `${elapsed}ms`,
      component,
      message,
      data: data ? JSON.parse(JSON.stringify(data)) : null
    };

    // Add to logs array
    this.logs.push(logEntry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift(); // Remove oldest
    }

    // Console log with formatting
    console.log(`[${component}] ${message}`, data || '');
    
    return logEntry;
  }

  error(component, message, error) {
    const timestamp = new Date().toISOString();
    const elapsed = Date.now() - this.startTime;
    const logEntry = {
      timestamp,
      elapsed: `${elapsed}ms`,
      component,
      level: 'ERROR',
      message,
      error: error ? {
        message: error.message,
        stack: error.stack,
        name: error.name
      } : null
    };

    this.logs.push(logEntry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    console.error(`[${component}] ERROR: ${message}`, error);
    return logEntry;
  }

  getLogs() {
    return this.logs;
  }

  getLogsAsText() {
    return this.logs.map(log => {
      let text = `[${log.timestamp}] [${log.elapsed}] [${log.component}]`;
      if (log.level) text += ` [${log.level}]`;
      text += ` ${log.message}`;
      if (log.data) {
        text += `\n  Data: ${JSON.stringify(log.data, null, 2)}`;
      }
      if (log.error) {
        text += `\n  Error: ${JSON.stringify(log.error, null, 2)}`;
      }
      return text;
    }).join('\n\n');
  }

  downloadLogs() {
    const text = this.getLogsAsText();
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rv-calculator-debug-${Date.now()}.log`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  clear() {
    this.logs = [];
    this.startTime = Date.now();
  }
}

// Create singleton instance
const debugLogger = new DebugLogger();

export default debugLogger;

