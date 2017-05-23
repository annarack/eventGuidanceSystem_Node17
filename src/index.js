
import '../graphic/style.sass'
import model from './module'

let titelLength            = 50
let visibleEvents          = 4
let visibleTimePerEvent    = 2
let verticalTransitionTime = 1

let currentTime = new Date("May 22, 2017 17:00:00")
let timeSpan    = new Date("May 22, 2017 17:00:00")
// let currentTime   = new Date()
// //events starttime should be earlier than timeSpan to be displayed as upcoming
// let timeSpan      = new Date()
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
						string
	return trimmedString
}

let sortEvents = eventList => {
	eventList.sort(function(a,b){
		if (a.start < b.start) return -1
		if (a.start > b.start) return 1
		return 0
	})
}

//filter for currently active events
let currentEvents = model.filter(event => (timeToDate(event.start) <= currentTime) && (currentTime <= timeToDate(event.end)))
//filter for upcoming events
let upcomingEvents = model.filter(event => timeToDate(event.start) < timeSpan && timeToDate(event.start) > currentTime)

console.log(currentEvents.length);

sortEvents(currentEvents)
sortEvents(upcomingEvents)

let fillList = (listID, events) => {
	events.forEach(data => {
		let event = document.createElement('div')
		event.classList.add('event')
		listID.appendChild(event)
		event.innerHTML = `
			<div class="title">${trimString(data.name)}</div>
			<div class="time">from ${data.start} to ${data.end}</div>
			<div class="room">${data.building}, ${data.room}</div>
		`//
		console.log('created event');
	})
	console.log('filled ' + listID.id + '-list with data');
}

// fillList(list.current, currentEvents)
// fillList(list.upcoming, upcomingEvents)


let fillLists = (fillList(list.current, currentEvents), filledFirstList => {
	let fillSecond = (fillList(list.upcoming, upcomingEvents), filledSecondList => {
		console.log('both lists should be filled');
	 	animateCurrentList()
	})
	fillSecond()
})

let animateCurrentList = () => {
	console.log('now do stuff');
}

fillLists()



// //amount of events in list
// let getNumEventsOfList = list => list.getElementsByClassName('event').length
//
// //number of slides and amount of scroll times
// let getNumberOfSlides  = list => {
// 	let n = Math.ceil(getNumEventsOfList(list) / visibleEvents)
// 	console.log('number of slides: ' + n);
// 	return n
// }
//
// //size in percent of last slide relating to list.clientHeight
// let sizeOfLastSlide = list => (getNumEventsOfList(list) / visibleEvents) - Math.floor(getNumEventsOfList(list) / visibleEvents)
//
// let numberEventsOnLastSlide = list => getNumEventsOfList(list) % visibleEvents
//
// // fill array with slide coordinates for ScrollTop
// let fillCoordsList = list => {
// 	let scrollTopCoords = []
// 	for (var i = 0; i < (getNumberOfSlides(list)); i++) {
// 		console.log('fill coordList');
// 		if(i == (getNumberOfSlides(list) - 1))
// 			scrollTopCoords[i] = scrollTopCoords[i-1] + list.clientHeight * sizeOfLastSlide(list)
// 		else
// 			scrollTopCoords[i] = i * list.clientHeight
// 	}
// 	return scrollTopCoords
// }
//
// let currentScrollCoords  = fillCoordsList(list.current)
// let upcomingScrollCoords = fillCoordsList(list.upcoming)
//
// for (var i = 0; i < currentScrollCoords.length; i++) {
// 	console.log('coords: ' + currentScrollCoords[i]);
// }
//
// let getAnimTimesForIteration = list => {
// 	let animTimes = []
// 	let numTimes = getNumberOfSlides(list) * 2 // after each slide one transition
// 	for (var i = 0; i < numTimes; i++) {
// 		if (i%2 === 0){
// 			if (i == (numTimes-2))
// 				animTimes[i] = visibleTimePerEvent * numberEventsOnLastSlide(list)
// 			else
// 				animTimes[i] = visibleTimePerEvent * visibleEvents
// 		}
// 		else
// 			animTimes[i] = verticalTransitionTime
// 	}
// 	return animTimes
// }
//
// let currentAnimTimes = getAnimTimesForIteration(list.current)
// for (var i = 0; i < currentAnimTimes.length; i++) {
// 	console.log('animTime: ' + currentAnimTimes[i]);
// }

//ease in and out functions
const easeIn    = p => t => Math.pow(t, p)
const easeOut   = p => t => (1 - Math.abs(Math.pow(t-1, p)))
const easeInOut = p => t => t<.5? easeIn(p)(t*2)/2: easeOut(p)(t*2 - 1)/2+0.5

let map = (value, aMin, aMax, bMin, bMax, clamp) => {
	var x = clamp == true? (
		value < aMin? aMin:
		value > aMax? aMax: value
	):  value
	return (
		(x - aMin) /
		(aMax - aMin) *
		(bMax - bMin) + bMin
	)
}

let initScrollAnimation = parent => {
	// settings
	let itemDuration       = 2 // second
	let transitionDuration = 3 // second
	let itemsProScreen     = 4
	// other stuff
	let items = parent.querySelectorAll('.event')
	let screenNumber = Math.ceil(items.length / itemsProScreen)
	let lastScreenChildNumber = items.length % itemsProScreen
	let timeLine = []
	let timeAcc  = 0
	for (let i = 0; i < screenNumber; i ++) {
		let get = n => {
			let a = n == screenNumber - 1?
				items.length - itemsProScreen:
				(n % screenNumber) * itemsProScreen
			return items[a].offsetTop - items[0].offsetTop
		}
		// screenDuration
		timeAcc += itemDuration *
			(i < screenNumber - 1? itemsProScreen: lastScreenChildNumber)
		let screenDurationStart = timeAcc
		// transitionDuration
		timeAcc += transitionDuration
		timeLine.push({
			from : {time : screenDurationStart, top  : get(i)},
			to   : {time : timeAcc, top  : get(i + 1)}
		})
	}
	//  4s   0px - 100px  5s
	//  9s 100px - 200px 10s
	// 11s 200px -   0px 12s
	return timeLine
}

let scrollParent = (parent, timeLine) => {
	let fix = .3
	let start = new Date()
	return () => {
		let t = (new Date() - start) / 1000 // elapsed time
		let l = t % timeLine[timeLine.length - 1].to.time // loop the time
		let seq = null // find animation (transition) window
		for (let i = 0; i < timeLine.length; i ++)
			// if the time is inside of transitional window
			if (timeLine[i].from.time < fix + l && l - fix < timeLine[i].to.time) {
				seq = timeLine[i]
				break
			}
		// if we are in the window
		if (seq) {
			let n = map(l, seq.from.time, seq.to.time, 0, 1, true) // convert to normal number 0-1
			let e = easeInOut(4)(n) // apply ease function
			let t = map(e, 0, 1, seq.from.top, seq.to.top) // convert to coordinates
			parent.scrollTop = t + 1 // scroll parent
		}
	}
}

let scrollJobs = [
	scrollParent(list.current, initScrollAnimation(list.current)) // add a scroll job
]

let loop = setInterval(() => {
	scrollJobs.forEach(job => job())
}, 1000/60)







// //
// //
// //
// // // param
// // let visibleTime    = 300
// // let timer          = 0
// // let numberOfSheets = numberOfSlides(currentEvents)
// //
//
// //ease in and out functions
// const easeIn    = p => t => Math.pow(t, p)
// const easeOut   = p => t => (1 - Math.abs(Math.pow(t-1, p)))
// const easeInOut = p => t => t<.5 ? easeIn(p)(t*2)/2 : easeOut(p)(t*2 - 1)/2+0.5
//
// let timesStepper = 0
// let secondsCounter = 0
// let step           = .005
// let t              = 0
//
// let scrollVerticaly = (list, scrollVal) => {
// 	t += step
// //   	let tStep = easeInOut(3)(t)
//    // if (t > 1 || t < 0) step = -step
//    list.scrollTop = t * scrollVal
// }
//
// // call anonymous function multiple times
// setInterval(() => {
//
// 	secondsCounter += 1/60
// 	if (timesStepper%2 === 0){
// 		if (secondsCounter >= currentAnimTimes[timesStepper]) {
// 			timesStepper += 1
// 			secondsCounter = 0
// 		}
// 	} else {
// 		if (secondsCounter >= currentAnimTimes[timesStepper]) {
//
// 		}
// 		scrollVerticaly(list.current, currentScrollCoords[timesStepper])
// 	}
//
// 	for (var i = 0; i < currentAnimTimes.length; i++) {
// 		currentAnimTimes[i]
// 	}
// 	// scroll animation of list
// 	// t += step
//  //   	let tStep = easeInOut(3)(t)
// 	// if (t > 1 || t < 0) step = -step
// 	// list.current.scrollTop = tStep * (list.current.scrollHeight - list.current.offsetHeight)
// // 60 fps
// }, 1000 / 60)
