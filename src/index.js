
import '../graphic/style.sass'
import data from './module'
import * as scroll from './scroll'
import mqtt from 'mqtt'
// var client  = mqtt.connect('ws://192.168.2.147:9001')

let model = data
let mqttBroker = config.mqttBroker
let disableScroll = config.disableScroll
let monitorID = config.monitorID

window.disableScroll = scroll.setDisableScroll
window.showScreen = scroll.showScreen

let client  = mqtt.connect(mqttBroker)


let currentTime = new Date()  //Date("June 26, 2017 12:00:00")
let timeSpan    = new Date()  //Date("June 26, 2017 12:00:00")

timeSpan.setHours(timeSpan.getHours()+2)
timeSpan.setMinutes(timeSpan.getMinutes()+ 50)
console.log('currentTime: ' + currentTime);
console.log('timespan: ' + timeSpan);

let currentDay = currentTime.getDate()

let subscribeToEvents = `screens/${monitorID}/${currentTime.getDate()}.${currentTime.getMonth()+1}`

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
	console.log('received new data');
	message = JSON.parse(message)
	console.log(message);
	for (let i in message) if (model[i]) model[i] = message[i]
	console.log(model);

	if (topic == subscribeToEvents) {
		fillCurrent(model)
		fillUpcoming(model)
		if (!scroll.disableScroll)
			scroll.reload()
	}
	if (topic == 'globals') {
		fillGlobal(model)
		if (!scroll.disableScroll)
			scroll.reload()
	}
	if (topic == itemDurationTop)
		scroll.itemDuration = message
	if (topic == gfxScreenDurationTop)
		scroll.graphicScreenDuration = message
	if (topic == disableScrollTop)
		scroll.setDisableScroll(message)
	if (topic == showScreenTop)
		scroll.showScreen(message)
})


let timeToDate = time => {
	let timeParts = time.split(':')
	let dateTime = new Date(currentTime.getTime())
	if (timeParts[0] <= 6)
		dateTime.setDate(dateTime.getDate()+1)
	dateTime.setHours(timeParts[0])
	dateTime.setMinutes(timeParts[1])
	dateTime.setSeconds('00')
	console.log(dateTime);
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



let getRandomMinute = (min, max) => {
	min = min*60000;
	max = max*60000;
	min = Math.ceil(min);
	max = Math.floor(max);
	return Math.floor(Math.random() * (max - min)) + min; //The maximum is exclusive and the minimum is inclusive
}

let changeImage = () => {
	let content = document.getElementById('graphicContent')
	// change image to avocado
	content.style.backgroundImage = "url('/graphic/avocado-16-9.gif')"
	setTimeout(function() {
			// change image back after 3 minutes
			content.style.backgroundImage = "url('/graphic/DesigningHope_Full_big.png')"
			content.style.backgroundRepeat = "no-repeat"
	}, 3*60000)
	content.style.backgroundRepeat = "no-repeat"
	content.style.backgroundSize = "contain"
	content.style.backgroundPosition = "center"
}

let loopImages = () => {
    var rand = getRandomMinute(1,10)
	console.log('will change image after: ' + rand);
    setTimeout(() => {
            changeImage()
            loopImages()
    }, rand)
}
loopImages()

let upcomingEventsOnChange = -1
let eventsOnChange = -1


setInterval(() =>{
	currentTime = new Date() //Date("June 26, 2017 12:01:00")

	let currentEventsLength = model.events.filter(event =>
		timeToDate(event.start) <= currentTime &&
		currentTime <= timeToDate(event.end)).length
	let upcomingEventsLength = model.events.filter(eventItem =>
		timeToDate(eventItem.start) > currentTime).length

	//if new day check if there are still elements in current or upcoming, if not subscribe to new day or just refresh website
	if (currentEventsLength == 0 && upcomingEventsLength == 0){
		client.unsubscribe(subscribeToEvents, () => {
			let day = (currentDay != currentTime.getDate() ? currentTime.getDate() : currentTime.getDate()+1)

			subscribeToEvents = `screens/${monitorID}/${day}.${currentTime.getMonth()+1}`
			client.subscribe(subscribeToEvents)
			console.log('now subscribed to' + subscribeToEvents);
		})
	}

	fillCurrent(model)
	fillUpcoming(model)

	if (upcomingEventsOnChange != upcomingEventsLength
		|| eventsOnChange != currentEventsLength) {
		upcomingEventsOnChange = upcomingEventsLength
		eventsOnChange = currentEventsLength
		if (!scroll.disableScroll)
			scroll.reload()
	}
}, 60000)

window.addEventListener('load', e => {
	fillCurrent(model)
	fillUpcoming(model)
	fillGlobal(model)
	scroll.start()

	// if (!disableScroll) {
	// 	scroll.start()
	// }
})
