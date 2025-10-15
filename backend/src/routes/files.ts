import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { FileController } from '../controllers/FileController';
import { AuthUtils } from '../utils/auth';
import { ValidationRules } from '../utils/validation';
import { UserRole } from '../models';

const router = Router();
const prisma = new PrismaClient();
const fileController = new FileController(prisma);

// Apply authentication to all routes
router.use(AuthUtils.authenticateToken);

// POST /api/files/upload/single - Upload single file
router.post('/upload/single', 
  fileController.upload.single('file'),
  fileController.uploadSingle.bind(fileController)
);

// POST /api/files/upload/multiple - Upload multiple files
router.post('/upload/multiple', 
  fileController.upload.array('files', 10), // Max 10 files
  fileController.uploadMultiple.bind(fileController)
);

// POST /api/files/upload/worksheets - Upload assessment worksheets
router.post('/upload/worksheets', 
  AuthUtils.requireEducatorRoles(),
  fileController.upload.array('worksheets', 5), // Max 5 worksheet files
  fileController.uploadAssessmentWorksheets.bind(fileController)
);

// POST /api/files/upload/parent-document - Upload parent document
router.post('/upload/parent-document', 
  AuthUtils.requireAnyRole(UserRole.PARENT),
  fileController.upload.single('document'),
  fileController.uploadParentDocument.bind(fileController)
);

// GET /api/files/download/:type/:fileId - Download file
router.get('/download/:type/:fileId', 
  ValidationRules.validateId(),
  fileController.downloadFile.bind(fileController)
);

// DELETE /api/files/:type/:fileId - Delete file
router.delete('/:type/:fileId', 
  ValidationRules.validateId(),
  fileController.deleteFile.bind(fileController)
);

export default router;
