const UMBRAL_HUMEDAD = { bajo: 30, alto: 70 };
const ESCALA_HUMEDAD = 100;

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
  contenedor.style.position = 'relative';
  contenedor.style.display = 'flex';
  contenedor.style.alignItems = 'flex-end';
  contenedor.style.justifyContent = 'space-between';
  contenedor.style.borderBottom = '2px solid #444';
  contenedor.style.paddingTop = '20px';
  contenedor.style.boxSizing = 'border-box';

  [UMBRAL_HUMEDAD.bajo, UMBRAL_HUMEDAD.alto].forEach((umbral) => {
    const linea = document.createElement('div');
    const posicion = (umbral / ESCALA_HUMEDAD) * 100;
    linea.style.position = 'absolute';
    linea.style.left = '0';
    linea.style.right = '0';
    linea.style.bottom = posicion + '%';
    linea.style.borderTop = '1px dashed #999';
    linea.style.fontSize = '9px';
    linea.style.color = '#777';
    linea.style.paddingLeft = '2px';
    linea.textContent = umbral + '%';
    contenedor.appendChild(linea);
  });

  const ultimos = historial.slice(-8);

  ultimos.forEach((medicion) => {
    const valor = medicion.humedadSuelo;
    const estadoBarra = calcularEstadoHumedad(valor);

    const columna = document.createElement('div');
    columna.style.display = 'flex';
    columna.style.flexDirection = 'column';
    columna.style.alignItems = 'center';
    columna.style.width = '10%';

    const etiqueta = document.createElement('div');
    etiqueta.textContent = valor + '%';
    etiqueta.style.fontSize = '10px';
    etiqueta.style.marginBottom = '2px';
    etiqueta.style.color = '#333';

    const barra = document.createElement('div');
    const alturaPorcentaje = (valor / ESCALA_HUMEDAD) * 100;
    barra.style.height = alturaPorcentaje + '%';
    barra.style.width = '100%';
    barra.style.minHeight = '4px';
    barra.style.background = estadoBarra === 'Óptimo' ? '#3a7d44' : '#c9762b';

    columna.appendChild(etiqueta);
    columna.appendChild(barra);
    contenedor.appendChild(columna);
  });
}

cargarHumedad();