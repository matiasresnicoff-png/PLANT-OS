const UMBRAL_HUMEDAD = { bajo: 30, alto: 70 };

function calcularEstadoHumedad(valor) {
  if (valor < UMBRAL_HUMEDAD.bajo) return 'Bajo';
  if (valor > UMBRAL_HUMEDAD.alto) return 'Alto';
  return 'Óptimo';
}

function recomendacionHumedad(estado) {
  if (estado === 'Bajo') return 'La tierra está seca. Te recomendamos regar la planta pronto.';
  if (estado === 'Alto') return 'Hay exceso de agua en la tierra. Evitá regar hasta que baje la humedad.';
  return 'La humedad del suelo está en un rango óptimo. No hace falta regar todavía.';
}

async function cargarHumedad() {
  try {
    const resUltimo = await fetch('http://localhost:3000/api/sensores/ultimo');
    const ultimo = await resUltimo.json();
    const valor = ultimo.humedadSuelo;

    document.getElementById('valor-humedad').textContent = valor + '%';

    const estado = calcularEstadoHumedad(valor);
    document.getElementById('estado-humedad').textContent = estado;
    document.getElementById('recomendacion-humedad').textContent = recomendacionHumedad(estado);

    const resHistorial = await fetch('http://localhost:3000/api/sensores');
    const historial = await resHistorial.json();
    dibujarGrafico(historial);
  } catch (error) {
    console.error('Error cargando datos de humedad:', error);
  }
}

function dibujarGrafico(historial) {
  const contenedor = document.getElementById('grafico-humedad');
  contenedor.innerHTML = '';

  const ultimos = historial.slice(-8);

  ultimos.forEach((medicion) => {
    const barra = document.createElement('div');
    const alturaPorcentaje = (medicion.humedadSuelo / 100) * 100;
    barra.style.height = alturaPorcentaje + '%';
    barra.style.width = '10%';
    barra.style.background = '#3a7d44';
    barra.style.display = 'inline-block';
    barra.style.marginRight = '2%';
    contenedor.appendChild(barra);
  });
}

cargarHumedad();