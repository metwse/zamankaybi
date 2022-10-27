console.log('sa')

const w = window, d = document

const ws = new WebSocket(`${w.location.protocol == 'https:' ? 'wss' : 'ws'}://${w.location.host}/api/ws`)
const [form, list] = [d.querySelector('form'), d.querySelector('ul')]

var first = true
setInterval(async () => {
	if (ws.readyState > 1) return w.location.replace('/offline')
	else if (ws.readyState == 1 && first) { 
		await fetch(`${w.location.origin}/api/messages`).then(r => r.json()).then(r => r.reverse().forEach(d => ws.onmessage({ data: JSON.stringify(d) })))
		d.querySelector('.loading').remove()
		first = false
	}
	ws.send('1')
}, 1000)

form.name.value = localStorage.getItem('name')

ws.onmessage = (e) => {
	var data = JSON.parse(e.data), li = d.createElement('li')
	if (typeof data == 'number') return (d.querySelector('.online').innerText = data)
	li.innerHTML = `<span class="sender"></span><span class="date"> - ${(data.timestamp ? new Date(data.timestamp) : new Date()).toLocaleString()}</span><br /><span class="content"></span>`
	li.querySelector('.sender').innerText = '@' + data.sender
	li.querySelector('.content').innerText = data.content
	list.appendChild(li)
}

var busy = false
form.content.onkeydown = e => { if (e.key == 'Enter' && !e.skiftKey) send() }
async function send(event) {
	event?.preventDefault()
	if (busy) return
	if (form.name.value.length < 2) return alert('ad kısa!')
	if (form.content.value.length < 1) return alert('oha, boş mesaj')
	localStorage.setItem('name', form.name.value)
	busy = true, form.submitButton.value = 'gönderiliyor...'
	await fetch(`${w.location.origin}/api/message`, { method: 'POST', body: JSON.stringify({ content: form.content.value, name: form.name.value }), headers: { 'Content-Type': 'application/json' } })
	form.content.value = ''
	busy = false, form.submitButton.value = 'gönder'
}
