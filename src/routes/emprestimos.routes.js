import { Router } from 'express';
import * as controller from '../controllers/emprestimos.controller.js';

const router = Router();
router.get('/', controller.listar);
router.get('/:id', controller.buscar);
router.post('/', controller.criar);
router.post('/:id/devolucao', controller.devolver);
router.post('/:id/pagamento', controller.pagarMulta);

export default router;
