const { app, BrowserWindow } = require('electron');

function createWindow() {
  const window = new BrowserWindow({
    width: 500,
    height: 700,
  });

  window.loadFile('index.html');
}

app.whenReady().then(createWindow);
