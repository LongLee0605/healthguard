const path = require('path');
const fs = require('fs');
const { app, BrowserWindow, Menu, Tray, shell, dialog, ipcMain, Notification } = require('electron');
const dotenv = require('dotenv');

const appRoot = path.resolve(__dirname, '..');
const envFiles = ['.env', '.env.local'];

for (const envFile of envFiles) {
  const envPath = path.join(appRoot, envFile);
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath, override: envFile === '.env.local' });
  }
}

const defaultFrontendUrl = 'http://localhost:3000';
const frontendUrl = process.env.FRONTEND_URL || defaultFrontendUrl;
const isDev = !app.isPackaged;

let mainWindow = null;
let tray = null;
let unreadCount = 0;

function updateTrayTooltip() {
  if (!tray) return;
  const suffix = unreadCount > 0 ? ` — ${unreadCount} cảnh báo` : '';
  tray.setToolTip(`HealthGuard Desktop${suffix}`);
}

ipcMain.on('show-notification', (_event, { title, body, alertId }) => {
  if (!Notification.isSupported()) return;
  const notification = new Notification({
    title,
    body,
    silent: false,
    icon: resolveAppIcon(),
  });
  notification.on('click', () => {
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
      mainWindow.loadURL(`${frontendUrl}/dashboard/alerts`);
    }
  });
  notification.show();
});

ipcMain.on('set-unread-count', (_event, count) => {
  unreadCount = typeof count === 'number' ? count : 0;
  updateTrayTooltip();
});

ipcMain.handle('export-report-pdf', async () => {
  if (!mainWindow) {
    return { success: false, message: 'Cửa sổ ứng dụng chưa sẵn sàng.' };
  }

  try {
    const defaultFileName = `healthguard-report-${new Date().toISOString().slice(0, 10)}.pdf`;
    const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
      title: 'Xuất báo cáo PDF',
      defaultPath: path.join(app.getPath('documents'), defaultFileName),
      filters: [{ name: 'PDF', extensions: ['pdf'] }],
    });

    if (canceled || !filePath) {
      return { success: false, cancelled: true };
    }

    const pdfBuffer = await mainWindow.webContents.printToPDF({
      printBackground: true,
      preferCSSPageSize: true,
      landscape: false,
      margins: {
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
      },
    });

    fs.writeFileSync(filePath, pdfBuffer);
    return { success: true, filePath };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Không thể xuất PDF.',
    };
  }
});

function resolveAppIcon() {
  const ico = path.join(appRoot, 'assets', 'icon.ico');
  const png = path.join(appRoot, 'assets', 'icon.png');
  if (process.platform === 'win32' && fs.existsSync(ico)) return ico;
  if (fs.existsSync(png)) return png;
  return undefined;
}

function createMainWindow() {
  const appIcon = resolveAppIcon();
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1100,
    minHeight: 700,
    autoHideMenuBar: false,
    title: 'HealthGuard Desktop',
    ...(appIcon ? { icon: appIcon } : {}),
    show: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      spellcheck: false,
      backgroundThrottling: true,
    },
  });

  mainWindow.once('ready-to-show', () => {
    if (mainWindow && !mainWindow.isVisible()) mainWindow.show();
  });

  mainWindow.webContents.on('did-finish-load', () => {
    if (mainWindow && !mainWindow.isVisible()) mainWindow.show();
  });

  mainWindow.webContents.on('did-fail-load', async (_event, errorCode, errorDescription, validatedURL) => {
    if (mainWindow && !mainWindow.isVisible()) mainWindow.show();
    await dialog.showMessageBox(mainWindow, {
      type: 'error',
      title: 'Không tải được giao diện',
      message: 'HealthGuard Desktop không thể tải trang web.',
      detail: [
        `URL: ${validatedURL}`,
        `Lỗi: ${errorDescription} (${errorCode})`,
        '',
        'Hãy chạy frontend trước: cd frontend && npm run dev',
      ].join('\n'),
    });
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.webContents.on('will-navigate', (event, url) => {
    const targetOrigin = new URL(url).origin;
    const allowedOrigin = new URL(frontendUrl).origin;
    if (targetOrigin !== allowedOrigin) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });

  const startUrl = frontendUrl.endsWith('/') ? `${frontendUrl}login` : `${frontendUrl}/login`;
  mainWindow.loadURL(startUrl).catch(async (error) => {
    await dialog.showMessageBox({
      type: 'error',
      title: 'Cannot open frontend',
      message: 'HealthGuard Desktop could not connect to the frontend UI.',
      detail: [
        `Expected frontend URL: ${frontendUrl}`,
        'Start the Next.js app in the frontend folder or point FRONTEND_URL to a deployed web app.',
        '',
        String(error),
      ].join('\n'),
    });
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function createAppMenu() {
  const template = [
    {
      label: 'HealthGuard',
      submenu: [
        {
          label: 'Open Web Dashboard',
          click: () => mainWindow && mainWindow.loadURL(frontendUrl),
        },
        {
          label: 'Open API Docs',
          click: () => shell.openExternal('http://localhost:3001/api/docs'),
        },
        { type: 'separator' },
        {
          label: 'Quit',
          click: () => app.quit(),
        },
      ],
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'togglefullscreen' },
        ...(isDev ? [{ role: 'toggleDevTools' }] : []),
      ],
    },
    {
      label: 'Window',
      submenu: [{ role: 'minimize' }, { role: 'close' }],
    },
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

function createTray() {
  const trayIconPath = resolveAppIcon();
  if (!trayIconPath) {
    return;
  }

  tray = new Tray(trayIconPath);
  tray.setToolTip('HealthGuard Desktop');
  tray.setContextMenu(
    Menu.buildFromTemplate([
      {
        label: 'Show App',
        click: () => {
          if (!mainWindow) {
            createMainWindow();
            return;
          }
          mainWindow.show();
          mainWindow.focus();
        },
      },
      {
        label: 'Open API Docs',
        click: () => shell.openExternal('http://localhost:3001/api/docs'),
      },
      { type: 'separator' },
      {
        label: 'Quit',
        click: () => app.quit(),
      },
    ]),
  );

  tray.on('double-click', () => {
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
    }
  });
}

app.whenReady().then(() => {
  createAppMenu();
  createMainWindow();
  createTray();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
