
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

let initScrollAnimation = parent => {
	// other stuff
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

let scrollParent = (parent, end) => {
	let timeLine = initScrollAnimation(parent)
	let fix = .1
	let start = new Date()
	let job = () => {
		let t = (new Date() - start) / 1000 // elapsed time
		for (let i = 0; i < timeLine.length; i ++) {
			// if the time is inside of transitional window
			let seq = timeLine[i]
			if (seq.from.time < fix + t && t - fix < seq.to.time) {
				let n = map(t, seq.from.time, seq.to.time, 0, 1) // convert to normal number 0-1
				let e = easeInOut(4)(n) // apply ease function
				let y = map(e, 0, 1, seq.from.top, seq.to.top) // convert to coordinates
				parent.scrollTop = y + 2// scroll parent
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
			let list = screens[i].querySelector('.list')
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
	let transitionTime = 3
	let screens        = document.querySelectorAll('.screen')
	return end => { // next
		let start      = new Date()
		let screenFrom = 0
		let screenTo   = 0
		// find the current one automaticaly
		for (let i = 0; i < screens.length; i ++) {
			if (screens[i].style.display != 'none') {
				let left = screens[i].getBoundingClientRect().left
				if (-3 < left) {
					screenFrom = screens[i].offsetLeft
					screenTo   = screens[(i + 1) % screens.length].offsetLeft
					break
				}
			}
		}
		let job = () => {
			let d = (new Date() - start) / 1000 // elapsed time
			let n = map(d, 0, transitionTime, 0, 1) // convert to normal number 0-1
			let e = easeInOut(4)(n) // apply ease function
			let t = map(e, 0, 1, screenFrom, screenTo) // convert to coordinates
			document.body.scrollLeft = t
			// if done delete us from animation list
			if (n > 1) {
				end && end()
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
