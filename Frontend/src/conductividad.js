const UMBRAL_CONDUCTIVIDAD = { bajo: 200, alto: 2000 };
const ESCALA_CONDUCTIVIDAD = 3000;

function calcularEstadoConductividad(valor) {
  if (valor < UMBRAL_CONDUCTIVIDAD.bajo) return 'Bajo';
  if (valor > UMBRAL_CONDUCTIVIDAD.alto) return 'Alto';
  return 'Óptimo';
}

function recomendacionConductividad(estado) {
  if (estado === 'Bajo') return 'Hay pocos nutrientes en la tierra. Te recomendamos fertilizar la planta.';
  if (estado === 'Alto') return 'Hay exceso de nutrientes/sales en la tierra. Te recomendamos regar para diluir y evitar fertilizar por ahora.';
  return 'El nivel de nutrientes en la tierra está en un rango óptimo.';
}

async function cargarConductividad() {
  const elValor = document.getElementById('valor-conductividad');
  const elEstado = document.getElementById('estado-conductividad');
  const elRecomendacion = document.getElementById('recomendacion-conductividad');

  if (elValor) elValor.textContent = 'Cargando...';
  if (elRecomendacion) elRecomendacion.innerHTML = '';

  try {
    const resUltimo = await fetchProtegido('http://localhost:3000/api/sensores/ultimo');
    if (!resUltimo) return;

    const ultimo = await resUltimo.json();

    if (!resUltimo.ok) {
      if (elValor) elValor.textContent = '--';
      if (elEstado) elEstado.textContent = 'Error';
      if (elRecomendacion) elRecomendacion.innerHTML = '<strong>Recomendación:</strong> ' + (ultimo.error || 'No se pudo obtener los datos.');
      return;
    }

    if (ultimo.mensaje) {
      if (elValor) elValor.textContent = '--';
      if (elEstado) elEstado.textContent = 'Sin datos';
      if (elRecomendacion) elRecomendacion.innerHTML = '<strong>Recomendación:</strong> Todavía no hay mediciones. Esperá a que el sensor mande datos.';
      return;
    }

    const valor = ultimo.conductividad;

    if (valor === null || valor === undefined) {
      if (elValor) elValor.textContent = 'Sin datos';
      if (elEstado) elEstado.textContent = 'Sin datos';
      if (elRecomendacion) elRecomendacion.innerHTML = '<strong>Recomendación:</strong> El sensor de conductividad todavía no está conectado.';
      return;
    }

    if (elValor) elValor.textContent = valor + ' µS/cm';

    const estado = calcularEstadoConductividad(valor);

    if (elEstado) elEstado.textContent = estado;

    if (elRecomendacion) {
      elRecomendacion.innerHTML = '<strong>Recomendación:</strong> ' + recomendacionConductividad(estado);
    }

    const resHistorial = await fetchProtegido('http://localhost:3000/api/sensores');
    if (!resHistorial) return;

    const historial = await resHistorial.json();

    dibujarGraficoConductividad(historial);

  } catch (error) {
    console.error('Error cargando datos de conductividad:', error);

    if (elValor) elValor.textContent = '--';
    if (elEstado) elEstado.textContent = 'Error';

    if (elRecomendacion) {
      elRecomendacion.innerHTML = '<strong>Recomendación:</strong> No se pudo conectar con el servidor. Revisá que el backend esté corriendo.';
    }
  }
}

function dibujarGraficoConductividad(historial) {
  const contenedor = document.getElementById('grafico-conductividad');
  if (!contenedor) return;

  contenedor.innerHTML = '';

  contenedor.style.position = 'relative';
  contenedor.style.display = 'flex';
  contenedor.style.alignItems = 'flex-end';
  contenedor.style.justifyContent = 'space-between';
  contenedor.style.width = '100%';
  contenedor.style.height = '175px';
  contenedor.style.padding = '12px 20px 45px 50px';
  contenedor.style.boxSizing = 'border-box';
  contenedor.style.fontFamily = 'Arial, sans-serif';
  contenedor.style.overflow = 'hidden';

  // Área disponible para las barras.
  const alturaGrafico = 175 - 12 - 45;

  // Líneas horizontales y valores del eje Y.
  [0, 25, 50, 75, 100].forEach((porcentaje) => {

    const linea = document.createElement('div');

    linea.style.position = 'absolute';
    linea.style.left = '50px';
    linea.style.right = '20px';

    linea.style.bottom = `${45 + (porcentaje / 100) * alturaGrafico}px`;

    linea.style.borderTop = porcentaje === 0
      ? '1px solid rgba(0,0,0,0.3)'
      : '1px dashed rgba(0,0,0,0.15)';

    linea.style.zIndex = '1';

    contenedor.appendChild(linea);

    const etiquetaEje = document.createElement('div');

    const valorEje = Math.round(
      (porcentaje / 100) * ESCALA_CONDUCTIVIDAD
    );

    etiquetaEje.textContent = valorEje;
    etiquetaEje.style.position = 'absolute';
    etiquetaEje.style.left = '8px';

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
        medicion.conductividad !== null &&
        medicion.conductividad !== undefined &&
        Number.isFinite(Number(medicion.conductividad))
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

    const valor = Number(medicion.conductividad);
    const estadoBarra = calcularEstadoConductividad(valor);

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
      Math.max(valor / ESCALA_CONDUCTIVIDAD, 0.05),
      1
    );

    const alturaBarra = proporcion * alturaGrafico;

    barra.title = `${valor} µS/cm — ${estadoBarra}`;
    barra.style.height = `${alturaBarra}px`;
    barra.style.flexShrink = '0';

    // Mantener el diseño original.
    barra.style.width = '1.5625rem';
    barra.style.maxWidth = '80%';
    barra.style.borderRadius = '0.8125rem';

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

    etiquetaValor.textContent = valor + ' µS/cm';
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

cargarConductividad();

setInterval(cargarConductividad, 15 * 60 * 1000);