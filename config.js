
let timeShift = new Date()
timeShift.setDate(27)
timeShift.setHours(1)

var config = {
	mqttBroker 				: 'ws://192.168.2.114:9001',
	// mqttBroker 				:'mqtt://test.mosquitto.org:8080',
	monitorID 		        : 'screen1',
	itemDuration            : 5, // second
	transitionDuration      : 2, // second
	itemsProScreen          : 5,
	fps                     : 30,
	graphicScreenDuration	: 5,
	disableScroll           : 0,
	timeTest				: timeShift,
	avocadoRange			: 30  // minutes
}
