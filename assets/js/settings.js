document.addEventListener('DOMContentLoaded', () => {
    const lockScreen = document.getElementById('lockScreen');
    const settingsContent = document.getElementById('settingsContent');
    const loginBtn = document.getElementById('loginBtn');
    const passwordInput = document.getElementById('adminPassword');
    const loginError = document.getElementById('loginError');

    // Password logic
    const ADMIN_PASSWORD = "admin";

    // Check if already authenticated in this session
    if (sessionStorage.getItem('admin_auth') === 'true') {
        unlockSettings();
    }

    // Login button click
    loginBtn.addEventListener('click', attemptLogin);
    
    // Enter key press
    passwordInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') attemptLogin();
    });

    function attemptLogin() {
        if (passwordInput.value === ADMIN_PASSWORD) {
            sessionStorage.setItem('admin_auth', 'true');
            unlockSettings();
        } else {
            loginError.style.display = 'block';
            loginError.textContent = 'パスワードが間違っています。';
            passwordInput.value = '';
            
            // Add shake animation
            const lockBox = document.querySelector('.lock-box');
            lockBox.style.animation = 'shake 0.5s';
            setTimeout(() => lockBox.style.animation = '', 500);
        }
    }

    function unlockSettings() {
        lockScreen.style.display = 'none';
        settingsContent.style.display = 'block';
        loadSettings();
    }

    // --- Settings Logic ---
    const themeSelect = document.getElementById('themeSelect');
    const fontSizeRange = document.getElementById('fontSizeRange');
    const fontSizeValue = document.getElementById('fontSizeValue');
    const disable3dCheck = document.getElementById('disable3dCheck');
    const cursorSelect = document.getElementById('cursorSelect');
    const bbsLoginCheck = document.getElementById('bbsLoginCheck');
    
    // Load current values
    function loadSettings() {
        themeSelect.value = localStorage.getItem('site_theme') || 'default';
        fontSizeRange.value = localStorage.getItem('site_font_size') || '100';
        fontSizeValue.textContent = `${fontSizeRange.value}%`;
        disable3dCheck.checked = localStorage.getItem('site_disable_3d') === 'true';
        cursorSelect.value = localStorage.getItem('site_cursor') || 'default';
        if (bbsLoginCheck) {
            bbsLoginCheck.checked = localStorage.getItem('bbs_login_required') === 'true';
        }

        // Set developer info
        document.getElementById('devUserAgent').textContent = navigator.userAgent;
        document.getElementById('devScreen').textContent = `${window.screen.width} x ${window.screen.height}`;
    }

    // Save and Apply instantly for each setting
    themeSelect.addEventListener('change', (e) => {
        localStorage.setItem('site_theme', e.target.value);
        // Remove existing theme classes
        document.documentElement.className = document.documentElement.className.replace(/\btheme-\S+/g, '');
        if (e.target.value !== 'default') {
            document.documentElement.classList.add(`theme-${e.target.value}`);
        }
    });

    fontSizeRange.addEventListener('input', (e) => {
        const val = e.target.value;
        fontSizeValue.textContent = `${val}%`;
        localStorage.setItem('site_font_size', val);
        document.documentElement.style.fontSize = `${val}%`;
    });

    disable3dCheck.addEventListener('change', (e) => {
        localStorage.setItem('site_disable_3d', e.target.checked);
        const existingStyle = document.getElementById('disable3dStyle');
        const logoTarget = document.getElementById('logo-3d-container');
        if (e.target.checked) {
            if (!existingStyle) {
                const style = document.createElement('style');
                style.id = 'disable3dStyle';
                style.innerHTML = `#logo-3d-container, #headerCanvas { display: none !important; }`;
                document.head.appendChild(style);
            }
        } else {
            if (existingStyle) {
                existingStyle.remove();
            }
            if (logoTarget) logoTarget.style.display = 'block';
        }
    });

    cursorSelect.addEventListener('change', (e) => {
        const type = e.target.value;
        localStorage.setItem('site_cursor', type);
        document.documentElement.style.cursor = type;
        if(type !== 'default') {
            let style = document.getElementById('customCursorStyle');
            if(!style) {
                style = document.createElement('style');
                style.id = 'customCursorStyle';
                document.head.appendChild(style);
            }
            style.innerHTML = `* { cursor: ${type} !important; }`;
        } else {
            const style = document.getElementById('customCursorStyle');
            if(style) style.remove();
        }
    });

    if (bbsLoginCheck) {
        bbsLoginCheck.addEventListener('change', (e) => {
            localStorage.setItem('bbs_login_required', e.target.checked);
        });
    }

    // Clear Data
    document.getElementById('clearDataBtn').addEventListener('click', () => {
        if(confirm('本当にすべての設定とローカルデータを初期化しますか？\n(BBSのユーザー名等も消去されます)')) {
            localStorage.clear();
            sessionStorage.clear();
            alert('初期化が完了しました。ページをリロードします。');
            location.reload();
        }
    });
});

// Add keyframes for shake animation dynamically
const style = document.createElement('style');
style.innerHTML = `
@keyframes shake {
  0% { transform: translateX(0); }
  25% { transform: translateX(-10px); }
  50% { transform: translateX(10px); }
  75% { transform: translateX(-10px); }
  100% { transform: translateX(0); }
}`;
document.head.appendChild(style);
