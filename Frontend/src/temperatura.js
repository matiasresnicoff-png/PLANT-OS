const UMBRAL_TEMPERATURA = { bajo: 15, alto: 32 };
const ESCALA_TEMPERATURA = 40;

function calcularEstadoTemperatura(valor) {
  if (valor < UMBRAL_TEMPERATURA.bajo) return 'Bajo';
  if (valor > UMBRAL_TEMPERATURA.alto) return 'Alto';
  return 'Óptimo';
}

function recomendacionTemperatura(estado) {
  if (estado === 'Bajo') return 'La temperatura es baja para la planta. Te recomendamos moverla a un lugar más cálido.';
  if (estado === 'Alto') return 'La temperatura es alta para la planta. Te recomendamos ubicarla en un lugar más fresco.';
  return 'La temperatura está en un rango óptimo para la planta.';
}

async function cargarTemperatura() {
  const elValor = document.getElementById('valor-temperatura');
  const elEstado = document.getElementById('estado-temperatura');
  const elRecomendacion = document.getElementById('recomendacion-temperatura');

  if (elValor) elValor.textContent = 'Cargando...';
  if (elRecomendacion) elRecomendacion.innerHTML = '';

  try {
    const resUltimo = await fetchProtegido('http://localhost:3000/api/sensores/ultimo');
    if (!resUltimo) return;

    const ultimo = await resUltimo.json();

    if (!resUltimo.ok || ultimo.mensaje || ultimo.temperaturaBME280 === undefined) {
      if (elValor) elValor.textContent = '--';
      if (elEstado) elEstado.textContent = 'Sin datos';
      return;
    }

    const valor = Number(ultimo.temperaturaBME280);

    // Evitar mostrar errores del sensor como temperaturas reales.
    if (
      ultimo.temperaturaBME280 === null ||
      !Number.isFinite(valor) ||
      valor === -127
    ) {
      if (elValor) elValor.textContent = '--';
      if (elEstado) elEstado.textContent = 'Sin datos';

      if (elRecomendacion) {
        elRecomendacion.innerHTML =
          '<strong>Recomendación:</strong> No se pudo obtener una temperatura válida. Revisá la conexión del sensor.';
      }

      return;
    }

    if (elValor) elValor.textContent = valor + '°C';

    const estado = calcularEstadoTemperatura(valor);

    if (elEstado) elEstado.textContent = estado;

    if (elRecomendacion) {
      elRecomendacion.innerHTML = '<strong>Recomendación:</strong> ' + recomendacionTemperatura(estado);
    }

    const resHistorial = await fetchProtegido('http://localhost:3000/api/sensores');
    if (!resHistorial) return;

    const historial = await resHistorial.json();

    dibujarGraficoTemperatura(historial);

  } catch (error) {
    console.error('Error cargando datos de temperatura:', error);

    if (elValor) elValor.textContent = '--';
    if (elEstado) elEstado.textContent = 'Error';

    if (elRecomendacion) {
      elRecomendacion.innerHTML =
        '<strong>Recomendación:</strong> No se pudo conectar con el servidor. Revisá que el backend esté corriendo.';
    }
  }
}

function dibujarGraficoTemperatura(historial) {
  const contenedor = document.getElementById('grafico-temperatura');
  if (!contenedor) return;

  contenedor.innerHTML = '';

  contenedor.style.position = 'relative';
  contenedor.style.display = 'flex';
  contenedor.style.alignItems = 'flex-end';
  contenedor.style.justifyContent = 'space-between';
  contenedor.style.width = '100%';
  contenedor.style.height = '175px';
  contenedor.style.padding = '12px 20px 45px 42px';
  contenedor.style.boxSizing = 'border-box';
  contenedor.style.fontFamily = 'Arial, sans-serif';
  contenedor.style.overflow = 'hidden';

  // Área disponible para las barras.
  const alturaGrafico = 175 - 12 - 45;

  // Líneas horizontales y valores del eje Y.
  [0, 25, 50, 75, 100].forEach((porcentaje) => {

    const linea = document.createElement('div');

    linea.style.position = 'absolute';
    linea.style.left = '42px';
    linea.style.right = '20px';

    linea.style.bottom = `${45 + (porcentaje / 100) * alturaGrafico}px`;

    linea.style.borderTop = porcentaje === 0
      ? '1px solid rgba(0,0,0,0.3)'
      : '1px dashed rgba(0,0,0,0.15)';

    linea.style.zIndex = '1';

    contenedor.appendChild(linea);

    const etiquetaEje = document.createElement('div');

    const valorEje = Math.round(
      (porcentaje / 100) * ESCALA_TEMPERATURA
    );

    etiquetaEje.textContent = valorEje + '°';
    etiquetaEje.style.position = 'absolute';
    etiquetaEje.style.left = '6px';

    etiquetaEje.style.bottom = `${40 + (porcentaje / 100) * alturaGrafico}px`;

    etiquetaEje.style.fontSize = '9px';
    etiquetaEje.style.color = '#555';
    etiquetaEje.style.fontWeight = '600';
    etiquetaEje.style.zIndex = '2';

    contenedor.appendChild(etiquetaEje);
  });

  // Obtener las últimas 9 mediciones válidas.
  const ultimos = Array.isArray(historial)
    ? historial.filter((medicion) =>
        medicion &&
        medicion.temperaturaBME280 !== null &&
        medicion.temperaturaBME280 !== undefined &&
        Number.isFinite(Number(medicion.temperaturaBME280)) &&
        Number(medicion.temperaturaBME280) !== -127
      ).slice(-9)
    : [];

  if (ultimos.length === 0) {
    const mensaje = document.createElement('div');

    mensaje.textContent = 'No hay mediciones disponibles.';
    mensaje.style.position = 'absolute';
    mensaje.style.top = '50%';
    mensaje.style.left = '50%';
    mensaje.style.transform = 'translate(-50%, -50%)';
    mensaje.style.fontSize = '12px';
    mensaje.style.color = '#777';

    contenedor.appendChild(mensaje);
    return;
  }

  ultimos.forEach((medicion, index) => {

    const valor = Number(medicion.temperaturaBME280);
    const estadoBarra = calcularEstadoTemperatura(valor);

    const columna = document.createElement('div');

    columna.style.display = 'flex';
    columna.style.flexDirection = 'column';
    columna.style.alignItems = 'center';
    columna.style.justifyContent = 'flex-end';
    columna.style.height = '100%';
    columna.style.flex = '1';
    columna.style.minWidth = '0';
    columna.style.zIndex = '3';
    columna.style.position = 'relative';

    const barra = document.createElement('div');

    // Altura proporcional al valor, sin salir del rectángulo.
    const proporcion = Math.min(
      Math.max(valor / ESCALA_TEMPERATURA, 0.05),
      1
    );

    const alturaBarra = proporcion * alturaGrafico;

    barra.title = `${valor}°C — ${estadoBarra}`;
    barra.style.height = `${alturaBarra}px`;
    barra.style.flexShrink = '0';

    // Mantener el diseño original.
    barra.style.width = '1.5625rem';
    barra.style.maxWidth = '80%';

    // Esquinas superiores redondeadas y base recta.
    barra.style.borderTopLeftRadius = '0.8125rem';
    barra.style.borderTopRightRadius = '0.8125rem';
    barra.style.borderBottomLeftRadius = '0px';
    barra.style.borderBottomRightRadius = '0px';

    barra.style.boxShadow = '0 3px 6px rgba(0,0,0,0.12)';
    barra.style.transition = 'transform 0.15s ease';

    barra.style.background = estadoBarra === 'Óptimo'
      ? 'linear-gradient(180deg, #3b7a42, #244b29)'
      : 'linear-gradient(180deg, #f59e0b, #d97706)';

    barra.addEventListener('mouseenter', () => {
      barra.style.transform = 'scaleY(1.03)';
    });

    barra.addEventListener('mouseleave', () => {
      barra.style.transform = 'scaleY(1)';
    });

    // Contenedor inferior para horario y valor.
    const contenedorEtiquetas = document.createElement('div');

    contenedorEtiquetas.style.position = 'absolute';
    contenedorEtiquetas.style.top = '100%';
    contenedorEtiquetas.style.marginTop = '5px';
    contenedorEtiquetas.style.display = 'flex';
    contenedorEtiquetas.style.flexDirection = 'column';
    contenedorEtiquetas.style.alignItems = 'center';
    contenedorEtiquetas.style.width = '100%';

    // Horario de la medición.
    const etiquetaHora = document.createElement('div');

    const fechaMedicion =
      medicion.fecha ||
      medicion.createdAt ||
      medicion.timestamp;

    if (fechaMedicion) {
      const fechaObj = new Date(fechaMedicion);

      etiquetaHora.textContent = Number.isNaN(fechaObj.getTime())
        ? '--:--'
        : new Intl.DateTimeFormat('es-AR', {
            timeZone: 'America/Argentina/Buenos_Aires',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
          }).format(fechaObj);

    } else {
      etiquetaHora.textContent =
        index === ultimos.length - 1 ? 'AHORA' : '--:--';
    }

    etiquetaHora.style.fontSize = '9px';
    etiquetaHora.style.color = '#555';
    etiquetaHora.style.fontWeight = '700';
    etiquetaHora.style.whiteSpace = 'nowrap';

    // Valor debajo del horario.
    const etiquetaValor = document.createElement('div');

    etiquetaValor.textContent = valor.toFixed(1) + '°';
    etiquetaValor.style.fontSize = '8px';
    etiquetaValor.style.color = '#777';
    etiquetaValor.style.fontWeight = '600';
    etiquetaValor.style.whiteSpace = 'nowrap';
    etiquetaValor.style.marginTop = '3px';

    contenedorEtiquetas.appendChild(etiquetaHora);
    contenedorEtiquetas.appendChild(etiquetaValor);

    columna.appendChild(barra);
    columna.appendChild(contenedorEtiquetas);

    contenedor.appendChild(columna);
  });
}

cargarTemperatura();

setInterval(cargarTemperatura, 15 * 60 * 1000);