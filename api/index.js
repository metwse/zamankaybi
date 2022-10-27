const express = require('express')
const ws = require('ws')
const http = require('http')

const app = express()
const server = http.createServer(app)
const wss = new ws.WebSocket.Server({ server })

app.use(express.json())
app.set('trust proxy', true)

app.get('/', (req, res) => {
	return res.json({ version: 1 })
})

var messageHistory = []

app.post('/message', (req, res) => {
	try {
		var message = JSON.stringify({ content: req.body.content, sender: req.body.name })
		messageHistory.unshift({ content: req.body.content, sender: req.body.name, timestamp: new Date() })
		messageHistory.length = 20
		for (let ws of Object.values(wssConnections)) ws.send(message)
		res.json(true)
	} catch { return res.json(false) }
})
app.get('/messages', (req, res) => res.json(messageHistory.filter(v => v)))

var wssConnections = {}, connectionCount = 0
const updateOnlines = () => {
	var count = Object.keys(wssConnections).length
	for (let ws of Object.values(wssConnections)) ws.send(count)
}
wss.on('connection', ws => {
	ws.id = connectionCount++
	wssConnections[ws.id] = ws
	var del = () => { delete wssConnections[ws.id]; updateOnlines(); clearInterval(ws.intervalId); ws.close() }
	ws.on('message', () => ws.lastMessage = new Date())
	ws.lastMessage = new Date()
	ws.intervalId = setInterval(() => ((ws.readyState > 1 || (ws.lastMessage - new Date() > 10000)) && del()), 400)
	updateOnlines()
})

server.listen(8080)
