(function() {
    // Read settings from localStorage
    const savedTheme = localStorage.getItem('site_theme') || 'default';
    const savedFontSize = localStorage.getItem('site_font_size') || '100';
    const disable3D = localStorage.getItem('site_disable_3d') === 'true';
    const cursorType = localStorage.getItem('site_cursor') || 'default';

    // Apply font size
    document.documentElement.style.fontSize = `${savedFontSize}%`;

    // Apply theme via class
    if (savedTheme !== 'default') {
        document.documentElement.classList.add(`theme-${savedTheme}`);
    }

    // Apply cursor
    if (cursorType !== 'default') {
        document.documentElement.style.cursor = cursorType;
        const style = document.createElement('style');
        style.id = 'customCursorStyle';
        style.innerHTML = `* { cursor: ${cursorType} !important; }`;
        document.head.appendChild(style);
    }

    // Apply 3D Logo / Canvas disable
    if (disable3D) {
        const style = document.createElement('style');
        style.id = 'disable3dStyle';
        style.innerHTML = `#logo-3d-container, #headerCanvas { display: none !important; }`;
        document.head.appendChild(style);
    }
})();
