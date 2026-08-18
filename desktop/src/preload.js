const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('healthguard', {
  platform: process.platform,
  isElectron: true,
  showNotification: ({ title, body, alertId }) => {
    ipcRenderer.send('show-notification', { title, body, alertId });
  },
  setUnreadCount: (count) => {
    ipcRenderer.send('set-unread-count', count);
  },
  exportReportPdf: () => ipcRenderer.invoke('export-report-pdf'),
});

contextBridge.exposeInMainWorld('healthguardDesktop', {
  platform: process.platform,
  isElectron: true,
});
