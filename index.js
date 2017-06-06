
const electron = require('electron')
const app = electron.app
const arg = process.argv.splice(2)

var mainWindow = null
app.on('window-all-closed', function() {
	if (process.platform != 'darwin') app.quit()
})
app.on('ready', () => {
	mainWindow = new electron.BrowserWindow({
		frame      : false,
		fullscreen : true
	})
	if (arg[0] == 'dev')
		mainWindow.loadURL(`http://192.168.2.114:8000`)
	else
		mainWindow.loadURL(`file://${__dirname}/index.html`)
	mainWindow.on('closed', () => {
		mainWindow = null
	})
	// mainWindow.webContents.openDevTools()
})
