
import '../graphic/style.sass'
import model from './module'
import * as scroll from './scroll'
import mqtt from 'mqtt'
var client  = mqtt.connect('mqtt://test.mosca.io')


client.on('connect', () => {
	client.subscribe('presence')
	client.publish('presence', 'Hello mqtt')
})

client.on('model', (topic, message) => {
	// message is Buffer
	let model = message.toString()
	console.log(model)
	fillCurrent(model)
	fillUpcoming(model)
	scroll.reload()
	// client.end()
})

let d = new Date()
let subscribeTo = `/screens/${config.monitorID}/${d.getDate()}.${d.getMonth()+1}`
console.log('date: '+ d.getHours()) ;
console.log('subscribe to: ' + subscribeTo);

let currentTime = new Date("June 18, 2017 17:00:00")
let timeSpan    = new Date("June 18, 2017 17:00:00")
// let currentTime   = new Date()
// //events starttime should be earlier than timeSpan to be displayed as upcoming
// let timeSpan      = new Date()
timeSpan.setHours(timeSpan.getHours()+2)

// document.querySelector('.screen.current').style.display = 'none'

let timeToDate = time => {
	let timeParts = time.split(':')
	let dateTime = new Date()
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
			`<div class="event green">
				<div class="title">${data.name}</div>
				<div class="time">from ${data.start} to ${data.end}</div>
				<div class="room">${data.building}, ${data.room}</div>
				${data.info? `<div class="info">${data.info}</div>`: ``}
			</div>`)
	if (templates == '')
		document.querySelector('.screen.current').style.display = 'none'
	else
		document.querySelector('.current .listScroller').innerHTML = templates
}

let fillUpcoming = model => {
	let templates = ''
	model.events
		.filter(event =>
			timeToDate(event.start) < timeSpan &&
			timeToDate(event.start) > currentTime)
		.sort(sortEvents)
		.forEach(data => templates +=
			`<div class="event grey">
				<div class="title">${data.name}</div>
				<div class="time">from ${data.start} to ${data.end}</div>
				<div class="room">${data.building}, ${data.room}</div>
				${data.info? `<div class="info">${data.info}</div>`: ``}
			</div>`)
	if(templates == '')
		document.querySelector('.screen.upcoming').style.display = 'none'
	else
		document.querySelector('.upcoming .listScroller').innerHTML = templates
}


let fillGlobal = model => {
	let templates = ''
	model.globalInfos
		.forEach(data => {
			let src = data.infoImage
			// let newImage = document.createElement('img')
			// newImage.src = src
			templates +=
			`<div class="globalInfo orange ${data.infoImage? `short`: ``}" >
				<div class="title">${data.title}</div>
				<div class="text">${data.text}</div>
				${data.infoImage? `<div class="infoImage" style="background-image:url(${data.infoImage})"></div>`: ``}
			</div>`
			// TODO: set text width for text and headline if no image exists
			// if (src == '') {
			// 	// document.querySelector('.global .list')
			// }
	})
	if(templates == '')
		document.querySelector('.screen.global').style.display = 'none'
	else {
		document.querySelector('.global .list .listScroller').innerHTML = templates
	}
}
// <div class="infoImage"><img src=${src}></div>

window.addEventListener('load', e => {
	fillCurrent(model)
	fillUpcoming(model)
	fillGlobal(model)
	scroll.start()
})
