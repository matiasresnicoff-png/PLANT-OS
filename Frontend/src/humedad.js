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
  contenedor.style.gap = '4%';
  contenedor.style.borderBottom = '2px solid rgba(255,255,255,0.6)';
  contenedor.style.padding = '28px 6px 0';
  contenedor.style.boxSizing = 'border-box';
  contenedor.style.fontFamily = 'Arial, sans-serif';

  [
    { valor: UMBRAL_HUMEDAD.bajo, texto: `Bajo ${UMBRAL_HUMEDAD.bajo}%` },
    { valor: UMBRAL_HUMEDAD.alto, texto: `Alto ${UMBRAL_HUMEDAD.alto}%` },
  ].forEach(({ valor, texto }) => {
    const posicion = (valor / ESCALA_HUMEDAD) * 100;

    const linea = document.createElement('div');
    linea.style.position = 'absolute';
    linea.style.left = '0';
    linea.style.right = '0';
    linea.style.bottom = posicion + '%';
    linea.style.borderTop = '1px dashed rgba(255,255,255,0.7)';
    contenedor.appendChild(linea);

    const etiquetaLinea = document.createElement('div');
    etiquetaLinea.textContent = texto;
    etiquetaLinea.style.position = 'absolute';
    etiquetaLinea.style.left = '4px';
    etiquetaLinea.style.bottom = `calc(${posicion}% + 3px)`;
    etiquetaLinea.style.fontSize = '9px';
    etiquetaLinea.style.fontWeight = '600';
    etiquetaLinea.style.color = '#fff';
    etiquetaLinea.style.background = 'rgba(0,0,0,0.45)';
    etiquetaLinea.style.padding = '1px 5px';
    etiquetaLinea.style.borderRadius = '8px';
    etiquetaLinea.style.zIndex = '5';
    contenedor.appendChild(etiquetaLinea);
  });

  const ultimos = historial.slice(-8);

  ultimos.forEach((medicion) => {
    const valor = medicion.humedadSuelo;
    const estadoBarra = calcularEstadoHumedad(valor);

    const columna = document.createElement('div');
    columna.style.display = 'flex';
    columna.style.flexDirection = 'column';
    columna.style.alignItems = 'center';
    columna.style.justifyContent = 'flex-end';
    columna.style.height = '100%';
    columna.style.flex = '1';
    columna.style.zIndex = '3';

    const etiqueta = document.createElement('div');
    etiqueta.textContent = valor + '%';
    etiqueta.style.fontSize = '11px';
    etiqueta.style.fontWeight = 'bold';
    etiqueta.style.marginBottom = '4px';
    etiqueta.style.color = '#fff';
    etiqueta.style.textShadow = '0 1px 2px rgba(0,0,0,0.5)';

    const barra = document.createElement('div');
    const alturaPorcentaje = (valor / ESCALA_HUMEDAD) * 100;
    barra.title = `${valor}% — ${estadoBarra}`;
    barra.style.height = alturaPorcentaje + '%';
    barra.style.width = '70%';
    barra.style.minHeight = '6px';
    barra.style.borderRadius = '6px 6px 2px 2px';
    barra.style.boxShadow = '0 2px 4px rgba(0,0,0,0.25)';
    barra.style.transition = 'transform 0.15s ease';
    barra.style.background = estadoBarra === 'Óptimo'
      ? 'linear-gradient(180deg, #6fd07f, #2f8f45)'
      : 'linear-gradient(180deg, #ffb15c, #e07a1f)';

    barra.addEventListener('mouseenter', () => { barra.style.transform = 'scaleY(1.03)'; });
    barra.addEventListener('mouseleave', () => { barra.style.transform = 'scaleY(1)'; });

    columna.appendChild(etiqueta);
    columna.appendChild(barra);
    contenedor.appendChild(columna);
  });
}

cargarHumedad();
setInterval(cargarHumedad, 15 * 60 * 1000);