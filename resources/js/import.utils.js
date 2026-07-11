export function parseImportedCommands(text) {
  if (typeof text !== 'string') {
    return [];
  }

  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line, index) => ({
        id: index + 1,
        text: line
    }));
}

export function readTextFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      resolve(typeof reader.result === 'string' ? reader.result : '');
    };

    reader.onerror = () => {
      reject(new Error('No se pudo leer el archivo seleccionado.'));
    };

    reader.readAsText(file);
  });
}

export function serializeCommandsToText(commands) {
  if (!Array.isArray(commands)) {
    return '';
  }

  return commands.map((command) => command.text).join('\n');
}

export async function downloadTextFile(fileName, text) {
  try {
    if (typeof Neutralino !== 'undefined' && Neutralino?.os?.showSaveDialog && Neutralino?.filesystem?.writeBinaryFile) {
      const documentsPath = await Neutralino.os.getPath('documents');
      const savePath = await Neutralino.os.showSaveDialog('Guardar comandos', {
        forceOverwrite: true,
        defaultPath: `${documentsPath}/${fileName}`,
        filters: [{ name: 'Archivos de texto', extensions: ['txt'] }]
      });

      if (savePath) {
        const encoder = new TextEncoder();
        const data = encoder.encode(text).buffer;
        await Neutralino.filesystem.writeBinaryFile(savePath, data);

        return savePath;
      }
    }
  } catch (error) {
    console.error('No se pudo guardar el archivo con Neutralino:', error);
  }

  if (typeof document === 'undefined') {
    return null;
  }

  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);

  return fileName;
}
