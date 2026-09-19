const { app, BrowserWindow, Menu, shell, session } = require('electron');
const path = require('node:path');

const isDev = !app.isPackaged;
const DEV_SERVER_URL = process.env.ELECTRON_START_URL || 'http://localhost:5173';

if (process.platform === 'win32') {
  app.setAppUserModelId('com.cubeapp.practice');
}

// only one window at a time
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
}

// Electron doesn't show a native device picker for navigator.bluetooth.requestDevice()
// the way a regular browser does, so it must be resolved here. This is an APP-level
// event (not a webContents event) - without this handler, requestDevice() from the
// renderer just hangs forever and the GAN timer "connect" button silently never
// resolves. Any device that shows up here has already passed the renderer's
// requestDevice() name-prefix filters, so the first entry is always a valid pick -
// no need to additionally require a populated deviceName. We give up after a
// generous scan window (some Windows Bluetooth stacks take a while to resolve a
// device's advertisement) if nothing is found at all.
let pendingBluetoothCallback = null;
let pendingBluetoothTimeout = null;

app.on('select-bluetooth-device', (event, deviceList, callback) => {
  event.preventDefault();
  if (deviceList.length > 0) {
    if (pendingBluetoothTimeout) clearTimeout(pendingBluetoothTimeout);
    pendingBluetoothTimeout = null;
    pendingBluetoothCallback = null;
    callback(deviceList[0].deviceId);
    return;
  }
  pendingBluetoothCallback = callback;
  if (!pendingBluetoothTimeout) {
    pendingBluetoothTimeout = setTimeout(() => {
      if (pendingBluetoothCallback) pendingBluetoothCallback('');
      pendingBluetoothCallback = null;
      pendingBluetoothTimeout = null;
    }, 25000);
  }
});

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 420,
    height: 860,
    minWidth: 360,
    minHeight: 640,
    backgroundColor: '#f4f5f7',
    autoHideMenuBar: true,
    icon: path.join(__dirname, '..', 'build', 'icon.png'),
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  Menu.setApplicationMenu(null);

  if (isDev) {
    mainWindow.loadURL(DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }

  // open external links (if any ever appear) in the OS browser instead of inside the app window
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.on('second-instance', () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
});

app.whenReady().then(() => {
  // On Windows/Linux, Electron auto-CANCELS any Bluetooth pairing that needs extra
  // confirmation unless this handler is registered (see Electron's session docs for
  // setBluetoothPairingHandler). The GAN Timer's BLE pairing goes through this "confirm"
  // step, so without a handler here the connection silently fails right after the device
  // picker resolves - this was the real root cause of the timer "connection error".
  session.defaultSession.setBluetoothPairingHandler((details, callback) => {
    if (details.pairingKind === 'confirm' || details.pairingKind === 'confirmPin') {
      callback({ confirmed: true });
    } else if (details.pairingKind === 'providePin') {
      callback({ confirmed: true, pin: '0000' });
    } else {
      callback({ confirmed: false });
    }
  });
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
