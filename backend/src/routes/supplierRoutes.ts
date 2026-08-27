import { Router } from 'express';
import {
  getSuppliers,
  getSupplier,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  createSupplierValidation,
  updateSupplierValidation,
} from '../controllers/supplierController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

// Phase 2: Add authenticate middleware to all protected routes
router.get('/', getSuppliers);
router.get('/:id', getSupplier);
router.post('/', createSupplierValidation, createSupplier);
router.put('/:id', updateSupplierValidation, updateSupplier);
router.delete('/:id', deleteSupplier);

export default router;
