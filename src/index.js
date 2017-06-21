
import '../graphic/style.sass'
import model from './module'
import * as scroll from './scroll'
import mqtt from 'mqtt'
// var client  = mqtt.connect('ws://192.168.96.147:9001')
var client  = mqtt.connect('mqtt://test.mosquitto.org:8080')



let currentTime = new Date("June 26, 2017 12:00:00")
let timeSpan    = new Date("June 26, 2017 12:00:00")
// let currentTime   = new Date()
// //events starttime should be earlier than timeSpan to be displayed as upcoming
// let timeSpan      = new Date()
timeSpan.setHours(timeSpan.getHours()+2)
console.log('currentTime: ' + currentTime);
console.log('timespan: ' + timeSpan);



let subscribeTo = `screens/${config.monitorID}/${currentTime.getDate()}.${currentTime.getMonth()+1}`
console.log('subscribe to: ' + subscribeTo);


client.on('connect', () => {
	client.subscribe(subscribeTo)
	client.subscribe('globals')
	client.publish('presence', 'Hello mqtt')
	console.log('connected to mqtt server')
})

client.on('message', (topic, message) => {
	// message is Buffer
	// let model = message.toString()
	let model = JSON.parse(message)
	console.log('received new data');
	console.log(model);

	if (topic == subscribeTo) {
		fillCurrent(model)
		fillUpcoming(model)
		scroll.reload()
	}
	if (topic == 'globals') {
		fillGlobal(model)
		scroll.reload()
	}

})




// document.querySelector('.screen.current').style.display = 'none'

let timeToDate = time => {
	let timeParts = time.split(':')

	// let dateTime = currentTime // --> wenn spaeter hours etc gesetzt wird, wird currenttime ueberschrieben !!!

	let dateTime = new Date("June 26, 2017 12:00:00")
	// if (timeParts[1] <= 6)
	// 	dateTime.setDate(dateTime.getDate()+1)
	dateTime.setHours(timeParts[0])
	dateTime.setMinutes(timeParts[1])
	dateTime.setSeconds('00')

	// console.log('parsed time to date: '  +  dateTime);
	return dateTime
}

let sortEvents = (a,b) =>
	a.start < b.start? -1: a.start > b.start? 1: 0

let fillCurrent = model => {
	let templates = ''
	// console.log(model);
	// console.log(model.events);
	// console.log(model.events[0].room);

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
			// console.log(data.image)
			if(data.title != '' || data.text != ''){
				templates +=
				`<div class="globalInfo orange ${data.image? `short`: ``}" >
					<div class="title">${data.title}</div>
					<div class="text">${data.text}</div>
					${data.image? `<div class="infoImage" style="background-image:${data.image}"></div>`: ``}
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
// <div class="infoImage"><img src=${src}></div>

window.addEventListener('load', e => {
	fillCurrent(model)
	fillUpcoming(model)
	fillGlobal(model)

	scroll.start()
})
