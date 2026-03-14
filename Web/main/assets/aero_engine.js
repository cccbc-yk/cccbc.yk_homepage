/**
 * Frutiger Aero Render Engine (Web Production Version)
 * Optimized for high-performance canvas rendering and SVG path extraction.
 */

const RESOLUTION_SCALE = 2;
let userSvg = null;
let userPaths = [];
let svgViewBox = { x: 0, y: 0, w: 800, h: 450 };

/**
 * SVGからパスデータと座標マトリクスを抽出する
 */
async function processSvg(svgText) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgText, 'image/svg+xml');
    const svgEl = doc.querySelector('svg');

    if (!svgEl) return;

    // ViewBoxの取得
    const vbAttr = svgEl.getAttribute('viewBox');
    if (vbAttr) {
        const parts = vbAttr.split(/[\s,]+/).map(parseFloat);
        svgViewBox = { x: parts[0], y: parts[1], w: parts[2], h: parts[3] };
    } else {
        svgViewBox = { x: 0, y: 0, w: parseFloat(svgEl.getAttribute('width') || 800), h: parseFloat(svgEl.getAttribute('height') || 450) };
    }

    // ブラウザの計算機能を利用するために一時的にDOMにマウント
    const tempContainer = document.createElement('div');
    tempContainer.style.visibility = 'hidden';
    tempContainer.style.position = 'absolute';
    tempContainer.style.width = '0';
    tempContainer.style.height = '0';
    tempContainer.innerHTML = svgText;
    document.body.appendChild(tempContainer);

    const mountedSvg = tempContainer.querySelector('svg');
    userPaths = [];

    const shapes = mountedSvg.querySelectorAll('path, rect, circle, ellipse, line, polyline, polygon');
    shapes.forEach(shape => {
        let d = "";
        const tag = shape.tagName.toLowerCase();
        
        // 基本形状をパス文字列に変換
        if (tag === 'path') d = shape.getAttribute('d');
        else if (tag === 'rect') {
            const x = parseFloat(shape.getAttribute('x') || 0), y = parseFloat(shape.getAttribute('y') || 0);
            const w = parseFloat(shape.getAttribute('width') || 0), h = parseFloat(shape.getAttribute('height') || 0);
            d = `M ${x} ${y} H ${x+w} V ${y+h} H ${x} Z`;
        } else if (tag === 'circle') {
            const cx = parseFloat(shape.getAttribute('cx') || 0), cy = parseFloat(shape.getAttribute('cy') || 0), r = parseFloat(shape.getAttribute('r') || 0);
            d = `M ${cx-r} ${cy} A ${r} ${r} 0 1 0 ${cx+r} ${cy} A ${r} ${r} 0 1 0 ${cx-r} ${cy}`;
        } else if (tag === 'ellipse') {
            const cx = parseFloat(shape.getAttribute('cx') || 0), cy = parseFloat(shape.getAttribute('cy') || 0), rx = parseFloat(shape.getAttribute('rx') || 0), ry = parseFloat(shape.getAttribute('ry') || 0);
            d = `M ${cx-rx} ${cy} A ${rx} ${ry} 0 1 0 ${cx+rx} ${cy} A ${rx} ${ry} 0 1 0 ${cx-rx} ${cy}`;
        }

        if (d) {
            // 絶対座標マトリクスの取得 (Inkscape等のtransformを解決)
            const ctm = shape.getCTM();
            userPaths.push({
                path: new Path2D(d),
                matrix: ctm || { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 }
            });
        }
    });

    document.body.removeChild(tempContainer);

    // 画像オブジェクト化
    const blob = new Blob([svgText], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    return new Promise((resolve) => {
        img.onload = () => {
            userSvg = img;
            resolve();
        };
        img.src = url;
    });
}

/**
 * レンダリングコア
 */
function render(ctx, w, h) {
    if (!userSvg) return;

    ctx.clearRect(0, 0, w, h);
    const cx = w / 2;
    const cy = h / 2;
    const svgW = w * 0.95; // ヘッダーいっぱいに広げる
    const svgH = h * 0.95;

    ctx.save();
    ctx.translate(cx, cy);

    // 1. 環境光・ベースグラデーション
    let bgGrad = ctx.createLinearGradient(0, -svgH/2, 0, svgH/2);
    bgGrad.addColorStop(0, 'rgba(0, 180, 255, 0.6)');
    bgGrad.addColorStop(1, 'rgba(0, 40, 120, 0.3)');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(-svgW/2, -svgH/2, svgW, svgH);

    // 2. 窓反射 (切れ込み入り)
    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
    const drawWindow = () => {
        ctx.beginPath();
        ctx.moveTo(-svgW*0.2, -svgH*0.4);
        ctx.bezierCurveTo(0, -svgH*0.45, 0, -svgH*0.45, svgW*0.1, -svgH*0.38);
        ctx.lineTo(svgW*0.05, -svgH*0.12);
        ctx.bezierCurveTo(-svgW*0.1, -svgH*0.15, -svgW*0.1, -svgH*0.15, -svgW*0.3, -svgH*0.1);
        ctx.closePath();
    };
    drawWindow();
    ctx.clip();
    ctx.fillRect(-svgW, -svgH, svgW * 0.85, svgH);
    ctx.fillRect(-svgW * 0.1, -svgH, svgW, svgH);
    ctx.restore();

    // 3. ボトムシャドウ
    let shadowGrad = ctx.createLinearGradient(0, 0, 0, svgH/2);
    shadowGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
    shadowGrad.addColorStop(1, 'rgba(0, 5, 20, 0.6)');
    ctx.fillStyle = shadowGrad;
    ctx.fillRect(-svgW/2, 0, svgW, svgH/2);

    // 4. 型抜き (Masking)
    ctx.globalCompositeOperation = 'destination-in';
    ctx.drawImage(userSvg, -svgW/2, -svgH/2, svgW, svgH);

    // 5. 精密パスエフェクト (SDF Bevel シミュレーター)
    ctx.globalCompositeOperation = 'source-over';
    const vb = svgViewBox;
    const globalScaleX = svgW / vb.w;
    
    userPaths.forEach(item => {
        ctx.save();
        ctx.scale(globalScaleX, globalScaleX); // アスペクト比維持のため片方基準
        ctx.translate(-vb.x - vb.w/2, -vb.y - vb.h/2);
        const m = item.matrix;
        ctx.transform(m.a, m.b, m.c, m.d, m.e, m.f);

        // a. 暗い境界線
        ctx.strokeStyle = 'rgba(0, 5, 20, 0.6)'; 
        ctx.lineWidth = 2 / globalScaleX; 
        ctx.stroke(item.path);

        // b. エルゴノミクス・ベベル
        ctx.save();
        ctx.globalCompositeOperation = 'source-atop';
        const heightCurve = (x) => Math.sin(x * Math.PI / 2);
        const maxDistance = 35; 
        const steps = 25;
        let lightMask = ctx.createLinearGradient(0, vb.y, 0, vb.y + vb.h * 0.5);
        lightMask.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
        lightMask.addColorStop(1, 'rgba(255, 255, 255, 0)');

        for (let i = steps; i > 0; i--) {
            let r = i / steps;
            ctx.globalAlpha = 0.7 * (1 - heightCurve(r));
            ctx.strokeStyle = lightMask;
            ctx.lineWidth = (maxDistance * r) / globalScaleX;
            ctx.stroke(item.path);
        }
        ctx.restore();

        // c. 最表面ハイライト
        ctx.save();
        ctx.globalCompositeOperation = 'source-atop';
        let sharpGrad = ctx.createLinearGradient(0, vb.y, 0, vb.y + vb.h * 0.15);
        sharpGrad.addColorStop(0, 'rgba(255, 255, 255, 1.0)');
        sharpGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.strokeStyle = sharpGrad;
        ctx.lineWidth = 1.5 / globalScaleX; 
        ctx.stroke(item.path);
        ctx.restore();

        ctx.restore();
    });

    // 6. 背面合成 (本体とオーラグロー)
    ctx.globalCompositeOperation = 'destination-over';
    ctx.drawImage(userSvg, -svgW/2, -svgH/2, svgW, svgH);
    ctx.save();
    ctx.shadowBlur = 30;
    ctx.shadowColor = 'rgba(0, 180, 255, 0.4)';
    ctx.drawImage(userSvg, -svgW/2, -svgH/2, svgW, svgH);
    ctx.restore();

    ctx.restore();
}

/**
 * ジャギー感を出すポストプロセッサ (Rough Cut)
 */
function applyRoughCut(ctx, w, h) {
    const imgData = ctx.getImageData(0, 0, w, h);
    const data = imgData.data;
    for (let i = 0; i < data.length; i += 4) {
        if (data[i + 3] < 120) data[i + 3] = 0;
        else if (data[i + 3] < 255) data[i + 3] = 255;
    }
    ctx.putImageData(imgData, 0, 0);
}
