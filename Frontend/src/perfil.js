async function cargarPerfil() {
  try {
    const res = await fetchProtegido('http://localhost:3000/api/usuarios/perfil');
    if (!res) return;
    const datos = await res.json();

    if (!res.ok) {
      mostrarToast(datos.error || 'No se pudo cargar el perfil', true);
      return;
    }

    document.getElementById('nombre-perfil-valor').textContent = datos.nombre;
    document.getElementById('avatar-perfil-letra').textContent = datos.nombre ? datos.nombre.charAt(0).toUpperCase() : '?';
    document.getElementById('input-nombre-perfil').value = datos.nombre;
    document.getElementById('input-fecha-perfil').value = datos.fechaNacimiento;
    document.getElementById('input-mail-perfil').value = datos.mail;
  } catch (error) {
    console.error('Error cargando perfil:', error);
    mostrarToast('Error de conexión con el servidor', true);
  }
}

async function guardarPerfil() {
  const nombre = document.getElementById('input-nombre-perfil').value;
  const fechaNacimiento = document.getElementById('input-fecha-perfil').value;
  const mail = document.getElementById('input-mail-perfil').value;

  try {
    const res = await fetchProtegido('http://localhost:3000/api/usuarios/perfil', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre, fechaNacimiento, mail }),
    });
    if (!res) return;
    const datos = await res.json();

    if (!res.ok) {
      mostrarToast(datos.error || 'No se pudo guardar', true);
      return;
    }

    document.getElementById('nombre-perfil-valor').textContent = datos.nombre;
    document.getElementById('avatar-perfil-letra').textContent = datos.nombre ? datos.nombre.charAt(0).toUpperCase() : '?';
    mostrarToast('Perfil actualizado');
  } catch (error) {
    console.error('Error guardando perfil:', error);
    mostrarToast('Error de conexión con el servidor', true);
  }
}

document.getElementById('boton-guardar-perfil').textContent = 'Guardar cambios';
document.getElementById('boton-guardar-perfil').addEventListener('click', guardarPerfil);

cargarPerfil();
