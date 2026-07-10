let commands = [];

const stringEmpty = ''
const noHistoryFileFound = 'NO_HISTORY_FILE_FOUND'

window.stringEmpty = stringEmpty

document.addEventListener('DOMContentLoaded', () => {
    if (typeof Neutralino !== 'undefined') {
        Neutralino.init();
    }
});

async function resolveScriptDir() {
    const config = await Neutralino.app.getConfig();
    const resourcePath = config.modes?.window?.icon  ? config.modes.window.icon.replace('/icons/appIcon.png', stringEmpty) : './resources';
    const scriptsDir = resourcePath.endsWith('resources') ? `${resourcePath}/scripts` : './resources/scripts';

    return scriptsDir;
}

function resolveOSCommand(scriptsDir) {
    const winPlatform = 'win'
    const platform = window.navigator.platform.toLowerCase();

    if (platform.includes(winPlatform)) {
        return `powershell -ExecutionPolicy Bypass -File "./${scriptsDir}/get_history.ps1"`;
    } else {
        return `bash "./${scriptsDir}/get_history.sh"`;
    }
}

async function loadHistory() {
    const content = document.getElementById('content');
    content.innerHTML = '<div class="loading"><span>Cargando historial...</span></div>';

    try {
        const scriptsDir = await resolveScriptDir()
        const command = resolveOSCommand(scriptsDir);
        const result = await Neutralino.os.execCommand(command);

        if (result.stdOut && !result.stdOut.includes(noHistoryFileFound)) {
            const lines = result.stdOut.split('\n').filter(l => l.trim() !== stringEmpty);
            
            commands = lines.reverse().map((cmd, index) => ({
                id: lines.length - index,
                text: cmd.trim()
            }));

            renderCommands(commands);
            updateStats(commands.length);
        } else {
            throw new Error('No se encontraron registros.');
        }
    } catch (err) {
        content.innerHTML = `<div class="error">Error: ${err.message || err}</div>`;
    }
}

function renderCommands(list) {
    const maxLength = 4;
    const container = document.getElementById('content');

    if (!list.length) {
        container.innerHTML = '<div class="empty-state"><p>No hay coincidencias</p></div>';

        return;
    }

    container.innerHTML = list.map(cmd => `
        <div class="command-item">
            <span class="cmd-index">${String(cmd.id).padStart(maxLength, '0')}</span>
            <span class="cmd-text">${escapeHtml(cmd.text)}</span>
            <button 
                class="copy-btn" 
                onclick="copyToClipboard('${escapeAttr(cmd.text)}', this)"
                title="Copiar comando"
                aria-label="Copiar comando"
            >
            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
            </svg>
        </div>
    `).join(stringEmpty);
}

function filterCommands() {
    const term = document.getElementById('searchInput').value.toLowerCase();
    const filtered = commands.filter(command => command.text.toLowerCase().includes(term));
    renderCommands(filtered);
    updateStats(filtered.length);
}

function updateStats(count) {
    document.getElementById('count-display').innerText = `${count} registros`;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;

    return div.innerHTML;
}

async function copyToClipboard(text, btnElement) {
    try {
        const timeOut = 2000;
        await Neutralino.clipboard.writeText(text);
        const row = btnElement.closest('.command-item');

        if (row) {
            row.classList.add('copied-indicator');
            setTimeout(() => row.classList.remove('copied-indicator'), timeOut);
        }

        showCopyFeedback(btnElement);
    } catch (err) {
        console.error('Error al copiar:', err);
    }
}

function showCopyFeedback(btnElement) {
    const timeOut = 2000;
    const originalHTML = btnElement.innerHTML;
    btnElement.innerHTML = '✓';
    btnElement.classList.add('copied');
    setTimeout(() => {
        btnElement.innerHTML = originalHTML;
        btnElement.classList.remove('copied');
    }, timeOut);
}

function escapeAttr(text) {
    return text
        .replace(/\\/g, '\\\\')
        .replace(/'/g, "\\'")
        .replace(/"/g, '&quot;')
        .replace(/\n/g, '\\n');
}
