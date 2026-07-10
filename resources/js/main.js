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
