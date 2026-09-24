async function registrarUsuario() {
  const nombre = document.getElementById('input-nombre-registro').value;
  const fechaNacimiento = document.getElementById('input-fecha-registro').value;
  const mail = document.getElementById('input-mail-registro').value;
  const contrasena = document.getElementById('input-contrasena-registro').value;

  if (!nombre || !fechaNacimiento || !mail || !contrasena) {
    mostrarToast('Completá todos los campos', true);
    return;
  }

  try {
    const res = await fetch('http://localhost:3000/api/usuarios', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre, fechaNacimiento, mail, contraseña: contrasena }),
    });

    const datos = await res.json();

    if (!res.ok) {
      mostrarToast(datos.error || 'No se pudo completar el registro', true);
      return;
    }

    mostrarToast('¡Cuenta creada! Ahora iniciá sesión.');
    setTimeout(() => { window.location.href = '4. iniciar-sesion.html'; }, 1200);
  } catch (error) {
    console.error('Error al registrarse:', error);
    mostrarToast('Error de conexión con el servidor', true);
  }
}

document.getElementById('input-contrasena-registro').addEventListener('keydown', (evento) => {
  if (evento.key === 'Enter') {
    registrarUsuario();
  }
});
