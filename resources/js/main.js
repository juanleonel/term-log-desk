import { paginationUtils } from './pagination.utils.js';

let commands = [];
let filteredCommands = [];
let currentPage = 1;

const stringEmpty = '';
const noHistoryFileFound = 'NO_HISTORY_FILE_FOUND';
const ITEMS_PER_PAGE = paginationUtils?.defaultItemsPerPage || 50;

window.stringEmpty = stringEmpty;

document.addEventListener('DOMContentLoaded', () => {
    if (typeof Neutralino !== 'undefined') {
        Neutralino.init();
    }
    const content = document.getElementById('content');
    const searchInput = document.getElementById('searchInput');
    const loadButton = document.getElementById('loadButton');

    if (content) {
        content.addEventListener('click', handleContentClick);
    }

    if (searchInput) {
        searchInput.addEventListener('input', filterCommands);
    }

    if (loadButton) {
        loadButton.addEventListener('click', loadHistory);
    }
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
