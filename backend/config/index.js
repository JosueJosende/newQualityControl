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
	debug: false,
	log: false
}




let VERIFICACION = {
	Pausada: false,
	RunLoop: false,
	SoftInstalado: false,
	TiemposGuardados: false,
	TiemposModificados: false,
	SetDatosVerificacion: false,    // Se establece en true en EquiposController --> SetEquip() una vez se inserte datos en uPC3.
	SetTrazabilidad: false,
	FinVerificacion: false
}




let ESTADOS = {
	EstadoAxapta: false,
	InfoAxapta: 'Desconectado', // [Desconectado, Establecida, Reconectando]
	EstadoEquipo: false,
	EstadoControlador: false
}




let PETICIONES = {
	esenciales: {
		'name': ['Pausa', 'EstatComunicacioEquip', 'IniciVerificacio', 'DadesVerificacio.equip', 'EV_Estat', 'Ev_MinOnT', 'EstatComunicacioServer', 'EV_EstatCompressor_1', 'EV_EstatVentiladorExterior_C1', 'EV_EstatBomba_1', 'EV_VentExtPorcentage', 'EV_PWRP_RotorSpeed_rps', 'EV_UnitStatus', 'EV_ModoFuncionament', 'EV_OnOff', 'EV_UnitatNoConfigurada']
	}
}





let COMPONENTE = {
	transductor_0_45: ['060547', '060687', '069763', '097246'],
	transductor_agua: ['069788'],
	valvXviasProporcional: ['059760', '059761', '059762', '059763', '059764', '059765', '059768', '059769', '059770', '059771', '059772', '059773'],
	medidorEnergia: ['060788'],
	toroidal: ['069841', '069854'],
	pgd: ['063885'],
	miniPGD: ['060786'],
	thtune: ['063049'],
	bombaAgua: ['068442', '068443', '068445', '068447', '068449', '068465', '068467', '068469', '068490', '068470', '068497', '068498', '068881', '068882', '068885', '068886', '068887', '068888', '068890', '068891', '068892', '068893', '068895', '068896', '068897', '068898', '068899', '069625', '069639', '069706', '069707', '069730', '069732', '069733', '069794', '069799', '069998',"068435",
	"068436","068475","068476","068477","069601","103419","103428","103553","103580","103661","103985","104076","104268","104277","104466","104521","104557","104558","104563","104566","104570","104588"],
	kgrRefrigerante: ['015407'/*R407c*/, '015408' /*R410a*/, '015422'/*R22*/, '015423'/*R452B*/, '015424' /*R454B*/, '015429' /*R290*/, '015454', /*R454C*/, '015906' /*R134A*/, '015923' /*R32*/],
	ventAxial: ['071156', '071136', '071150', '071130', '071291', '071196', '071197', '071276', '068288', '071303', '071298', '068352',"071188","071186","071189","071187","071365","071364","071370"],
	ventRadial: ['071244', '071242', '071243', '071231', '071261', '071262', '071277', '071239', '071259', '071278', '071280', '071247', '071240', '071252', '071283'],
	ventMotor: ['069605','069695','069697','069696'],
	ventTurbina: ['069657', '069650', '069656', '069651', '068316', '069655'],
	compresor: ['050488','050487','050486','050485','050484','050480','059668','059666','059667','059615','059665','059080','059084','059309','059310','059311','059313','059314','059320','059321','059322','059323','059324','059325','059326','059327','059328','059329','059073','059074','059075','059076','059077','059079','059100','059109','059110','059111','059330','059331','059332','059341','059342','059380','059381','059382'],
	bomba: ['069732','068885','069663','069707','068881','068882','068445','068447','068449','068435','068436','068475','068476','068477','069601','103419','103428','103553','103580','103661','103985','104076','104268','104277','104466','104521','104557','104558','104563','104566','104570','104588']
}








module.exports = {
	PORT,
	SERVER,
	VERIFICACION,
	ESTADOS,
	APP,
	COMPONENTE,
	PETICIONES
}