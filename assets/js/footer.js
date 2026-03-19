/**
 * footer.js
 * 共通フッターを動的に挿入するスクリプト
 */
document.addEventListener('DOMContentLoaded', () => {
    const footerElements = document.querySelectorAll('.footer');

    // フッターの内容（ここを書き換えるだけで全ページに反映されます）
    const footerHTML = `
        <div class="footer-content">
            <p>Copyright© cccbc.yk 2026
                <br>
                Powered by <a href="https://pages.github.com/" target="_blank" rel="noopener noreferrer" style="color: aliceblue; text-decoration: underline;">Github Pages</a> sakura internet
            </p>
        </div>
    `;

    footerElements.forEach(footer => {
        footer.innerHTML = footerHTML;
    });
});
