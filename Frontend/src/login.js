async function iniciarSesion() {
  const mail = document.getElementById('input-mail-login').value;
  const contrasena = document.getElementById('input-contrasena-login').value;

  if (!mail || !contrasena) {
    alert('Completá mail y contraseña');
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
      alert(datos.error || 'No se pudo iniciar sesión');
      return;
    }

    localStorage.setItem('token', datos.token);
    localStorage.setItem('usuario', JSON.stringify(datos.usuario));

    window.location.href = '5.%20inicio.html';
  } catch (error) {
    console.error('Error al iniciar sesión:', error);
    alert('Error de conexión con el servidor');
  }
}

document.getElementById('input-contrasena-login').addEventListener('keydown', (evento) => {
  if (evento.key === 'Enter') {
    iniciarSesion();
  }
});
