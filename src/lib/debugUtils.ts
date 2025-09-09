import { getSiteContent } from "@/lib/datasource";

// ⚠️ ATTENZIONE: DIPENDENZA CIRCOLARE RISK!
// Questo file importa getSiteContent, quindi getSiteContent NON DEVE mai importare
// le funzioni async di questo file (debugLog, debugError, debugWarn).
// SOLO debugLogSync è sicuro da usare in getSiteContent!

// Cache per evitare troppe chiamate a getSiteContent
let debugLogsCache: boolean | null = null;
let cacheExpiry: number = 0;
const CACHE_DURATION = 30000; // 30 secondi

/**
 * Funzione helper per i log condizionali
 * Controlla se i log di debug sono abilitati nelle impostazioni
 */
async function isDebugEnabled(): Promise<boolean> {
  const now = Date.now();
  
  // Usa la cache se è ancora valida
  if (debugLogsCache !== null && now < cacheExpiry) {
    return debugLogsCache;
  }
  
  try {
    const siteContent = await getSiteContent();
    debugLogsCache = siteContent?.debugLogsEnabled !== false; // Default true
    cacheExpiry = now + CACHE_DURATION;
    return debugLogsCache;
  } catch (error) {
    // In caso di errore, abilita i log per default
    debugLogsCache = true;
    cacheExpiry = now + CACHE_DURATION;
    return true;
  }
}

/**
 * Log condizionale - equivale a console.log ma solo se i debug sono abilitati
 */
export async function debugLog(...args: any[]): Promise<void> {
  if (await isDebugEnabled()) {
    console.log(...args);
  }
}

/**
 * Error log condizionale - equivale a console.error ma solo se i debug sono abilitati
 */
export async function debugError(...args: any[]): Promise<void> {
  if (await isDebugEnabled()) {
    console.error(...args);
  }
}

/**
 * Warn log condizionale - equivale a console.warn ma solo se i debug sono abilitati
 */
export async function debugWarn(...args: any[]): Promise<void> {
  if (await isDebugEnabled()) {
    console.warn(...args);
  }
}

/**
 * Versione sincrona per casi critici dove non possiamo aspettare
 * Usa il valore dalla cache o assume true come default
 */
export function debugLogSync(...args: any[]): void {
  if (debugLogsCache !== false) { // Se cache è null o true, logga
    console.log(...args);
  }
}

/**
 * Forza un refresh della cache (utile dopo aver cambiato le impostazioni)
 */
export function refreshDebugCache(): void {
  debugLogsCache = null;
  cacheExpiry = 0;
}

/**
 * Ottiene lo stato corrente della cache (per debugging)
 */
export function getDebugCacheStatus(): { enabled: boolean | null; expires: number } {
  return {
    enabled: debugLogsCache,
    expires: cacheExpiry
  };
}
