const UMBRAL_TEMPERATURA = { bajo: 15, alto: 32 };
const ESCALA_TEMPERATURA = 40;

// Colores idénticos a los de Inicio.
const COLORES_TEMPERATURA = {
  Bajo: '#3498db',
  'Óptimo': '#27ae60',
  Alto: '#e74c3c',
  'Sin datos': '#7f8c8d'
};

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

function actualizarEstadoTemperatura(elValor, elEstado, valor, estado) {
  const color = COLORES_TEMPERATURA[estado];

  if (elValor) {
    elValor.textContent = valor + '°C';
    elValor.style.color = color;
  }

  if (elEstado) {
    elEstado.textContent = estado;
    elEstado.style.setProperty('background-color', color, 'important');
    elEstado.style.setProperty('color', '#000000', 'important');
  }
}

async function cargarTemperatura() {
  const elValor = document.getElementById('valor-temperatura');
  const elEstado = document.getElementById('estado-temperatura');
  const elRecomendacion = document.getElementById('recomendacion-temperatura');

  if (elRecomendacion) elRecomendacion.style.color = '#000000';
  if (elValor) elValor.textContent = 'Cargando...';
  if (elRecomendacion) elRecomendacion.innerHTML = '';

  try {
    const resUltimo = await fetchProtegido('http://localhost:3000/api/sensores/ultimo');
    if (!resUltimo) return;

    const ultimo = await resUltimo.json();

    if (!resUltimo.ok || !ultimo || ultimo.mensaje) {
      if (elValor) {
        elValor.textContent = '--';
        elValor.style.color = COLORES_TEMPERATURA['Sin datos'];
      }

      if (elEstado) {
        elEstado.textContent = 'Sin datos';
        elEstado.style.setProperty(
          'background-color',
          COLORES_TEMPERATURA['Sin datos'],
          'important'
        );
        elEstado.style.color = '#000000';
      }

      if (elRecomendacion) {
        elRecomendacion.innerHTML =
          '<strong>Recomendación:</strong> Todavía no hay mediciones disponibles.';
      }
      return;
    }

    const valorOriginal = ultimo.temperaturaBME280;
    const valor = Number(valorOriginal);

    const valido =
      valorOriginal !== null &&
      valorOriginal !== undefined &&
      valorOriginal !== '' &&
      Number.isFinite(valor) &&
      valor !== -127;

    if (!valido) {
      if (elValor) {
        elValor.textContent = 'Sin datos';
        elValor.style.color = COLORES_TEMPERATURA['Sin datos'];
      }

      if (elEstado) {
        elEstado.textContent = 'Sin datos';
        elEstado.style.setProperty(
          'background-color',
          COLORES_TEMPERATURA['Sin datos'],
          'important'
        );
        elEstado.style.color = '#000000';
      }

      if (elRecomendacion) {
        elRecomendacion.innerHTML =
          '<strong>Recomendación:</strong> No se pudo obtener una temperatura válida. Revisá la conexión del sensor.';
      }
      return;
    }

    const estado = calcularEstadoTemperatura(valor);
    actualizarEstadoTemperatura(elValor, elEstado, valor, estado);

    if (elRecomendacion) {
      elRecomendacion.innerHTML =
        '<strong>Recomendación:</strong> ' +
        recomendacionTemperatura(estado);

      elRecomendacion.style.color = '#000000';
    }

    const resHistorial = await fetchProtegido('http://localhost:3000/api/sensores');
    if (!resHistorial || !resHistorial.ok) return;

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

  const alturaGrafico = 175 - 12 - 45;

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

  const ultimos = Array.isArray(historial)
    ? historial.filter(medicion => {
        if (!medicion) return false;

        const valorOriginal = medicion.temperaturaBME280;

        return valorOriginal !== null &&
          valorOriginal !== undefined &&
          valorOriginal !== '' &&
          Number.isFinite(Number(valorOriginal)) &&
          Number(valorOriginal) !== -127;
      }).sort((a, b) => {
        const fechaA = new Date(a.fecha || a.createdAt || a.timestamp).getTime();
        const fechaB = new Date(b.fecha || b.createdAt || b.timestamp).getTime();

        return (Number.isFinite(fechaA) ? fechaA : 0) -
          (Number.isFinite(fechaB) ? fechaB : 0);
      }).slice(-9)
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

    const proporcion = Math.min(
      Math.max(valor / ESCALA_TEMPERATURA, 0.05),
      1
    );

    barra.title = `${valor}°C — ${estadoBarra}`;
    barra.style.height = `${proporcion * alturaGrafico}px`;
    barra.style.flexShrink = '0';
    barra.style.width = '1.5625rem';
    barra.style.maxWidth = '80%';
    barra.style.boxShadow = '0 3px 6px rgba(0,0,0,0.12)';
    barra.style.transition = 'transform 0.15s ease';
    barra.style.backgroundColor = COLORES_TEMPERATURA[estadoBarra];

    barra.style.borderTopLeftRadius = '0.8125rem';
    barra.style.borderTopRightRadius = '0.8125rem';
    barra.style.borderBottomLeftRadius = '0px';
    barra.style.borderBottomRightRadius = '0px';

    barra.addEventListener('mouseenter', () => {
      barra.style.transform = 'scaleY(1.03)';
    });

    barra.addEventListener('mouseleave', () => {
      barra.style.transform = 'scaleY(1)';
    });

    const contenedorEtiquetas = document.createElement('div');

    contenedorEtiquetas.style.position = 'absolute';
    contenedorEtiquetas.style.top = '100%';
    contenedorEtiquetas.style.marginTop = '5px';
    contenedorEtiquetas.style.display = 'flex';
    contenedorEtiquetas.style.flexDirection = 'column';
    contenedorEtiquetas.style.alignItems = 'center';
    contenedorEtiquetas.style.width = '100%';

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
      etiquetaHora.textContent = '--:--';
    }

    if (index === ultimos.length - 1) {
      etiquetaHora.textContent = 'AHORA';
    }

    etiquetaHora.style.fontSize = '9px';
    etiquetaHora.style.color = '#555';
    etiquetaHora.style.fontWeight = '700';
    etiquetaHora.style.whiteSpace = 'nowrap';

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