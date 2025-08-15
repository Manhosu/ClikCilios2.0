import React, { useState, useEffect } from 'react'
import { performanceMonitor } from '../utils/performanceMonitor'
import type { PerformanceMetrics } from '../utils/performanceMonitor'

interface PerformanceMonitorProps {
  isVisible?: boolean
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
}

export const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({
  isVisible = false,
  position = 'top-right'
}) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null)
  const [isExpanded, setIsExpanded] = useState(false)

  useEffect(() => {
    if (!isVisible) return

    const unsubscribe = performanceMonitor.subscribe((newMetrics) => {
      setMetrics(newMetrics)
    })

    // Coletar métricas iniciais
    performanceMonitor.collectMetrics()

    return unsubscribe
  }, [isVisible])

  if (!isVisible || !metrics) return null

  const positionClasses = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4'
  }

  const getStatusColor = (value: number, threshold: number) => {
    if (value > threshold * 1.5) return 'text-red-500'
    if (value > threshold) return 'text-yellow-500'
    return 'text-green-500'
  }

  return (
    <div className={`fixed ${positionClasses[position]} z-50 bg-black/80 backdrop-blur-sm rounded-lg border border-gray-700 text-white text-xs font-mono transition-all duration-300 ${isExpanded ? 'w-80' : 'w-16'}`}>
      <div 
        className="p-2 cursor-pointer flex items-center justify-between"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${metrics.alerts.length > 0 ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`} />
          {isExpanded && <span>Performance</span>}
        </div>
        {isExpanded && (
          <span className="text-gray-400">
            {isExpanded ? '−' : '+'}
          </span>
        )}
      </div>
      
      {isExpanded && (
        <div className="p-3 pt-0 space-y-2">
          {/* Métricas de Autenticação */}
          <div className="border-b border-gray-600 pb-2">
            <div className="font-semibold text-blue-400 mb-1">Auth Performance</div>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span>Init Time:</span>
                <span className={getStatusColor(metrics.authInitTime, 1000)}>
                  {metrics.authInitTime.toFixed(0)}ms
                </span>
              </div>
              <div className="flex justify-between">
                <span>Login Time:</span>
                <span className={getStatusColor(metrics.loginTime, 2000)}>
                  {metrics.loginTime.toFixed(0)}ms
                </span>
              </div>
            </div>
          </div>

          {/* Métricas de Cache */}
          <div className="border-b border-gray-600 pb-2">
            <div className="font-semibold text-purple-400 mb-1">Cache Performance</div>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span>Hit Rate:</span>
                <span className={metrics.cacheHitRate > 0.8 ? 'text-green-500' : metrics.cacheHitRate > 0.6 ? 'text-yellow-500' : 'text-red-500'}>
                  {(metrics.cacheHitRate * 100).toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span>Entries:</span>
                <span className="text-gray-300">{metrics.cacheSize}</span>
              </div>
            </div>
          </div>

          {/* Métricas de Rede */}
          <div className="border-b border-gray-600 pb-2">
            <div className="font-semibold text-green-400 mb-1">Network</div>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span>Latency:</span>
                <span className={getStatusColor(metrics.networkLatency, 200)}>
                  {metrics.networkLatency.toFixed(0)}ms
                </span>
              </div>
              <div className="flex justify-between">
                <span>Error Rate:</span>
                <span className={metrics.errorRate > 0.05 ? 'text-red-500' : metrics.errorRate > 0.02 ? 'text-yellow-500' : 'text-green-500'}>
                  {(metrics.errorRate * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          </div>

          {/* Alertas */}
          {metrics.alerts.length > 0 && (
            <div>
              <div className="font-semibold text-red-400 mb-1">Alerts</div>
              <div className="space-y-1 max-h-20 overflow-y-auto">
                {metrics.alerts.slice(0, 3).map((alert, index) => (
                  <div key={index} className="text-red-300 text-xs">
                    {alert.message}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Timestamp */}
          <div className="text-gray-500 text-xs pt-1 border-t border-gray-600">
            Last update: {new Date(metrics.timestamp).toLocaleTimeString()}
          </div>
        </div>
      )}
    </div>
  )
}

export default PerformanceMonitor