console.log(config);
export let itemDuration = config.itemDuration
export let graphicScreenDuration = config.graphicScreenDuration
let disableScroll = config.disableScroll

export let setDisableScroll = state => disableScroll = state
/*
	toshas pattern:
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
				// in our case the job is done if it returns true
				for (let i = 0; i < list.length; i ++)
					if (list[i]()) list[i] = undefined
				list = list.filter(a => a)
				if (list.length == 0) {
					clearInterval(interval)
					active = false
				}
				console.log(list.length);
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
			list = new Array()
			console.log('cleared job list');
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
	if (items.length == 0) items = parent.querySelectorAll('.globalInfo')
	let timeLine = []
	console.log('there are: ' + items.length + ' items in list');
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
			timeAcc += itemDuration *
				(i < screenNumber - 1? config.itemsProScreen: lastScreenChildNumber)
			let screenDurationStart = timeAcc
			// transitionDuration
			timeAcc += config.transitionDuration
			timeLine.push({
				from : {time : screenDurationStart, top  : get(i)},
				to   : {time : timeAcc, top  : get(i + 1)}
			})
		}
	} else {
		timeLine.push({
			from : {time : 0, top  : 0},
			to   : {time : items.length * itemDuration, top : 0}
		})
		console.log('less items than itemsProScreen, show for: ' + items.length*itemDuration);
	}
	//  4s   0px - 100px  5s
	//  9s 100px - 200px 10s
	// 11s 200px -   0px 12s
	return timeLine
}


// vertical scroll animation
let scrollParent = (parent, end) => {
	let timeLine = initScrollAnimation(parent)
	let start = new Date()
	parent.style.transform = `translateY(0px)`
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
			console.log('should delete vertical job');
			return true // delete me from animation list
		}
	}
	// add animation to jobs
	console.log('added vertical job');
	jobs.add(job)
}

let graphicScrollTimeout
export let y = end => {
	console.log('should now scroll vertically');
	let screens = document.querySelectorAll('.screen')
	for (let i = 0; i < screens.length; i ++) {
		if (screens[i].style.display != 'none') {
			let left = screens[i].getBoundingClientRect().left
			let list = screens[i].querySelector('.list .listScroller')
			if (-3 < left) {
				if (list){
					console.log('now scroll screen with list');
					scrollParent(list, end)
				}
				else {
					// console.log('screen has no list, wait for: ' + graphicScreenDuration * 1000);
					// graphicScrollTimeout = setTimeout(end, graphicScreenDuration * 1000)

					let beg = new Date()
					jobs.add(() => {
						let t = (new Date() - beg) / 1000 // elapsed time
						if (t > graphicScreenDuration) {
							console.log('done scroll for screen with no list');
							end && end()
							return true // delete me from animation list
						}
					})
				}
				break
			}
		}
	}
}

export let x = (() => {
	let transitionTime = 1
	let screens        = document.querySelectorAll('.screen')
	return end => { // next
		console.log('should now scroll horizontally');

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
			for (var i = 0; i < visibleScreens.length; i ++)
				visibleScreens[i].style.transform = `translateX(${-screenTo}px)`

			if (d > transitionTime) {
				end && end()
				console.log('should delete horizontal job');
				return true // delete me from animation list
			}
		}
		// add animation to jobs
		console.log('added horizontal job');
		jobs.add(job)
	}
})()



export let showScreen = id => {
	stop()
	clearTimeout(graphicScrollTimeout)
	let beg      = new Date()
	let screens        = document.querySelectorAll('.screen')
	let visibleScreens = []
	for (var i = 0; i < screens.length; i++) {
		if (screens[i].style.display != 'none')
				visibleScreens.push(screens[i])
	}
	let left = visibleScreens[id].offsetLeft

	let job = () => {
		let d = parseInt((new Date() - beg) / 1000) // elapsed time
		for (var i = 0; i < visibleScreens.length; i ++)
			visibleScreens[i].style.transform = `translateX(${-left}px)`
		if (d > 1) {
			console.log('delete showscreen transition');
			dir = false
			start()
			return true // delete me from animation list
		}
	}
	jobs.add(job)
}



// main function for continously switching between horizontal and vertical scrolling
let dir = false
export let start = () => {
	console.log('dir:', dir? 'horizontal' : 'vertical');
	if (dir && !disableScroll) x(start)
	else y(start)
	dir = !dir
}

export let stop = () => jobs.clear()

export let reloadVertical = () => {
	stop()
}

let numVisibleScreensOnChange = 0
export let reload = () => {
	stop()
	dir = false
	let screens        = document.querySelectorAll('.screen')
	let visibleScreens = []
	let numVisibleScreens = 0
	for (var i = 0; i < screens.length; i++) {
		if (screens[i].style.display != 'none'){
			numVisibleScreens += 1
			visibleScreens.push(screens[i])
		}
	}
	if (numVisibleScreens != numVisibleScreensOnChange){
		console.log('amount of screens changed so reset to first screen');
		for (var i = 0; i < visibleScreens.length; i++) {
			visibleScreens[i].style.transform = `translateX(0px)`
		}
		numVisibleScreensOnChange = numVisibleScreens
	}
	let beg = new Date()
	jobs.add(() => {
		let t = (new Date() - beg) / 1000 // elapsed time
		if (t > 1.1) {
			console.log('start is executed on reload');
			start()
			return true // delete me from animation list
		}
	})
}
