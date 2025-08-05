import { FaceMesh } from '@mediapipe/face_mesh'
// import { Camera } from '@mediapipe/camera_utils' // Removido - não utilizado

// 🎯 LANDMARKS ESPECÍFICOS DA PÁLPEBRA SUPERIOR (MediaPipe Face Mesh)
export const EYELID_LANDMARKS = {
  // Olho esquerdo - pálpebra superior (seguindo curvatura natural)
  LEFT_EYE_UPPER: [33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246],
  // Olho direito - pálpebra superior (seguindo curvatura natural)  
  RIGHT_EYE_UPPER: [362, 398, 384, 385, 386, 387, 388, 466, 263, 249, 390, 373, 374, 380, 381, 382],
  // Pontos de referência para largura do olho
  LEFT_EYE_CORNERS: [33, 133], // Canto interno e externo
  RIGHT_EYE_CORNERS: [362, 263] // Canto interno e externo
}

export interface FaceMeshResults {
  landmarks: Array<{x: number, y: number, z: number}>
  leftEyeUpperCurve: Array<{x: number, y: number}>
  rightEyeUpperCurve: Array<{x: number, y: number}>
  leftEyeWidth: number
  rightEyeWidth: number
  confidence: number
}

let faceMeshInstance: FaceMesh | null = null

/**
 * 🚀 Inicializa o MediaPipe Face Mesh
 */
export const initializeFaceMesh = async (): Promise<boolean> => {
  try {
    console.log('🤖 Inicializando MediaPipe Face Mesh...')
    
    faceMeshInstance = new FaceMesh({
      locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`
      }
    })

    faceMeshInstance.setOptions({
      maxNumFaces: 1,
      refineLandmarks: true,
      minDetectionConfidence: 0.7,
      minTrackingConfidence: 0.5
    })

    console.log('✅ MediaPipe Face Mesh inicializado com sucesso!')
    return true
  } catch (error) {
    console.error('❌ Erro ao inicializar MediaPipe Face Mesh:', error)
    return false
  }
}

/**
 * 🔍 Detecta landmarks faciais com MediaPipe Face Mesh
 */
export const detectFaceMeshLandmarks = async (
  imageElement: HTMLImageElement
): Promise<FaceMeshResults | null> => {
  return new Promise((resolve) => {
    if (!faceMeshInstance) {
      console.error('❌ Face Mesh não inicializado')
      resolve(null)
      return
    }

    let hasDetected = false

    faceMeshInstance.onResults((results) => {
      if (hasDetected) return
      hasDetected = true

      if (!results.multiFaceLandmarks || results.multiFaceLandmarks.length === 0) {
        console.warn('⚠️ Nenhuma face detectada pelo MediaPipe')
        resolve(null)
        return
      }

      const landmarks = results.multiFaceLandmarks[0]
      const imageWidth = imageElement.width
      const imageHeight = imageElement.height

      // 🎯 Extrai pontos específicos da pálpebra superior
      const leftEyeUpperCurve = EYELID_LANDMARKS.LEFT_EYE_UPPER.map(index => ({
        x: landmarks[index].x * imageWidth,
        y: landmarks[index].y * imageHeight
      }))

      const rightEyeUpperCurve = EYELID_LANDMARKS.RIGHT_EYE_UPPER.map(index => ({
        x: landmarks[index].x * imageWidth,
        y: landmarks[index].y * imageHeight
      }))

      // 📏 Calcula largura dos olhos
      const leftEyeWidth = Math.sqrt(
        Math.pow((landmarks[EYELID_LANDMARKS.LEFT_EYE_CORNERS[1]].x - landmarks[EYELID_LANDMARKS.LEFT_EYE_CORNERS[0]].x) * imageWidth, 2) +
        Math.pow((landmarks[EYELID_LANDMARKS.LEFT_EYE_CORNERS[1]].y - landmarks[EYELID_LANDMARKS.LEFT_EYE_CORNERS[0]].y) * imageHeight, 2)
      )

      const rightEyeWidth = Math.sqrt(
        Math.pow((landmarks[EYELID_LANDMARKS.RIGHT_EYE_CORNERS[1]].x - landmarks[EYELID_LANDMARKS.RIGHT_EYE_CORNERS[0]].x) * imageWidth, 2) +
        Math.pow((landmarks[EYELID_LANDMARKS.RIGHT_EYE_CORNERS[1]].y - landmarks[EYELID_LANDMARKS.RIGHT_EYE_CORNERS[0]].y) * imageHeight, 2)
      )

      console.log('✅ MediaPipe Face Mesh - Landmarks detectados:')
      console.log(`👁️ Olho esquerdo: ${leftEyeUpperCurve.length} pontos, largura: ${leftEyeWidth.toFixed(1)}px`)
      console.log(`👁️ Olho direito: ${rightEyeUpperCurve.length} pontos, largura: ${rightEyeWidth.toFixed(1)}px`)

      resolve({
        landmarks: landmarks.map(lm => ({
          x: lm.x * imageWidth,
          y: lm.y * imageHeight,
          z: lm.z
        })),
        leftEyeUpperCurve,
        rightEyeUpperCurve,
        leftEyeWidth,
        rightEyeWidth,
        confidence: 0.9 // MediaPipe não retorna confidence score, usando valor fixo alto
      })
    })

    // Processa a imagem
    faceMeshInstance.send({ image: imageElement })

    // Timeout de 5 segundos
    setTimeout(() => {
      if (!hasDetected) {
        console.warn('⏰ Timeout na detecção do MediaPipe Face Mesh')
        resolve(null)
      }
    }, 5000)
  })
}

/**
 * 🌊 Gera curva Catmull-Rom spline para interpolação suave da pálpebra
 */
export const generateEyelidSplineCurve = (
  controlPoints: Array<{x: number, y: number}>,
  resolution: number = 30
): Array<{x: number, y: number, tangent: number}> => {
  if (controlPoints.length < 4) {
    console.warn('⚠️ Pontos insuficientes para spline, usando interpolação linear')
    return controlPoints.map(p => ({ ...p, tangent: 0 }))
  }

  const splinePoints: Array<{x: number, y: number, tangent: number}> = []

  // 🌀 Algoritmo Catmull-Rom Spline
  for (let i = 0; i < controlPoints.length - 1; i++) {
    const p0 = controlPoints[Math.max(0, i - 1)]
    const p1 = controlPoints[i]
    const p2 = controlPoints[i + 1]
    const p3 = controlPoints[Math.min(controlPoints.length - 1, i + 2)]

    const segmentPoints = Math.ceil(resolution / (controlPoints.length - 1))

    for (let j = 0; j < segmentPoints; j++) {
      const t = j / segmentPoints

      // Catmull-Rom spline formula
      const t2 = t * t
      const t3 = t2 * t

      const x = 0.5 * (
        (2 * p1.x) +
        (-p0.x + p2.x) * t +
        (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 +
        (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3
      )

      const y = 0.5 * (
        (2 * p1.y) +
        (-p0.y + p2.y) * t +
        (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 +
        (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3
      )

      // Calcula tangente para orientação do cílio
      const tangent = Math.atan2(
        0.5 * ((-p0.y + p2.y) + 2 * (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t + 3 * (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t2),
        0.5 * ((-p0.x + p2.x) + 2 * (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t + 3 * (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t2)
      )

      splinePoints.push({ x, y, tangent })
    }
  }

  console.log(`🌊 Curva spline gerada: ${splinePoints.length} pontos (resolução: ${resolution})`)
  return splinePoints
}

/**
 * 📐 Calcula ângulo de inclinação do olho baseado nos cantos
 */
export const calculateEyeAngle = (
  innerCorner: {x: number, y: number},
  outerCorner: {x: number, y: number}
): number => {
  return Math.atan2(
    outerCorner.y - innerCorner.y,
    outerCorner.x - innerCorner.x
  )
}

/**
 * 🎯 Ordena landmarks da pálpebra superior da esquerda para direita
 */
export const sortEyelidLandmarks = (
  landmarks: Array<{x: number, y: number}>,
  isRightEye: boolean = false
): Array<{x: number, y: number}> => {
  const sorted = [...landmarks].sort((a, b) => 
    isRightEye ? b.x - a.x : a.x - b.x
  )
  
  console.log(`📊 Landmarks ordenados: ${sorted.length} pontos para olho ${isRightEye ? 'direito' : 'esquerdo'}`)
  return sorted
}