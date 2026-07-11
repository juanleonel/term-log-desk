import { paginationUtils } from './pagination.utils.js';
import { serializeCommandsToText, downloadTextFile } from './import.utils.js';

let commands = [];
let filteredCommands = [];
let currentPage = 1;

const stringEmpty = '';
const noHistoryFileFound = 'NO_HISTORY_FILE_FOUND';
const ITEMS_PER_PAGE = paginationUtils?.defaultItemsPerPage || 50;

window.stringEmpty = stringEmpty;

// Neutralino.window.onClose(() => {
//   Neutralino.app.exit(); 
// });

document.addEventListener('DOMContentLoaded', () => {
    if (typeof Neutralino !== 'undefined') {
        Neutralino.init();
    }
    const content = document.getElementById('content');
    const searchInput = document.getElementById('searchInput');
    const loadButton = document.getElementById('loadButton');
    const exportButton = document.getElementById('exportButton');
    const aboutButton = document.getElementById('aboutButton');
    const aboutModal = document.getElementById('aboutModal');
    const closeAboutModal = document.getElementById('closeAboutModal');
    const exportModal = document.getElementById('exportModal');
    const closeExportModal = document.getElementById('closeExportModal');
    const confirmExportButton = document.getElementById('confirmExportButton');

    if (content) {
        content.addEventListener('click', handleContentClick);
    }

    if (searchInput) {
        searchInput.addEventListener('input', filterCommands);
    }

    if (loadButton) {
        loadButton.addEventListener('click', loadHistory);
    }

    if (exportButton) {
        exportButton.addEventListener('click', () => {
            exportModal.hidden = false;
        });
    }

    if (aboutButton && aboutModal) {
        aboutButton.addEventListener('click', async () => {
            await populateAboutInfo(aboutModal);
            aboutModal.hidden = false;
        });
    }

    if (closeAboutModal && aboutModal) {
        closeAboutModal.addEventListener('click', () => {
            aboutModal.hidden = true;
        });
    }

    if (closeExportModal && exportModal) {
        closeExportModal.addEventListener('click', () => {
            exportModal.hidden = true;
        });
    }

    if (confirmExportButton && exportModal) {
        confirmExportButton.addEventListener('click', () => {
            const selectedScope = document.querySelector('input[name="exportScope"]:checked')?.value;
            exportModal.hidden = true;
            exportCommandsToTxt(selectedScope === 'all');
        });
    }

    [aboutModal, exportModal].forEach((modal) => {
        if (!modal) {
            return;
        }

        modal.addEventListener('click', (event) => {
            if (event.target === modal) {
                modal.hidden = true;
            }
        });
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            if (aboutModal) {
                aboutModal.hidden = true;
            }
            if (exportModal) {
                exportModal.hidden = true;
            }
        }
    });
});

async function resolveScriptDir() {
    const config = await Neutralino.app.getConfig();
    const resourcePath = config.modes?.window?.icon ? config.modes.window.icon.replace('/icons/appIcon.png', stringEmpty) : './resources';
    const scriptsDir = resourcePath.endsWith('resources') ? `${resourcePath}/scripts` : './resources/scripts';

    return scriptsDir;
}

function resolveOSCommand(scriptsDir) {
    const winPlatform = 'win';
    const platform = window.navigator.platform.toLowerCase();

    if (platform.includes(winPlatform)) {
        return `powershell -ExecutionPolicy Bypass -File "./${scriptsDir}/get_history.ps1"`;
    }

    return `bash "./${scriptsDir}/get_history.sh"`;
}

async function loadHistory() {
    const content = document.getElementById('content');
    content.innerHTML = '<div class="loading"><span>Cargando historial...</span></div>';

    try {
        const scriptsDir = await resolveScriptDir();
        const command = resolveOSCommand(scriptsDir);
        const result = await Neutralino.os.execCommand(command);

        if (result.stdOut && !result.stdOut.includes(noHistoryFileFound)) {
            const lines = result.stdOut.split('\n').filter((line) => line.trim() !== stringEmpty);

            commands = lines.reverse().map((cmd, index) => ({
                id: lines.length - index,
                text: cmd.trim()
            }));

            filteredCommands = commands;
            currentPage = 1;
            renderCommands();
            updateStats(filteredCommands.length);
        } else {
            throw new Error('No se encontraron registros.');
        }
    } catch (err) {
        content.innerHTML = `<div class="error">Error: ${err.message || err}</div>`;
    }
}

async function exportCommandsToTxt(exportAll = false) {
    const content = document.getElementById('content');
    const exportList = exportAll ? commands : (filteredCommands.length ? filteredCommands : commands);

    if (!exportList.length) {
        content.innerHTML = '<div class="error">No hay comandos para exportar.</div>';

        return;
    }

    try {
        const textContent = serializeCommandsToText(exportList);
        const savedPath = await downloadTextFile('comandos.txt', textContent);

        if (savedPath) {
            content.innerHTML = `<div class="empty-state"><p>Archivo guardado en:<br>${savedPath}</p></div>`;
        } else {
            content.innerHTML = '<div class="empty-state"><p>No se pudo iniciar la descarga. Intenta de nuevo desde la ventana de la app.</p></div>';
        }
    } catch (err) {
        content.innerHTML = `<div class="error">Error: ${err.message || err}</div>`;
    }
}

async function populateAboutInfo(aboutModal) {
    const title = document.getElementById('aboutTitle');
    const version = document.getElementById('aboutVersion');
    const platform = document.getElementById('aboutPlatform');
    const osName = document.getElementById('aboutOs');
    const developer = document.getElementById('aboutDeveloper');
    const contact = document.getElementById('aboutContact');

    try {
        const config = typeof Neutralino !== 'undefined' ? await Neutralino.app.getConfig() : null;
        const appVersion = config?.version || '1.0.0';
        const appName = config?.applicationId || 'Term Log';
        const runtimePlatform = navigator.platform || 'Desconocida';
        const userAgent = navigator.userAgent || 'Desconocido';
        const osLabel = detectOS(userAgent, runtimePlatform);

        if (title) {
            title.textContent = `Acerca de ${appName}`;
        }

        if (version) {
            version.textContent = `Versión: ${appVersion}`;
        }

        if (platform) {
            platform.textContent = `Plataforma: ${runtimePlatform}`;
        }

        if (osName) {
            osName.textContent = `Sistema operativo: ${osLabel}`;
        }

        if (developer) {
            developer.textContent = 'Desarrollador: Juan L.';
        }

        if (contact) {
            contact.textContent = 'Contacto: developer@example.com';
        }
    } catch (err) {
        if (version) {
            version.textContent = 'Versión: 1.0.0';
        }

        if (platform) {
            platform.textContent = `Plataforma: ${navigator.platform || 'Desconocida'}`;
        }

        if (osName) {
            osName.textContent = `Sistema operativo: ${detectOS(navigator.userAgent || '', navigator.platform || '')}`;
        }
    }
}

function detectOS(userAgent, platform) {
    const lowerAgent = userAgent.toLowerCase();
    const lowerPlatform = platform.toLowerCase();

    if (lowerAgent.includes('win')) {
        return 'Windows';
    }

    if (lowerAgent.includes('mac')) {
        return 'macOS';
    }

    if (lowerAgent.includes('linux')) {
        return 'Linux';
    }

    if (lowerPlatform.includes('linux')) {
        return 'Linux';
    }

    if (lowerPlatform.includes('mac')) {
        return 'macOS';
    }

    if (lowerPlatform.includes('win')) {
        return 'Windows';
    }

    return 'Desconocido';
}

function renderCommands(list = filteredCommands) {
    const maxLength = 4;
    const container = document.getElementById('content');

    if (!Array.isArray(list) || !list.length) {
        container.innerHTML = '<div class="empty-state"><p>No hay coincidencias</p></div>';

        return;
    }

    const pagination = paginationUtils.paginateItems(list, currentPage, ITEMS_PER_PAGE);
    const itemsMarkup = pagination.pageItems.map((cmd) => `
        <div class="command-item">
            <span class="cmd-index">${String(cmd.id).padStart(maxLength, '0')}</span>
            <span class="cmd-text">${escapeHtml(cmd.text)}</span>
            <button
                class="copy-btn"
                data-command-text="${escapeAttr(cmd.text)}"
                title="Copiar comando"
                aria-label="Copiar comando"
                type="button"
            >
                <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                </svg>
            </button>
        </div>
    `).join(stringEmpty);

    container.innerHTML = `
        <div class="pagination-summary">Mostrando ${pagination.startIndex}-${pagination.endIndex} de ${pagination.totalItems} registros</div>
        <div class="command-list">${itemsMarkup}</div>
        ${renderPagination(pagination)}
    `;
}

function renderPagination(pagination) {
    if (pagination.totalPages <= 1) {
        return stringEmpty;
    }

    const pageNumbers = paginationUtils.getPageNumbers(pagination.currentPage, pagination.totalPages, 5);
    const buildButton = (label, page, disabled = false, active = false) => `
        <button
            class="pagination-btn${active ? ' active' : stringEmpty}"
            data-page="${page}"
            ${disabled ? 'disabled' : stringEmpty}
            ${active ? 'aria-current="page"' : stringEmpty}
            type="button"
        >
            ${label}
        </button>
    `;

    return `
        <nav class="pagination" aria-label="Paginación de comandos">
            ${buildButton('«', 1, pagination.currentPage === 1)}
            ${buildButton('‹', pagination.currentPage - 1, pagination.currentPage === 1)}
            ${pageNumbers.map((page) => buildButton(page, page, false, page === pagination.currentPage)).join(stringEmpty)}
            ${buildButton('›', pagination.currentPage + 1, pagination.currentPage === pagination.totalPages)}
            ${buildButton('»', pagination.totalPages, pagination.currentPage === pagination.totalPages)}
        </nav>
    `;
}

function handleContentClick(event) {
    const copyButton = event.target.closest('.copy-btn');

    if (copyButton) {
        copyToClipboard(copyButton.dataset.commandText, copyButton);
        return;
    }

    const paginationButton = event.target.closest('.pagination-btn');

    if (paginationButton && !paginationButton.disabled) {
        changePage(Number(paginationButton.dataset.page));
    }
}

function changePage(page) {
    currentPage = page;
    renderCommands(filteredCommands);
}

function filterCommands() {
    const searchInput = document.getElementById('searchInput');
    const term = searchInput?.value.trim().toLowerCase() || stringEmpty;
    filteredCommands = commands.filter((command) => command.text.toLowerCase().includes(term));
    currentPage = 1;
    renderCommands(filteredCommands);
    updateStats(filteredCommands.length);
}

function updateStats(count) {
    const countDisplay = document.getElementById('count-display');

    if (countDisplay) {
        countDisplay.innerText = `${count} registros`;
    }
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
