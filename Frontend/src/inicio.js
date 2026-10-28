const UMBRAL_CONDUCTIVIDAD = { bajo: 200, alto: 2000 };
const UMBRAL_HUMEDAD = { bajo: 30, alto: 70 };
const UMBRAL_TEMPERATURA = { bajo: 15, alto: 32 };

function calcularEstadoConductividad(valor) {
  if (valor < UMBRAL_CONDUCTIVIDAD.bajo) return 'Bajo';
  if (valor > UMBRAL_CONDUCTIVIDAD.alto) return 'Alto';
  return 'Óptimo';
}

function calcularEstadoHumedad(valor) {
  if (valor < UMBRAL_HUMEDAD.bajo) return 'Bajo';
  if (valor > UMBRAL_HUMEDAD.alto) return 'Alto';
  return 'Óptimo';
}

function calcularEstadoTemperatura(valor) {
  if (valor < UMBRAL_TEMPERATURA.bajo) return 'Bajo';
  if (valor > UMBRAL_TEMPERATURA.alto) return 'Alto';
  return 'Óptimo';
}

async function cargarNombreUsuario() {
  try {
    const res = await fetchProtegido('http://localhost:3000/api/usuarios/perfil');
    if (!res || !res.ok) return;
    const datos = await res.json();
    document.getElementById('nombre-usuario-inicio').textContent = datos.nombre;
  } catch (error) {
    console.error('Error cargando el nombre del usuario:', error);
  }
}

async function cargarSensoresInicio() {
  try {
    const resUltimo = await fetchProtegido('http://localhost:3000/api/sensores/ultimo');
    if (!resUltimo) return;
    const ultimo = await resUltimo.json();

    if (!resUltimo.ok || ultimo.mensaje || !ultimo) {
      console.warn('No se pudieron obtener los datos de los sensores.');
      return;
    }

    const valCond = ultimo.conductividad;
    const valTemp = ultimo.temperaturaBME280;
    const valHum = ultimo.humedadSuelo;

    const estadoCond = valCond !== null ? calcularEstadoConductividad(valCond) : null;
    const estadoTemp = valTemp !== null ? calcularEstadoTemperatura(valTemp) : null;
    const estadoHum = valHum !== null ? calcularEstadoHumedad(valHum) : null;

    const elValCond = document.getElementById('valor-conductividad');
    const elConclusionCond = document.getElementById('conclusion-conductividad');
    if (valCond !== null && valCond !== undefined) {
      elValCond.textContent = `${valCond} µS/cm`;
      if (estadoCond === 'Óptimo') {
        elConclusionCond.textContent = '¡Rango Saludable!';
        elConclusionCond.style.color = '#27ae60';
        elValCond.style.color = '#27ae60';
      } else if (estadoCond === 'Bajo') {
        elConclusionCond.textContent = '¡Bajo!';
        elConclusionCond.style.color = '#e67e22';
        elValValCond.style.color = '#e67e22';
      } else {
        elConclusionCond.textContent = '¡Alto!';
        elConclusionCond.style.color = '#e74c3c';
        elValCond.style.color = '#e74c3c';
      }
    } else {
      elValCond.textContent = 'Sin datos';
      elConclusionCond.textContent = 'Sin conexión';
      elConclusionCond.style.color = '#7f8c8d';
      elValCond.style.color = '#7f8c8d';
    }

    const elValTemp = document.getElementById('valor-temperatura');
    const elConclusionTemp = document.getElementById('conclusion-temperatura');
    if (valTemp !== null && valTemp !== undefined) {
      elValTemp.textContent = `${valTemp} °C`;
      if (estadoTemp === 'Óptimo') {
        elConclusionTemp.textContent = '¡Perfecto!';
        elConclusionTemp.style.color = '#27ae60';
        elValTemp.style.color = '#27ae60';
      } else if (estadoTemp === 'Bajo') {
        elConclusionTemp.textContent = '¡Frío!';
        elConclusionTemp.style.color = '#3498db';
        elValTemp.style.color = '#3498db';
      } else {
        elConclusionTemp.textContent = '¡Calor!';
        elConclusionTemp.style.color = '#e74c3c';
        elValTemp.style.color = '#e74c3c';
      }
    } else {
      elValTemp.textContent = 'Sin datos';
      elConclusionTemp.textContent = 'Sin conexión';
      elConclusionTemp.style.color = '#7f8c8d';
      elValTemp.style.color = '#7f8c8d';
    }

    const elValHum = document.getElementById('valor-humedad');
    const elConclusionHum = document.getElementById('conclusion-humedad');
    if (valHum !== null && valHum !== undefined) {
      elValHum.textContent = `${valHum}%`;
      if (estadoHum === 'Óptimo') {
        elConclusionHum.textContent = '¡Ideal!';
        elConclusionHum.style.color = '#27ae60';
        elValHum.style.color = '#27ae60';
      } else if (estadoHum === 'Bajo') {
        elConclusionHum.textContent = '¡Seco!';
        elConclusionHum.style.color = '#e67e22';
        elValHum.style.color = '#e67e22';
      } else {
        elConclusionHum.textContent = '¡Húmedo!';
        elConclusionHum.style.color = '#3498db';
        elValHum.style.color = '#3498db';
      }
    } else {
      elValHum.textContent = 'Sin datos';
      elConclusionHum.textContent = 'Sin conexión';
      elConclusionHum.style.color = '#7f8c8d';
      elValHum.style.color = '#7f8c8d';
    }

    const textoSaludGeneral = document.querySelector('.contenido-izquierdo .info');
    const subtituloCrecimiento = document.querySelectorAll('.subtitulo-estado')[0];
    const subtituloCondiciones = document.querySelectorAll('.subtitulo-estado')[1];
    const subtituloUltimaMedicion = document.querySelectorAll('.subtitulo-estado')[2];

    const estados = [estadoCond, estadoTemp, estadoHum].filter(e => e !== null);
    const todosOptimos = estados.length > 0 && estados.every(e => e === 'Óptimo');
    const hayProblemas = estados.some(e => e === 'Bajo' || e === 'Alto');

    if (todosOptimos) {
      textoSaludGeneral.textContent = 'Tu planta se encuentra en un rango saludable. Todos los parámetros están estables.';
      
      subtituloCrecimiento.textContent = 'Estable';
      subtituloCrecimiento.style.color = '#27ae60'; 

      subtituloCondiciones.textContent = 'Ideales';
      subtituloCondiciones.style.color = '#27ae60'; 
    } else if (hayProblemas) {
      textoSaludGeneral.textContent = 'Atención: algunos parámetros están fuera del rango recomendado. Revisá los detalles.';
      
      subtituloCrecimiento.textContent = 'En revisión';
      subtituloCrecimiento.style.color = '#e74c3c'; 

      subtituloCondiciones.textContent = 'Alerta';
      subtituloCondiciones.style.color = '#e74c3c'; 
    } else {
      textoSaludGeneral.textContent = 'Esperando lecturas completas de los sensores para evaluar la salud.';
      
      subtituloCrecimiento.textContent = 'Calculando';
      subtituloCrecimiento.style.color = '#7f8c8d';

      subtituloCondiciones.textContent = 'Pendiente';
      subtituloCondiciones.style.color = '#7f8c8d';
    }

    const fechaObj = (ultimo.fecha || ultimo.createdAt) ? new Date(ultimo.fecha || ultimo.createdAt) : new Date();
    
    const opcionesFecha = { timeZone: 'America/Argentina/Buenos_Aires', hour: '2-digit', minute: '2-digit', hour12: false };
    const horaArgentina = new Intl.DateTimeFormat('es-AR', opcionesFecha).format(fechaObj);
    
    const opcionesSoloFecha = { timeZone: 'America/Argentina/Buenos_Aires', year: 'numeric', month: '2-digit', day: '2-digit' };
    const fechaArgentinaStr = new Intl.DateTimeFormat('es-AR', opcionesSoloFecha).format(fechaObj);
    const hoyArgentinaStr = new Intl.DateTimeFormat('es-AR', opcionesSoloFecha).format(new Date());

    const esHoy = fechaArgentinaStr === hoyArgentinaStr;
    subtituloUltimaMedicion.textContent = esHoy ? `Hoy, ${horaArgentina}` : `${fechaArgentinaStr}, ${horaArgentina}`;

  } catch (error) {
    console.error('Error cargando los sensores en el inicio:', error);
  }
}

function cerrarSesion() {
  localStorage.removeItem('token');
  window.location.href = '4. iniciar-sesion.html';
}

cargarNombreUsuario();
cargarSensoresInicio();

setInterval(cargarSensoresInicio, 15 * 60 * 1000);