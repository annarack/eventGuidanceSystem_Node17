
import '../graphic/style.sass'
import data from './module'
import * as scroll from './scroll'
import mqtt from 'mqtt'
// var client  = mqtt.connect('ws://192.168.2.147:9001')

let model = data
let mqttBroker = config.mqttBroker
let disableScroll = config.disableScroll

window.disableScroll = scroll.setDisableScroll
window.showScreen = scroll.showScreen

let client  = mqtt.connect(mqttBroker)

let me = `screens/${config.monitorID}`
// let itemDurationTop      = `${me}/itemDuration`
// let gfxScreenDurationTop = `${me}/graphicScreenDuration`
// let disableScrollTop     = `${me}/disableScroll`
// let showScreenTop        = `${me}/showScreen`

client.on('connect', () => {
	client.subscribe(`globals`)
	client.subscribe(`screens/${config.monitorID}/#`)
	console.log('subscribed to', `screens/${config.monitorID}/#`);
	fillGlobal(model.globalInfos)
})

client.on('message', (topic, message) => {
	message = JSON.parse(message)
	console.log(topic, message)
	// settings
	if (topic == `${me}/itemDuration`)
		scroll.itemDuration = message
	else if (topic == `${me}/gfxScreenDuration`)
		scroll.graphicScreenDuration = message
	else if (topic == `${me}/disableScroll`)
		scroll.setDisableScroll(message)
	else if (topic == `${me}/showScreen`)
		scroll.showScreen(message)
	// globals
	else if (topic == 'globals') {
		model.globalInfos = message.globalInfos
		fillGlobal(model.globalInfos)
		if (!scroll.disableScroll)
			scroll.reload()
	}
	// handling events
	// for (let i in message) if (model[i]) model[i] = message[i]
	else if (topic.match('.')) {
		let date = topic.split('/')[2].split('.')
		let day  = new Date(new Date().getYear()+1900,date[1]-1,date[0])
		message.events.forEach(event => {
			// start
			let start = new Date(day)
			let oldStart = event.start.split(':')
			start.setHours(oldStart[0])
			start.setMinutes(oldStart[1])
			event.unixStart = start
			// end
			let end = new Date(day)
			let oldEnd = event.end.split(':')
			end.setHours(oldEnd[0])
			end.setMinutes(oldEnd[1])
			if (oldStart > oldEnd) end.setDate(end.getDate() + 1)
			event.unixEnd = end
		})
		model.days[date.join('_')] = message.events
		check()
	}
})

let sortEvents = (a,b) =>
	a.start < b.start? -1: a.start > b.start? 1: 0

let fillCurrent = list => {
	let templates = ''
	list.forEach(data => templates +=
		`<div class="event" style="background-color:${data.color}">
			<div class="title">${data.name}</div>
			<div class="time">from ${data.start} to ${data.end}</div>
			<div class="room">${data.building}, ${data.room}</div>
			${data.info? `<div class="info">${data.info}</div>`: ``}
		</div>`)
	if (templates == '')
		document.querySelector('.screen.current').style.display = 'none'
	else {
		document.querySelector('.screen.current').style.display = ''
		document.querySelector('.current .listScroller').innerHTML = templates
	}
}

let fillUpcoming = list => {
	let templates = ''
	list.forEach(data => templates +=
		`<div class="event grey">
			<div class="title">${data.name}</div>
			<div class="time">from ${data.start} to ${data.end}</div>
			<div class="room">${data.building}, ${data.room}</div>
			${data.info? `<div class="info">${data.info}</div>`: ``}
		</div>`)
	if (templates == '') {
		document.querySelector('.screen.upcoming').style.display = 'none'
	} else {
		document.querySelector('.screen.upcoming').style.display = ''
		document.querySelector('.upcoming .listScroller').innerHTML = templates
	}
}

let fillGlobal = list => {
	let templates = ''
	list.forEach(data => {
		if (data.title != '') templates +=
			`<div class="globalInfo orange ${data.image? `short`: ``}" >
				<div class="title">${data.title}</div>
				<div class="text">${data.text}</div>
				${data.image? `<div class="infoImage" style=\'background-image:${data.image}\'></div>`: ``}
			</div>`})
	console.log(templates)
	if (templates == '')
		document.querySelector('.screen.global').style.display = 'none'
	else {
		document.querySelector('.screen.global').style.display = ''
		document.querySelector('.global .list .listScroller').innerHTML = templates
	}
}

let getRandomMinute = (min, max) => {
	min = min * 60000
	max = max * 60000
	min = Math.ceil(min)
	max = Math.floor(max)
	return Math.floor(Math.random() * (max - min)) + min // The maximum is exclusive and the minimum is inclusive
}

let changeImage = () => {
	let content = document.querySelector('#graphicContent')
	// change image to avocado
	content.style.backgroundImage = `url('graphic/test.gif')`
	// change image back after 3 minutes
	setTimeout(() => {
		content.style.backgroundImage = `url('graphic/DesigningHope_Full_big.png')`
	}, 3 * 60000)
}

let loopImages = () => {
	let content = document.querySelector('#graphicContent')
	content.style.backgroundImage = `url('graphic/DesigningHope_Full_big.png')`
    var rand = getRandomMinute(0, config.avocadoRange)
	console.log('will change image after: ' + rand);
    setTimeout(() => {
        changeImage()
        loopImages()
    }, rand)
}
loopImages()

let eventsRef = ""

let check = () => {
	// play head on the x axis
	let now = config.timeTest || new Date()
	// generate future
	let next = new Date(now)
	next.setHours(next.getHours() + 2)
	next.setMinutes(next.getMinutes() + 50)
	// merge days to one list
	model.events = []
	for (let i in model.days)
		model.events = model.events.concat(model.days[i])
	// filter events
	let currents = model.events.filter(e => e.unixStart < now && now  < e.unixEnd)
	let upcoming = model.events.filter(e => now < e.unixStart && e.unixStart < next)
	// generate ref
	let ref = JSON.stringify(model.events)
	if (ref != eventsRef) {
		eventsRef = ref
		// fill
		fillCurrent(currents)
		fillUpcoming(upcoming)
		// handle scroll
		if (!scroll.disableScroll) scroll.reload()
	}
}
setInterval(check, 60000)
