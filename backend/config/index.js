'use strict'

const PORT = 4004

let SERVER = {
	nombre: 'ControlCalidad_1',
	version: '0.8.2',
	urlApiCarel: '',

	configSQL: {
		server: '10.44.82.43',
		database:'axapta_25',
  	options: {
			tdsVersion: "7_1",
			encrypt: false, 
			rowCollectionOnRequestCompletion: true,
			database: 'axapta_25',
			requestTimeout: 30 * 1000,
			debug: {
				data: true,
				payload: false,
				token: false,
				packet: true,
				log: true
			}
  	},
  	authentication: {
    	type: 'default',
			options: {
				database:'axapta_25',
    	  userName: 'sa',
    	  password: 'ducati!'
    	}
  	}
	},
}

let APP = {
	operario: '',
	runLoop: false
}

let VERIFICACION = {
	
}

let ESTADOS = {
	EstadoAxapta: false,
	InfoAxapta: 'Desconectado', // [Desconectado, Establecida, Reconectando]
}

module.exports = {
	PORT,
	SERVER,
	VERIFICACION,
	ESTADOS,
	APP
}