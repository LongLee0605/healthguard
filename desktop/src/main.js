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
let isQuitting = false;
let trayHintShown = false;

const PAGES = [
  ['Tổng quan', '/dashboard'],
  ['AI Chat', '/dashboard/chat'],
  ['Chỉ số', '/dashboard/vitals'],
  ['Triệu chứng', '/dashboard/symptoms'],
  ['Phân tích AI', '/dashboard/ai'],
  ['Thuốc', '/dashboard/medications'],
  ['Báo cáo', '/dashboard/reports'],
];

function boundsFile() {
  return path.join(app.getPath('userData'), 'window-bounds.json');
}

function loadWindowBounds() {
  try {
    const saved = JSON.parse(fs.readFileSync(boundsFile(), 'utf8'));
    if (saved && saved.width >= 1100 && saved.height >= 700) return saved;
  } catch {
    /* first launch */
  }
  return { width: 1360, height: 860 };
}

function saveWindowBounds() {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  fs.writeFileSync(boundsFile(), JSON.stringify(mainWindow.getBounds()));
}

function openAppPage(route) {
  if (!mainWindow) {
    createMainWindow();
    return;
  }
  const target = new URL(route, frontendUrl.endsWith('/') ? frontendUrl : `${frontendUrl}/`).toString();
  mainWindow.show();
  mainWindow.focus();
  mainWindow.loadURL(target);
}

function showOfflinePage(detail) {
  if (!mainWindow) return;
  const html = `<!doctype html>
<html lang="vi"><head><meta charset="utf-8"><title>HealthGuard</title>
<style>
  body { margin:0; min-height:100vh; display:grid; place-items:center; font-family:Segoe UI,sans-serif; background:#0f172a; color:#e2e8f0; }
  main { max-width:440px; padding:32px; }
  h1 { margin:0 0 8px; font-size:24px; }
  p { color:#94a3b8; line-height:1.5; }
  a { display:inline-block; margin-top:16px; background:#0f766e; color:white; text-decoration:none; padding:10px 16px; border-radius:10px; font-weight:600; }
</style></head>
<body><main>
  <h1>Chưa mở được giao diện</h1>
  <p>App PC cần web đang chạy tại ${frontendUrl}. Hãy giữ terminal <strong>npm run dev:frontend</strong> rồi thử lại.</p>
  <p>${detail}</p>
  <a href="${frontendUrl}/login">Thử lại</a>
</main></body></html>`;
  mainWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);
}

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
  const bounds = loadWindowBounds();
  mainWindow = new BrowserWindow({
    ...bounds,
    minWidth: 1100,
    minHeight: 700,
    autoHideMenuBar: false,
    title: 'HealthGuard',
    backgroundColor: '#f1f5f9',
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

  mainWindow.webContents.on('did-fail-load', (_event, errorCode, _errorDescription, validatedURL) => {
    if (!validatedURL || validatedURL.startsWith('data:') || errorCode === -3) return;
    if (mainWindow && !mainWindow.isVisible()) mainWindow.show();
    showOfflinePage(`${errorCode}`);
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
  mainWindow.loadURL(startUrl).catch((error) => {
    showOfflinePage(String(error));
  });

  mainWindow.on('resize', saveWindowBounds);
  mainWindow.on('move', saveWindowBounds);

  mainWindow.on('close', (event) => {
    if (isQuitting || !tray) return;
    event.preventDefault();
    mainWindow.hide();
    if (!trayHintShown && Notification.isSupported()) {
      trayHintShown = true;
      const notice = new Notification({
        title: 'HealthGuard vẫn đang chạy',
        body: 'Cửa sổ đã thu vào khay hệ thống để tiếp tục nhận cảnh báo. Chọn Thoát trên menu khay để đóng hẳn.',
        icon: resolveAppIcon(),
      });
      notice.show();
    }
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
        ...PAGES.map(([label, route]) => ({
          label,
          click: () => openAppPage(route),
        })),
        { type: 'separator' },
        {
          label: 'Tài liệu API',
          click: () => shell.openExternal('http://localhost:3001/api/docs'),
        },
        { type: 'separator' },
        {
          label: 'Thoát',
          click: () => {
            isQuitting = true;
            app.quit();
          },
        },
      ],
    },
    {
      label: 'Xem',
      submenu: [
        { label: 'Tải lại', role: 'reload' },
        { label: 'Tải lại bỏ cache', role: 'forceReload' },
        { label: 'Toàn màn hình', role: 'togglefullscreen' },
        ...(isDev ? [{ label: 'Công cụ phát triển', role: 'toggleDevTools' }] : []),
      ],
    },
    {
      label: 'Cửa sổ',
      submenu: [
        { label: 'Thu nhỏ', role: 'minimize' },
        {
          label: 'Thu vào khay',
          click: () => mainWindow && mainWindow.hide(),
        },
      ],
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
  tray.setToolTip('HealthGuard');
  tray.setContextMenu(
    Menu.buildFromTemplate([
      {
        label: 'Hiện HealthGuard',
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
        label: 'Tổng quan',
        click: () => openAppPage('/dashboard'),
      },
      {
        label: 'Cảnh báo',
        click: () => openAppPage('/dashboard/alerts'),
      },
      { type: 'separator' },
      {
        label: 'Thoát',
        click: () => {
          isQuitting = true;
          app.quit();
        },
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

app.on('before-quit', () => {
  isQuitting = true;
});

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
