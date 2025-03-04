export type LogCallback = (type: 'info' | 'success' | 'error', message: string, metadata?: any) => void;

export abstract class BaseService {
  protected isShuttingDown = false;
  public logCallback?: LogCallback;

  setLogCallback(callback: LogCallback) {
    console.log('[BaseService] Setting log callback');
    this.logCallback = callback;
  }

  protected log(type: 'info' | 'success' | 'error', message: string, metadata?: any) {
    if (this.isShuttingDown) {
      console.log('[BaseService] Skipping log due to shutdown:', { type, message });
      return;
    }
    console.log(`[BaseService] ${type.toUpperCase()}: ${message}`, metadata || '');
    this.logCallback?.(type, message, metadata);
  }

  shutdown() {
    console.log('[BaseService] Shutting down');
    this.isShuttingDown = true;
  }

  protected sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
