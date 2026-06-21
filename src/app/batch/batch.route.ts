import { Router } from 'express';
import { BatchValidation } from './batch.validation';
import { batchController } from './batch.controller';
import auth from '../middlewares/authorization';
import { featureNames } from '../constant/seedRoleData';
import validation from '../middlewares/validation';

const router = Router();

router.post(
  '/',
//   auth([featureNames.batches]),
  validation(BatchValidation.createBatchSchema),
  batchController.createBatch,
);

router.get('/', batchController.getAllBatches);

// নির্দিষ্ট ক্লাসের batch লিস্ট — '/:id' এর আগে রাখা হয়েছে যাতে 'class' শব্দটাকে id হিসেবে না ধরে
router.get('/class/:classId', batchController.getBatchesByClassId);

router.put(
  '/:id',
//   auth([featureNames.batches]),
  validation(BatchValidation.updateBatchSchema),
  batchController.updateBatch,
);

router.delete(
  '/:id',
//   auth([featureNames.batches]),
  batchController.deleteBatch,
);

router.get('/:id', batchController.getBatchById);

export const BatchRoutes = router;