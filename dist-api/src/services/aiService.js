import * as faceapi from 'face-api.js';
import { initializeFaceMesh, detectFaceMeshLandmarks, sortEyelidLandmarks } from './faceMeshService';
import { applyEyelashOverlayWithSpline } from './eyelashOverlayService';
let modelsLoaded = false;
let modelsAvailable = true;
let mediaPipeAvailable = false;
export const getEstilosCilios = () => {
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
    ];
    if (estilos.length > 0) {
        const testImg = new Image();
        testImg.onload = () => console.log('✅ Sistema de cílios: Imagens carregando corretamente');
        testImg.onerror = () => console.error('❌ Sistema de cílios: Erro no carregamento das imagens');
        testImg.src = estilos[0].overlayPath;
    }
    return estilos;
};
const loadFaceApiModels = async () => {
    if (modelsLoaded)
        return modelsAvailable || mediaPipeAvailable;
    try {
        try {
            mediaPipeAvailable = await initializeFaceMesh();
            if (mediaPipeAvailable) {
                modelsLoaded = true;
                return true;
            }
        }
        catch (mediaPipeError) {
            mediaPipeAvailable = false;
        }
        try {
            await Promise.race([
                Promise.all([
                    faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
                    faceapi.nets.faceLandmark68Net.loadFromUri('/models')
                ]),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
            ]);
            modelsLoaded = true;
            modelsAvailable = true;
            return true;
        }
        catch (faceApiError) {
            try {
                await Promise.race([
                    Promise.all([
                        faceapi.nets.tinyFaceDetector.loadFromUri('https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights'),
                        faceapi.nets.faceLandmark68Net.loadFromUri('https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights')
                    ]),
                    new Promise((_, reject) => setTimeout(() => reject(new Error('CDN Timeout')), 10000))
                ]);
                modelsLoaded = true;
                modelsAvailable = true;
                return true;
            }
            catch (cdnError) {
            }
        }
        modelsLoaded = true;
        modelsAvailable = false;
        mediaPipeAvailable = false;
        return false;
    }
    catch (error) {
        modelsLoaded = true;
        modelsAvailable = false;
        mediaPipeAvailable = false;
        return false;
    }
};
const getEyelashFileName = (styleId) => {
    const fileMap = {
        'brasileiro-boneca': 'brasileiro_boneca.png',
        'brasileiro-gatinho': 'brasileiro_gatinho.png',
        'russo-boneca': 'russo_boneca.png',
        'russo-gatinho': 'russo_gatinho.png',
        'egipcio-boneca': 'egipcio_boneca.png',
        'egipcio-gatinho': 'egipcio_gatinho.png',
        'volume-classico-boneca': 'volume_classico_boneca.png',
        'volume-classico-gatinho': 'volume_classico_gatinho.png',
        'fox-eyes': 'fox_eyes.png'
    };
    return fileMap[styleId] || `${styleId}.png`;
};
const detectFacialLandmarks = async () => {
    return null;
};
const detectEyeRegionByHistogram = (canvas, ctx) => {
    const width = canvas.width;
    const height = canvas.height;
    const eyeRegionTop = Math.floor(height * 0.25);
    const eyeRegionBottom = Math.floor(height * 0.55);
    const eyeRegionHeight = eyeRegionBottom - eyeRegionTop;
    const imageData = ctx.getImageData(0, eyeRegionTop, width, eyeRegionHeight);
    const data = imageData.data;
    const analysisByRow = [];
    for (let y = 0; y < eyeRegionHeight; y++) {
        let darkPixels = 0;
        let contrastChanges = 0;
        let prevBrightness = 0;
        for (let x = 0; x < width; x++) {
            const idx = (y * width + x) * 4;
            const r = data[idx];
            const g = data[idx + 1];
            const b = data[idx + 2];
            const brightness = (r + g + b) / 3;
            if (brightness < 100) {
                darkPixels++;
            }
            if (x > 0) {
                const contrastDiff = Math.abs(brightness - prevBrightness);
                if (contrastDiff > 30) {
                    contrastChanges++;
                }
            }
            prevBrightness = brightness;
        }
        const eyePattern = darkPixels + (contrastChanges * 0.5);
        analysisByRow.push({
            darkPixels,
            contrastChanges,
            eyePattern
        });
    }
    let maxEyePattern = 0;
    let eyeLineIndex = Math.floor(eyeRegionHeight * 0.6);
    for (let i = 0; i < analysisByRow.length; i++) {
        if (analysisByRow[i].eyePattern > maxEyePattern) {
            maxEyePattern = analysisByRow[i].eyePattern;
            eyeLineIndex = i;
        }
    }
    const detectedEyeY = eyeRegionTop + eyeLineIndex - 6;
    console.log(`🧠 DETECÇÃO INTELIGENTE: Linha dos olhos detectada em ${detectedEyeY}px`);
    console.log(`📊 Padrão máximo: ${maxEyePattern.toFixed(1)} na linha ${eyeLineIndex}`);
    console.log(`🔍 Pixels escuros: ${analysisByRow[eyeLineIndex].darkPixels}, Contraste: ${analysisByRow[eyeLineIndex].contrastChanges}`);
    return detectedEyeY;
};
const calculateEyelidCurve = async (imageElement, faceData = null) => {
    const width = imageElement.width;
    const height = imageElement.height;
    if (mediaPipeAvailable) {
        console.log('🚀 Usando MediaPipe Face Mesh para landmarks da pálpebra superior');
        try {
            const faceMeshResults = await detectFaceMeshLandmarks(imageElement);
            if (faceMeshResults) {
                const leftEyeSorted = sortEyelidLandmarks(faceMeshResults.leftEyeUpperCurve, false);
                const rightEyeSorted = sortEyelidLandmarks(faceMeshResults.rightEyeUpperCurve, true);
                console.log('✅ MediaPipe - Landmarks da pálpebra superior extraídos:');
                console.log(`👁️ Olho esquerdo: ${leftEyeSorted.length} pontos, largura: ${faceMeshResults.leftEyeWidth.toFixed(1)}px`);
                console.log(`👁️ Olho direito: ${rightEyeSorted.length} pontos, largura: ${faceMeshResults.rightEyeWidth.toFixed(1)}px`);
                return {
                    leftEye: leftEyeSorted,
                    rightEye: rightEyeSorted,
                    leftEyeWidth: faceMeshResults.leftEyeWidth,
                    rightEyeWidth: faceMeshResults.rightEyeWidth,
                    confidence: faceMeshResults.confidence,
                    method: 'mediapipe_face_mesh'
                };
            }
        }
        catch (error) {
            console.warn('⚠️ Erro no MediaPipe, usando fallback:', error);
        }
    }
    if (faceData && faceData.landmarks) {
        console.log('🔄 Usando face-api.js para landmarks faciais');
        const eyeLandmarks = extractEyeLandmarks(faceData);
        if (eyeLandmarks) {
            console.log(`👁️ face-api.js - Olho esquerdo: ${eyeLandmarks.leftEye.length} pontos`);
            console.log(`👁️ face-api.js - Olho direito: ${eyeLandmarks.rightEye.length} pontos`);
            return {
                leftEye: eyeLandmarks.leftEye,
                rightEye: eyeLandmarks.rightEye,
                leftEyeWidth: calculateEyeWidth(eyeLandmarks.leftEye),
                rightEyeWidth: calculateEyeWidth(eyeLandmarks.rightEye),
                confidence: 0.8,
                method: 'faceapi_landmarks'
            };
        }
    }
    console.log('🧠 Usando análise inteligente por histograma');
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(imageElement, 0, 0);
    const detectedEyeY = detectEyeRegionByHistogram(canvas, ctx);
    const centerX = width / 2;
    const eyeDistance = width * 0.16;
    const eyeWidth = width * 0.12;
    const leftCenterX = centerX - eyeDistance;
    const rightCenterX = centerX + eyeDistance;
    const leftCurve = [
        { x: leftCenterX - eyeWidth / 2, y: detectedEyeY + 3 },
        { x: leftCenterX - eyeWidth / 4, y: detectedEyeY - 1 },
        { x: leftCenterX, y: detectedEyeY - 3 },
        { x: leftCenterX + eyeWidth / 4, y: detectedEyeY - 1 },
        { x: leftCenterX + eyeWidth / 2, y: detectedEyeY + 3 }
    ];
    const rightCurve = [
        { x: rightCenterX - eyeWidth / 2, y: detectedEyeY + 3 },
        { x: rightCenterX - eyeWidth / 4, y: detectedEyeY - 1 },
        { x: rightCenterX, y: detectedEyeY - 3 },
        { x: rightCenterX + eyeWidth / 4, y: detectedEyeY - 1 },
        { x: rightCenterX + eyeWidth / 2, y: detectedEyeY + 3 }
    ];
    return {
        leftEye: leftCurve,
        rightEye: rightCurve,
        leftEyeWidth: eyeWidth,
        rightEyeWidth: eyeWidth,
        confidence: 0.6,
        method: 'intelligent_histogram_analysis'
    };
};
const getStyleRefinementConfig = (selectedStyle) => {
    const configs = {
        'volume-classico-boneca': {
            maxProjectionRatio: 0.22,
            anatomicalOffsetRatio: 0.14,
            blendOpacity: 0.87,
            curvatureIntensity: 0.30,
            segmentCount: 10,
            warpStrength: 0.20,
            tangentSmoothing: 0.85
        },
        'volume-classico-gatinho': {
            maxProjectionRatio: 0.24,
            anatomicalOffsetRatio: 0.15,
            blendOpacity: 0.88,
            curvatureIntensity: 0.32,
            segmentCount: 11,
            warpStrength: 0.22,
            tangentSmoothing: 0.87
        },
        'brasileiro-boneca': {
            maxProjectionRatio: 0.25,
            anatomicalOffsetRatio: 0.15,
            blendOpacity: 0.88,
            curvatureIntensity: 0.35,
            segmentCount: 12,
            warpStrength: 0.25,
            tangentSmoothing: 0.90
        },
        'brasileiro-gatinho': {
            maxProjectionRatio: 0.27,
            anatomicalOffsetRatio: 0.16,
            blendOpacity: 0.89,
            curvatureIntensity: 0.37,
            segmentCount: 13,
            warpStrength: 0.27,
            tangentSmoothing: 0.91
        },
        'russo-boneca': {
            maxProjectionRatio: 0.30,
            anatomicalOffsetRatio: 0.18,
            blendOpacity: 0.90,
            curvatureIntensity: 0.40,
            segmentCount: 15,
            warpStrength: 0.35,
            tangentSmoothing: 0.95,
            useAdvancedMask: true
        },
        'russo-gatinho': {
            maxProjectionRatio: 0.32,
            anatomicalOffsetRatio: 0.19,
            blendOpacity: 0.91,
            curvatureIntensity: 0.42,
            segmentCount: 16,
            warpStrength: 0.37,
            tangentSmoothing: 0.96,
            useAdvancedMask: true
        },
        'egipcio-boneca': {
            maxProjectionRatio: 0.35,
            anatomicalOffsetRatio: 0.20,
            blendOpacity: 0.92,
            curvatureIntensity: 0.45,
            segmentCount: 14,
            warpStrength: 0.30,
            tangentSmoothing: 0.92,
            useAdvancedMask: true
        },
        'egipcio-gatinho': {
            maxProjectionRatio: 0.37,
            anatomicalOffsetRatio: 0.21,
            blendOpacity: 0.93,
            curvatureIntensity: 0.47,
            segmentCount: 15,
            warpStrength: 0.32,
            tangentSmoothing: 0.94,
            useAdvancedMask: true
        },
        'fox-eyes': {
            maxProjectionRatio: 0.28,
            anatomicalOffsetRatio: 0.16,
            blendOpacity: 0.89,
            curvatureIntensity: 0.50,
            segmentCount: 10,
            warpStrength: 0.22,
            tangentSmoothing: 0.85,
            elongationFactor: 1.15
        }
    };
    return configs[selectedStyle] || configs['brasileiro-boneca'];
};
export const applyCurvedEyelashOverlay = async (landmarks, ctx, overlayImageUrl, isRightEye = false, styleId = 'brasileiro-boneca') => {
    return new Promise((resolve, reject) => {
        console.log(`🚀 INICIANDO overlay curvo para ${isRightEye ? 'direito' : 'esquerdo'}`);
        console.log(`📂 URL da imagem: ${overlayImageUrl}`);
        console.log(`🎨 Estilo: ${styleId}`);
        console.log(`👁️ Landmarks recebidos: ${landmarks.length} pontos`);
        const overlayImg = new Image();
        overlayImg.crossOrigin = 'anonymous';
        overlayImg.onload = () => {
            try {
                const upperEyelidLandmarks = extractUpperEyelidCurve(landmarks);
                const eyelidCurve = generateAnatomicalCurve(upperEyelidLandmarks);
                const eyeWidth = calculateEyeWidth(landmarks);
                const styleConfig = getStyleRefinementConfig(styleId);
                const scaleX = (eyeWidth * 1.15) / overlayImg.width;
                const scaleY = Math.max(scaleX * 0.7, (eyeWidth * styleConfig.maxProjectionRatio) / overlayImg.height);
                applyCurvedDeformation(ctx, overlayImg, eyelidCurve, scaleX, scaleY, isRightEye, styleConfig);
                resolve();
            }
            catch (error) {
                console.error(`❌ Erro ao aplicar overlay curvo:`, error);
                console.error(`❌ Stack trace:`, error instanceof Error ? error.stack : 'No stack trace');
                reject(error);
            }
        };
        overlayImg.onerror = (event) => {
            console.error(`❌ Erro ao carregar imagem do overlay: ${overlayImageUrl}`);
            console.error(`❌ Evento de erro:`, event);
            reject(new Error(`Erro ao carregar imagem do overlay: ${overlayImageUrl}`));
        };
        console.log(`📥 Iniciando carregamento da imagem...`);
        overlayImg.src = overlayImageUrl;
    });
};
const extractUpperEyelidCurve = (landmarks) => {
    if (landmarks.length >= 6) {
        const innerCorner = landmarks[0];
        const outerCorner = landmarks[3];
        const upperMid = landmarks[1];
        const upperOuter = landmarks[2];
        const point1 = {
            x: innerCorner.x + (upperMid.x - innerCorner.x) * 0.25,
            y: innerCorner.y + (upperMid.y - innerCorner.y) * 0.8
        };
        const point2 = {
            x: innerCorner.x + (upperMid.x - innerCorner.x) * 0.75,
            y: innerCorner.y + (upperMid.y - innerCorner.y) * 0.9
        };
        const point3 = {
            x: upperMid.x + (upperOuter.x - upperMid.x) * 0.25,
            y: upperMid.y + (upperOuter.y - upperMid.y) * 0.9
        };
        const point4 = {
            x: upperMid.x + (upperOuter.x - upperMid.x) * 0.75,
            y: upperMid.y + (upperOuter.y - upperMid.y) * 0.8
        };
        return [
            innerCorner,
            point1,
            point2,
            upperMid,
            point3,
            point4,
            upperOuter,
            outerCorner
        ];
    }
    const centerX = landmarks.length > 0 ? landmarks[0].x : 100;
    const centerY = landmarks.length > 0 ? landmarks[0].y : 100;
    const width = 80;
    return [
        { x: centerX - width / 2, y: centerY + 2 },
        { x: centerX - width / 3, y: centerY - 3 },
        { x: centerX - width / 6, y: centerY - 5 },
        { x: centerX, y: centerY - 6 },
        { x: centerX + width / 6, y: centerY - 5 },
        { x: centerX + width / 3, y: centerY - 3 },
        { x: centerX + width / 2.5, y: centerY - 1 },
        { x: centerX + width / 2, y: centerY + 2 }
    ];
};
const generateAnatomicalCurve = (controlPoints, resolution = 20) => {
    const curve = [];
    for (let i = 0; i < controlPoints.length - 1; i++) {
        const p0 = controlPoints[Math.max(0, i - 1)];
        const p1 = controlPoints[i];
        const p2 = controlPoints[i + 1];
        const p3 = controlPoints[Math.min(controlPoints.length - 1, i + 2)];
        for (let t = 0; t <= resolution; t++) {
            const u = t / resolution;
            const u2 = u * u;
            const u3 = u2 * u;
            const x = 0.5 * ((2 * p1.x) +
                (-p0.x + p2.x) * u +
                (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * u2 +
                (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * u3);
            const y = 0.5 * ((2 * p1.y) +
                (-p0.y + p2.y) * u +
                (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * u2 +
                (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * u3);
            const tangent = Math.atan2(p2.y - p1.y, p2.x - p1.x);
            curve.push({ x, y, tangent });
        }
    }
    return curve;
};
const calculateEyeWidth = (landmarks) => {
    if (landmarks.length >= 4) {
        const innerCorner = landmarks[0];
        const outerCorner = landmarks[3];
        return Math.sqrt(Math.pow(outerCorner.x - innerCorner.x, 2) +
            Math.pow(outerCorner.y - innerCorner.y, 2));
    }
    return 60;
};
const applyCurvedDeformation = (ctx, overlayImg, eyelidCurve, scaleX, scaleY, isRightEye, styleConfig) => {
    const segments = styleConfig.segmentCount || 12;
    const segmentWidth = overlayImg.width / segments;
    const warpStrength = styleConfig.warpStrength || 0.25;
    const tangentSmoothing = styleConfig.tangentSmoothing || 0.85;
    const elongationFactor = styleConfig.elongationFactor || 1.0;
    console.log(`🌊 Aplicando deformação curva AVANÇADA com ${segments} segmentos`);
    console.log(`   • Pontos da curva: ${eyelidCurve.length}`);
    console.log(`   • Escala: ${scaleX.toFixed(2)}x × ${scaleY.toFixed(2)}x`);
    console.log(`   • Força de deformação: ${(warpStrength * 100).toFixed(1)}%`);
    console.log(`   • Suavização: ${(tangentSmoothing * 100).toFixed(1)}%`);
    ctx.save();
    ctx.globalAlpha = styleConfig.blendOpacity || 0.88;
    ctx.globalCompositeOperation = 'multiply';
    for (let i = 0; i < segments; i++) {
        const progress = i / (segments - 1);
        const curveIndex = Math.floor(progress * (eyelidCurve.length - 1));
        const curvePoint = eyelidCurve[curveIndex];
        if (!curvePoint)
            continue;
        ctx.save();
        ctx.translate(curvePoint.x, curvePoint.y);
        let rotation = curvePoint.tangent * tangentSmoothing;
        const currentScaleX = scaleX * elongationFactor;
        if (isRightEye) {
            ctx.scale(-1, 1);
            rotation = -rotation;
        }
        ctx.rotate(rotation);
        const variationIntensity = warpStrength * 2;
        const segmentScaleY = scaleY * (0.8 + variationIntensity * Math.sin(progress * Math.PI));
        ctx.scale(currentScaleX, segmentScaleY);
        if (styleConfig.curvatureIntensity > 0.4) {
            const curvatureOffset = warpStrength * Math.sin(progress * Math.PI * 2) * 5;
            ctx.translate(0, curvatureOffset);
        }
        ctx.drawImage(overlayImg, i * segmentWidth, 0, segmentWidth, overlayImg.height, -segmentWidth * currentScaleX / 2, -overlayImg.height * segmentScaleY / 2, segmentWidth * currentScaleX, overlayImg.height * segmentScaleY);
        ctx.restore();
    }
    if (styleConfig.useAdvancedMask && styleConfig.curvatureIntensity > 0.35) {
        console.log('🎭 Aplicando máscara curva avançada adicional');
        applyAdvancedCurveMask(ctx, overlayImg, eyelidCurve, scaleX * elongationFactor, scaleY, isRightEye);
    }
    ctx.restore();
};
const applyAdvancedCurveMask = (ctx, overlayImg, eyelidCurve, scaleX, scaleY, isRightEye) => {
    console.log('🎭 Aplicando máscara curva avançada para curvatura extrema');
    const curvePath = new Path2D();
    if (eyelidCurve.length > 0) {
        curvePath.moveTo(eyelidCurve[0].x, eyelidCurve[0].y);
        for (let i = 1; i < eyelidCurve.length - 1; i += 2) {
            const cp = eyelidCurve[i];
            const end = eyelidCurve[i + 1] || eyelidCurve[eyelidCurve.length - 1];
            curvePath.quadraticCurveTo(cp.x, cp.y, end.x, end.y);
        }
        const lastPoint = eyelidCurve[eyelidCurve.length - 1];
        curvePath.lineTo(lastPoint.x, lastPoint.y - 30);
        curvePath.lineTo(eyelidCurve[0].x, eyelidCurve[0].y - 30);
        curvePath.closePath();
    }
    ctx.save();
    ctx.clip(curvePath);
    const centerX = eyelidCurve.length > 0 ? eyelidCurve[Math.floor(eyelidCurve.length / 2)].x : 0;
    const centerY = eyelidCurve.length > 0 ? eyelidCurve[Math.floor(eyelidCurve.length / 2)].y : 0;
    ctx.translate(centerX, centerY);
    if (isRightEye) {
        ctx.scale(-scaleX, scaleY);
    }
    else {
        ctx.scale(scaleX, scaleY);
    }
    ctx.drawImage(overlayImg, -overlayImg.width / 2, -overlayImg.height / 2, overlayImg.width, overlayImg.height);
    ctx.restore();
};
const getEyelashAnchorPoint = (eyeLandmarks, isRightEye = false) => {
    let eyelashBasePoints;
    if (isRightEye) {
        eyelashBasePoints = [
            eyeLandmarks[0],
            {
                x: eyeLandmarks[0].x + (eyeLandmarks[1].x - eyeLandmarks[0].x) * 0.4,
                y: eyeLandmarks[0].y + (eyeLandmarks[1].y - eyeLandmarks[0].y) * 0.7
            },
            {
                x: (eyeLandmarks[0].x + eyeLandmarks[3].x) / 2,
                y: Math.max(eyeLandmarks[1].y, eyeLandmarks[2].y) + 2
            },
            {
                x: eyeLandmarks[2].x + (eyeLandmarks[3].x - eyeLandmarks[2].x) * 0.6,
                y: eyeLandmarks[2].y + (eyeLandmarks[3].y - eyeLandmarks[2].y) * 0.7
            },
            eyeLandmarks[3]
        ];
    }
    else {
        eyelashBasePoints = [
            eyeLandmarks[0],
            {
                x: eyeLandmarks[0].x + (eyeLandmarks[1].x - eyeLandmarks[0].x) * 0.4,
                y: eyeLandmarks[0].y + (eyeLandmarks[1].y - eyeLandmarks[0].y) * 0.7
            },
            {
                x: (eyeLandmarks[0].x + eyeLandmarks[3].x) / 2,
                y: Math.max(eyeLandmarks[1].y, eyeLandmarks[2].y) + 2
            },
            {
                x: eyeLandmarks[2].x + (eyeLandmarks[3].x - eyeLandmarks[2].x) * 0.6,
                y: eyeLandmarks[2].y + (eyeLandmarks[3].y - eyeLandmarks[2].y) * 0.7
            },
            eyeLandmarks[3]
        ];
    }
    const naturalCurve = generateBezierCurve(eyelashBasePoints, 15);
    const midIndex = Math.floor(naturalCurve.length / 2);
    const anchorPoint = naturalCurve[midIndex];
    console.log(`🎯 Ponto de ancoragem calculado (${isRightEye ? 'direito' : 'esquerdo'}):`);
    console.log(`   • Posição: (${anchorPoint.x.toFixed(1)}, ${anchorPoint.y.toFixed(1)})`);
    console.log(`   • Pontos da base: ${eyelashBasePoints.length}`);
    console.log(`   • Curva natural: ${naturalCurve.length} pontos`);
    return {
        anchorPoint,
        eyelashBaseLine: eyelashBasePoints,
        naturalCurve
    };
};
const applyEyelashOverlay = async (ctx, overlayImageUrl, eyeLandmarks, isRightEye = false, selectedStyle = 'volume-brasileiro-d') => {
    return new Promise((resolve, reject) => {
        const overlayImg = new Image();
        overlayImg.crossOrigin = 'anonymous';
        overlayImg.onload = () => {
            try {
                console.log(`🎨 Aplicando overlay POSICIONADO PRECISAMENTE ${isRightEye ? 'direito' : 'esquerdo'} - Estilo: ${selectedStyle}`);
                const innerCorner = eyeLandmarks[0];
                const outerCorner = eyeLandmarks[3];
                const upperMid = eyeLandmarks[1];
                const eyelashAnchor = getEyelashAnchorPoint(eyeLandmarks, isRightEye);
                const eyeWidth = Math.sqrt(Math.pow(outerCorner.x - innerCorner.x, 2) +
                    Math.pow(outerCorner.y - innerCorner.y, 2));
                const baseAngle = Math.atan2(outerCorner.y - innerCorner.y, outerCorner.x - innerCorner.x);
                const eyeCenter = {
                    x: (innerCorner.x + outerCorner.x) / 2,
                    y: (innerCorner.y + outerCorner.y) / 2
                };
                const eyelidHeight = Math.abs(upperMid.y - eyeCenter.y) * 2;
                const styleConfig = getStyleRefinementConfig(selectedStyle);
                let globalAngle = baseAngle;
                const angleDegrees = (baseAngle * 180) / Math.PI;
                if (Math.abs(angleDegrees) <= 5) {
                    globalAngle += (3 * Math.PI) / 180;
                }
                const maxRotation = 25 * Math.PI / 180;
                if (Math.abs(globalAngle) > maxRotation) {
                    globalAngle = Math.sign(globalAngle) * maxRotation;
                }
                const scaleX = (eyeWidth * 1.1) / overlayImg.width;
                const baseScaleY = Math.max(scaleX * 0.6, (eyelidHeight * 1.2) / overlayImg.height);
                const maxVerticalProjection = eyeWidth * styleConfig.maxProjectionRatio;
                const scaleY = Math.min(baseScaleY, maxVerticalProjection / overlayImg.height);
                const eyelashRootOffsetY = eyelidHeight * 0.02;
                const precisePosition = {
                    x: eyelashAnchor.anchorPoint.x,
                    y: eyelashAnchor.anchorPoint.y + eyelashRootOffsetY
                };
                const curveMidPoint = eyelashAnchor.naturalCurve[Math.floor(eyelashAnchor.naturalCurve.length / 2)];
                const curveStartPoint = eyelashAnchor.naturalCurve[0];
                const curveEndPoint = eyelashAnchor.naturalCurve[eyelashAnchor.naturalCurve.length - 1];
                const naturalCurvature = (curveMidPoint.y - ((curveStartPoint.y + curveEndPoint.y) / 2)) * styleConfig.curvatureIntensity * 0.7;
                console.log(`📊 Posicionamento PRECISO na raiz dos cílios:`);
                console.log(`   • Estilo: ${selectedStyle}`);
                console.log(`   • Largura do olho: ${eyeWidth.toFixed(1)}px`);
                console.log(`   • Ângulo global: ${(globalAngle * 180 / Math.PI).toFixed(1)}°`);
                console.log(`   • Escala: ${scaleX.toFixed(2)}x (H) × ${scaleY.toFixed(2)}x (V)`);
                console.log(`   • Posição na raiz: (${precisePosition.x.toFixed(1)}, ${precisePosition.y.toFixed(1)})`);
                console.log(`   • Offset da raiz: +${eyelashRootOffsetY.toFixed(1)}px`);
                console.log(`   • Curvatura natural: ${(naturalCurvature * 100).toFixed(1)}%`);
                console.log(`   • Pontos da base natural: ${eyelashAnchor.naturalCurve.length}`);
                ctx.save();
                ctx.translate(precisePosition.x, precisePosition.y);
                ctx.rotate(globalAngle);
                if (isRightEye) {
                    ctx.scale(-1, 1);
                }
                ctx.scale(scaleX, scaleY);
                if (Math.abs(naturalCurvature) > 1) {
                    const curveFactor = naturalCurvature / overlayImg.height;
                    ctx.transform(1, 0, curveFactor * 0.15, 1, 0, naturalCurvature * 0.2);
                }
                ctx.globalAlpha = styleConfig.blendOpacity;
                ctx.globalCompositeOperation = 'multiply';
                const overlayOriginY = -overlayImg.height * 0.85;
                ctx.drawImage(overlayImg, -overlayImg.width / 2, overlayOriginY, overlayImg.width, overlayImg.height);
                ctx.restore();
                console.log(`✅ Overlay POSICIONADO NA RAIZ ${isRightEye ? 'direito' : 'esquerdo'} aplicado com precisão fotográfica!`);
                resolve();
            }
            catch (error) {
                console.error(`❌ Erro ao aplicar overlay posicionado:`, error);
                reject(error);
            }
        };
        overlayImg.onerror = () => {
            console.error(`❌ Erro ao carregar overlay: ${overlayImageUrl}`);
            reject(new Error(`Failed to load overlay: ${overlayImageUrl}`));
        };
        overlayImg.src = overlayImageUrl;
    });
};
const generateBezierCurve = (controlPoints, segments = 20) => {
    if (controlPoints.length < 3)
        return controlPoints;
    const curvePoints = [];
    for (let i = 0; i <= segments; i++) {
        const t = i / segments;
        if (controlPoints.length === 3) {
            const point = quadraticBezier(controlPoints[0], controlPoints[1], controlPoints[2], t);
            curvePoints.push(point);
        }
        else if (controlPoints.length >= 4) {
            const point = multipleBezierCurve(controlPoints, t);
            curvePoints.push(point);
        }
    }
    return curvePoints;
};
const quadraticBezier = (p0, p1, p2, t) => {
    const u = 1 - t;
    const tt = t * t;
    const uu = u * u;
    return {
        x: uu * p0.x + 2 * u * t * p1.x + tt * p2.x,
        y: uu * p0.y + 2 * u * t * p1.y + tt * p2.y
    };
};
const multipleBezierCurve = (points, t) => {
    const n = points.length - 1;
    let x = 0;
    let y = 0;
    for (let i = 0; i <= n; i++) {
        const binomial = binomialCoefficient(n, i);
        const factor = binomial * Math.pow(1 - t, n - i) * Math.pow(t, i);
        x += factor * points[i].x;
        y += factor * points[i].y;
    }
    return { x, y };
};
const binomialCoefficient = (n, k) => {
    if (k === 0 || k === n)
        return 1;
    if (k > n - k)
        k = n - k;
    let result = 1;
    for (let i = 0; i < k; i++) {
        result = result * (n - i) / (i + 1);
    }
    return result;
};
const extractEyeLandmarks = (faceDetection) => {
    if (!faceDetection || !faceDetection.landmarks) {
        return null;
    }
    try {
        const landmarks = faceDetection.landmarks.positions;
        const leftEyeLandmarks = [
            landmarks[36],
            landmarks[37],
            landmarks[38],
            landmarks[39],
            landmarks[40],
            landmarks[41]
        ];
        const rightEyeLandmarks = [
            landmarks[42],
            landmarks[43],
            landmarks[44],
            landmarks[45],
            landmarks[46],
            landmarks[47]
        ];
        console.log(`👁️ Landmarks extraídos: ${leftEyeLandmarks.length} (esquerdo) + ${rightEyeLandmarks.length} (direito)`);
        return {
            leftEye: leftEyeLandmarks,
            rightEye: rightEyeLandmarks
        };
    }
    catch (error) {
        console.error('❌ Erro ao extrair landmarks:', error);
        return null;
    }
};
const drawEyelashAlongCurve = async (canvas, eyelashUrl, eyelidCurve, isRightEye, styleId) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) {
        throw new Error('Canvas context not available');
    }
    console.log(`🎯 Aplicando overlay com alinhamento preciso (${isRightEye ? 'direito' : 'esquerdo'})`);
    return applyEyelashOverlay(ctx, eyelashUrl, eyelidCurve, isRightEye, styleId);
};
export const applyEyelashesWithAdvancedCurvature = async (imageFile, selectedStyle) => {
    return new Promise(async (resolve, reject) => {
        try {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = async () => {
                try {
                    const eyelidCurves = await calculateEyelidCurve(img, null);
                    if (!eyelidCurves) {
                        throw new Error('Não foi possível detectar landmarks dos olhos');
                    }
                    const canvas = document.createElement('canvas');
                    canvas.width = img.width;
                    canvas.height = img.height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0);
                    const estilos = getEstilosCilios();
                    const estiloAtual = estilos.find(e => e.id === selectedStyle);
                    if (!estiloAtual) {
                        throw new Error(`Estilo '${selectedStyle}' não encontrado`);
                    }
                    const overlayUrl = estiloAtual.overlayPath;
                    await applyEyelashOverlayWithSpline(ctx, overlayUrl, eyelidCurves.leftEye, false, selectedStyle, eyelidCurves.leftEyeWidth || 80);
                    await applyEyelashOverlayWithSpline(ctx, overlayUrl, eyelidCurves.rightEye, true, selectedStyle, eyelidCurves.rightEyeWidth || 80);
                    const result = canvas.toDataURL('image/jpeg', 0.92);
                    resolve(result);
                }
                catch (error) {
                    reject(error);
                }
            };
            img.onerror = () => {
                reject(new Error('Erro ao carregar imagem'));
            };
            const reader = new FileReader();
            reader.onload = (e) => {
                img.src = e.target?.result;
            };
            reader.readAsDataURL(imageFile);
        }
        catch (error) {
            reject(error);
        }
    });
};
export const applyEyelashes = async (imageFile, selectedStyle) => {
    return new Promise(async (resolve, reject) => {
        try {
            const faceApiAvailable = await loadFaceApiModels();
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = async () => {
                try {
                    let faceData = null;
                    if (faceApiAvailable) {
                        faceData = await detectFacialLandmarks();
                    }
                    const eyelidCurves = await calculateEyelidCurve(img, faceData);
                    if (!eyelidCurves) {
                        throw new Error('Falha ao calcular landmarks dos olhos');
                    }
                    const canvas = document.createElement('canvas');
                    canvas.width = img.width;
                    canvas.height = img.height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0);
                    const estilos = getEstilosCilios();
                    const estiloAtual = estilos.find(e => e.id === selectedStyle);
                    const eyelashUrl = estiloAtual?.overlayPath || `/assets/cilios/${getEyelashFileName(selectedStyle)}`;
                    await applyCurvedEyelashOverlay(eyelidCurves.leftEye, ctx, eyelashUrl, false, selectedStyle);
                    await applyCurvedEyelashOverlay(eyelidCurves.rightEye, ctx, eyelashUrl, true, selectedStyle);
                    resolve(canvas.toDataURL('image/jpeg', 0.95));
                }
                catch (error) {
                    try {
                        let fallbackFaceData = null;
                        if (faceApiAvailable) {
                            fallbackFaceData = await detectFacialLandmarks();
                        }
                        const eyelidCurves = await calculateEyelidCurve(img, fallbackFaceData);
                        if (eyelidCurves) {
                            const canvas = document.createElement('canvas');
                            canvas.width = img.width;
                            canvas.height = img.height;
                            const ctx = canvas.getContext('2d');
                            ctx.drawImage(img, 0, 0);
                            const estilos = getEstilosCilios();
                            const estiloAtual = estilos.find(e => e.id === selectedStyle);
                            const eyelashUrl = estiloAtual?.overlayPath || `/assets/cilios/${getEyelashFileName(selectedStyle)}`;
                            await drawEyelashAlongCurve(canvas, eyelashUrl, eyelidCurves.leftEye, false, selectedStyle);
                            await drawEyelashAlongCurve(canvas, eyelashUrl, eyelidCurves.rightEye, true, selectedStyle);
                            resolve(canvas.toDataURL('image/jpeg', 0.95));
                        }
                        else {
                            reject(error);
                        }
                    }
                    catch (fallbackError) {
                        reject(error);
                    }
                }
            };
            img.onerror = () => {
                reject(new Error('Failed to load image'));
            };
            const reader = new FileReader();
            reader.onload = (e) => {
                img.src = e.target?.result;
            };
            reader.readAsDataURL(imageFile);
        }
        catch (error) {
            reject(error);
        }
    });
};
export const applyEyelashesLegacy = async (imageFile, selectedStyle) => {
    return new Promise(async (resolve, reject) => {
        try {
            const faceApiAvailable = await loadFaceApiModels();
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = async () => {
                try {
                    let faceData = null;
                    if (faceApiAvailable) {
                        faceData = await detectFacialLandmarks();
                    }
                    const eyelidCurves = await calculateEyelidCurve(img, faceData);
                    if (!eyelidCurves) {
                        throw new Error('Falha ao calcular landmarks dos olhos');
                    }
                    const canvas = document.createElement('canvas');
                    canvas.width = img.width;
                    canvas.height = img.height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0);
                    const estilos = getEstilosCilios();
                    const estiloAtual = estilos.find(e => e.id === selectedStyle);
                    const eyelashUrl = estiloAtual?.overlayPath || `/assets/cilios/${getEyelashFileName(selectedStyle)}`;
                    await drawEyelashAlongCurve(canvas, eyelashUrl, eyelidCurves.leftEye, false, selectedStyle);
                    await drawEyelashAlongCurve(canvas, eyelashUrl, eyelidCurves.rightEye, true, selectedStyle);
                    resolve(canvas.toDataURL('image/jpeg', 0.95));
                }
                catch (error) {
                    reject(error);
                }
            };
            img.onerror = () => {
                reject(new Error('Failed to load image'));
            };
            const reader = new FileReader();
            reader.onload = (e) => {
                img.src = e.target?.result;
            };
            reader.readAsDataURL(imageFile);
        }
        catch (error) {
            reject(error);
        }
    });
};
export const applyLashes = async (imageFile, styleId, onProgress) => {
    const startTime = Date.now();
    try {
        onProgress?.(10);
        let resultado;
        try {
            resultado = await applyEyelashesWithAdvancedCurvature(imageFile, styleId);
            onProgress?.(90);
        }
        catch (advancedError) {
            onProgress?.(50);
            resultado = await applyEyelashes(imageFile, styleId);
            onProgress?.(90);
        }
        const endTime = Date.now();
        const tempoProcessamento = endTime - startTime;
        onProgress?.(100);
        return {
            imagemOriginal: URL.createObjectURL(imageFile),
            estiloSelecionado: styleId,
            imagemProcessada: resultado,
            status: 'concluido',
            tempoProcessamento,
            metadata: {
                tamanhoOriginal: imageFile.size,
                tamanhoProcessada: Math.round(resultado.length * 0.75),
                qualidade: 92
            }
        };
    }
    catch (error) {
        return {
            imagemOriginal: URL.createObjectURL(imageFile),
            estiloSelecionado: styleId,
            status: 'erro',
            erro: error instanceof Error ? error.message : 'Erro desconhecido'
        };
    }
};
export const downloadProcessedImage = (imagemBase64, nomeArquivo = 'cilios-aplicados') => {
    try {
        const link = document.createElement('a');
        link.href = imagemBase64;
        link.download = `${nomeArquivo}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
    catch (error) {
        alert('Erro ao fazer download da imagem');
    }
};
