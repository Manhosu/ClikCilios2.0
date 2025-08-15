// Sistema de monitoramento de performance em tempo real
import React from 'react'
// import { networkOptimizer } from './networkOptimizer'

export interface PerformanceMetrics {
  authInitTime: number
  loginTime: number
  cacheHitRate: number
  networkLatency: number
  errorRate: number
  timestamp: number
}

interface PerformanceAlert {
  type: 'warning' | 'error' | 'info'
  message: string
  metric: string
  value: number
  threshold: number
  timestamp: number
}

export class PerformanceMonitor {
  private static instance: PerformanceMonitor
  private metrics: PerformanceMetrics[] = []
  private alerts: PerformanceAlert[] = []
  private observers: ((metrics: PerformanceMetrics) => void)[] = []
  
  // Thresholds para alertas
  private readonly THRESHOLDS = {
    authInitTime: 2000, // 2 segundos
    loginTime: 3000, // 3 segundos
    cacheHitRate: 0.7, // 70%
    networkLatency: 1000, // 1 segundo
    errorRate: 0.05 // 5%
  }

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor()
      PerformanceMonitor.instance.initMonitoring()
    }
    return PerformanceMonitor.instance
  }

  private initMonitoring(): void {
    // Monitoramento contínuo a cada 30 segundos
    setInterval(() => {
      this.collectMetrics()
    }, 30000)

    // Limpeza de métricas antigas (manter apenas últimas 24h)
    setInterval(() => {
      this.cleanOldMetrics()
    }, 3600000) // A cada hora

    console.log('📊 Sistema de monitoramento de performance iniciado')
  }

  // Coletar métricas atuais
  private async collectMetrics(): Promise<void> {
    try {
      const metrics: PerformanceMetrics = {
        authInitTime: this.getAverageAuthTime(),
        loginTime: this.getAverageLoginTime(),
        cacheHitRate: this.calculateCacheHitRate(),
        networkLatency: await this.measureNetworkLatency(),
        errorRate: this.calculateErrorRate(),
        timestamp: Date.now()
      }

      this.metrics.push(metrics)
      this.checkThresholds(metrics)
      this.notifyObservers(metrics)

      console.log('📈 Métricas coletadas:', {
        authInit: `${metrics.authInitTime}ms`,
        login: `${metrics.loginTime}ms`,
        cacheHit: `${(metrics.cacheHitRate * 100).toFixed(1)}%`,
        latency: `${metrics.networkLatency}ms`,
        errors: `${(metrics.errorRate * 100).toFixed(1)}%`
      })
    } catch (error) {
      console.error('❌ Erro ao coletar métricas:', error)
    }
  }

  // Medir latência de rede
  private async measureNetworkLatency(): Promise<number> {
    const start = performance.now()
    
    try {
      // Ping simples para medir latência
      await fetch('/favicon.ico', { 
        method: 'HEAD',
        cache: 'no-cache'
      })
      
      return performance.now() - start
    } catch {
      return 9999 // Valor alto para indicar problema
    }
  }

  // Calcular taxa de cache hit (simulado)
  private calculateCacheHitRate(): number {
    // Em uma implementação real, isso viria do performanceOptimizer
    return Math.random() * 0.3 + 0.7 // Simular 70-100%
  }

  // Calcular taxa de erro (simulado)
  private calculateErrorRate(): number {
    // Em uma implementação real, isso viria de logs de erro
    return Math.random() * 0.05 // Simular 0-5%
  }

  // Tempo médio de inicialização de auth
  private getAverageAuthTime(): number {
    const recentMetrics = this.metrics.slice(-10)
    if (recentMetrics.length === 0) return 0
    
    const sum = recentMetrics.reduce((acc, m) => acc + m.authInitTime, 0)
    return sum / recentMetrics.length
  }

  // Tempo médio de login
  private getAverageLoginTime(): number {
    const recentMetrics = this.metrics.slice(-10)
    if (recentMetrics.length === 0) return 0
    
    const sum = recentMetrics.reduce((acc, m) => acc + m.loginTime, 0)
    return sum / recentMetrics.length
  }

  // Verificar thresholds e gerar alertas
  private checkThresholds(metrics: PerformanceMetrics): void {
    const checks = [
      {
        metric: 'authInitTime',
        value: metrics.authInitTime,
        threshold: this.THRESHOLDS.authInitTime,
        message: 'Inicialização de autenticação lenta'
      },
      {
        metric: 'loginTime',
        value: metrics.loginTime,
        threshold: this.THRESHOLDS.loginTime,
        message: 'Tempo de login elevado'
      },
      {
        metric: 'cacheHitRate',
        value: metrics.cacheHitRate,
        threshold: this.THRESHOLDS.cacheHitRate,
        message: 'Taxa de cache hit baixa',
        inverse: true
      },
      {
        metric: 'networkLatency',
        value: metrics.networkLatency,
        threshold: this.THRESHOLDS.networkLatency,
        message: 'Latência de rede alta'
      },
      {
        metric: 'errorRate',
        value: metrics.errorRate,
        threshold: this.THRESHOLDS.errorRate,
        message: 'Taxa de erro elevada'
      }
    ]

    checks.forEach(check => {
      const isAlert = check.inverse 
        ? check.value < check.threshold
        : check.value > check.threshold

      if (isAlert) {
        this.addAlert({
          type: check.value > check.threshold * 2 ? 'error' : 'warning',
          message: check.message,
          metric: check.metric,
          value: check.value,
          threshold: check.threshold,
          timestamp: Date.now()
        })
      }
    })
  }

  // Adicionar alerta
  private addAlert(alert: PerformanceAlert): void {
    this.alerts.push(alert)
    
    // Manter apenas últimos 100 alertas
    if (this.alerts.length > 100) {
      this.alerts = this.alerts.slice(-100)
    }

    const icon = alert.type === 'error' ? '🚨' : alert.type === 'warning' ? '⚠️' : 'ℹ️'
    console.warn(`${icon} Performance Alert: ${alert.message} (${alert.value} > ${alert.threshold})`)
  }

  // Limpar métricas antigas
  private cleanOldMetrics(): void {
    const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000)
    this.metrics = this.metrics.filter(m => m.timestamp > oneDayAgo)
    this.alerts = this.alerts.filter(a => a.timestamp > oneDayAgo)
  }

  // Registrar tempo de operação
  recordOperationTime(operation: string, duration: number): void {
    if (operation.includes('auth') || operation.includes('Auth')) {
      // Atualizar métricas de auth em tempo real
      const lastMetric = this.metrics[this.metrics.length - 1]
      if (lastMetric) {
        lastMetric.authInitTime = duration
      }
    }
    
    if (operation.includes('login') || operation.includes('Login')) {
      // Atualizar métricas de login em tempo real
      const lastMetric = this.metrics[this.metrics.length - 1]
      if (lastMetric) {
        lastMetric.loginTime = duration
      }
    }
  }

  // Observar mudanças nas métricas
  subscribe(observer: (metrics: PerformanceMetrics) => void): () => void {
    this.observers.push(observer)
    
    // Retornar função de unsubscribe
    return () => {
      const index = this.observers.indexOf(observer)
      if (index > -1) {
        this.observers.splice(index, 1)
      }
    }
  }

  // Notificar observadores
  private notifyObservers(metrics: PerformanceMetrics): void {
    this.observers.forEach(observer => {
      try {
        observer(metrics)
      } catch (error) {
        console.error('❌ Erro ao notificar observer:', error)
      }
    })
  }

  // Obter métricas atuais
  getCurrentMetrics(): PerformanceMetrics | null {
    return this.metrics[this.metrics.length - 1] || null
  }

  // Obter alertas recentes
  getRecentAlerts(limit: number = 10): PerformanceAlert[] {
    return this.alerts.slice(-limit)
  }

  // Obter relatório de performance
  getPerformanceReport(): {
    metrics: PerformanceMetrics[]
    alerts: PerformanceAlert[]
    summary: {
      avgAuthTime: number
      avgLoginTime: number
      avgCacheHitRate: number
      avgNetworkLatency: number
      avgErrorRate: number
    }
  } {
    const recentMetrics = this.metrics.slice(-24) // Últimas 24 medições
    
    const summary = {
      avgAuthTime: recentMetrics.reduce((acc, m) => acc + m.authInitTime, 0) / recentMetrics.length || 0,
      avgLoginTime: recentMetrics.reduce((acc, m) => acc + m.loginTime, 0) / recentMetrics.length || 0,
      avgCacheHitRate: recentMetrics.reduce((acc, m) => acc + m.cacheHitRate, 0) / recentMetrics.length || 0,
      avgNetworkLatency: recentMetrics.reduce((acc, m) => acc + m.networkLatency, 0) / recentMetrics.length || 0,
      avgErrorRate: recentMetrics.reduce((acc, m) => acc + m.errorRate, 0) / recentMetrics.length || 0
    }

    return {
      metrics: this.metrics,
      alerts: this.alerts,
      summary
    }
  }

  // Forçar coleta de métricas
  async forceCollection(): Promise<PerformanceMetrics> {
    await this.collectMetrics()
    return this.getCurrentMetrics()!
  }
}

// Instância global
export const performanceMonitor = PerformanceMonitor.getInstance()

// Hook para integração com React (opcional)
export function usePerformanceMonitoring() {
  const [metrics, setMetrics] = React.useState<PerformanceMetrics | null>(null)
  const [alerts, setAlerts] = React.useState<PerformanceAlert[]>([])

  React.useEffect(() => {
    const unsubscribe = performanceMonitor.subscribe((newMetrics) => {
      setMetrics(newMetrics)
      setAlerts(performanceMonitor.getRecentAlerts(5))
    })

    return unsubscribe
  }, [])

  return { metrics, alerts }
}