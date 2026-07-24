const { app, BrowserWindow, shell } = require('electron'); // 1. Добавили shell
const path = require('path');

function createWindow () {
  const win = new BrowserWindow({
    width: 1050,
    height: 860,
    minWidth: 600,
    minHeight: 500,
    autoHideMenuBar: true, // Скрывает верхнее браузерное меню
    icon: path.join(__dirname, 'assets', 'icon.ico'), // Иконка окна
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  // 2. Перехватываем открытие новых окон и перенаправляем в системный браузер
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  win.loadFile('index.html');
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});