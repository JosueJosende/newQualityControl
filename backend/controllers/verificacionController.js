'use strict'

/******************************************************************************************************** */
/**																																																				*/
/**		Requerimientos de modulos de terceros y locales.																									 	*/
/**																																																				*/
/******************************************************************************************************** */

const { ESTADOS, PETICIONES, VERIFICACION, APP, } = require('../config/index');
const { setTimeout } = require('timers/promises');
const { getApiCarel, setApiCarel, getAlarmas } = require('../services/CurlRequest');
const { pushData, getData, delData, saveVerificacion } = require('../services/JsonRequest');



const fs = require('fs');
const moment = require('moment');
const { toClient } = require('../services/SendToClient');









/******************************************************************************************************** */
/**																																																				*/
/**		Variables a nivel de modulo.																																			 	*/
/**																																																				*/
/******************************************************************************************************** */

let enviar = {
	alarmas: [],
	horaInicio: '',
	infoEquipo: {},
	estadoVerificacion: 0
}












/******************************************************************************************************** */
/**																																																				*/
/**		@function: 				Publica																																						*/
/**		@description: 		Vacia valores de variables y se autollama el método loop(), si se cumplen		 			*/
/**											las condiciones.																																	*/
/**		@method: 					loop() --> solo se ejecuta en bucle si la variable global RunLoop 								*/
/**											es igual a TRUE																																		*/
/**																																																				*/
/******************************************************************************************************** */

const initVerififcacion = () => {

	enviar.alarmas = [];
	enviar.horaInicio = '';
	enviar.infoEquipo = {};
	enviar.estadoVerificacion = 0;

	let loop = null;


	loop = async () => {
		
		try {
			
			/******************************************************************************/
			/**																																						*/
			/**		Espera a obtier datos de controlador y modifica variables segun los valores			*/
			/**		recibidos.																															*/
			/**																																						*/
			/******************************************************************************/

			let datos = await getApiCarel(PETICIONES.esenciales).then();
			
			if (datos) {

				ESTADOS.EstadoControlador = true;
				VERIFICACION.Pausada = datos.Pausa;

				enviar.infoEquipo = datos;

				if (datos.EV_Estat) await getAlarmas().then((alarmas) => enviar.alarmas = alarmas);

				await comunicacionEquipo(datos).then(() => {
					toClient('', { ...enviar, ...ESTADOS }, true);
				});

			} else {
				ESTADOS.EstadoControlador = false;
			}

			

			/*await getApiCarel(PETICIONES.esenciales).then((datos) => {

				if (datos) {

					ESTADOS.EstadoControlador = true;
					VERIFICACION.Pausada = datos.Pausa;

					enviar.infoEquipo = datos;
					datos.EV_Estat ? getAlarmas().then((alarmas) => enviar.alarmas = alarmas ) : '';


					comunicacionEquipo(datos).then(() => {

						toClient('', { ...enviar, ...ESTADOS }, true);

					});


				} else {
					ESTADOS.EstadoControlador = false;
				}
			});

			//await setTimeout(1000);*/

		} finally {
			
			setImmediate(() => {
				if (VERIFICACION.RunLoop) loop();
			});
		}
	}

	// Si los datos de verificación se han establecido correctamente en el controlador 
	// se ejecuta el bucle.
	VERIFICACION.SetDatosVerificacion ? loop() : console.log('No se establecieron los datos en el controlador');
}













/******************************************************************************************************** */
/**																																																				*/
/**		@function: 				Privada																																						*/
/**		@description: 		Función que no sigue con la ejecución, hasta que hay comunicación con el  	 			*/
/**											equipo y los valores recibidos son los correctos.																	*/
/**																																																				*/
/******************************************************************************************************** */

const comunicacionEquipo = async (datos) => {

	let datosComprometidos = false;

	// Parada la ejecución en este punto hasta que se comunique con el equipo
	if (datos.EstatComunicacioEquip === 1) {  
		ESTADOS.EstadoEquipo = true;

		
		if (datos.Ev_MinOnT !== 0) {
			datosComprometidos = false;


			// En este punto la ejecución quedará parada hasta que el usuario presione el botón de
			// InicioVerificación, 
			if (datos.IniciVerificacio) preVerificacion(datos).then(() => { return true });


		} else {
			// la ejecución se para aquí sí hay comunicación con el equipo y los valores recibidos
			// no tienen el valor esperado.
			datosComprometidos = true;
		}

		// Emitimos info al cliente y establece como acabada la instalación del softwares cuando
		// se cumple las condiciones necesarias.
		if (!VERIFICACION.SoftInstalado) {
			toClient('instalacionSoftware', { comprometidos: datosComprometidos, comunicacion: ESTADOS.EstadoEquipo }, false);
			
			!datosComprometidos ? VERIFICACION.SoftInstalado = true : '';
		}
	} else {

		ESTADOS.EstadoEquipo = false;
	}

	//return true;
}















/******************************************************************************************************** */
/**																																																				*/
/**		@function: 				Privada																																						*/
/**		@description: 		Si la verificación ha sido iniciada, antes de empezar con la verificación  	 			*/
/**											Recojemos y guardamos datos necesarios para la generación del informe y						*/
/**											restablecer valores en variables del equipo una vez finalizada la verificación		*/
/**																																																				*/
/******************************************************************************************************** */

const preVerificacion = async (datos) => {

	if (!VERIFICACION.SetTrazabilidad) {
		saveTrazabilidad().then((res) => {
			res ? VERIFICACION.SetTrazabilidad = true : APP.debug ? console.log('Error, no se guardaron los datos de trazabilidad de componentes.') : '';
		});
	}

	if (VERIFICACION.SetTrazabilidad && !VERIFICACION.TiemposGuardados) {
		saveTimes().then((res) => {
			res ? VERIFICACION.TiemposGuardados = true : APP.debug ? console.log('Error, no se guardaron los tiempos de compresor y bomba del equipo.') : '';
		});
	}

	if (VERIFICACION.TiemposGuardados && !VERIFICACION.TiemposModificados) {
		modifyTimes().then((res) => {
			res ? VERIFICACION.TiemposModificados = true : APP.debug ? console.log('Error, no se modificaron los tiempos de compresor y bomba del equipo.') : '';
		});
	}


	// Si la pre-verificacion es toda exitosa, continuamos con la verificación.
	if(VERIFICACION.SetTrazabilidad && VERIFICACION.TiemposGuardados && VERIFICACION.TiemposModificados) verificacion(datos);
}














/******************************************************************************************************** */
/**																																																				*/
/**		@function: 				Privada																																						*/
/**		@description: 		Gestiona la realización de las pruebas en el equipo
/**																																																				*/
/******************************************************************************************************** */




















/******************************************************************************************************** */
/**																																																				*/
/**		@function: 				Privada																																						*/
/**		@description: 		Obtiene los valores de tiempo de compressor y bomba y los guardamos en la  	 			*/
/**											estructura de verificación																												*/
/**											restablecer valores en variables del equipo una vez finalizada la verificación		*/
/**																																																				*/
/******************************************************************************************************** */

const saveTimes = async () => {
	
	getVars({
		'name': [
			'EV_DTBombaActive',
			'EV_MinOnOnSameT_Bomba',
			'EV_DTBombaOff',
			'EV_MinOnT_Bomba',
			'Ev_MinOffT_Bomba',
			'EV_MinOnOnSameT',
			'Ev_MinOffT',
			'Ev_MinOnT',
			'EV_OffFabricant',
			'EV_RegulacioUNE'
		]
	}, false).then((val) => {
		
		pushData('', {
			"restablecerDatos": val
		}, false).then(() => {
				return true;

			}).catch((e) => { return false } );
			

		}).catch((e) => { return false } );
}















/******************************************************************************************************** */
/**																																																				*/
/**		@function: 				Privada																																						*/
/**		@description: 		Modifica en el equipo los valores de tiempo de compressor y bomba. 			  	 			*/
/**											Establece la hora de inicio de la verificacion																		*/
/**																																																				*/
/******************************************************************************************************** */

const modifyTimes = async () => {

	setVars({
		'EV_DTBombaActive': 2,
		'EV_MinOnOnSameT_Bomba': 2,
		'EV_DTBombaOff': 2,
		'EV_MinOnT_Bomba': 2,
		'Ev_MinOffT_Bomba': 2,
		'EV_MinOnOnSameT': 10,
		'Ev_MinOffT': 10,
		'Ev_MinOnT': 10,
		'EV_OffFabricant': 2,
		'EV_RegulacioUNE': 0
	}).then(() => {

		pushData('', {
			"verificacion": {
				"horaInicio": moment().format('HH:mm'),
				"horaInitSinFormat": moment(),
				"fechaInicio": moment().format('DD/MMMM/YYYY'),
				"responsableVerificacion": APP.operario
			}
		}, false).then(() => {

				enviar.horaInicio = moment().format('HH:mm');
				return true;
				
			}).catch((e) => {

				return false;
			});
		}).catch((e) => {

			return false;
		});
}



















const saveTrazabilidad = async () => {
	let tipoPowerPlus;
	let tamanyoUPC3;
	
	getApiCarel({ 'name': ['EV_BootVersio_1', 'EV_BootVersio_2', 'EV_BootVersio_3', 'EV_OsVersio_1', 'EV_OsVersio_2', 'EV_OsVersio_3', 'EV_VersioX', 'EV_VersioY', 'EV_VersioZ'] }, false).then((soft) => {
		getApiCarel({ 'name': ['ID_UPC3_1', 'ID_UPC3_2', 'ID_PowerPlus', 'FBVersionX_PWP', 'FBVersionY_PWP', 'FBVersionZ_PWP', 'FBVersionBeta_PWP', 'Type_PowerPlus', 'EV_SmallBoard', 'EV_MediumBoard'] }, false).then((upc3_pwp) => {
			getApiCarel({ 'name': ['Fan1_Year', 'Fan2_Year', 'Fan1_Week', 'Fan2_Week', 'Fan1_Digit1', 'Fan2_Digit1', 'Fan1_Digit2', 'Fan2_Digit2', 'Fan1_Digit3', 'Fan2_Digit3', 'Fan1_Digit4', 'Fan2_Digit4'] }, false).then((fan) => {

				upc3_pwp.EV_SmallBoard ? tamanyoUPC3 = 'SMALL' : upc3_pwp.EV_MediumBoard ? tamanyoUPC3 = 'MEDIUM' : tamanyoUPC3 = 'xxxxxx';
				


				switch (upc3_pwp.Type_PowerPlus) {
					case 1:
						tipoPowerPlus = 'PSD0*122**'
						break;
					case 2:
						tipoPowerPlus = 'PSD0*162**'
						break;
					case 3:
						tipoPowerPlus = 'PSD0*144**'
						break;
					case 4:
						tipoPowerPlus = 'PSD0*224**'
						break;
					case 5:
						tipoPowerPlus = 'PSD1*122**'
						break;
					case 6:
						tipoPowerPlus = 'PSD1*162**'
						break;
					case 7:
						tipoPowerPlus = 'PSD1*102**'
						break;
					case 9:
						tipoPowerPlus = 'PSD1*184**'
						break;
					case 10:
						tipoPowerPlus = 'PSD1*244**'
						break;
					case 11:
						tipoPowerPlus = 'PSD1*354**'
						break;	
					case 12:
						tipoPowerPlus = 'PSD1*404**'
						break;
					case 13:
						tipoPowerPlus = 'PS2**142**'
						break;
					case 14:
						tipoPowerPlus = 'PS2**162**'
						break;
					case 15:
						tipoPowerPlus = 'PS2**252**'
						break;
					case 16:
						tipoPowerPlus = 'PS2**302**'
						break;
					case 17:
						tipoPowerPlus = 'PS2**184**'
						break;
					case 18:
						tipoPowerPlus = 'PS2**244**'
						break;
					case 19:
						tipoPowerPlus = 'PS2**183**'
						break;
					case 20:
						tipoPowerPlus = 'PS2**243**'
						break;
					case 21:
						tipoPowerPlus = 'PS2**061**'
						break;				
					case 22:
						tipoPowerPlus = 'PS2**122**'
						break;
					case 23:
						tipoPowerPlus = 'PSD1*353**'
						break;
					case 24:
						tipoPowerPlus = 'PSD1*403**'
						break;
					case 25:
						tipoPowerPlus = 'PS2**604**'
						break;
					case 26:
						tipoPowerPlus = 'PS2**804**'
						break;
					case 27:
						tipoPowerPlus = 'PS2**603**'
						break;
					case 28:
						tipoPowerPlus = 'PS2**803**'
						break;
					case 29:
						tipoPowerPlus = 'PS2**152**'
						break;
					case 30:
						tipoPowerPlus = 'PS2**182**'
						break;
				
					default:
						tipoPowerPlus = 'PS(X)**(XXX)**'
						break;
				}

				pushData('', {
					"verificacion": {
						"upc": {
							"tipo": tamanyoUPC3,
							"id": upc3_pwp.ID_UPC3_2 + upc3_pwp.ID_UPC3_1
						},
						"power": {
							"id": upc3_pwp.ID_PowerPlus,
							"version": upc3_pwp.FBVersionX_PWP + "." + upc3_pwp.FBVersionY_PWP + "." + upc3_pwp.FBVersionZ_PWP,
							"beta": upc3_pwp.FBVersionBeta_PWP,
							'tipo': tipoPowerPlus
						},
						"fan1": {
							"id": fan.Fan1_Year + fan.Fan1_Week + "00" + fan.Fan1_Digit1 + fan.Fan1_Digit2 + fan.Fan1_Digit3 + fan.Fan1_Digit4
						},
						"fan2": {
							"id": fan.Fan2_Year + fan.Fan2_Week + "00" + fan.Fan2_Digit1 + fan.Fan2_Digit2 + fan.Fan2_Digit3 + fan.Fan2_Digit4
						},
						"soft": {
							"versionSoftware": soft.EV_VersioX + '.' + soft.EV_VersioY + '.' + soft.EV_VersioZ,
							"versionOS": soft.EV_OsVersio_1 + '.' + soft.EV_OsVersio_2 + '.' + soft.EV_OsVersio_3,
							"versionBoot": soft.EV_BootVersio_1 + '.' + soft.EV_BootVersio_2 + '.' + soft.EV_BootVersio_3
						}
					}
				}, false).then(() => {
					APP.debug ? console.log('Establecidos datos de trazabilidad de componentes.') : '';
					return true;
					
				}).catch(() => {
					return false;

				});
			}).catch(() => {
				return false;

			});
		}).catch(() => {
			return false;

		}).catch(() => {
			return false;

		});
	});
}