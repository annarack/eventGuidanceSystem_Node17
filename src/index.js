
import '../graphic/style.sass'
import model from './module'
import * as scroll from './scroll'
import mqtt from 'mqtt'
// var client  = mqtt.connect('ws://192.168.2.147:9001')

let mqttBroker
let disableScroll
let monitorID

let loadConfig = (() => {
	mqttBroker = config.mqttBroker
	disableScroll = config.disableScroll
	monitorID = config.monitorID
})()


let client  = mqtt.connect(mqttBroker)



let currentTime = new Date("June 26, 2017 12:00:00")
let timeSpan    = new Date("June 26, 2017 12:00:00")
// let currentTime   = new Date()
// //events starttime should be earlier than timeSpan to be displayed as upcoming
// let timeSpan      = new Date()
timeSpan.setHours(timeSpan.getHours()+2)
timeSpan.setMinutes(timeSpan.getMinutes()+ 50)
console.log('currentTime: ' + currentTime);
console.log('timespan: ' + timeSpan);




let subscribeToEvents = `screens/${monitorID}/${currentTime.getDate()}.${currentTime.getMonth()+1}`
console.log('subscribe to: ' + subscribeToEvents);

let itemDurationTop      = `screens/${monitorID}/itemDuration`
let gfxScreenDurationTop = `screens/${monitorID}/graphicScreenDuration`
let disableScrollTop     = `screens/${monitorID}/disableScroll`
let showScreenTop        = `screens/${monitorID}/showScreen`


client.on('connect', () => {
	client.subscribe(subscribeToEvents)
	client.subscribe('globals')
	client.subscribe(itemDurationTop)
	client.subscribe(gfxScreenDurationTop)
	client.subscribe(disableScrollTop)
	client.subscribe(showScreenTop)
	client.publish('presence', 'Node Client Connected')
	console.log('connected to mqtt server')
})

client.on('message', (topic, message) => {
	// message is Buffer
	// let model = message.toString()
	let model = JSON.parse(message)
	console.log('received new data');
	console.log(model);

	if (topic == subscribeToEvents) {
		fillCurrent(model)
		fillUpcoming(model)
		if (!disableScroll)
			scroll.reload()
	}
	if (topic == 'globals') {
		fillGlobal(model)
		if (!disableScroll)
			scroll.reload()
	}
	if (topic == itemDurationTop)
		scroll.setItemDuration = message
	if (topic == gfxScreenDurationTop)
		scroll.setGraphicScreenDuration = message
	if (topic == disableScrollTop)
		disableScroll = message
	if (topic == showScreenTop)
		scroll.showScreen(message)


})


let timeToDate = time => {
	let timeParts = time.split(':')

	// let dateTime = currentTime // --> wenn spaeter hours etc gesetzt wird, wird currenttime ueberschrieben !!!

	let dateTime = new Date("June 26, 2017 12:00:00")
	if (timeParts[0] <= 6)
		dateTime.setDate(dateTime.getDate()+1)
	dateTime.setHours(timeParts[0])
	dateTime.setMinutes(timeParts[1])
	dateTime.setSeconds('00')

	return dateTime
}

let sortEvents = (a,b) =>
	a.start < b.start? -1: a.start > b.start? 1: 0

let fillCurrent = model => {
	let templates = ''

	model.events
		.filter(event =>
			timeToDate(event.start) <= currentTime &&
			currentTime <= timeToDate(event.end))
		.sort(sortEvents)
		.forEach(data => templates +=
			`<div class="event" style="background-color:${data.color}">
				<div class="title">${data.name}</div>
				<div class="time">from ${data.start} to ${data.end}</div>
				<div class="room">${data.building}, ${data.room}</div>
				${data.info? `<div class="info">${data.info}</div>`: ``}
			</div>`)
	if (templates == '')
		document.querySelector('.screen.current').style.display = 'none'
	else{
		document.querySelector('.screen.current').style.display = ''
		document.querySelector('.current .listScroller').innerHTML = templates
	}
}

let fillUpcoming = model => {
	let templates = ''
	model.events
		.filter(eventItem =>
			timeToDate(eventItem.start) < timeSpan &&
			timeToDate(eventItem.start) > currentTime)
		.sort(sortEvents)
		.forEach(data => {
			templates +=
			`<div class="event grey">
				<div class="title">${data.name}</div>
				<div class="time">from ${data.start} to ${data.end}</div>
				<div class="room">${data.building}, ${data.room}</div>
				${data.info? `<div class="info">${data.info}</div>`: ``}
			</div>`
		})

	if(templates == ''){
		document.querySelector('.screen.upcoming').style.display = 'none'
	}
	else{
		document.querySelector('.screen.upcoming').style.display = ''
		document.querySelector('.upcoming .listScroller').innerHTML = templates
	}
}


let fillGlobal = model => {
	let templates = ''
	model.globalInfos
		.forEach(data => {
			if(data.title != '' || data.text != ''){
				templates +=
				`<div class="globalInfo orange ${data.image? `short`: ``}" >
					<div class="title">${data.title}</div>
					<div class="text">${data.text}</div>
					${data.image? `<div class="infoImage" style=\'background-image:${data.image}\'></div>`: ``}
				</div>`
			}
	})
	if(templates == '')
		document.querySelector('.screen.global').style.display = 'none'
	else {
		document.querySelector('.screen.global').style.display = ''
		document.querySelector('.global .list .listScroller').innerHTML = templates
	}
}

window.addEventListener('load', e => {
	fillCurrent(model)
	fillUpcoming(model)
	fillGlobal(model)
	scroll.start()

	// if (!disableScroll) {
	// 	scroll.start()
	// }
})
