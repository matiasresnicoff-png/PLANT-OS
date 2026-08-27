import { Router } from 'express';
import { registrarUsuario } from '../controladores/usuariosControlador.ts';
const router = Router();
router.post('/usuarios', registrarUsuario);
export default router;