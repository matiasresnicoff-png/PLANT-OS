async function iniciarSesion() {
  const mail = document.getElementById('input-mail-login').value;
  const contrasena = document.getElementById('input-contrasena-login').value;

  if (!mail || !contrasena) {
    mostrarToast('Completá mail y contraseña', true);
    return;
  }

  try {
    const res = await fetch('http://localhost:3000/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mail, contraseña: contrasena }),
    });

    const datos = await res.json();

    if (!res.ok) {
      mostrarToast(datos.error || 'No se pudo iniciar sesión', true);
      return;
    }

    localStorage.setItem('token', datos.token);
    localStorage.setItem('usuario', JSON.stringify(datos.usuario));

    window.location.href = '5.%20inicio.html';
  } catch (error) {
    console.error('Error al iniciar sesión:', error);
    mostrarToast('Error de conexión con el servidor', true);
  }
}

document.getElementById('input-contrasena-login').addEventListener('keydown', (evento) => {
  if (evento.key === 'Enter') {
    iniciarSesion();
  }
});
