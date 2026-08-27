import { Router } from 'express';
import { registrarUsuario, loginUsuario } from '../controladores/usuariosControlador.ts';

const router = Router();

router.post('/usuarios', registrarUsuario);
router.post('/login', loginUsuario);

export default router;