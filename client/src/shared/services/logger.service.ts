// Simple Client Logger - unified and simplified
class ClientLogger {
    private logs: any[] = [];
    private maxLogs = 1000;
    
    constructor() {
        this.setupErrorHandlers();
        this.loadLogs();
    }
    
    // Setup automatic error handlers
    private setupErrorHandlers(): void {
        // Catch uncaught errors
        window.addEventListener('error', (event) => {
            this.error('Uncaught Error', {
                message: event.message,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                stack: event.error?.stack
            });
        });
        
        // Catch unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            this.error('Unhandled Promise Rejection', {
                reason: event.reason,
                stack: event.reason?.stack
            });
        });
    }
    
    // Load logs from localStorage
    private loadLogs(): void {
        try {
            const stored = localStorage.getItem('everytriv-client-logs');
            if (stored) {
                this.logs = JSON.parse(stored);
            }
        } catch (e) {
            console.warn('Failed to load logs from localStorage');
        }
    }
    
    // Save logs to localStorage
    private saveLogs(): void {
        try {
            // Keep only last 1000 logs
            if (this.logs.length > this.maxLogs) {
                this.logs = this.logs.slice(-this.maxLogs);
            }
            
            localStorage.setItem('everytriv-client-logs', JSON.stringify(this.logs));
        } catch (e) {
            console.warn('Failed to save logs');
        }
    }
    
    // Internal log method
    private log(level: string, message: string, meta?: any): void {
        const timestamp = new Date().toISOString();
        const emoji = {
            error: '❌',
            warn: '⚠️',
            info: '📝',
            debug: '🐛'
        }[level] || '📝';
        
        // Add to logs array
        this.logs.push({ timestamp, level, message, meta });
        
        // Console output with colors and emojis
        const consoleMethod = level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'log';
        console[consoleMethod](`${emoji} [Client] ${message}`, meta || '');
        
        // Save logs
        this.saveLogs();
    }
    
    // Public logging methods
    error(message: string, meta?: any): void {
        this.log('error', message, meta);
    }
    
    warn(message: string, meta?: any): void {
        this.log('warn', message, meta);
    }
    
    info(message: string, meta?: any): void {
        this.log('info', message, meta);
    }
    
    debug(message: string, meta?: any): void {
        this.log('debug', message, meta);
    }
    
    // Specialized methods
    api(message: string, meta?: any): void {
        this.info(`🌐 API: ${message}`, meta);
    }
    
    user(message: string, meta?: any): void {
        this.info(`👤 User: ${message}`, meta);
    }
    
    performance(operation: string, duration: number, meta?: any): void {
        const level = duration > 1000 ? 'warn' : 'info';
        const emoji = duration > 1000 ? '🐌' : duration > 500 ? '⏱️' : '⚡';
        this[level](`${emoji} ${operation}: ${duration}ms`, { duration, ...meta });
    }
    
    // Simple download function
    downloadLogs(): void {
        try {
            const logContent = this.logs
                .map(log => `[${log.timestamp}] [${log.level.toUpperCase()}] ${log.message} ${log.meta ? JSON.stringify(log.meta) : ''}`)
                .join('\n');
            
            const blob = new Blob([logContent], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = 'client.log';
            a.click();
            
            URL.revokeObjectURL(url);
        } catch (e) {
            console.warn('Failed to download logs');
        }
    }
    
    // Get all logs
    getLogs(): any[] {
        return [...this.logs];
    }
    
    // Clear all logs
    clearLogs(): void {
        this.logs = [];
        localStorage.removeItem('everytriv-client-logs');
    }
}

// Extend window type
declare global {
    interface Window {
        logger: ClientLogger;
    }
}

// Create global instance
const logger = new ClientLogger();

// Make available globally
window.logger = logger;

export { ClientLogger };
export default logger;
