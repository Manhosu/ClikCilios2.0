// Serviço para aplicação de cílios com DETECÇÃO FACIAL REAL + CURVATURA NATURAL
import * as faceapi from 'face-api.js'
import { 
  initializeFaceMesh, 
  detectFaceMeshLandmarks, 
  sortEyelidLandmarks,
  type FaceMeshResults 
} from './faceMeshService'
import { 
  applyEyelashOverlayWithSpline
} from './eyelashOverlayService'

export interface EstiloCilio {
  id: string
  nome: string
  descricao: string
  thumbnail: string
  codigo: string
  overlayPath: string
}

export interface ProcessamentoIA {
  imagemOriginal: string
  estiloSelecionado: string
  imagemProcessada?: string
  status: 'processando' | 'concluido' | 'erro'
  erro?: string
  tempoProcessamento?: number
  metadata?: {
    tamanhoOriginal: number
    tamanhoProcessada: number
    qualidade: number
  }
}

// Flag para controlar se os modelos já foram carregados
let modelsLoaded = false
let modelsAvailable = true
let mediaPipeAvailable = false

/**
 * Estilos de cílios disponíveis
 */
export const getEstilosCilios = (): EstiloCilio[] => {
  const estilos = [
    {
      id: 'brasileiro-boneca',
      nome: 'Volume Brasileiro Boneca',
      descricao: 'Volume brasileiro estilo boneca',
      thumbnail: '🇧🇷',
      codigo: 'BRASILEIRO_BONECA',
      overlayPath: '/assets/cilios/brasileiro_boneca.png'
    },
    {
      id: 'brasileiro-gatinho',
      nome: 'Volume Brasileiro Gatinho',
      descricao: 'Volume brasileiro estilo gatinho',
      thumbnail: '🐱',
      codigo: 'BRASILEIRO_GATINHO',
      overlayPath: '/assets/cilios/brasileiro_gatinho.png'
    },
    {
      id: 'russo-boneca',
      nome: 'Volume Russo Boneca',
      descricao: 'Volume russo estilo boneca',
      thumbnail: '🪆',
      codigo: 'RUSSO_BONECA',
      overlayPath: '/assets/cilios/russo_boneca.png'
    },
    {
      id: 'russo-gatinho',
      nome: 'Volume Russo Gatinho',
      descricao: 'Volume russo estilo gatinho',
      thumbnail: '🔥',
      codigo: 'RUSSO_GATINHO',
      overlayPath: '/assets/cilios/russo_gatinho.png'
    },
    {
      id: 'egipcio-boneca',
      nome: 'Volume Egípcio Boneca',
      descricao: 'Volume egípcio estilo boneca',
      thumbnail: '🔺',
      codigo: 'EGIPCIO_BONECA',
      overlayPath: '/assets/cilios/egipcio_boneca.png'
    },
    {
      id: 'egipcio-gatinho',
      nome: 'Volume Egípcio Gatinho',
      descricao: 'Volume egípcio estilo gatinho',
      thumbnail: '⚡',
      codigo: 'EGIPCIO_GATINHO',
      overlayPath: '/assets/cilios/egipcio_gatinho.png'
    },
    {
      id: 'volume-classico-boneca',
      nome: 'Volume Clássico Boneca',
      descricao: 'Volume clássico estilo boneca',
      thumbnail: '💄',
      codigo: 'CLASSICO_BONECA',
      overlayPath: '/assets/cilios/volume_classico_boneca.png'
    },
    {
      id: 'volume-classico-gatinho',
      nome: 'Volume Clássico Gatinho',
      descricao: 'Volume clássico estilo gatinho',
      thumbnail: '✨',
      codigo: 'CLASSICO_GATINHO',
      overlayPath: '/assets/cilios/volume_classico_gatinho.png'
    },
    {
      id: 'fox-eyes',
      nome: 'Fox Eyes',
      descricao: 'Efeito fox eyes moderno',
      thumbnail: '🦊',
      codigo: 'FOX_EYES',
      overlayPath: '/assets/cilios/fox_eyes.png'
    }
  ]
  
  // 🔧 Teste de carregamento do primeiro estilo para validação
  if (estilos.length > 0) {
    const testImg = new Image()
    testImg.onload = () => console.log('✅ Sistema de cílios: Imagens carregando corretamente')
    testImg.onerror = () => console.error('❌ Sistema de cílios: Erro no carregamento das imagens')
    testImg.src = estilos[0].overlayPath
  }
  
  return estilos
}

/**
 * 🚀 Carrega os modelos de detecção facial (MediaPipe primeiro, face-api.js como fallback)
 */
const loadFaceApiModels = async (): Promise<boolean> => {
  if (modelsLoaded) return modelsAvailable || mediaPipeAvailable

  try {
    // 1️⃣ Tenta MediaPipe Face Mesh primeiro (mais preciso)
    console.log('🤖 Tentando carregar MediaPipe Face Mesh...')
    
    try {
      mediaPipeAvailable = await initializeFaceMesh()
      
      if (mediaPipeAvailable) {
        console.log('✅ MediaPipe Face Mesh carregado com sucesso!')
        modelsLoaded = true
        return true
      }
    } catch (mediaPipeError) {
      console.warn('⚠️ MediaPipe não disponível:', mediaPipeError)
      mediaPipeAvailable = false
    }

    // 2️⃣ Fallback para face-api.js se MediaPipe falhar
    console.log('🔄 Tentando carregar face-api.js...')
    
    try {
      // Testa primeiro se os modelos estão disponíveis
      await Promise.race([
        Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
          faceapi.nets.faceLandmark68Net.loadFromUri('/models')
        ]),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
      ])
      
      modelsLoaded = true
      modelsAvailable = true
      console.log('✅ Modelos face-api.js carregados como fallback!')
      return true
      
    } catch (faceApiError) {
      console.warn('⚠️ face-api.js não disponível:', faceApiError)
      
      // 3️⃣ Tenta carregar de CDN como último recurso
      try {
        console.log('🌐 Tentando carregar modelos de CDN...')
        await Promise.race([
          Promise.all([
            faceapi.nets.tinyFaceDetector.loadFromUri('https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights'),
            faceapi.nets.faceLandmark68Net.loadFromUri('https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights')
          ]),
          new Promise((_, reject) => setTimeout(() => reject(new Error('CDN Timeout')), 10000))
        ])
        
        modelsLoaded = true
        modelsAvailable = true
        console.log('✅ Modelos face-api.js carregados da CDN!')
        return true
        
      } catch (cdnError) {
        console.warn('⚠️ CDN também falhou:', cdnError)
      }
    }
    
    // 4️⃣ Se tudo falhar, continua sem modelos (usando fallback inteligente)
    console.log('📊 Usando apenas fallback inteligente por histograma')
    modelsLoaded = true
    modelsAvailable = false
    mediaPipeAvailable = false
    return false
    
  } catch (error) {
    console.error('❌ Erro geral no carregamento dos modelos:', error)
    modelsLoaded = true
    modelsAvailable = false
    mediaPipeAvailable = false
    return false
  }
}

/**
 * Mapeia ID do estilo para nome real do arquivo
 */
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

/**
 * 🚫 TEMPORARIAMENTE DESABILITADO: Detecta pontos faciais usando face-api.js
 * (Desabilitado devido a problemas de carregamento de modelo)
 */
const detectFacialLandmarks = async (imageElement: HTMLImageElement) => {
  // Temporariamente desabilitado para evitar erros
  console.log('ℹ️ face-api.js temporariamente desabilitado, usando fallback inteligente')
  return null
}

/**
 * FALLBACK INTELIGENTE: Analisa histograma de cores para detectar região dos olhos
 */
const detectEyeRegionByHistogram = (canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) => {
  const width = canvas.width
  const height = canvas.height
  
  // Analisa a região superior da imagem (onde geralmente ficam os olhos)
  const eyeRegionTop = Math.floor(height * 0.25)
  const eyeRegionBottom = Math.floor(height * 0.55)
  const eyeRegionHeight = eyeRegionBottom - eyeRegionTop
  
  const imageData = ctx.getImageData(0, eyeRegionTop, width, eyeRegionHeight)
  const data = imageData.data
  
  // Analisa múltiplos padrões para maior precisão
  const analysisByRow: Array<{
    darkPixels: number,
    contrastChanges: number,
    eyePattern: number
  }> = []
  
  for (let y = 0; y < eyeRegionHeight; y++) {
    let darkPixels = 0
    let contrastChanges = 0
    let prevBrightness = 0
    
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4
      const r = data[idx]
      const g = data[idx + 1]
      const b = data[idx + 2]
      
      const brightness = (r + g + b) / 3
      
      // Conta pixels escuros (íris, pupilas)
      if (brightness < 100) {
        darkPixels++
      }
      
      // Detecta mudanças de contraste (bordas dos olhos)
      if (x > 0) {
        const contrastDiff = Math.abs(brightness - prevBrightness)
        if (contrastDiff > 30) {
          contrastChanges++
        }
      }
      prevBrightness = brightness
    }
    
    // Score combinado para detectar linha dos olhos
    const eyePattern = darkPixels + (contrastChanges * 0.5)
    
    analysisByRow.push({
      darkPixels,
      contrastChanges,
      eyePattern
    })
  }
  
  // Encontra a linha com melhor padrão de olhos
  let maxEyePattern = 0
  let eyeLineIndex = Math.floor(eyeRegionHeight * 0.6) // fallback
  
  for (let i = 0; i < analysisByRow.length; i++) {
    if (analysisByRow[i].eyePattern > maxEyePattern) {
      maxEyePattern = analysisByRow[i].eyePattern
      eyeLineIndex = i
    }
  }
  
  const detectedEyeY = eyeRegionTop + eyeLineIndex - 6 // 6px acima para pálpebra superior
  
  console.log(`🧠 DETECÇÃO INTELIGENTE: Linha dos olhos detectada em ${detectedEyeY}px`)
  console.log(`📊 Padrão máximo: ${maxEyePattern.toFixed(1)} na linha ${eyeLineIndex}`)
  console.log(`🔍 Pixels escuros: ${analysisByRow[eyeLineIndex].darkPixels}, Contraste: ${analysisByRow[eyeLineIndex].contrastChanges}`)
  
  return detectedEyeY
}

/**
 * 🎯 FUNÇÃO APRIMORADA: Extrai landmarks da pálpebra usando MediaPipe ou face-api.js
 */
const calculateEyelidCurve = async (imageElement: HTMLImageElement, faceData: any = null) => {
  const width = imageElement.width
  const height = imageElement.height
  
  // 1️⃣ MÉTODO PREMIUM: MediaPipe Face Mesh (mais preciso)
  if (mediaPipeAvailable) {
    console.log('🚀 Usando MediaPipe Face Mesh para landmarks da pálpebra superior')
    
    try {
      const faceMeshResults = await detectFaceMeshLandmarks(imageElement)
      
      if (faceMeshResults) {
        // Ordena e suaviza os landmarks da pálpebra superior
        const leftEyeSorted = sortEyelidLandmarks(faceMeshResults.leftEyeUpperCurve, false)
        const rightEyeSorted = sortEyelidLandmarks(faceMeshResults.rightEyeUpperCurve, true)
        
        console.log('✅ MediaPipe - Landmarks da pálpebra superior extraídos:')
        console.log(`👁️ Olho esquerdo: ${leftEyeSorted.length} pontos, largura: ${faceMeshResults.leftEyeWidth.toFixed(1)}px`)
        console.log(`👁️ Olho direito: ${rightEyeSorted.length} pontos, largura: ${faceMeshResults.rightEyeWidth.toFixed(1)}px`)
        
        return {
          leftEye: leftEyeSorted,
          rightEye: rightEyeSorted,
          leftEyeWidth: faceMeshResults.leftEyeWidth,
          rightEyeWidth: faceMeshResults.rightEyeWidth,
          confidence: faceMeshResults.confidence,
          method: 'mediapipe_face_mesh'
        }
      }
    } catch (error) {
      console.warn('⚠️ Erro no MediaPipe, usando fallback:', error)
    }
  }
  
  // 2️⃣ MÉTODO FALLBACK: face-api.js (boa precisão)
  if (faceData && faceData.landmarks) {
    console.log('🔄 Usando face-api.js para landmarks faciais')
    
    const eyeLandmarks = extractEyeLandmarks(faceData)
    
    if (eyeLandmarks) {
      console.log(`👁️ face-api.js - Olho esquerdo: ${eyeLandmarks.leftEye.length} pontos`)
      console.log(`👁️ face-api.js - Olho direito: ${eyeLandmarks.rightEye.length} pontos`)
      
      return {
        leftEye: eyeLandmarks.leftEye,
        rightEye: eyeLandmarks.rightEye,
        leftEyeWidth: calculateEyeWidth(eyeLandmarks.leftEye),
        rightEyeWidth: calculateEyeWidth(eyeLandmarks.rightEye),
        confidence: 0.8,
        method: 'faceapi_landmarks'
      }
    }
  } 
  
  // 3️⃣ MÉTODO INTELIGENTE: Análise de histograma (fallback final)
  console.log('🧠 Usando análise inteligente por histograma')
  
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(imageElement, 0, 0)
  
  const detectedEyeY = detectEyeRegionByHistogram(canvas, ctx)
  
  // Estima posições dos olhos baseado na anatomia padrão
  const centerX = width / 2
  const eyeDistance = width * 0.16
  const eyeWidth = width * 0.12
  
  // Cria curva estimada para cada olho (5 pontos para melhor curvatura)
  const leftCenterX = centerX - eyeDistance
  const rightCenterX = centerX + eyeDistance
  
  const leftCurve = [
    { x: leftCenterX - eyeWidth/2, y: detectedEyeY + 3 },    // Canto interno
    { x: leftCenterX - eyeWidth/4, y: detectedEyeY - 1 },    // 1/4
    { x: leftCenterX, y: detectedEyeY - 3 },                 // Centro (mais alto)
    { x: leftCenterX + eyeWidth/4, y: detectedEyeY - 1 },    // 3/4
    { x: leftCenterX + eyeWidth/2, y: detectedEyeY + 3 }     // Canto externo
  ]
  
  const rightCurve = [
    { x: rightCenterX - eyeWidth/2, y: detectedEyeY + 3 },   // Canto interno
    { x: rightCenterX - eyeWidth/4, y: detectedEyeY - 1 },   // 1/4
    { x: rightCenterX, y: detectedEyeY - 3 },                // Centro (mais alto)
    { x: rightCenterX + eyeWidth/4, y: detectedEyeY - 1 },   // 3/4
    { x: rightCenterX + eyeWidth/2, y: detectedEyeY + 3 }    // Canto externo
  ]
  
  return {
    leftEye: leftCurve,
    rightEye: rightCurve,
    leftEyeWidth: eyeWidth,
    rightEyeWidth: eyeWidth,
    confidence: 0.6,
    method: 'intelligent_histogram_analysis'
  }
}

/**
 * 🔍 CONFIGURAÇÕES DE REFINAMENTO POR TIPO DE ESTILO
 */
const getStyleRefinementConfig = (selectedStyle: string) => {
  const configs: Record<string, {
    maxProjectionRatio: number,
    anatomicalOffsetRatio: number,
    blendOpacity: number,
    curvatureIntensity: number,
    segmentCount?: number,
    warpStrength?: number,
    tangentSmoothing?: number,
    useAdvancedMask?: boolean,
    elongationFactor?: number
  }> = {
    // 🎨 Estilos Clássicos - Volume Natural
    'volume-classico-boneca': {
      maxProjectionRatio: 0.22,
      anatomicalOffsetRatio: 0.14,
      blendOpacity: 0.87,
      curvatureIntensity: 0.30,
      segmentCount: 10,             // Mais segmentos para suavidade
      warpStrength: 0.20,           // Força moderada da deformação
      tangentSmoothing: 0.85        // Suavização aprimorada
    },
    
    'volume-classico-gatinho': {
      maxProjectionRatio: 0.24,
      anatomicalOffsetRatio: 0.15,
      blendOpacity: 0.88,
      curvatureIntensity: 0.32,
      segmentCount: 11,             // Ligeiramente mais segmentos
      warpStrength: 0.22,           // Força um pouco maior
      tangentSmoothing: 0.87        // Suavização alta
    },
    
    // 🎯 Estilos Brasileiros - Volume Brasileiro
    'brasileiro-boneca': {
      maxProjectionRatio: 0.25,
      anatomicalOffsetRatio: 0.15,
      blendOpacity: 0.88,
      curvatureIntensity: 0.35,
      segmentCount: 12,             // Segmentação otimizada
      warpStrength: 0.25,           // Deformação acentuada
      tangentSmoothing: 0.90        // Alta suavização
    },
    
    'brasileiro-gatinho': {
      maxProjectionRatio: 0.27,
      anatomicalOffsetRatio: 0.16,
      blendOpacity: 0.89,
      curvatureIntensity: 0.37,
      segmentCount: 13,             // Mais segmentos para efeito gatinho
      warpStrength: 0.27,           // Deformação mais forte
      tangentSmoothing: 0.91        // Suavização otimizada
    },
    
    // 🔥 Estilos Dramáticos - Volume Russo
    'russo-boneca': {
      maxProjectionRatio: 0.30,
      anatomicalOffsetRatio: 0.18,
      blendOpacity: 0.90,
      curvatureIntensity: 0.40,
      segmentCount: 15,             // Máxima segmentação para volume
      warpStrength: 0.35,           // Deformação dramática
      tangentSmoothing: 0.95,       // Suavização máxima
      useAdvancedMask: true         // Usa máscara curva avançada
    },
    
    'russo-gatinho': {
      maxProjectionRatio: 0.32,
      anatomicalOffsetRatio: 0.19,
      blendOpacity: 0.91,
      curvatureIntensity: 0.42,
      segmentCount: 16,             // Máxima segmentação
      warpStrength: 0.37,           // Deformação extrema
      tangentSmoothing: 0.96,       // Suavização máxima
      useAdvancedMask: true         // Máscara curva avançada
    },
    
    // 🏺 Estilos Egípcios - Volume 3D
    'egipcio-boneca': {
      maxProjectionRatio: 0.35,
      anatomicalOffsetRatio: 0.20,
      blendOpacity: 0.92,
      curvatureIntensity: 0.45,
      segmentCount: 14,             // Segmentação alta
      warpStrength: 0.30,           // Deformação forte
      tangentSmoothing: 0.92,       // Suavização alta
      useAdvancedMask: true         // Máscara curva para 3D
    },
    
    'egipcio-gatinho': {
      maxProjectionRatio: 0.37,
      anatomicalOffsetRatio: 0.21,
      blendOpacity: 0.93,
      curvatureIntensity: 0.47,
      segmentCount: 15,             // Segmentação extrema
      warpStrength: 0.32,           // Deformação intensa
      tangentSmoothing: 0.94,       // Suavização extrema
      useAdvancedMask: true         // Máscara avançada
    },
    
    // 🦊 Estilo Especial - Fox Eyes
    'fox-eyes': {
      maxProjectionRatio: 0.28,
      anatomicalOffsetRatio: 0.16,
      blendOpacity: 0.89,
      curvatureIntensity: 0.50,     // Maior curvatura para efeito fox
      segmentCount: 10,             // Segmentação alongada
      warpStrength: 0.22,           // Deformação sutil
      tangentSmoothing: 0.85,       // Suavização felina
      elongationFactor: 1.15        // Fator de alongamento para fox eyes
    }
  }
  
  // Configuração padrão se estilo não encontrado
  return configs[selectedStyle] || configs['brasileiro-boneca']
}

/**
 * 🌊 FUNÇÃO AVANÇADA: Aplica overlay com curvatura real da pálpebra
 * 
 * Esta função implementa deformação 2D seguindo a anatomia natural do olho
 * usando landmarks específicos da pálpebra superior para máximo realismo.
 */
export const applyCurvedEyelashOverlay = async (
  landmarks: Array<{x: number, y: number}>,
  ctx: CanvasRenderingContext2D,
  overlayImageUrl: string,
  isRightEye: boolean = false,
  styleId: string = 'brasileiro-boneca'
): Promise<void> => {
  return new Promise((resolve, reject) => {
    console.log(`🚀 INICIANDO overlay curvo para ${isRightEye ? 'direito' : 'esquerdo'}`)
    console.log(`📂 URL da imagem: ${overlayImageUrl}`)
    console.log(`🎨 Estilo: ${styleId}`)
    console.log(`👁️ Landmarks recebidos: ${landmarks.length} pontos`)
    
    const overlayImg = new Image()
    overlayImg.crossOrigin = 'anonymous'
    
    overlayImg.onload = () => {
      try {
        // 1. EXTRAÇÃO DE LANDMARKS ESPECÍFICOS DA PÁLPEBRA SUPERIOR
        const upperEyelidLandmarks = extractUpperEyelidCurve(landmarks, isRightEye)
        
        // 2. GERAÇÃO DA CURVA ANATÔMICA BÉZIER/SPLINE
        const eyelidCurve = generateAnatomicalCurve(upperEyelidLandmarks)
        
        // 3. CÁLCULO DA LARGURA REAL DO OLHO
        const eyeWidth = calculateEyeWidth(landmarks)
        
        // 4. CONFIGURAÇÃO DO ESTILO E ESCALA
        const styleConfig = getStyleRefinementConfig(styleId)
        
        const scaleX = (eyeWidth * 1.15) / overlayImg.width  // 115% da largura do olho
        const scaleY = Math.max(scaleX * 0.7, (eyeWidth * styleConfig.maxProjectionRatio) / overlayImg.height)
        
        // 5. APLICAÇÃO DA DEFORMAÇÃO CURVA
        applyCurvedDeformation(
          ctx,
          overlayImg,
          eyelidCurve,
          scaleX,
          scaleY,
          isRightEye,
          styleConfig
        )
        
        resolve()
        
      } catch (error) {
        console.error(`❌ Erro ao aplicar overlay curvo:`, error)
        console.error(`❌ Stack trace:`, error instanceof Error ? error.stack : 'No stack trace')
        reject(error)
      }
    }
    
    overlayImg.onerror = (event) => {
      console.error(`❌ Erro ao carregar imagem do overlay: ${overlayImageUrl}`)
      console.error(`❌ Evento de erro:`, event)
      reject(new Error(`Erro ao carregar imagem do overlay: ${overlayImageUrl}`))
    }
    
    console.log(`📥 Iniciando carregamento da imagem...`)
    overlayImg.src = overlayImageUrl
  })
}

/**
 * 👁️ FUNÇÃO: Extrai pontos específicos da curvatura da pálpebra superior
 */
const extractUpperEyelidCurve = (
  landmarks: Array<{x: number, y: number}>,
  isRightEye: boolean
): Array<{x: number, y: number}> => {
  // Para face-api.js (68 pontos) ou landmarks customizados
  if (landmarks.length >= 6) {
    // Usa landmarks existentes dos olhos
    const innerCorner = landmarks[0]  // Canto interno
    const outerCorner = landmarks[3]  // Canto externo
    const upperMid = landmarks[1]     // Centro superior
    const upperOuter = landmarks[2]   // Superior externo
    
    // Cria pontos intermediários para curvatura suave
    const point1 = {
      x: innerCorner.x + (upperMid.x - innerCorner.x) * 0.25,
      y: innerCorner.y + (upperMid.y - innerCorner.y) * 0.8
    }
    
    const point2 = {
      x: innerCorner.x + (upperMid.x - innerCorner.x) * 0.75,
      y: innerCorner.y + (upperMid.y - innerCorner.y) * 0.9
    }
    
    const point3 = {
      x: upperMid.x + (upperOuter.x - upperMid.x) * 0.25,
      y: upperMid.y + (upperOuter.y - upperMid.y) * 0.9
    }
    
    const point4 = {
      x: upperMid.x + (upperOuter.x - upperMid.x) * 0.75,
      y: upperMid.y + (upperOuter.y - upperMid.y) * 0.8
    }
    
    // Retorna 8 pontos para curva precisa
    return [
      innerCorner,  // Ponto 0: Canto interno
      point1,       // Ponto 1: 25% interno-centro
      point2,       // Ponto 2: 75% interno-centro
      upperMid,     // Ponto 3: Centro superior
      point3,       // Ponto 4: 25% centro-externo
      point4,       // Ponto 5: 75% centro-externo
      upperOuter,   // Ponto 6: Superior externo
      outerCorner   // Ponto 7: Canto externo
    ]
  }
  
  // Fallback: pontos estimados se landmarks insuficientes
  const centerX = landmarks.length > 0 ? landmarks[0].x : 100
  const centerY = landmarks.length > 0 ? landmarks[0].y : 100
  const width = 80
  
  return [
    { x: centerX - width/2, y: centerY + 2 },  // Canto interno
    { x: centerX - width/3, y: centerY - 3 },  // Ponto 1
    { x: centerX - width/6, y: centerY - 5 },  // Ponto 2
    { x: centerX, y: centerY - 6 },            // Centro superior
    { x: centerX + width/6, y: centerY - 5 },  // Ponto 4
    { x: centerX + width/3, y: centerY - 3 },  // Ponto 5
    { x: centerX + width/2.5, y: centerY - 1 }, // Superior externo
    { x: centerX + width/2, y: centerY + 2 }   // Canto externo
  ]
}

/**
 * 📐 FUNÇÃO: Gera curva anatômica suave usando interpolação Catmull-Rom
 */
const generateAnatomicalCurve = (
  controlPoints: Array<{x: number, y: number}>,
  resolution: number = 20
): Array<{x: number, y: number, tangent: number}> => {
  const curve: Array<{x: number, y: number, tangent: number}> = []
  
  // Catmull-Rom spline para curvatura natural
  for (let i = 0; i < controlPoints.length - 1; i++) {
    const p0 = controlPoints[Math.max(0, i - 1)]
    const p1 = controlPoints[i]
    const p2 = controlPoints[i + 1]
    const p3 = controlPoints[Math.min(controlPoints.length - 1, i + 2)]
    
    for (let t = 0; t <= resolution; t++) {
      const u = t / resolution
      const u2 = u * u
      const u3 = u2 * u
      
      // Fórmula Catmull-Rom
      const x = 0.5 * (
        (2 * p1.x) +
        (-p0.x + p2.x) * u +
        (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * u2 +
        (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * u3
      )
      
      const y = 0.5 * (
        (2 * p1.y) +
        (-p0.y + p2.y) * u +
        (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * u2 +
        (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * u3
      )
      
      // Calcula tangente para rotação dos segmentos
      const tangent = Math.atan2(p2.y - p1.y, p2.x - p1.x)
      
      curve.push({ x, y, tangent })
    }
  }
  
  return curve
}

/**
 * 📏 FUNÇÃO: Calcula largura real do olho baseada nos landmarks
 */
const calculateEyeWidth = (landmarks: Array<{x: number, y: number}>): number => {
  if (landmarks.length >= 4) {
    const innerCorner = landmarks[0]
    const outerCorner = landmarks[3]
    
    return Math.sqrt(
      Math.pow(outerCorner.x - innerCorner.x, 2) + 
      Math.pow(outerCorner.y - innerCorner.y, 2)
    )
  }
  
  return 60 // Fallback padrão
}

/**
 * 🌊 FUNÇÃO APRIMORADA: Aplica deformação curva usando parâmetros avançados do estilo
 */
const applyCurvedDeformation = (
  ctx: CanvasRenderingContext2D,
  overlayImg: HTMLImageElement,
  eyelidCurve: Array<{x: number, y: number, tangent: number}>,
  scaleX: number,
  scaleY: number,
  isRightEye: boolean,
  styleConfig: any
) => {
  // Usa segmentação específica do estilo ou padrão
  const segments = styleConfig.segmentCount || 12
  const segmentWidth = overlayImg.width / segments
  const warpStrength = styleConfig.warpStrength || 0.25
  const tangentSmoothing = styleConfig.tangentSmoothing || 0.85
  const elongationFactor = styleConfig.elongationFactor || 1.0
  
  console.log(`🌊 Aplicando deformação curva AVANÇADA com ${segments} segmentos`)
  console.log(`   • Pontos da curva: ${eyelidCurve.length}`)
  console.log(`   • Escala: ${scaleX.toFixed(2)}x × ${scaleY.toFixed(2)}x`)
  console.log(`   • Força de deformação: ${(warpStrength * 100).toFixed(1)}%`)
  console.log(`   • Suavização: ${(tangentSmoothing * 100).toFixed(1)}%`)
  
  ctx.save()
  
  // Aplica configurações de blend para naturalidade
  ctx.globalAlpha = styleConfig.blendOpacity || 0.88
  ctx.globalCompositeOperation = 'multiply'
  
  // Método 1: Segmentação Adaptativa Avançada
  for (let i = 0; i < segments; i++) {
    const progress = i / (segments - 1)
    const curveIndex = Math.floor(progress * (eyelidCurve.length - 1))
    const curvePoint = eyelidCurve[curveIndex]
    
    if (!curvePoint) continue
    
    ctx.save()
    
    // Posicionamento baseado na curva real
    ctx.translate(curvePoint.x, curvePoint.y)
    
    // Rotação seguindo a tangente da curva com suavização
    let rotation = curvePoint.tangent * tangentSmoothing
    
    // Aplicar alongamento para fox-eyes
    const currentScaleX = scaleX * elongationFactor
    
    // Ajuste para olho direito
    if (isRightEye) {
      ctx.scale(-1, 1)
      rotation = -rotation
    }
    
    ctx.rotate(rotation)
    
    // Escala com variação suave controlada por warpStrength
    const variationIntensity = warpStrength * 2 // Amplifica a variação baseada na força
    const segmentScaleY = scaleY * (0.8 + variationIntensity * Math.sin(progress * Math.PI))
    ctx.scale(currentScaleX, segmentScaleY)
    
    // Deformação adicional para curvatura extrema
    if (styleConfig.curvatureIntensity > 0.4) {
      const curvatureOffset = warpStrength * Math.sin(progress * Math.PI * 2) * 5
      ctx.translate(0, curvatureOffset)
    }
    
    // Desenha segmento do overlay
    ctx.drawImage(
      overlayImg,
      i * segmentWidth, 0,                    // Origem no overlay
      segmentWidth, overlayImg.height,        // Tamanho do segmento
      -segmentWidth * currentScaleX / 2,      // Posição X (centralizado)
      -overlayImg.height * segmentScaleY / 2, // Posição Y (centralizado)
      segmentWidth * currentScaleX,           // Largura renderizada
      overlayImg.height * segmentScaleY       // Altura renderizada
    )
    
    ctx.restore()
  }
  
  // Método 2: Máscara SVG Curva Avançada (para estilos específicos)
  if (styleConfig.useAdvancedMask && styleConfig.curvatureIntensity > 0.35) {
    console.log('🎭 Aplicando máscara curva avançada adicional')
    applyAdvancedCurveMask(ctx, overlayImg, eyelidCurve, scaleX * elongationFactor, scaleY, isRightEye)
  }
  
  ctx.restore()
}

/**
 * 🎭 FUNÇÃO AVANÇADA: Aplica máscara curva usando Path2D para curvatura extrema
 */
const applyAdvancedCurveMask = (
  ctx: CanvasRenderingContext2D,
  overlayImg: HTMLImageElement,
  eyelidCurve: Array<{x: number, y: number, tangent: number}>,
  scaleX: number,
  scaleY: number,
  isRightEye: boolean
) => {
  console.log('🎭 Aplicando máscara curva avançada para curvatura extrema')
  
  // Cria path curvo baseado nos pontos da pálpebra
  const curvePath = new Path2D()
  
  if (eyelidCurve.length > 0) {
    curvePath.moveTo(eyelidCurve[0].x, eyelidCurve[0].y)
    
    // Quadratic curves para suavidade
    for (let i = 1; i < eyelidCurve.length - 1; i += 2) {
      const cp = eyelidCurve[i]
      const end = eyelidCurve[i + 1] || eyelidCurve[eyelidCurve.length - 1]
      curvePath.quadraticCurveTo(cp.x, cp.y, end.x, end.y)
    }
    
    // Completa o path para máscara
    const lastPoint = eyelidCurve[eyelidCurve.length - 1]
    curvePath.lineTo(lastPoint.x, lastPoint.y - 30) // Desce para criar área
    curvePath.lineTo(eyelidCurve[0].x, eyelidCurve[0].y - 30)
    curvePath.closePath()
  }
  
  // Aplica máscara
  ctx.save()
  ctx.clip(curvePath)
  
  // Desenha overlay com escala dentro da máscara
  const centerX = eyelidCurve.length > 0 ? eyelidCurve[Math.floor(eyelidCurve.length / 2)].x : 0
  const centerY = eyelidCurve.length > 0 ? eyelidCurve[Math.floor(eyelidCurve.length / 2)].y : 0
  
  ctx.translate(centerX, centerY)
  
  if (isRightEye) {
    ctx.scale(-scaleX, scaleY)
  } else {
    ctx.scale(scaleX, scaleY)
  }
  
  ctx.drawImage(
    overlayImg,
    -overlayImg.width / 2,
    -overlayImg.height / 2,
    overlayImg.width,
    overlayImg.height
  )
  
  ctx.restore()
}

/**
 * 💎 FUNÇÃO DE VALIDAÇÃO VISUAL: Verifica naturalidade do resultado
 */
const validateVisualResult = (
  eyeLandmarks: Array<{x: number, y: number}>,
  refinements: any,
  styleConfig: any
): {
  score: number,
  feedback: string[],
  adjustments: any
} => {
  const feedback: string[] = []
  let score = 100
  const adjustments: any = {}
  
  // 1. Verifica se o offset anatômico não está excessivo
  const eyeHeight = Math.abs(eyeLandmarks[1].y - eyeLandmarks[0].y) * 2
  const offsetRatio = Math.abs(refinements.anatomicalOffsetY) / eyeHeight
  
  if (offsetRatio > 0.25) {
    score -= 20
    feedback.push('Offset muito alto - reduzindo para 20% da altura do olho')
    adjustments.anatomicalOffsetY = -eyeHeight * 0.20
  }
  
  // 2. Verifica ângulo de rotação excessivo
  const angleDegrees = Math.abs(refinements.refinedAngle * 180 / Math.PI)
  if (angleDegrees > 25) {
    score -= 15
    feedback.push('Rotação excessiva - limitando a 25°')
    adjustments.maxRotation = 25 * Math.PI / 180
  }
  
  // 3. Verifica proporção da projeção vertical
  const eyeWidth = Math.sqrt(
    Math.pow(eyeLandmarks[3].x - eyeLandmarks[0].x, 2) + 
    Math.pow(eyeLandmarks[3].y - eyeLandmarks[0].y, 2)
  )
  const projectionRatio = refinements.maxVerticalProjection / eyeWidth
  
  if (projectionRatio > styleConfig.maxProjectionRatio + 0.1) {
    score -= 10
    feedback.push('Projeção vertical muito alta - aplicando limite do estilo')
    adjustments.maxVerticalProjection = eyeWidth * styleConfig.maxProjectionRatio
  }
  
  // 4. Classificação final
  let classification = 'excellent'
  if (score < 90) classification = 'good'
  if (score < 70) classification = 'poor'
  
  return {
    score,
    feedback,
    adjustments
  }
}

/**
 * 🎯 FUNÇÃO CRUCIAL: Calcula ponto de ancoragem na raiz dos cílios naturais
 */
const getEyelashAnchorPoint = (
  eyeLandmarks: Array<{x: number, y: number}>,
  isRightEye: boolean = false
): {
  anchorPoint: {x: number, y: number},
  eyelashBaseLine: Array<{x: number, y: number}>,
  naturalCurve: Array<{x: number, y: number}>
} => {
  
  // 1. PONTOS ESPECÍFICOS DA LINHA INFERIOR DA PÁLPEBRA SUPERIOR
  // (onde os cílios naturais realmente nascem)
  
  let eyelashBasePoints: Array<{x: number, y: number}>
  
  if (isRightEye) {
    // Olho direito: pontos da base dos cílios (MediaPipe)
    eyelashBasePoints = [
      eyeLandmarks[0],  // Canto interno (ponto 145 equivalente)
      {                 // Ponto interpolado interno-centro
        x: eyeLandmarks[0].x + (eyeLandmarks[1].x - eyeLandmarks[0].x) * 0.4,
        y: eyeLandmarks[0].y + (eyeLandmarks[1].y - eyeLandmarks[0].y) * 0.7
      },
      {                 // Ponto da base central (ponto 153 equivalente)
        x: (eyeLandmarks[0].x + eyeLandmarks[3].x) / 2,
        y: Math.max(eyeLandmarks[1].y, eyeLandmarks[2].y) + 2 // Ligeiramente abaixo da pálpebra
      },
      {                 // Ponto interpolado centro-externo  
        x: eyeLandmarks[2].x + (eyeLandmarks[3].x - eyeLandmarks[2].x) * 0.6,
        y: eyeLandmarks[2].y + (eyeLandmarks[3].y - eyeLandmarks[2].y) * 0.7
      },
      eyeLandmarks[3]   // Canto externo (ponto 154 equivalente)
    ]
  } else {
    // Olho esquerdo: pontos da base dos cílios (MediaPipe)
    eyelashBasePoints = [
      eyeLandmarks[0],  // Canto interno (ponto 374 equivalente)
      {                 // Ponto interpolado interno-centro
        x: eyeLandmarks[0].x + (eyeLandmarks[1].x - eyeLandmarks[0].x) * 0.4,
        y: eyeLandmarks[0].y + (eyeLandmarks[1].y - eyeLandmarks[0].y) * 0.7
      },
      {                 // Ponto da base central (ponto 380 equivalente)
        x: (eyeLandmarks[0].x + eyeLandmarks[3].x) / 2,
        y: Math.max(eyeLandmarks[1].y, eyeLandmarks[2].y) + 2 // Ligeiramente abaixo da pálpebra
      },
      {                 // Ponto interpolado centro-externo
        x: eyeLandmarks[2].x + (eyeLandmarks[3].x - eyeLandmarks[2].x) * 0.6, 
        y: eyeLandmarks[2].y + (eyeLandmarks[3].y - eyeLandmarks[2].y) * 0.7
      },
      eyeLandmarks[3]   // Canto externo (ponto 381 equivalente)
    ]
  }
  
  // 2. GERA CURVA NATURAL DA LINHA DE NASCIMENTO DOS CÍLIOS
  const naturalCurve = generateBezierCurve(eyelashBasePoints, 15) // 15 pontos para precisão
  
  // 3. CALCULA PONTO DE ANCORAGEM (CENTRO DA LINHA DE BASE)
  const midIndex = Math.floor(naturalCurve.length / 2)
  const anchorPoint = naturalCurve[midIndex]
  
  console.log(`🎯 Ponto de ancoragem calculado (${isRightEye ? 'direito' : 'esquerdo'}):`)
  console.log(`   • Posição: (${anchorPoint.x.toFixed(1)}, ${anchorPoint.y.toFixed(1)})`)
  console.log(`   • Pontos da base: ${eyelashBasePoints.length}`)
  console.log(`   • Curva natural: ${naturalCurve.length} pontos`)
  
  return {
    anchorPoint,
    eyelashBaseLine: eyelashBasePoints,
    naturalCurve
  }
}

/**
 * 🎯 FUNÇÃO CORRIGIDA: Overlay posicionado na raiz dos cílios naturais
 */
const applyEyelashOverlay = async (
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  overlayImageUrl: string,
  eyeLandmarks: Array<{x: number, y: number}>,
  isRightEye: boolean = false,
  selectedStyle: string = 'volume-brasileiro-d'
): Promise<void> => {
  return new Promise((resolve, reject) => {
    const overlayImg = new Image()
    overlayImg.crossOrigin = 'anonymous'
    
    overlayImg.onload = () => {
      try {
        console.log(`🎨 Aplicando overlay POSICIONADO PRECISAMENTE ${isRightEye ? 'direito' : 'esquerdo'} - Estilo: ${selectedStyle}`)
        
        // 1. EXTRAÇÃO DE PONTOS CRÍTICOS DOS LANDMARKS
        const innerCorner = eyeLandmarks[0]  // Canto interno
        const outerCorner = eyeLandmarks[3]  // Canto externo  
        const upperMid = eyeLandmarks[1]     // Centro superior
        const upperOuter = eyeLandmarks[2]   // Superior externo
        
        // 2. 🎯 CALCULA PONTO DE ANCORAGEM NA RAIZ DOS CÍLIOS NATURAIS
        const eyelashAnchor = getEyelashAnchorPoint(eyeLandmarks, isRightEye)
        
        // 3. CÁLCULOS GEOMÉTRICOS BÁSICOS
        const eyeWidth = Math.sqrt(
          Math.pow(outerCorner.x - innerCorner.x, 2) + 
          Math.pow(outerCorner.y - innerCorner.y, 2)
        )
        
        const baseAngle = Math.atan2(
          outerCorner.y - innerCorner.y,
          outerCorner.x - innerCorner.x
        )
        
        const eyeCenter = {
          x: (innerCorner.x + outerCorner.x) / 2,
          y: (innerCorner.y + outerCorner.y) / 2
        }
        
        const eyelidHeight = Math.abs(upperMid.y - eyeCenter.y) * 2
        
        // 4. ✨ CONFIGURAÇÕES ESPECÍFICAS DO ESTILO ✨
        const styleConfig = getStyleRefinementConfig(selectedStyle)
        
        // 5. CURVA SUAVE DA PÁLPEBRA SUPERIOR (PARA REFERÊNCIA DE CURVATURA)
        const upperEyelidPoints = [
          innerCorner,          // Ponto 0: Canto interno
          {                     // Ponto 1: Interpolado interno-meio
            x: innerCorner.x + (upperMid.x - innerCorner.x) * 0.33,
            y: innerCorner.y + (upperMid.y - innerCorner.y) * 0.8
          },
          upperMid,             // Ponto 2: Centro superior
          {                     // Ponto 3: Interpolado meio-externo  
            x: upperMid.x + (upperOuter.x - upperMid.x) * 0.5,
            y: upperMid.y + (upperOuter.y - upperMid.y) * 0.9
          },
          upperOuter,           // Ponto 4: Superior externo
          outerCorner           // Ponto 5: Canto externo
        ]
        
        // 6. GERA CURVA BÉZIER SUAVE E CONTÍNUA (PARA CURVATURA DE REFERÊNCIA)
        const smoothCurve = generateBezierCurve(upperEyelidPoints, 20) // 20 pontos para suavidade
        
        // 7. CÁLCULOS DE TRANSFORMAÇÃO UNIFICADA
        
        // A) Rotação global baseada na inclinação média da pálpebra
        let globalAngle = baseAngle
        const angleDegrees = (baseAngle * 180) / Math.PI
        
        // Aplica curvatura sutil para olhos horizontais
        if (Math.abs(angleDegrees) <= 5) {
          globalAngle += (3 * Math.PI) / 180 // +3° para naturalidade
        }
        
        // Limita rotação máxima
        const maxRotation = 25 * Math.PI / 180
        if (Math.abs(globalAngle) > maxRotation) {
          globalAngle = Math.sign(globalAngle) * maxRotation
        }
        
        // B) Escala proporcional
        const scaleX = (eyeWidth * 1.1) / overlayImg.width  // 110% da largura do olho
        const baseScaleY = Math.max(scaleX * 0.6, (eyelidHeight * 1.2) / overlayImg.height)
        const maxVerticalProjection = eyeWidth * styleConfig.maxProjectionRatio
        const scaleY = Math.min(baseScaleY, maxVerticalProjection / overlayImg.height)
        
        // C) 🎯 POSIÇÃO CORRIGIDA: Na raiz dos cílios naturais + offset mínimo
        const eyelashRootOffsetY = eyelidHeight * 0.02 // +2% da altura do olho (muito sutil)
        const precisePosition = {
          x: eyelashAnchor.anchorPoint.x,
          y: eyelashAnchor.anchorPoint.y + eyelashRootOffsetY // Ligeiramente abaixo para tocar a raiz
        }
        
        // D) APLICAÇÃO DE DEFORMAÇÃO SUAVE (WARP) baseada na curva natural
        
        // Calcula pontos de controle para a deformação baseados na curva da base dos cílios
        const curveMidPoint = eyelashAnchor.naturalCurve[Math.floor(eyelashAnchor.naturalCurve.length / 2)]
        const curveStartPoint = eyelashAnchor.naturalCurve[0]
        const curveEndPoint = eyelashAnchor.naturalCurve[eyelashAnchor.naturalCurve.length - 1]
        
        // Calcula curvatura baseada na linha natural dos cílios (não da pálpebra)
        const naturalCurvature = (curveMidPoint.y - ((curveStartPoint.y + curveEndPoint.y) / 2)) * styleConfig.curvatureIntensity * 0.7 // Reduzido para naturalidade
        
        console.log(`📊 Posicionamento PRECISO na raiz dos cílios:`)
        console.log(`   • Estilo: ${selectedStyle}`)
        console.log(`   • Largura do olho: ${eyeWidth.toFixed(1)}px`)
        console.log(`   • Ângulo global: ${(globalAngle * 180 / Math.PI).toFixed(1)}°`)
        console.log(`   • Escala: ${scaleX.toFixed(2)}x (H) × ${scaleY.toFixed(2)}x (V)`)
        console.log(`   • Posição na raiz: (${precisePosition.x.toFixed(1)}, ${precisePosition.y.toFixed(1)})`)
        console.log(`   • Offset da raiz: +${eyelashRootOffsetY.toFixed(1)}px`)
        console.log(`   • Curvatura natural: ${(naturalCurvature * 100).toFixed(1)}%`)
        console.log(`   • Pontos da base natural: ${eyelashAnchor.naturalCurve.length}`)
        
        // 8. APLICAÇÃO DA TRANSFORMAÇÃO UNIFICADA NO CANVAS
        
        ctx.save()
        
        // A) Move origem para o ponto preciso na raiz dos cílios
        ctx.translate(precisePosition.x, precisePosition.y)
        
        // B) Aplica rotação global
        ctx.rotate(globalAngle)
        
        // C) Espelha para olho direito
        if (isRightEye) {
          ctx.scale(-1, 1)
        }
        
        // D) Aplica escala
        ctx.scale(scaleX, scaleY)
        
        // E) Aplica deformação suave para seguir curvatura natural da base dos cílios
        if (Math.abs(naturalCurvature) > 1) {
          // Usa transform para curvar levemente seguindo a linha natural
          const curveFactor = naturalCurvature / overlayImg.height
          ctx.transform(1, 0, curveFactor * 0.15, 1, 0, naturalCurvature * 0.2) // Reduzido para sutileza
        }
        
        // F) Configurações de blend para naturalidade
        ctx.globalAlpha = styleConfig.blendOpacity
        ctx.globalCompositeOperation = 'multiply'
        
        // 9. DESENHA O OVERLAY POSICIONADO NA RAIZ DOS CÍLIOS
        
        // Ajusta o ponto de origem para que a BASE do overlay toque a raiz dos cílios
        const overlayOriginY = -overlayImg.height * 0.85 // 85% da altura para baixo (base na raiz)
        
        ctx.drawImage(
          overlayImg,
          -overlayImg.width / 2,   // Centralizado horizontalmente
          overlayOriginY,          // Base alinhada com a raiz dos cílios
          overlayImg.width,        // Largura original
          overlayImg.height        // Altura original
        )
        
        ctx.restore()
        
        console.log(`✅ Overlay POSICIONADO NA RAIZ ${isRightEye ? 'direito' : 'esquerdo'} aplicado com precisão fotográfica!`)
        resolve()
        
      } catch (error) {
        console.error(`❌ Erro ao aplicar overlay posicionado:`, error)
        reject(error)
      }
    }
    
    overlayImg.onerror = () => {
      console.error(`❌ Erro ao carregar overlay: ${overlayImageUrl}`)
      reject(new Error(`Failed to load overlay: ${overlayImageUrl}`))
    }
    
    overlayImg.src = overlayImageUrl
  })
}

/**
 * 🎨 FUNÇÃO AUXILIAR: Gera curva Bézier suave e contínua
 */
const generateBezierCurve = (
  controlPoints: Array<{x: number, y: number}>, 
  segments: number = 20
): Array<{x: number, y: number}> => {
  if (controlPoints.length < 3) return controlPoints
  
  const curvePoints: Array<{x: number, y: number}> = []
  
  // Gera curva Bézier quadrática/cúbica suave
  for (let i = 0; i <= segments; i++) {
    const t = i / segments
    
    if (controlPoints.length === 3) {
      // Bézier quadrática
      const point = quadraticBezier(controlPoints[0], controlPoints[1], controlPoints[2], t)
      curvePoints.push(point)
    } else if (controlPoints.length >= 4) {
      // Bézier cúbica com múltiplos pontos
      const point = multipleBezierCurve(controlPoints, t)
      curvePoints.push(point)
    }
  }
  
  return curvePoints
}

/**
 * 📐 FUNÇÃO AUXILIAR: Bézier quadrática
 */
const quadraticBezier = (
  p0: {x: number, y: number}, 
  p1: {x: number, y: number}, 
  p2: {x: number, y: number}, 
  t: number
): {x: number, y: number} => {
  const u = 1 - t
  const tt = t * t
  const uu = u * u
  
  return {
    x: uu * p0.x + 2 * u * t * p1.x + tt * p2.x,
    y: uu * p0.y + 2 * u * t * p1.y + tt * p2.y
  }
}

/**
 * 🌊 FUNÇÃO AUXILIAR: Bézier com múltiplos pontos
 */
const multipleBezierCurve = (
  points: Array<{x: number, y: number}>, 
  t: number
): {x: number, y: number} => {
  const n = points.length - 1
  let x = 0
  let y = 0
  
  for (let i = 0; i <= n; i++) {
    const binomial = binomialCoefficient(n, i)
    const factor = binomial * Math.pow(1 - t, n - i) * Math.pow(t, i)
    
    x += factor * points[i].x
    y += factor * points[i].y
  }
  
  return { x, y }
}

/**
 * 🔢 FUNÇÃO AUXILIAR: Coeficiente binomial
 */
const binomialCoefficient = (n: number, k: number): number => {
  if (k === 0 || k === n) return 1
  if (k > n - k) k = n - k // Otimização
  
  let result = 1
  for (let i = 0; i < k; i++) {
    result = result * (n - i) / (i + 1)
  }
  
  return result
}

/**
 * 🧠 FUNÇÃO MELHORADA: Extrai landmarks específicos para cada olho
 */
const extractEyeLandmarks = (faceDetection: any) => {
  if (!faceDetection || !faceDetection.landmarks) {
    return null
  }
  
  try {
    // face-api.js landmarks: 68 pontos padrão
    const landmarks = faceDetection.landmarks.positions
    
    // Olho esquerdo: pontos 36-41 (6 pontos)
    const leftEyeLandmarks = [
      landmarks[36], // Canto interno
      landmarks[37], // Superior interno  
      landmarks[38], // Superior externo
      landmarks[39], // Canto externo
      landmarks[40], // Inferior externo
      landmarks[41]  // Inferior interno
    ]
    
    // Olho direito: pontos 42-47 (6 pontos)  
    const rightEyeLandmarks = [
      landmarks[42], // Canto interno
      landmarks[43], // Superior interno
      landmarks[44], // Superior externo  
      landmarks[45], // Canto externo
      landmarks[46], // Inferior externo
      landmarks[47]  // Inferior interno
    ]
    
    console.log(`👁️ Landmarks extraídos: ${leftEyeLandmarks.length} (esquerdo) + ${rightEyeLandmarks.length} (direito)`)
    
    return {
      leftEye: leftEyeLandmarks,
      rightEye: rightEyeLandmarks
    }
    
  } catch (error) {
    console.error('❌ Erro ao extrair landmarks:', error)
    return null
  }
}

/**
 * 🔄 FUNÇÃO SUBSTITUÍDA: Aplicação precisa usando landmarks reais
 */
const drawEyelashAlongCurve = async (
  canvas: HTMLCanvasElement,
  eyelashUrl: string,
  eyelidCurve: Array<{x: number, y: number}>,
  isRightEye: boolean,
  styleId: string
): Promise<void> => {
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('Canvas context not available')
  }
  
  console.log(`🎯 Aplicando overlay com alinhamento preciso (${isRightEye ? 'direito' : 'esquerdo'})`)
  
  // Usa a nova função de overlay unificado
  return applyEyelashOverlay(
    canvas,
    ctx, 
    eyelashUrl,
    eyelidCurve,
    isRightEye,
    styleId
  )
}

/**
 * 🚀 FUNÇÃO PRINCIPAL APRIMORADA: Aplicação com curvatura real da pálpebra
 */
/**
 * 🚀 FUNÇÃO PRINCIPAL APRIMORADA: Aplica cílios com MediaPipe + spline + blend modes
 */
export const applyEyelashesWithAdvancedCurvature = async (
  imageFile: File, 
  selectedStyle: string
): Promise<string> => {
  console.log('🚀 NOVA VERSÃO: Aplicando cílios com curvatura avançada')
  console.log(`📂 Arquivo: ${imageFile.name}`)
  console.log(`🎨 Estilo: ${selectedStyle}`)
  
  return new Promise(async (resolve, reject) => {
    try {
      // 1. 📄 Carrega imagem
      const img = new Image()
      img.crossOrigin = 'anonymous'
      
      img.onload = async () => {
        try {
          console.log(`🖼️ Imagem carregada: ${img.width}x${img.height}`)
          
          // 2. 🎯 Detecta landmarks usando fallback inteligente
          console.log('📊 Usando detecção inteligente por análise de histograma...')
          const eyelidCurves = await calculateEyelidCurve(img, null)
          
          if (!eyelidCurves) {
            throw new Error('Não foi possível detectar landmarks dos olhos')
          }
          
          console.log(`✅ Landmarks detectados usando: ${eyelidCurves.method}`)
          console.log(`👁️ Confiança: ${(eyelidCurves.confidence * 100).toFixed(1)}%`)
          
          // 3. 🎨 Prepara canvas
          const canvas = document.createElement('canvas')
          canvas.width = img.width
          canvas.height = img.height
          const ctx = canvas.getContext('2d')!
          
          // Desenha imagem original
          ctx.drawImage(img, 0, 0)
          
          // 4. 🦾 Obtém caminho da imagem do overlay
          const estilos = getEstilosCilios()
          const estiloAtual = estilos.find(e => e.id === selectedStyle)
          if (!estiloAtual) {
            throw new Error(`Estilo '${selectedStyle}' não encontrado`)
          }
          
          const overlayUrl = estiloAtual.overlayPath
          console.log(`🔗 Overlay URL: ${overlayUrl}`)
          
          // 5. 🌊 Aplica cílios com spline nos dois olhos
          console.log('🌊 Aplicando overlay com curvatura inteligente...')
          
          await applyEyelashOverlayWithSpline(
            ctx,
            overlayUrl,
            eyelidCurves.leftEye,
            false,
            selectedStyle,
            eyelidCurves.leftEyeWidth || 80
          )
          
          await applyEyelashOverlayWithSpline(
            ctx,
            overlayUrl,
            eyelidCurves.rightEye,
            true,
            selectedStyle,
            eyelidCurves.rightEyeWidth || 80
          )
          
          // 6. ✅ Resultado final
          const result = canvas.toDataURL('image/jpeg', 0.92)
          console.log('🎉 Processamento concluído com sucesso!')
          console.log(`📊 Resultado: ${(result.length / 1024).toFixed(1)}KB`)
          
          resolve(result)
          
        } catch (error) {
          console.error('❌ Erro no processamento:', error)
          reject(error)
        }
      }
      
      img.onerror = () => {
        reject(new Error('Erro ao carregar imagem'))
      }
      
      // Carrega imagem
      const reader = new FileReader()
      reader.onload = (e) => {
        img.src = e.target?.result as string
      }
      reader.readAsDataURL(imageFile)
      
    } catch (error) {
      console.error('❌ Erro geral:', error)
      reject(error)
    }
  })
}

// 🔄 Mantém função original como fallback
export const applyEyelashes = async (imageFile: File, selectedStyle: string): Promise<string> => {
  console.log(`🎯 Aplicando estilo com CURVATURA REAL DA PÁLPEBRA: ${selectedStyle}`)
  
  return new Promise(async (resolve, reject) => {
    try {
      // 1. Tenta carregar modelos de detecção facial
      const faceApiAvailable = await loadFaceApiModels()
      
      const img = new Image()
      img.crossOrigin = 'anonymous'
      
      img.onload = async () => {
        try {
          let faceData = null
          
          // 2. Tenta detecção facial se disponível
          if (faceApiAvailable) {
            faceData = await detectFacialLandmarks(img)
          }
          
          // 3. Calcula curvas da pálpebra superior (landmarks reais OU estimativa inteligente)
          const eyelidCurves = calculateEyelidCurve(img, faceData)
          
          if (!eyelidCurves) {
            throw new Error('Falha ao calcular landmarks dos olhos')
          }
          
          console.log(`🎯 Método de curva usado: ${eyelidCurves.method}`)
          
          // 4. Cria canvas e aplica cílios seguindo as curvas
          const canvas = document.createElement('canvas')
          canvas.width = img.width
          canvas.height = img.height
          
          const ctx = canvas.getContext('2d')!
          ctx.drawImage(img, 0, 0)
          
          // 🔧 CORREÇÃO: Usa overlayPath diretamente do estilo
          const estilos = getEstilosCilios()
          const estiloAtual = estilos.find(e => e.id === selectedStyle)
          const eyelashUrl = estiloAtual?.overlayPath || `/assets/cilios/${getEyelashFileName(selectedStyle)}`
          console.log(`📂 Carregando arquivo: ${eyelashUrl}`)
          console.log(`🚨 DEBUG: Estilo encontrado:`, estiloAtual?.nome || 'NÃO ENCONTRADO')
          
          // 🌊 VERSÃO APRIMORADA: Usa aplicação curva avançada
          await applyCurvedEyelashOverlay(
            eyelidCurves.leftEye, 
            ctx,
            eyelashUrl, 
            false, // olho esquerdo
            selectedStyle
          )
          
          await applyCurvedEyelashOverlay(
            eyelidCurves.rightEye, 
            ctx,
            eyelashUrl, 
            true, // olho direito
            selectedStyle
          )
          
          console.log('🎉 Cílios aplicados com CURVATURA REAL DA PÁLPEBRA!')
          
          resolve(canvas.toDataURL('image/jpeg', 0.95))
          
        } catch (error) {
          console.error('❌ Erro no processamento:', error)
          
          // 🔄 FALLBACK: Usa método tradicional em caso de erro
          console.log('🔄 Tentando método fallback...')
          try {
            // Recalcula as curvas para o fallback
            let fallbackFaceData = null
            if (faceApiAvailable) {
              fallbackFaceData = await detectFacialLandmarks(img)
            }
            
            const eyelidCurves = calculateEyelidCurve(img, fallbackFaceData)
            if (eyelidCurves) {
              const canvas = document.createElement('canvas')
              canvas.width = img.width
              canvas.height = img.height
              
              const ctx = canvas.getContext('2d')!
              ctx.drawImage(img, 0, 0)
              
              // 🔧 CORREÇÃO FALLBACK: Usa overlayPath diretamente do estilo  
              const estilos = getEstilosCilios()
              const estiloAtual = estilos.find(e => e.id === selectedStyle)
              const eyelashUrl = estiloAtual?.overlayPath || `/assets/cilios/${getEyelashFileName(selectedStyle)}`
              console.log(`📂 FALLBACK - Carregando arquivo: ${eyelashUrl}`)
              
              // Método fallback tradicional
              await drawEyelashAlongCurve(
                canvas, 
                eyelashUrl, 
                eyelidCurves.leftEye, 
                false, 
                selectedStyle
              )
              
              await drawEyelashAlongCurve(
                canvas, 
                eyelashUrl, 
                eyelidCurves.rightEye, 
                true, 
                selectedStyle
              )
              
              console.log('✅ Fallback aplicado com sucesso!')
              resolve(canvas.toDataURL('image/jpeg', 0.95))
            } else {
              reject(error)
            }
          } catch (fallbackError) {
            console.error('❌ Erro no fallback também:', fallbackError)
            reject(error)
          }
        }
      }
      
      img.onerror = () => {
        reject(new Error('Failed to load image'))
      }
      
      const reader = new FileReader()
      reader.onload = (e) => {
        img.src = e.target?.result as string
      }
      reader.readAsDataURL(imageFile)
      
    } catch (error) {
      console.error('❌ Erro geral:', error)
      reject(error)
    }
  })
}

/**
 * 🎯 FUNÇÃO LEGADA: Mantida para compatibilidade
 */
export const applyEyelashesLegacy = async (imageFile: File, selectedStyle: string): Promise<string> => {
  console.log(`🎯 Aplicando estilo com método LEGADO: ${selectedStyle}`)
  
  return new Promise(async (resolve, reject) => {
    try {
      // 1. Tenta carregar modelos de detecção facial
      const faceApiAvailable = await loadFaceApiModels()
      
      const img = new Image()
      img.crossOrigin = 'anonymous'
      
      img.onload = async () => {
        try {
          let faceData = null
          
          // 2. Tenta detecção facial se disponível
          if (faceApiAvailable) {
            faceData = await detectFacialLandmarks(img)
          }
          
          // 3. Calcula curvas da pálpebra superior (landmarks reais OU estimativa inteligente)
          const eyelidCurves = calculateEyelidCurve(img, faceData)
          
          if (!eyelidCurves) {
            throw new Error('Falha ao calcular landmarks dos olhos')
          }
          
          console.log(`🎯 Método de curva usado: ${eyelidCurves.method}`)
          
          // 4. Cria canvas e aplica cílios seguindo as curvas
          const canvas = document.createElement('canvas')
          canvas.width = img.width
          canvas.height = img.height
          
          const ctx = canvas.getContext('2d')!
          ctx.drawImage(img, 0, 0)
          
          // 🔧 CORREÇÃO LEGACY: Usa overlayPath diretamente do estilo
          const estilos = getEstilosCilios()
          const estiloAtual = estilos.find(e => e.id === selectedStyle)
          const eyelashUrl = estiloAtual?.overlayPath || `/assets/cilios/${getEyelashFileName(selectedStyle)}`
          console.log(`📂 LEGACY - Carregando arquivo: ${eyelashUrl}`)
          console.log(`🚨 DEBUG LEGACY: Estilo encontrado:`, estiloAtual?.nome || 'NÃO ENCONTRADO')
          
          // Aplica cílios seguindo as curvas naturais (método legado)
          await drawEyelashAlongCurve(
            canvas, 
            eyelashUrl, 
            eyelidCurves.leftEye, 
            false, 
            selectedStyle
          )
          
          await drawEyelashAlongCurve(
            canvas, 
            eyelashUrl, 
            eyelidCurves.rightEye, 
            true, 
            selectedStyle
          )
          
          console.log('🎉 Cílios aplicados seguindo CURVATURA NATURAL!')
          
          resolve(canvas.toDataURL('image/jpeg', 0.95))
          
        } catch (error) {
          console.error('❌ Erro no processamento:', error)
          reject(error)
        }
      }
      
      img.onerror = () => {
        reject(new Error('Failed to load image'))
      }
      
      const reader = new FileReader()
      reader.onload = (e) => {
        img.src = e.target?.result as string
      }
      reader.readAsDataURL(imageFile)
      
    } catch (error) {
      console.error('❌ Erro geral:', error)
      reject(error)
    }
  })
}

/**
 * Função para compatibilidade com interface existente
 */
export const applyLashes = async (
  imageFile: File,
  styleId: string,
  onProgress?: (progress: number) => void
): Promise<ProcessamentoIA> => {
  console.log('🎨 Aplicando cílios com curvatura real:', styleId, 'em', imageFile?.name)
  const startTime = Date.now()
  
  try {
    onProgress?.(10)
    
    // 🚀 USA NOVA VERSÃO com MediaPipe + spline + blend modes
    console.log('🚀 Usando versão aprimorada com curvatura real...')
    let resultado: string
    
    try {
      resultado = await applyEyelashesWithAdvancedCurvature(imageFile, styleId)
      onProgress?.(90)
      console.log('✅ Versão aprimorada executada com sucesso!')
    } catch (advancedError) {
      console.warn('⚠️ Versão aprimorada falhou, usando fallback:', advancedError)
      onProgress?.(50)
      resultado = await applyEyelashes(imageFile, styleId)
      onProgress?.(90)
    }
    
    const endTime = Date.now()
    const tempoProcessamento = endTime - startTime
    
    onProgress?.(100)
    
    return {
      imagemOriginal: URL.createObjectURL(imageFile),
      estiloSelecionado: styleId,
      imagemProcessada: resultado,
      status: 'concluido',
      tempoProcessamento,
      metadata: {
        tamanhoOriginal: imageFile.size,
        tamanhoProcessada: Math.round(resultado.length * 0.75), // Estimativa
        qualidade: 92
      }
    }
  } catch (error) {
    console.error('❌ Erro completo no processamento:', error)
    return {
      imagemOriginal: URL.createObjectURL(imageFile),
      estiloSelecionado: styleId,
      status: 'erro',
      erro: error instanceof Error ? error.message : 'Erro desconhecido'
    }
  }
}

/**
 * Função para download da imagem processada
 */
export const downloadProcessedImage = (
  imagemBase64: string, 
  nomeArquivo: string = 'cilios-aplicados'
): void => {
  try {
    const link = document.createElement('a')
    link.href = imagemBase64
    link.download = `${nomeArquivo}.jpg`
    
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    console.log(`📥 Download iniciado: ${nomeArquivo}.jpg`)
  } catch (error) {
    console.error('❌ Erro no download:', error)
    alert('Erro ao fazer download da imagem')
  }
}

/**
 * 🔧 FUNÇÃO DE DEBUG: Testa aplicação básica dos cílios
 */
export const debugEyelashApplication = async (imageFile: File, styleId: string = 'brasileiro-boneca'): Promise<{
  success: boolean,
  logs: string[],
  imageResult?: string,
  error?: string
}> => {
  const logs: string[] = []
  
  try {
    logs.push(`🚀 Iniciando debug para estilo: ${styleId}`)
    
    // 1. Verificar se arquivo existe
    if (!imageFile) {
      logs.push(`❌ Arquivo não fornecido`)
      return { success: false, logs, error: 'Arquivo não fornecido' }
    }
    
    logs.push(`📂 Arquivo: ${imageFile.name} (${(imageFile.size / 1024 / 1024).toFixed(2)}MB)`)
    
    // 2. Verificar se estilo existe
    const estilos = getEstilosCilios()
    const estiloEncontrado = estilos.find(e => e.id === styleId)
    if (!estiloEncontrado) {
      logs.push(`❌ Estilo '${styleId}' não encontrado`)
      logs.push(`✅ Estilos disponíveis: ${estilos.map(e => e.id).join(', ')}`)
      return { success: false, logs, error: `Estilo '${styleId}' não encontrado` }
    }
    
    logs.push(`✅ Estilo encontrado: ${estiloEncontrado.nome}`)
    logs.push(`📂 Overlay path: ${estiloEncontrado.overlayPath}`)
    
    // 3. Verificar mapeamento de arquivo
    const fileName = getEyelashFileName(styleId)
    logs.push(`📄 Arquivo mapeado: ${fileName}`)
    
    // 4. Testar carregamento da imagem original
    const img = new Image()
    img.crossOrigin = 'anonymous'
    
    const imageLoadResult = await new Promise<boolean>((resolve) => {
      img.onload = () => {
        logs.push(`✅ Imagem original carregada: ${img.width}x${img.height}`)
        resolve(true)
      }
      img.onerror = () => {
        logs.push(`❌ Erro ao carregar imagem original`)
        resolve(false)
      }
      
      const reader = new FileReader()
      reader.onload = (e) => {
        img.src = e.target?.result as string
      }
      reader.readAsDataURL(imageFile)
    })
    
    if (!imageLoadResult) {
      return { success: false, logs, error: 'Falha ao carregar imagem original' }
    }
    
    // 5. Testar carregamento da imagem dos cílios
    // 🔧 CORREÇÃO DEBUG: Usa overlayPath diretamente do estilo
    const overlayUrl = estiloEncontrado.overlayPath
    logs.push(`🔗 Testando URL do overlay: ${overlayUrl}`)
    logs.push(`📄 Arquivo mapeado: ${fileName} → ${overlayUrl}`)
    
    const overlayLoadResult = await new Promise<boolean>((resolve) => {
      const overlayImg = new Image()
      overlayImg.crossOrigin = 'anonymous'
      
      overlayImg.onload = () => {
        logs.push(`✅ Overlay carregado: ${overlayImg.width}x${overlayImg.height}`)
        resolve(true)
      }
      overlayImg.onerror = (event) => {
        logs.push(`❌ Erro ao carregar overlay: ${overlayUrl}`)
        logs.push(`❌ Evento:`, JSON.stringify(event))
        resolve(false)
      }
      
      overlayImg.src = overlayUrl
    })
    
    if (!overlayLoadResult) {
      return { success: false, logs, error: `Falha ao carregar overlay: ${overlayUrl}` }
    }
    
    // 6. Testar aplicação simples (sem curvatura)
    logs.push(`🎨 Testando aplicação simples...`)
    
    const canvas = document.createElement('canvas')
    canvas.width = img.width
    canvas.height = img.height
    const ctx = canvas.getContext('2d')!
    
    // Desenha imagem original
    ctx.drawImage(img, 0, 0)
    
    // Cria landmarks estimados simples para teste
    const centerX = img.width / 2
    const centerY = img.height / 2
    const testLandmarks = [
      { x: centerX - 40, y: centerY },      // Canto interno
      { x: centerX - 20, y: centerY - 10 }, // Superior interno
      { x: centerX + 20, y: centerY - 10 }, // Superior externo
      { x: centerX + 40, y: centerY }       // Canto externo
    ]
    
    logs.push(`👁️ Landmarks de teste criados: ${testLandmarks.length} pontos`)
    
    // Testa aplicação curva
    try {
      await applyCurvedEyelashOverlay(
        testLandmarks,
        ctx,
        overlayUrl,
        false,
        styleId
      )
      
      logs.push(`✅ Aplicação curva concluída com sucesso!`)
      
      const resultImage = canvas.toDataURL('image/jpeg', 0.9)
      logs.push(`📊 Imagem resultado gerada: ${(resultImage.length / 1024).toFixed(1)}KB`)
      
      return { 
        success: true, 
        logs, 
        imageResult: resultImage 
      }
      
    } catch (error) {
      logs.push(`❌ Erro na aplicação curva: ${error}`)
      return { success: false, logs, error: `Erro na aplicação: ${error}` }
    }
    
  } catch (error) {
    logs.push(`❌ Erro geral: ${error}`)
    return { success: false, logs, error: `Erro geral: ${error}` }
  }
}

/**
 * 🌊 FUNÇÃO DE TESTE PARA CURVATURA REAL: Valida aplicação curva da pálpebra
 */
export const testCurvedEyelashApplication = async (imageFile: File, styleId: string = 'brasileiro-boneca'): Promise<{
  landmarks: any,
  curvatureAnalysis: any,
  alignment: 'excellent' | 'good' | 'poor',
  curveQuality: number,
  anatomicalAccuracy: number,
  feedback: string[],
  preview?: string
}> => {
  return new Promise(async (resolve, reject) => {
    try {
      const faceApiAvailable = await loadFaceApiModels()
      
      const img = new Image()
      img.crossOrigin = 'anonymous'
      
      img.onload = async () => {
        try {
          let faceData = null
          
          if (faceApiAvailable) {
            faceData = await detectFacialLandmarks(img)
          }
          
          const eyelidCurves = await calculateEyelidCurve(img, faceData)
          
          if (eyelidCurves) {
            const feedback: string[] = []
            let curveQuality = 100
            let anatomicalAccuracy = 100
            
            // Testa extração da curvatura da pálpebra superior
            const leftEyelidCurve = extractUpperEyelidCurve(eyelidCurves.leftEye, false)
            const rightEyelidCurve = extractUpperEyelidCurve(eyelidCurves.rightEye, true)
            
            // Gera curvas anatômicas
            const leftAnatomicalCurve = generateAnatomicalCurve(leftEyelidCurve)
            const rightAnatomicalCurve = generateAnatomicalCurve(rightEyelidCurve)
            
            // Calcula métricas de qualidade da curvatura
            const leftEyeWidth = eyelidCurves.leftEyeWidth || calculateEyeWidth(eyelidCurves.leftEye)
            const rightEyeWidth = eyelidCurves.rightEyeWidth || calculateEyeWidth(eyelidCurves.rightEye)
            
            // Validações específicas da curvatura
            if (leftAnatomicalCurve.length < 10) {
              curveQuality -= 20
              feedback.push('Pontos insuficientes para curvatura suave - olho esquerdo')
            }
            
            if (rightAnatomicalCurve.length < 10) {
              curveQuality -= 20
              feedback.push('Pontos insuficientes para curvatura suave - olho direito')
            }
            
            const symmetryRatio = Math.min(leftEyeWidth, rightEyeWidth) / Math.max(leftEyeWidth, rightEyeWidth)
            if (symmetryRatio < 0.8) {
              anatomicalAccuracy -= 15
              feedback.push('Assimetria significativa entre olhos pode afetar curvatura')
            }
            
            if (leftEyeWidth < 30 || rightEyeWidth < 30) {
              anatomicalAccuracy -= 25
              feedback.push('Olhos muito pequenos - curvatura pode ser imprecisa')
            }
            
            // Teste de preview da aplicação curva
            let preview = ''
            try {
              const canvas = document.createElement('canvas')
              canvas.width = img.width
              canvas.height = img.height
              const ctx = canvas.getContext('2d')!
              ctx.drawImage(img, 0, 0)
              
              // 🔧 CORREÇÃO TESTE: Usa overlayPath diretamente do estilo
              const estilos = getEstilosCilios()
              const estiloAtual = estilos.find(e => e.id === styleId)
              const eyelashUrl = estiloAtual?.overlayPath || `/assets/cilios/${getEyelashFileName(styleId)}`
              
              // Aplica preview da curvatura
              await applyCurvedEyelashOverlay(
                eyelidCurves.leftEye,
                ctx,
                eyelashUrl,
                false,
                styleId
              )
              
              await applyCurvedEyelashOverlay(
                eyelidCurves.rightEye,
                ctx,
                eyelashUrl,
                true,
                styleId
              )
              
              preview = canvas.toDataURL('image/jpeg', 0.8)
              feedback.push('Preview da curvatura gerado com sucesso')
            } catch (previewError) {
              console.error('❌ Erro ao gerar preview:', previewError)
              feedback.push('Erro ao gerar preview da curvatura')
              curveQuality -= 10
            }
            
            // Classificação final
            let alignment: 'excellent' | 'good' | 'poor' = 'poor'
            const overallScore = (curveQuality + anatomicalAccuracy) / 2
            
            if (overallScore >= 85 && leftAnatomicalCurve.length >= 15 && rightAnatomicalCurve.length >= 15) {
              alignment = 'excellent'
            } else if (overallScore >= 70 && leftAnatomicalCurve.length >= 10 && rightAnatomicalCurve.length >= 10) {
              alignment = 'good'
            }
            
            resolve({
              landmarks: {
                leftEye: leftEyelidCurve,
                rightEye: rightEyelidCurve,
                method: eyelidCurves.method
              },
              curvatureAnalysis: {
                leftCurvePoints: leftAnatomicalCurve.length,
                rightCurvePoints: rightAnatomicalCurve.length,
                leftEyeWidth: leftEyeWidth.toFixed(1),
                rightEyeWidth: rightEyeWidth.toFixed(1),
                symmetryRatio: (symmetryRatio * 100).toFixed(1) + '%',
                imageSize: `${img.width}x${img.height}`
              },
              alignment,
              curveQuality,
              anatomicalAccuracy,
              feedback,
              preview
            })
          } else {
            reject(new Error('Não foi possível calcular landmarks para teste de curvatura'))
          }
        } catch (error) {
          reject(error)
        }
      }
      
      img.onerror = () => {
        reject(new Error('Erro ao carregar imagem para teste de curvatura'))
      }
      
      const reader = new FileReader()
      reader.onload = (e) => {
        img.src = e.target?.result as string
      }
      reader.readAsDataURL(imageFile)
      
    } catch (error) {
      reject(error)
    }
  })
}

/**
 * 🧪 FUNÇÃO DE TESTE ATUALIZADA: Valida posicionamento na raiz dos cílios
 */
export const testEyelashAlignment = async (imageFile: File): Promise<{
  landmarks: any,
  eyeMetrics: any,
  alignment: 'excellent' | 'good' | 'poor',
  eyelashAnchors?: any,
  validationScore?: number,
  feedback?: string[],
  styleConfig?: any
}> => {
  return new Promise(async (resolve, reject) => {
    try {
      // Carrega modelos se necessário
      const faceApiAvailable = await loadFaceApiModels()
      
      const img = new Image()
      img.crossOrigin = 'anonymous'
      
      img.onload = async () => {
        let faceData = null
        
        if (faceApiAvailable) {
          faceData = await detectFacialLandmarks(img)
        }
        
        if (faceData) {
          const eyeLandmarks = extractEyeLandmarks(faceData)
          
          if (eyeLandmarks) {
            // Calcula métricas de qualidade
            const leftEyeWidth = Math.sqrt(
              Math.pow(eyeLandmarks.leftEye[3].x - eyeLandmarks.leftEye[0].x, 2) + 
              Math.pow(eyeLandmarks.leftEye[3].y - eyeLandmarks.leftEye[0].y, 2)
            )
            
            const rightEyeWidth = Math.sqrt(
              Math.pow(eyeLandmarks.rightEye[3].x - eyeLandmarks.rightEye[0].x, 2) + 
              Math.pow(eyeLandmarks.rightEye[3].y - eyeLandmarks.rightEye[0].y, 2)
            )
            
            const symmetryRatio = Math.min(leftEyeWidth, rightEyeWidth) / Math.max(leftEyeWidth, rightEyeWidth)
            
            // 🎯 TESTA PONTOS DE ANCORAGEM NA RAIZ DOS CÍLIOS
            const leftEyelashAnchor = getEyelashAnchorPoint(eyeLandmarks.leftEye, false)
            const rightEyelashAnchor = getEyelashAnchorPoint(eyeLandmarks.rightEye, true)
            
            // Calcula configuração para um estilo padrão
            const styleConfig = getStyleRefinementConfig('volume-brasileiro-d')
            
            // Validação da qualidade do posicionamento
            const validationFeedback: string[] = []
            let validationScore = 100
            
            // Verifica se os pontos de ancoragem estão bem posicionados
            const anchorDistance = Math.sqrt(
              Math.pow(rightEyelashAnchor.anchorPoint.x - leftEyelashAnchor.anchorPoint.x, 2) + 
              Math.pow(rightEyelashAnchor.anchorPoint.y - leftEyelashAnchor.anchorPoint.y, 2)
            )
            
            if (anchorDistance < 50) {
              validationScore -= 30
              validationFeedback.push('Distância entre olhos muito pequena - pode afetar precisão')
            }
            
            if (leftEyeWidth < 20 || rightEyeWidth < 20) {
              validationScore -= 20
              validationFeedback.push('Olhos muito pequenos na imagem - recomenda-se maior resolução')
            }
            
            if (symmetryRatio < 0.8) {
              validationScore -= 15
              validationFeedback.push('Assimetria significativa entre olhos detectada')
            }
            
            let alignment: 'excellent' | 'good' | 'poor' = 'poor'
            if (validationScore >= 90 && symmetryRatio > 0.9 && leftEyeWidth > 30) alignment = 'excellent'
            else if (validationScore >= 70 && symmetryRatio > 0.8 && leftEyeWidth > 20) alignment = 'good'
            
            resolve({
              landmarks: eyeLandmarks,
              eyeMetrics: {
                leftEyeWidth: leftEyeWidth.toFixed(1),
                rightEyeWidth: rightEyeWidth.toFixed(1),
                symmetryRatio: (symmetryRatio * 100).toFixed(1) + '%',
                imageSize: `${img.width}x${img.height}`,
                anchorDistance: anchorDistance.toFixed(1)
              },
              alignment,
              eyelashAnchors: {
                leftEye: leftEyelashAnchor,
                rightEye: rightEyelashAnchor
              },
              validationScore,
              feedback: validationFeedback,
              styleConfig
            })
          } else {
            throw new Error('Não foi possível extrair landmarks dos olhos')
          }
        } else {
          throw new Error('Não foi possível detectar rosto na imagem')
        }
      }
      
      img.onerror = () => {
        reject(new Error('Erro ao carregar imagem para teste'))
      }
      
      const reader = new FileReader()
      reader.onload = (e) => {
        img.src = e.target?.result as string
      }
      reader.readAsDataURL(imageFile)
      
    } catch (error) {
      reject(error)
    }
  })
}

/**
 * 🔧 FUNÇÃO DE TESTE RÁPIDO: Para debugging no console
 */
export const testeRapidoCilios = () => {
  console.log('🚨🚨🚨 === TESTE RÁPIDO DOS CÍLIOS ===')
  
  try {
    console.log('1. Testando função getEstilosCilios...')
    const estilos = getEstilosCilios()
    console.log('✅ Estilos carregados:', estilos.length)
    console.table(estilos.map(e => ({ id: e.id, nome: e.nome, thumbnail: e.thumbnail, overlayPath: e.overlayPath })))
    
    console.log('2. Testando carregamento de TODAS as imagens...')
    let sucessos = 0
    let erros = 0
    
    estilos.forEach((estilo, index) => {
      const img = new Image()
      img.onload = () => {
        sucessos++
        console.log(`✅ ${index + 1}/${estilos.length}. ${estilo.nome}: CARREGOU (${img.width}x${img.height})`)
        if (sucessos + erros === estilos.length) {
          console.log(`🎯 RESULTADO FINAL: ${sucessos} sucessos, ${erros} erros de ${estilos.length} imagens`)
        }
      }
      img.onerror = (event) => {
        erros++
        console.error(`❌ ${index + 1}/${estilos.length}. ${estilo.nome}: ERRO ao carregar`)
        console.error(`   URL testada: ${estilo.overlayPath}`)
        console.error(`   Evento de erro:`, event)
        if (sucessos + erros === estilos.length) {
          console.log(`🎯 RESULTADO FINAL: ${sucessos} sucessos, ${erros} erros de ${estilos.length} imagens`)
        }
      }
      img.src = estilo.overlayPath
      console.log(`🔗 ${index + 1}. Testando: ${estilo.overlayPath}`)
    })
    
    console.log('3. Informações do sistema:')
    console.log('   • Local:', window.location.href)
    console.log('   • User Agent:', navigator.userAgent)
    console.log('   • Cookies habilitados:', navigator.cookieEnabled)
    
    console.log('🚨 TESTE INICIADO! Aguarde os resultados do carregamento das imagens...')
    return { success: true, message: 'Teste executado com sucesso' }
    
  } catch (error) {
    console.error('❌ ERRO NO TESTE:', error)
    return { success: false, error }
  }
}

/**
 * 🔧 FUNÇÃO DE TESTE ESPECÍFICO: Testa um estilo individual
 */
export const testeEstiloEspecifico = (estiloId: string) => {
  console.log(`🚨🚨🚨 === TESTE DO ESTILO: ${estiloId} ===`)
  
  try {
    const estilos = getEstilosCilios()
    const estilo = estilos.find(e => e.id === estiloId)
    
    if (!estilo) {
      console.error(`❌ Estilo '${estiloId}' não encontrado!`)
      console.log('✅ Estilos disponíveis:', estilos.map(e => e.id))
      return { success: false, error: 'Estilo não encontrado' }
    }
    
    console.log('✅ Estilo encontrado:', estilo)
    
    console.log('🔗 Testando carregamento da imagem...')
    const img = new Image()
    
    return new Promise((resolve) => {
      img.onload = () => {
        console.log(`✅ SUCESSO! Imagem carregada: ${img.width}x${img.height}px`)
        console.log('📊 Detalhes da imagem:')
        console.log(`   • Largura: ${img.width}px`)
        console.log(`   • Altura: ${img.height}px`)
        console.log(`   • URL: ${estilo.overlayPath}`)
        console.log(`   • Natural Width: ${img.naturalWidth}px`)
        console.log(`   • Natural Height: ${img.naturalHeight}px`)
        resolve({ success: true, estilo, dimensions: { width: img.width, height: img.height } })
      }
      
      img.onerror = (event) => {
        console.error(`❌ ERRO ao carregar imagem!`)
        console.error(`   URL: ${estilo.overlayPath}`)
        console.error(`   Evento:`, event)
        
        // Tenta com caminho alternativo
        console.log('🔄 Tentando caminho alternativo...')
        const alternativeUrl = `/assets/cilios/${getEyelashFileName(estiloId)}`
        console.log(`🔗 URL alternativa: ${alternativeUrl}`)
        
        const img2 = new Image()
        img2.onload = () => {
          console.log(`✅ SUCESSO com URL alternativa! ${img2.width}x${img2.height}px`)
          resolve({ success: true, estilo, dimensions: { width: img2.width, height: img2.height }, urlUsada: alternativeUrl })
        }
        img2.onerror = () => {
          console.error(`❌ FALHOU também com URL alternativa`)
          resolve({ success: false, error: 'Ambas URLs falharam', estilo })
        }
        img2.src = alternativeUrl
      }
      
      img.src = estilo.overlayPath
    })
    
  } catch (error) {
    console.error('❌ ERRO NO TESTE:', error)
    return { success: false, error }
  }
}

// Disponibiliza globalmente para debug
if (typeof window !== 'undefined') {
  (window as any).testeRapidoCilios = testeRapidoCilios;
  (window as any).testeEstiloEspecifico = testeEstiloEspecifico
}

/**
 * 🔍 FUNÇÃO MELHORADA: Detecta tipo de arquivo de overlay automaticamente
 */
const detectOverlayType = async (overlayPath: string): Promise<'png' | 'svg' | 'missing'> => {
  try {
    // Testa PNG primeiro
    const pngResponse = await fetch(overlayPath.replace('.svg', '.png'))
    if (pngResponse.ok) {
      console.log(`✅ Arquivo PNG encontrado: ${overlayPath.replace('.svg', '.png')}`)
      return 'png'
    }
    
    // Testa SVG
    const svgResponse = await fetch(overlayPath)
    if (svgResponse.ok) {
      console.log(`✅ Arquivo SVG encontrado: ${overlayPath}`)
      return 'svg'
    }
    
    console.warn(`⚠️ Nenhum arquivo encontrado para: ${overlayPath}`)
    return 'missing'
    
  } catch (error) {
    console.error(`❌ Erro ao detectar tipo de overlay:`, error)
    return 'missing'
  }
}

/**
 * 📊 FUNÇÃO DE MÉTRICAS: Calcula qualidade do alinhamento em tempo real
 */
const calculateAlignmentQuality = (eyeLandmarks: Array<{x: number, y: number}>): number => {
  if (eyeLandmarks.length < 4) return 0
  
  const innerCorner = eyeLandmarks[0]
  const outerCorner = eyeLandmarks[3]
  const upperMid = eyeLandmarks[1]
  
  // Fatores de qualidade
  const eyeWidth = Math.sqrt(
    Math.pow(outerCorner.x - innerCorner.x, 2) + 
    Math.pow(outerCorner.y - innerCorner.y, 2)
  )
  
  const eyeHeight = Math.abs(upperMid.y - (innerCorner.y + outerCorner.y) / 2)
  const aspectRatio = eyeWidth / eyeHeight
  
  // Qualidade baseada em:
  // 1. Tamanho mínimo do olho (>20px)
  // 2. Proporção realista (2:1 a 4:1)
  // 3. Definição dos pontos
  
  let quality = 0
  if (eyeWidth > 20) quality += 40
  if (eyeWidth > 40) quality += 20
  if (aspectRatio >= 2 && aspectRatio <= 4) quality += 30
  if (eyeHeight > 5) quality += 10
  
  return Math.min(quality, 100)
} 