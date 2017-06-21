
/*
	toshas pattern :*
	let MakeObject = params => {
		let variable = 10
		return {
			property : false,
			method1 () {
				return variable
			},
			method2 () {
				return params
			}
		}
	}

	let object1 = MakeObject(20)
	object1.property -> false
	object1.method1() -> 10
	object1.method2() -> 20
*/

let jobs = (() => {
	let list   = []
	let active = false
	let start  = () => {
		if (!active) {
			active = true
			let interval = setInterval(() => {
				// save only jobs to the list that return true
				// in our case the job is done it it returns true
				for (let i = 0; i < list.length; i ++)
					if (list[i]()) list[i] = undefined
				list = list.filter(a => a)
				if (list.length == 0) {
					clearInterval(interval)
					active = false
				}
			}, 1000 / config.fps)
		}
	}
	// export interface
	return {
		add (job) {
			start()
			list.push(job)
		},
		delete (job) {
			list.splice(list.indexOf(job), 1)
		},
		clear () {
			list = []
		}
	}
})()

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

// Initialisation for vertical scroll
let initScrollAnimation = parent => {

	let items = parent.querySelectorAll('.event')
	if(items.length == 0) items = parent.querySelectorAll('.globalInfo')
	let timeLine = []
	if (items.length > config.itemsProScreen) {
		let screenNumber = Math.ceil(items.length / config.itemsProScreen)
		let mod = items.length % config.itemsProScreen
		let lastScreenChildNumber = (mod == 0? config.itemsProScreen: mod)
		let timeAcc  = 0
		for (let i = 0; i < screenNumber; i ++) {
			let get = n => {
				let a = n == screenNumber - 1?
					items.length - config.itemsProScreen:
					(n % screenNumber) * config.itemsProScreen
				return items[a].offsetTop - items[0].offsetTop
			}
			// screenDuration
			timeAcc += config.itemDuration *
				(i < screenNumber - 1? config.itemsProScreen: lastScreenChildNumber)
			let screenDurationStart = timeAcc
			// transitionDuration
			timeAcc += config.transitionDuration
			timeLine.push({
				from : {time : screenDurationStart, top  : get(i)},
				to   : {time : timeAcc, top  : get(i + 1)}
			})
		}
	} else
		timeLine.push({
			from : {time : 0, top  : 0},
			to   : {time : items.length * config.itemDuration, top : 0}
		})
	//  4s   0px - 100px  5s
	//  9s 100px - 200px 10s
	// 11s 200px -   0px 12s
	return timeLine
}


// vertical scroll animation
let scrollParent = (parent, end) => {
	let timeLine = initScrollAnimation(parent)
	let start = new Date()
	let job = () => {
		let t = (new Date() - start) / 1000 // elapsed time
		for (let i = 0; i < timeLine.length; i ++) {
			// if the time is inside of transitional window
			let seq = timeLine[i]
			// console.log(seq);
			if (seq.from.time < t && t < seq.to.time) {
				parent.style.transform = `translateY(${-seq.to.top}px)`
				break
			}
		}
		if (t > timeLine[timeLine.length - 1].to.time) {
			end && end()
			return true // delete me from animation list
		}
	}
	// add animation to jobs
	jobs.add(job)
}

export let y = end => {
	let screens = document.querySelectorAll('.screen')
	for (let i = 0; i < screens.length; i ++) {
		if (screens[i].style.display != 'none') {
			let left = screens[i].getBoundingClientRect().left
			let list = screens[i].querySelector('.list .listScroller')
			if (-3 < left) {
				if (list)
					scrollParent(list, end)
				else
					setTimeout(end, config.nonScrollScreenDuration * 1000)
				break
			}
		}
	}
}

export let x = (() => {
	let transitionTime = 1
	let screens        = document.querySelectorAll('.screen')
	return end => { // next
		let start      = new Date()
		let screenFrom = 0
		let screenTo   = 0
		let visibleScreens = []
		for (var i = 0; i < screens.length; i++) {
			if (screens[i].style.display != 'none') {
					visibleScreens.push(screens[i])
			}
		}
		// find the current one automaticaly
		for (let i = 0; i < visibleScreens.length; i ++) {
			if (visibleScreens[i].style.display != 'none') {
				let left = visibleScreens[i].getBoundingClientRect().left
				if (-3 < left) {
					screenFrom = visibleScreens[i].offsetLeft
					screenTo   = visibleScreens[(i + 1) % visibleScreens.length].offsetLeft
					break
				}
			}
		}
		let job = () => {
			let d = parseInt((new Date() - start) / 1000) // elapsed time
			// if (d == transitionTime)
			for (var i = 0; i < screens.length; i ++)
				screens[i].style.transform = `translateX(${-screenTo}px)`
			// document.body.scrollLeft = t
			// if done delete us from animation list

			if (d > transitionTime) {
				end && end()
				// console.log('delete horizontal scroll');
				return true // delete me from animation list
			}
		}
		// add animation to jobs
		jobs.add(job)
	}
})()

// main function for continously switching between horizontal and vertical scrolling
let dir = false
export let start = () => {
	if (dir) x(start)
	else y(start)
	dir = !dir
}

export let stop = () => jobs.clear()

export let reload = () => {
	stop()
	document.body.scrollLeft = 0
	start()
}
