
import '../graphic/style.sass'
import model from './module'

let titelLength = 50
let visibleEvents = 4

let currentTime = new Date()
//events starttime should be earlier than timeSpan to be displayed as upcoming
let timeSpan = new Date()
timeSpan.setHours(timeSpan.getHours()+2)


let list = {
	current  : document.querySelector('#current'),
	upcoming : document.querySelector('#upcoming'),
	global   : document.querySelector('#global')
}

let timeToDate = time => {
	let timeParts = time.split(':')
	let dateTime = new Date()
	dateTime.setHours(timeParts[0])
	dateTime.setMinutes(timeParts[1])
	dateTime.setSeconds('00')
	return dateTime
}

let trimString = string => {
	let trimmedString = string.length > titelLength ?
						string.substring(0, titelLength - 3) + "..." :
						string;
	return trimmedString
}

let sortEvents = eventList => {
	eventList.sort(function(a,b){
		if (a.start < b.start) return -1;
		if (a.start > b.start) return 1;
		return 0;
	})
}

//filter for currently active events
let currentEvents = model.filter(event => (timeToDate(event.start) <= currentTime) && (currentTime <= timeToDate(event.end)))
//filter for upcoming events
let upcomingEvents = model.filter(event => timeToDate(event.start) < timeSpan && timeToDate(event.start) > currentTime)

sortEvents(currentEvents)
sortEvents(upcomingEvents)

let fillList = (listID, events) => {
	events.forEach(data => {
		let event = document.createElement('div')
		event.classList.add('event')
		listID.appendChild(event)
		event.innerHTML = `
			<div class="title">${data.name}</div>
			<div class="time">from ${data.start} to ${data.end}</div>
			<div class="room">${data.building}, ${data.room}</div>
		`//
	})
}

fillList(list.current, currentEvents)
fillList(list.upcoming, upcomingEvents)

const easeIn  = p => t => Math.pow(t, p);
const easeOut = p => t => (1 - Math.abs(Math.pow(t-1, p)));
const easeInOut = p => t => t<.5 ? easeIn(p)(t*2)/2 : easeOut(p)(t*2 - 1)/2+0.5;

let getVerticalScrollSheets = eventList => {
	return Math.ceil(eventList.length / visibleEvents)
}
getVerticalScrollSheets(currentEvents)

// param
let t    = 0
let step = .005
// call anonymous function multiple times
setInterval(() => {
	// scroll animation of the list
	t += step
   	let tStep = easeInOut(3)(t);
	if (t > 1 || t < 0) step = -step
	list.current.scrollTop = tStep * (list.current.scrollHeight - list.current.offsetHeight)
// 60 fps
}, 1000 / 60)
