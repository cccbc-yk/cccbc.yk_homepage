/**
 * rotating_logo_3d.js
 * ロゴを3D押し出し（Extrude）し、銀色の側面を持たせて回転させるエンジン
 */

(function () {
    const container = document.getElementById('logo-3d-container');
    if (!container) return;

    const LOGO_SRC = 'assets/webp/Y2K同好会ロゴ.webp';
    const EXTRUDE_DEPTH = 80;

    let scene, camera, renderer, logoMesh;
    let rotationSpeed = 0.02;
    let currentVelocity = 0.02;
    const baseAcceleration = 0.0005;
    let isHovered = false;

    // --- 1. 初期化 ---
    function init() {
        const width = container.clientWidth;
        const height = container.clientHeight;

        scene = new THREE.Scene();

        camera = new THREE.PerspectiveCamera(45, width / height, 1, 1000);
        camera.position.z = 400;

        renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        renderer.setSize(width, height);
        renderer.setPixelRatio(window.devicePixelRatio);
        container.appendChild(renderer.domElement);

        // ライティング (銀色の質感を出すために重要)
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);

        const dirLight = new THREE.DirectionalLight(0xffffff, 1.0);
        dirLight.position.set(200, 200, 500);
        scene.add(dirLight);

        const sideLight = new THREE.PointLight(0x00d2ff, 0.8);
        sideLight.position.set(-200, -100, 100);
        scene.add(sideLight);

        loadLogo();
        animate();

        // イベント
        container.addEventListener('mouseenter', () => isHovered = true);
        container.addEventListener('mouseleave', () => isHovered = false);
    }

    // --- 2. ロゴの読み込みと3D化 ---
    function loadLogo() {
        const textureLoader = new THREE.TextureLoader();
        textureLoader.load(LOGO_SRC, (texture) => {
            const img = texture.image;

            // キャンバスで透過情報を解析して輪郭を抽出
            const canvas = document.createElement('canvas');
            const scanScale = 0.5; // 解析負荷を下げる
            canvas.width = img.width * scanScale;
            canvas.height = img.height * scanScale;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

            // 像の形状を抽出 (簡易的な矩形ベースの近似 or 四角形押し出し)
            // 本格的なパス抽出は複雑なため、ピクセルの塊をShapeとして構築
            const shape = createShapeFromAlpha(imageData, 2); // 2pxステップでサンプリング

            const extrudeSettings = {
                depth: EXTRUDE_DEPTH,
                bevelEnabled: true,
                bevelThickness: 2,
                bevelSize: 2,
                bevelOffset: 0,
                bevelSegments: 3
            };

            const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
            geometry.center();

            // --- ★ 前面に画像を正しく貼り付けるためのUV正規化 ---
            geometry.computeBoundingBox();
            const min = geometry.boundingBox.min;
            const max = geometry.boundingBox.max;
            const size = new THREE.Vector3().subVectors(max, min);

            const uvAttr = geometry.attributes.uv;
            for (let i = 0; i < uvAttr.count; i++) {
                // ExtrudeGeometryの最初のグループ(index 0)が表面と裏面
                // UV座標をバウンディングボックスに基づいて0.0〜1.0に変換
                let u = (geometry.attributes.position.getX(i) - min.x) / size.x;
                let v = (geometry.attributes.position.getY(i) - min.y) / size.y;
                uvAttr.setXY(i, u, v);
            }
            uvAttr.needsUpdate = true;

            // マテリアル設定
            // 表面素材: 画像を貼り付け (古さを出すため光沢なしのBasic)
            const frontMaterial = new THREE.MeshBasicMaterial({
                map: texture,
                transparent: true
            });

            // 側面素材: 灰色のマットな金属
            const sideMaterial = new THREE.MeshStandardMaterial({
                color: 0x777777,
                metalness: 0.5,
                roughness: 0.8
            });

            // グループ設定 (0: キャップ面, 1: 側面)
            logoMesh = new THREE.Mesh(geometry, [frontMaterial, sideMaterial]);

            // 座標補正 (テクスチャが正しく見えるように、かつサイズを半分に)
            logoMesh.rotation.x = 0;
            logoMesh.scale.set(0.3, -0.3, 0.3); // サイズを半分に

            scene.add(logoMesh);
        });
    }

    /**
     * アルファ値から実際の輪郭(Contour)を抽出してShapeを生成する
     * 境界を1周「歩いて」追跡することで、複雑な「とげ」や凹凸を完璧に再現する
     */
    function createShapeFromAlpha(imageData) {
        const { data, width, height } = imageData;
        const threshold = 120;

        // --- 1. 開始点を探す (最初に見つかった不透明ピクセル) ---
        let startX = -1, startY = -1;
        for (let y = 0; y < height && startX === -1; y++) {
            for (let x = 0; x < width; x++) {
                if (data[(y * width + x) * 4 + 3] > threshold) {
                    startX = x; startY = y;
                    break;
                }
            }
        }

        if (startX === -1) {
            const s = new THREE.Shape();
            s.moveTo(-50, -50); s.lineTo(50, -50); s.lineTo(50, 50); s.lineTo(-50, 50);
            return s;
        }

        // --- 2. 輪郭追跡（Moore Neighborhood / 手壁法） ---
        const pts = [];
        let currX = startX, currY = startY;
        let prevX = startX - 1, prevY = startY;

        // 8方向の時計回りの相対座標
        const dx = [0, 1, 1, 1, 0, -1, -1, -1];
        const dy = [-1, -1, 0, 1, 1, 1, 0, -1];

        let limit = 5000; // 無限ループ防止
        while (limit-- > 0) {
            pts.push({ x: currX, y: currY });

            // 直前の位置から時計回りに次を探す
            let startAngle = 0;
            for (let i = 0; i < 8; i++) {
                if (currX + dx[i] === prevX && currY + dy[i] === prevY) {
                    startAngle = (i + 1) % 8;
                    break;
                }
            }

            let found = false;
            for (let i = 0; i < 8; i++) {
                const angle = (startAngle + i) % 8;
                const nextX = currX + dx[angle];
                const nextY = currY + dy[angle];

                if (nextX >= 0 && nextX < width && nextY >= 0 && nextY < height) {
                    if (data[(nextY * width + nextX) * 4 + 3] > threshold) {
                        prevX = currX; prevY = currY;
                        currX = nextX; currY = nextY;
                        found = true;
                        break;
                    }
                }
            }

            if (!found || (currX === startX && currY === startY)) break;
        }

        // --- 3. Shapeに変換 ---
        const shape = new THREE.Shape();
        const factor = 1.0 / 0.5;
        const offsetX = width / 2;
        const offsetY = height / 2;

        if (pts.length > 0) {
            shape.moveTo((pts[0].x - offsetX) * factor, (offsetY - pts[0].y) * factor);
            // 負荷軽減のためサンプリング間隔を調整
            for (let i = 1; i < pts.length; i += 1) {
                shape.lineTo((pts[i].x - offsetX) * factor, (offsetY - pts[i].y) * factor);
            }
            shape.closePath();
        }

        return shape;
    }

    // --- 3. アニメーション ---
    function animate() {
        requestAnimationFrame(animate);

        if (logoMesh) {
            // 基本の加速度
            currentVelocity += baseAcceleration;

            // マウスオーバー時は減速（摩擦）を追加
            if (isHovered) {
                currentVelocity *= 0.95; // 5%ずつ減速
            } else {
                // 通常時の速度制限
                if (currentVelocity > 0.04) currentVelocity = 0.04;
                if (currentVelocity < 0.01) currentVelocity = 0.01;
            }

            logoMesh.rotation.y += currentVelocity;

            // 昔のスクリーンセーバー風のゆらぎ
            logoMesh.rotation.x = Math.PI + Math.sin(Date.now() * 0.001) * 0.1;
        }

        renderer.render(scene, camera);
    }

    init();
})();
