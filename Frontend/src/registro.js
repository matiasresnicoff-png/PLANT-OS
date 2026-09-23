async function registrarUsuario() {
  const nombre = document.getElementById('input-nombre-registro').value;
  const fechaNacimiento = document.getElementById('input-fecha-registro').value;
  const mail = document.getElementById('input-mail-registro').value;
  const contrasena = document.getElementById('input-contrasena-registro').value;

  if (!nombre || !fechaNacimiento || !mail || !contrasena) {
    alert('Completá todos los campos');
    return;
  }

  try {
    const res = await fetch('http://10.10.32.52:3000/api/usuarios', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre, fechaNacimiento, mail, contraseña: contrasena }),
    });

    const datos = await res.json();

    if (!res.ok) {
      alert(datos.error || 'No se pudo completar el registro');
      return;
    }

    alert('¡Cuenta creada! Ahora iniciá sesión.');
    window.location.href = '4. iniciar-sesion.html';
  } catch (error) {
    console.error('Error al registrarse:', error);
    alert('Error de conexión con el servidor');
  }
}

document.getElementById('input-contrasena-registro').addEventListener('keydown', (evento) => {
  if (evento.key === 'Enter') {
    registrarUsuario();
  }
});
