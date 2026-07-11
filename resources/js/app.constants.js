export const appConstants = {
  checkmark: '✓',
  forwardSlash: '/',
  dot: '.',
  dir: {
    resourcesApp: '/resources/scripts',
    resources: '/resources',
    scripts: '/scripts'
  },
  stringEmpty: '',
  undefinedString: 'undefined',
  os: {
    mac: 'mac',
    linux: 'linux',
    win: 'windows'
  },
  copyTimeOut: 2000,
  unknow: 'unknow'
}

export const resourcesConstants = {
  appIcon: '/icons/appIcon.png'
}

export const commandConstants = {
  bash: 'bash',
  powershell: 'powershell',
  winOs: {
    getHistory: 'get_history.ps1',
    getHistoryParams: '-ExecutionPolicy Bypass -File'
  },
  linux: {
    getHistory: 'get_history.sh'
  }
}

export const operatingSystem = {
  macOs: 'macOS',
  linux: 'Linux',
  windowOs: 'Windows',
}

export const noHistoryFileFound = 'NO_HISTORY_FILE_FOUND';
