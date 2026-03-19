/**
 * header_manager.js
 * ヘッダーに動的にボタンを追加するためのクラス
 */

class HeaderButton {
    /**
     * @param {Object} options
     * @param {string} options.icon - アイコン名 (assets/images/ 内)
     * @param {number} options.x - 左からの距離 (px)
     * @param {number} options.y - 上からの距離 (px)
     * @param {string} options.link - 遷移先URL (ルート基準の相対パス、例: ./index.html)
     * @param {string} [options.tooltip] - ツールチップ表示名
     */
    constructor({ icon, x, y, link, tooltip = "" }) {
        this.icon = icon;
        this.x = x;
        this.y = y;
        this.link = link;
        this.tooltip = tooltip;
        
        // パスの判別
        this.isSubDir = window.location.pathname.includes('/html/');
        this.basePath = this.isSubDir ? '../' : './';
        
        this.init();
    }

    resolveLink(link) {
        // httpで始まる場合はそのまま
        if (link.startsWith('http')) return link;
        
        if (this.isSubDir) {
            // html/ フォルダ内にいる場合
            if (link.startsWith('./html/')) {
                // ./html/xxx.html -> ./xxx.html
                return link.replace('./html/', './');
            } else if (link === './index.html') {
                // ./index.html -> ../index.html
                return '../index.html';
            }
        }
        return link;
    }

    init() {
        document.addEventListener('DOMContentLoaded', () => {
            const container = document.getElementById('canvas-wrap');
            if (!container) return;

            // 要素の作成
            const btn = document.createElement('a');
            btn.href = this.resolveLink(this.link);
            btn.className = 'header-btn';
            btn.style.left = `${this.x}px`;
            btn.style.top = `${this.y}px`;
            if (this.tooltip) btn.title = this.tooltip;

            // アイコンの作成
            const img = document.createElement('img');
            img.src = this.icon.startsWith('http') ? this.icon : `${this.basePath}assets/images/${this.icon}`;
            img.alt = this.tooltip || 'header button';

            btn.appendChild(img);
            container.appendChild(btn);
        });
    }
}

// --- 共通ヘッダーボタンの設定 (ここを編集すると全ページに反映されます) ---
const commonHeaderButtons = [
    { icon: 'Administrator.webp', x: 640, y: 50, link: './html/settings.html', tooltip: 'サイト設定' },
    { icon: 'home.webp',          x: 720, y: 30, link: './index.html',         tooltip: 'ホーム' },
    { icon: 'chatroom.webp',      x: 802, y: 55, link: './html/bbs.html',      tooltip: '掲示板' }
];

// ボタンの初期化
commonHeaderButtons.forEach(config => new HeaderButton(config));

// グローバルに公開
window.HeaderButton = HeaderButton;

