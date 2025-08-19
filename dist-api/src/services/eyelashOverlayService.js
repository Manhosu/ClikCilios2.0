import { generateEyelidSplineCurve, calculateEyeAngle } from './faceMeshService';
export const getBlendModeConfig = (styleId) => {
    const configs = {
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
    };
    return configs[styleId] || configs['brasileiro-boneca'];
};
export const applyEyelashOverlayWithSpline = async (ctx, overlayImageUrl, eyelidLandmarks, isRightEye, styleId, eyeWidth) => {
    return new Promise((resolve, reject) => {
        const overlayImg = new Image();
        overlayImg.crossOrigin = 'anonymous';
        overlayImg.onload = () => {
            try {
                const splineCurve = generateEyelidSplineCurve(eyelidLandmarks, 25);
                const innerCorner = eyelidLandmarks[0];
                const outerCorner = eyelidLandmarks[eyelidLandmarks.length - 1];
                const eyeAngle = calculateEyeAngle(innerCorner, outerCorner);
                const blendConfig = getBlendModeConfig(styleId);
                const targetWidth = eyeWidth * blendConfig.scaleFactorX;
                const targetHeight = Math.max((targetWidth * blendConfig.scaleFactorY), (eyeWidth * 0.3));
                const scaleX = targetWidth / overlayImg.width;
                const scaleY = targetHeight / overlayImg.height;
                ctx.save();
                ctx.shadowColor = blendConfig.shadowColor;
                ctx.shadowBlur = blendConfig.shadowBlur;
                ctx.shadowOffsetX = 0;
                ctx.shadowOffsetY = blendConfig.shadowOffsetY;
                ctx.globalCompositeOperation = blendConfig.blendMode;
                ctx.globalAlpha = blendConfig.opacity;
                applySplineBasedDeformation(ctx, overlayImg, splineCurve, scaleX, scaleY, eyeAngle, isRightEye, blendConfig);
                ctx.restore();
                resolve();
            }
            catch (error) {
                reject(error);
            }
        };
        overlayImg.onerror = () => {
            reject(new Error(`Falha ao carregar overlay: ${overlayImageUrl}`));
        };
        overlayImg.src = overlayImageUrl;
    });
};
const applySplineBasedDeformation = (ctx, overlayImg, splineCurve, scaleX, scaleY, eyeAngle, isRightEye, config) => {
    const centerIndex = Math.floor(splineCurve.length / 2);
    const centerPoint = splineCurve[centerIndex];
    const transformedWidth = overlayImg.width * scaleX;
    const transformedHeight = overlayImg.height * scaleY;
    ctx.save();
    ctx.translate(centerPoint.x, centerPoint.y);
    ctx.rotate(eyeAngle);
    if (isRightEye) {
        ctx.scale(-1, 1);
    }
    if (config.warpStrength > 0 && splineCurve.length > 10) {
        applySubtleCurveWarp(ctx, overlayImg, splineCurve, config.warpStrength, transformedWidth, transformedHeight);
    }
    else {
        ctx.drawImage(overlayImg, -transformedWidth / 2, -transformedHeight / 2, transformedWidth, transformedHeight);
    }
    ctx.restore();
};
const applySubtleCurveWarp = (ctx, overlayImg, splineCurve, warpStrength, width, height) => {
    const segments = Math.min(splineCurve.length / 3, 8);
    const segmentHeight = height / segments;
    for (let i = 0; i < segments; i++) {
        const t = i / (segments - 1);
        const yOffset = Math.sin(t * Math.PI) * warpStrength * height * 0.1;
        ctx.drawImage(overlayImg, 0, i * overlayImg.height / segments, overlayImg.width, overlayImg.height / segments, -width / 2, (-height / 2) + (i * segmentHeight) + yOffset, width, segmentHeight);
    }
};
export const generateEyelashPreview = async (styleId) => {
    return new Promise((resolve, reject) => {
        const canvas = document.createElement('canvas');
        canvas.width = 200;
        canvas.height = 100;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const mockEyeLandmarks = [
            { x: 20, y: 50 },
            { x: 50, y: 40 },
            { x: 100, y: 35 },
            { x: 150, y: 40 },
            { x: 180, y: 50 }
        ];
        const overlayPath = `/assets/cilios/${getEyelashFileName(styleId)}`;
        applyEyelashOverlayWithSpline(ctx, overlayPath, mockEyeLandmarks, false, styleId, 160).then(() => {
            resolve(canvas.toDataURL('image/png'));
        }).catch(reject);
    });
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
