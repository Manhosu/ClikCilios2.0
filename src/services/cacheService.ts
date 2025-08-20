interface CacheItem<T> {
  data: T
  timestamp: number
  ttl: number
}

interface SessionData {
  user: any
  isAuthenticated: boolean
  expiresAt: number
}

export class CacheService {
  private memoryCache: Map<string, CacheItem<any>> = new Map()
  private readonly DEFAULT_TTL = 5 * 60 * 1000 // 5 minutos
  private readonly SESSION_KEY = 'clik_session_cache'
  private readonly AUTH_KEY = 'clik_auth_cache'

  set<T>(key: string, data: T, ttl?: number): void {
    const item: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.DEFAULT_TTL
    }
    
    this.memoryCache.set(key, item)
    
    if (key.startsWith('session_') || key.startsWith('auth_')) {
      try {
        localStorage.setItem(key, JSON.stringify(item))
      } catch (error) {
        console.warn('Erro ao salvar no localStorage:', error)
      }
    }
  }

  get<T>(key: string): T | null {
    let item = this.memoryCache.get(key)
    
    if (!item && (key.startsWith('session_') || key.startsWith('auth_'))) {
      try {
        const stored = localStorage.getItem(key)
        if (stored) {
          item = JSON.parse(stored)
          if (item) {
            this.memoryCache.set(key, item)
          }
        }
      } catch (error) {
        console.warn('Erro ao recuperar do localStorage:', error)
      }
    }
    
    if (!item) return null
    
    const isExpired = Date.now() - item.timestamp > item.ttl
    
    if (isExpired) {
      this.delete(key)
      return null
    }
    
    return item.data
  }

  delete(key: string): void {
    this.memoryCache.delete(key)
    
    if (key.startsWith('session_') || key.startsWith('auth_')) {
      try {
        localStorage.removeItem(key)
      } catch (error) {
        console.warn('Erro ao remover do localStorage:', error)
      }
    }
  }

  clear(): void {
    this.memoryCache.clear()
    
    try {
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('clik_')) {
          localStorage.removeItem(key)
        }
      })
    } catch (error) {
      console.warn('Erro ao limpar localStorage:', error)
    }
  }

  isValid(key: string): boolean {
    const item = this.memoryCache.get(key)
    if (!item) return false
    
    return Date.now() - item.timestamp <= item.ttl
  }

  setSession(sessionData: SessionData): void {
    this.set(this.SESSION_KEY, sessionData, 24 * 60 * 60 * 1000) // 24 horas
  }

  getSession(): SessionData | null {
    return this.get<SessionData>(this.SESSION_KEY)
  }

  clearSession(): void {
    this.delete(this.SESSION_KEY)
  }

  setAuth(authData: any): void {
    this.set(this.AUTH_KEY, authData, 60 * 60 * 1000) // 1 hora
  }

  getAuth(): any {
    return this.get(this.AUTH_KEY)
  }

  clearAuth(): void {
    this.delete(this.AUTH_KEY)
  }

  setUserData(userId: string, data: any, ttl = 10 * 60 * 1000): void {
    this.set(`user_data_${userId}`, data, ttl)
  }

  getUserData(userId: string): any {
    return this.get(`user_data_${userId}`)
  }

  setImagesList(userId: string, images: any[], ttl = 5 * 60 * 1000): void {
    this.set(`images_${userId}`, images, ttl)
  }

  getImagesList(userId: string): any[] | null {
    return this.get(`images_${userId}`)
  }

  invalidateUserData(userId: string): void {
    const keys = Array.from(this.memoryCache.keys()).filter(key => 
      key.includes(userId) || key.includes('user_data') || key.includes('images_')
    )
    
    keys.forEach(key => this.delete(key))
  }
}

export const cacheService = new CacheService()