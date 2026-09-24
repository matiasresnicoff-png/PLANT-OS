// Notificaciones "toast": un cartelito que aparece arriba, se lee solo y
// desaparece solo (a diferencia de alert(), no tapa la pantalla ni hay que
// tocar "Aceptar"). Usa la librería Toastify (cargada en el HTML antes de
// este archivo).
function mostrarToast(mensaje, esError = false) {
  Toastify({
    text: mensaje,
    duration: 3000,
    gravity: 'top',
    position: 'center',
    style: {
      background: esError ? '#c0392b' : '#698E5C',
      borderRadius: '0.75rem',
      fontFamily: 'Inter, sans-serif',
    },
  }).showToast();
}
