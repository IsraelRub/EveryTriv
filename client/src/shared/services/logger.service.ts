// Simple Client Logger - unified and simplified
import { API_BASE_URL } from '../constants/api.constants';
import type { LogEntry } from '../../../../shared/types/logging.types';
import { LOG_EMOJIS } from '../../../../shared/types/logging.types';
import { 
    formatPerformanceMessage,
    formatApiMessage,
    formatUserMessage,
    getPerformanceLevel
} from '../../../../shared/utils/logging.utils';

class ClientLogger {
    private logs: LogEntry[] = [];
    private maxLogs = 1000;
    private serverUrl = API_BASE_URL;
    private batchSize = 50;
    private pendingLogs: LogEntry[] = [];
    private syncInProgress = false;
    private retryCount = 0;
    private maxRetries = 3;
    
    constructor() {
        this.setupErrorHandlers();
        this.clearLogsOnStartup(); // Clear logs from previous session
        this.loadLogs();
        this.setupPeriodicSync();
    }
    
    // Clear logs from previous session
    private clearLogsOnStartup(): void {
        try {
            localStorage.removeItem('everytriv-client-logs');
            console.log('🧹 Client logs cleared on startup');
        } catch (e) {
            console.warn('Failed to clear logs on startup');
        }
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
    
    // Setup periodic sync with server
    private setupPeriodicSync(): void {
        // Sync logs every 30 seconds
        setInterval(() => {
            this.syncLogsToServer();
        }, 30000);
        
        // Log session end and sync when page is about to unload
        window.addEventListener('beforeunload', () => {
            this.info('EveryTriv Client Application Ending', {
                timestamp: new Date().toISOString(),
                sessionEnd: true,
                totalLogs: this.logs.length
            });
            this.syncLogsToServer();
        });
    }
    
    // Send logs to server with retry logic
    private async syncLogsToServer(): Promise<void> {
        if (this.pendingLogs.length === 0 || this.syncInProgress) return;
        
        this.syncInProgress = true;
        console.log('Syncing logs to server:', this.pendingLogs.length, 'logs');
        
        try {
            const logsToSend = [...this.pendingLogs];
            this.pendingLogs = [];
            
            const logContent = logsToSend
                .map(log => `[${log.timestamp}] [${log.level.toUpperCase()}] ${log.message} ${log.meta ? JSON.stringify(log.meta) : ''}`)
                .join('\n') + '\n';
            
            console.log('Sending to:', `${this.serverUrl}/client-logs/write`);
            console.log('Content length:', logContent.length);
            
            const response = await fetch(`${this.serverUrl}/client-logs/write`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ content: logContent }),
            });
            
            if (!response.ok) {
                throw new Error(`Server responded with ${response.status}: ${response.statusText}`);
            }
            
            console.log('Successfully synced logs to server');
            this.retryCount = 0; // Reset retry count on success
            
        } catch (error) {
            console.warn('Error syncing logs to server:', error);
            
            // Retry logic
            if (this.retryCount < this.maxRetries) {
                this.retryCount++;
                console.log(`Retrying sync in ${this.retryCount * 2} seconds... (${this.retryCount}/${this.maxRetries})`);
                
                setTimeout(() => {
                    this.syncInProgress = false;
                    this.syncLogsToServer();
                }, this.retryCount * 2000);
                return;
            } else {
                console.error('Max retries reached, logs will be kept for next sync attempt');
                this.retryCount = 0;
            }
        } finally {
            this.syncInProgress = false;
        }
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
    private log(level: 'error' | 'warn' | 'info' | 'debug', message: string, meta?: any): void {
        const timestamp = new Date().toISOString();
        const emoji = LOG_EMOJIS[level] || LOG_EMOJIS.info;
        
        const logEntry: LogEntry = { timestamp, level, message, meta };
        
        // Add to logs array
        this.logs.push(logEntry);
        
        // Add to pending logs for server sync
        this.pendingLogs.push(logEntry);
        
        // Console output with colors and emojis
        const consoleMethod = level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'log';
        console[consoleMethod](`${emoji} [Client] ${message}`, meta || '');
        
        // Save logs
        this.saveLogs();
        
        // If we have too many pending logs, sync immediately
        if (this.pendingLogs.length >= this.batchSize) {
            this.syncLogsToServer();
        }
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
        this.info(formatApiMessage(message), meta);
    }
    
    user(message: string, meta?: any): void {
        this.info(formatUserMessage(message), meta);
    }
    
    performance(operation: string, duration: number, meta?: any): void {
        const level = getPerformanceLevel(duration);
        const message = formatPerformanceMessage(operation, duration);
        this[level](message, { duration, ...meta });
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
        this.pendingLogs = [];
        localStorage.removeItem('everytriv-client-logs');
        console.log('🧹 All client logs cleared manually');
    }
    
    // Manual sync logs to server
    async flushToServer(): Promise<boolean> {
        try {
            await this.syncLogsToServer();
            return true;
        } catch (error) {
            console.warn('Failed to flush logs to server:', error);
            return false;
        }
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
