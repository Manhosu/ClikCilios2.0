import { generateEyelidSplineCurve, calculateEyeAngle } from './faceMeshService'

export interface EyelashApplicationConfig {
  blendMode: GlobalCompositeOperation
  opacity: number
  shadowBlur: number
  shadowOffsetY: number
  shadowColor: string
  scaleFactorX: number
  scaleFactorY: number
  curvatureIntensity: number
  warpStrength: number
}

// 🎨 CONFIGURAÇÕES DE BLEND MODE OTIMIZADAS POR ESTILO
export const getBlendModeConfig = (styleId: string): EyelashApplicationConfig => {
  const configs: Record<string, EyelashApplicationConfig> = {
    // 🎯 Estilos Brasileiros - Volume Natural
    'brasileiro-boneca': {
      blendMode: 'multiply',
      opacity: 0.88,
      shadowBlur: 2,
      shadowOffsetY: 1,
      shadowColor: 'rgba(0, 0, 0, 0.3)',
      scaleFactorX: 1.15,
      scaleFactorY: 0.85,
      curvatureIntensity: 0.35,
      warpStrength: 0.25
    },
    'brasileiro-gatinho': {
      blendMode: 'multiply',
      opacity: 0.89,
      shadowBlur: 2,
      shadowOffsetY: 1,
      shadowColor: 'rgba(0, 0, 0, 0.35)',
      scaleFactorX: 1.18,
      scaleFactorY: 0.87,
      curvatureIntensity: 0.37,
      warpStrength: 0.27
    },
    
    // 🔥 Estilos Russos - Volume Dramático
    'russo-boneca': {
      blendMode: 'multiply',
      opacity: 0.90,
      shadowBlur: 3,
      shadowOffsetY: 2,
      shadowColor: 'rgba(0, 0, 0, 0.4)',
      scaleFactorX: 1.22,
      scaleFactorY: 0.90,
      curvatureIntensity: 0.40,
      warpStrength: 0.35
    },
    'russo-gatinho': {
      blendMode: 'multiply',
      opacity: 0.91,
      shadowBlur: 3,
      shadowOffsetY: 2,
      shadowColor: 'rgba(0, 0, 0, 0.42)',
      scaleFactorX: 1.25,
      scaleFactorY: 0.92,
      curvatureIntensity: 0.42,
      warpStrength: 0.37
    },
    
    // 🏺 Estilos Egípcios - Volume 3D
    'egipcio-boneca': {
      blendMode: 'multiply',
      opacity: 0.92,
      shadowBlur: 4,
      shadowOffsetY: 2,
      shadowColor: 'rgba(0, 0, 0, 0.45)',
      scaleFactorX: 1.28,
      scaleFactorY: 0.94,
      curvatureIntensity: 0.45,
      warpStrength: 0.30
    },
    'egipcio-gatinho': {
      blendMode: 'multiply',
      opacity: 0.93,
      shadowBlur: 4,
      shadowOffsetY: 3,
      shadowColor: 'rgba(0, 0, 0, 0.47)',
      scaleFactorX: 1.30,
      scaleFactorY: 0.96,
      curvatureIntensity: 0.47,
      warpStrength: 0.32
    },
    
    // 💄 Estilos Clássicos - Volume Equilibrado  
    'volume-classico-boneca': {
      blendMode: 'multiply',
      opacity: 0.87,
      shadowBlur: 1,
      shadowOffsetY: 1,
      shadowColor: 'rgba(0, 0, 0, 0.25)',
      scaleFactorX: 1.12,
      scaleFactorY: 0.82,
      curvatureIntensity: 0.30,
      warpStrength: 0.20
    },
    'volume-classico-gatinho': {
      blendMode: 'multiply',
      opacity: 0.88,
      shadowBlur: 2,
      shadowOffsetY: 1,
      shadowColor: 'rgba(0, 0, 0, 0.28)',
      scaleFactorX: 1.14,
      scaleFactorY: 0.84,
      curvatureIntensity: 0.32,
      warpStrength: 0.22
    },
    
    // 🦊 Estilo Especial - Fox Eyes
    'fox-eyes': {
      blendMode: 'multiply',
      opacity: 0.89,
      shadowBlur: 2,
      shadowOffsetY: 1,
      shadowColor: 'rgba(0, 0, 0, 0.33)',
      scaleFactorX: 1.20,
      scaleFactorY: 0.78,
      curvatureIntensity: 0.50,
      warpStrength: 0.22
    }
  }
  
  return configs[styleId] || configs['brasileiro-boneca']
}

/**
 * 🌊 FUNÇÃO PRINCIPAL: Aplica overlay de cílios com curvatura real e blend mode otimizado
 */
export const applyEyelashOverlayWithSpline = async (
  ctx: CanvasRenderingContext2D,
  overlayImageUrl: string,
  eyelidLandmarks: Array<{x: number, y: number}>,
  isRightEye: boolean,
  styleId: string,
  eyeWidth: number
): Promise<void> => {
  return new Promise((resolve, reject) => {
    console.log(`🚀 Aplicando overlay com spline - ${isRightEye ? 'Direito' : 'Esquerdo'}`)
    console.log(`🎨 Estilo: ${styleId}`)
    console.log(`📏 Largura do olho: ${eyeWidth.toFixed(1)}px`)
    console.log(`👁️ Landmarks: ${eyelidLandmarks.length} pontos`)
    
    const overlayImg = new Image()
    overlayImg.crossOrigin = 'anonymous'
    
    overlayImg.onload = () => {
      try {
        // 1. 🌊 Gera curva spline suave da pálpebra superior
        const splineCurve = generateEyelidSplineCurve(eyelidLandmarks, 25)
        console.log(`🌊 Curva spline gerada: ${splineCurve.length} pontos`)
        
        // 2. 📐 Calcula ângulo de inclinação do olho
        const innerCorner = eyelidLandmarks[0]
        const outerCorner = eyelidLandmarks[eyelidLandmarks.length - 1]
        const eyeAngle = calculateEyeAngle(innerCorner, outerCorner)
        
        // 3. 🎨 Obtém configuração de blend mode específica do estilo
        const blendConfig = getBlendModeConfig(styleId)
        
        // 4. 📏 Calcula escala proporcional ao olho detectado
        const targetWidth = eyeWidth * blendConfig.scaleFactorX
        const targetHeight = Math.max(
          (targetWidth * blendConfig.scaleFactorY),
          (eyeWidth * 0.3) // Mínimo 30% da largura do olho
        )
        
        const scaleX = targetWidth / overlayImg.width
        const scaleY = targetHeight / overlayImg.height
        
        console.log(`📏 Escala calculada: ${scaleX.toFixed(3)}x (largura), ${scaleY.toFixed(3)}x (altura)`)
        console.log(`📐 Ângulo do olho: ${(eyeAngle * 180 / Math.PI).toFixed(1)}°`)
        
        // 5. 🎭 Configura blend mode e sombras
        ctx.save()
        
        // Sombra sutil para realismo
        ctx.shadowColor = blendConfig.shadowColor
        ctx.shadowBlur = blendConfig.shadowBlur
        ctx.shadowOffsetX = 0
        ctx.shadowOffsetY = blendConfig.shadowOffsetY
        
        // Blend mode para naturalidade
        ctx.globalCompositeOperation = blendConfig.blendMode
        ctx.globalAlpha = blendConfig.opacity
        
        // 6. 🌀 Aplica deformação seguindo a curvatura da pálpebra
        applySplineBasedDeformation(
          ctx,
          overlayImg,
          splineCurve,
          scaleX,
          scaleY,
          eyeAngle,
          isRightEye,
          blendConfig
        )
        
        ctx.restore()
        
        console.log('✅ Overlay aplicado com sucesso!')
        resolve()
        
      } catch (error) {
        console.error('❌ Erro ao aplicar overlay:', error)
        reject(error)
      }
    }
    
    overlayImg.onerror = () => {
      console.error(`❌ Erro ao carregar imagem do overlay: ${overlayImageUrl}`)
      reject(new Error(`Falha ao carregar overlay: ${overlayImageUrl}`))
    }
    
    overlayImg.src = overlayImageUrl
  })
}

/**
 * 🌀 DEFORMAÇÃO BASEADA EM SPLINE: Aplica PNG seguindo curvatura natural da pálpebra
 */
const applySplineBasedDeformation = (
  ctx: CanvasRenderingContext2D,
  overlayImg: HTMLImageElement,
  splineCurve: Array<{x: number, y: number, tangent: number}>,
  scaleX: number,
  scaleY: number,
  eyeAngle: number,
  isRightEye: boolean,
  config: EyelashApplicationConfig
) => {
  // Encontra o centro da curva da pálpebra
  const centerIndex = Math.floor(splineCurve.length / 2)
  const centerPoint = splineCurve[centerIndex]
  
  // Calcula dimensões transformadas
  const transformedWidth = overlayImg.width * scaleX
  const transformedHeight = overlayImg.height * scaleY
  
  // Ponto de ancoragem (centro da pálpebra superior)
  const anchorX = centerPoint.x - transformedWidth / 2
  const anchorY = centerPoint.y - transformedHeight * 0.2 // 20% acima da linha da pálpebra
  
  console.log(`🎯 Ancoragem: (${anchorX.toFixed(1)}, ${anchorY.toFixed(1)})`)
  console.log(`📐 Dimensões transformadas: ${transformedWidth.toFixed(1)} x ${transformedHeight.toFixed(1)}`)
  
  // Aplica transformações
  ctx.save()
  
  // Move para o ponto de ancoragem
  ctx.translate(centerPoint.x, centerPoint.y)
  
  // Rotaciona seguindo a inclinação natural do olho
  ctx.rotate(eyeAngle)
  
  // Espelha horizontalmente se for olho direito (para simetria)
  if (isRightEye) {
    ctx.scale(-1, 1)
  }
  
  // 🌊 DEFORMAÇÃO CURVA AVANÇADA (se suportada)
  if (config.warpStrength > 0 && splineCurve.length > 10) {
    // Aplica deformação sutil seguindo a curvatura
    applySubtleCurveWarp(ctx, overlayImg, splineCurve, config.warpStrength, transformedWidth, transformedHeight)
  } else {
    // Aplicação direta com escala
    ctx.drawImage(
      overlayImg,
      -transformedWidth / 2,
      -transformedHeight / 2,
      transformedWidth,
      transformedHeight
    )
  }
  
  ctx.restore()
}

/**
 * 🎯 DEFORMAÇÃO SUTIL: Aplica warp sutil seguindo pontos da curva
 */
const applySubtleCurveWarp = (
  ctx: CanvasRenderingContext2D,
  overlayImg: HTMLImageElement,
  splineCurve: Array<{x: number, y: number, tangent: number}>,
  warpStrength: number,
  width: number,
  height: number
) => {
  // Divide a imagem em segmentos horizontais e aplica curvatura gradual
  const segments = Math.min(splineCurve.length / 3, 8) // Máximo 8 segmentos
  const segmentHeight = height / segments
  
  for (let i = 0; i < segments; i++) {
    const t = i / (segments - 1)
    // const curveIndex = Math.floor(t * (splineCurve.length - 1)) // Removido por não estar em uso
    
    // Calcula offset Y baseado na curvatura da pálpebra
    const yOffset = Math.sin(t * Math.PI) * warpStrength * height * 0.1
    
    // Desenha segmento com offset curvo
    ctx.drawImage(
      overlayImg,
      0, i * overlayImg.height / segments,           // sx, sy (source)
      overlayImg.width, overlayImg.height / segments, // sw, sh (source)
      -width / 2, (-height / 2) + (i * segmentHeight) + yOffset, // dx, dy (dest)
      width, segmentHeight                            // dw, dh (dest)
    )
  }
}

/**
 * 🎨 FUNÇÃO HELPERS: Previews e validações
 */
export const generateEyelashPreview = async (styleId: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas')
    canvas.width = 200
    canvas.height = 100
    const ctx = canvas.getContext('2d')!
    
    // Fundo transparente
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    
    // Simula olho para preview
    const mockEyeLandmarks = [
      { x: 20, y: 50 },
      { x: 50, y: 40 },
      { x: 100, y: 35 },
      { x: 150, y: 40 },
      { x: 180, y: 50 }
    ]
    
    const overlayPath = `/assets/cilios/${getEyelashFileName(styleId)}`
    
    applyEyelashOverlayWithSpline(
      ctx,
      overlayPath,
      mockEyeLandmarks,
      false,
      styleId,
      160
    ).then(() => {
      resolve(canvas.toDataURL('image/png'))
    }).catch(reject)
  })
}

// Helper function - reaproveitada do aiService
const getEyelashFileName = (styleId: string): string => {
  const fileMap: { [key: string]: string } = {
    'brasileiro-boneca': 'brasileiro_boneca.png',
    'brasileiro-gatinho': 'brasileiro_gatinho.png',
    'russo-boneca': 'russo_boneca.png',
    'russo-gatinho': 'russo_gatinho.png',
    'egipcio-boneca': 'egipcio_boneca.png',
    'egipcio-gatinho': 'egipcio_gatinho.png',
    'volume-classico-boneca': 'volume_classico_boneca.png',
    'volume-classico-gatinho': 'volume_classico_gatinho.png',
    'fox-eyes': 'fox_eyes.png'
  }
  
  return fileMap[styleId] || `${styleId}.png`
}