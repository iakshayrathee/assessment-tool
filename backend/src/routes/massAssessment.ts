import { Router } from 'express';
import multer from 'multer';
import { MassAssessmentController } from '../controllers/MassAssessmentController';
import { AuthUtils } from '../utils/auth';

const router = Router();

// Configure multer for file uploads
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        const allowedMimes = [
            'application/pdf',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/msword',
        ];
        if (allowedMimes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only PDF and DOCX files are allowed.'));
        }
    },
});

// All routes require authentication
router.use(AuthUtils.authenticateToken);

// Assessment CRUD
router.post('/', MassAssessmentController.createAssessment);
router.get('/educator', MassAssessmentController.getEducatorAssessments);
router.get('/:id', MassAssessmentController.getAssessment);

// Submit results
router.post('/:id/results', MassAssessmentController.submitResults);
router.post('/:id/batch-results', MassAssessmentController.batchSubmitResults);

// Tier management
router.get('/:id/tiers', MassAssessmentController.getTierDistribution);
router.get('/:id/tier/:tierLevel', MassAssessmentController.getStudentsByTier);
router.put(
    '/:id/results/:resultId/tier',
    MassAssessmentController.overrideTierAllocation
);

// Heatmap and visualization
router.get('/:id/heatmap', MassAssessmentController.getHeatmap);

// AI Analysis and Reports
router.post('/:id/analyze', MassAssessmentController.analyzeAssessment);
router.get('/:id/report', MassAssessmentController.generateReport);

// Document upload and assessment creation
router.post(
    '/upload-document',
    upload.single('document'),
    MassAssessmentController.uploadDocument
);

export default router;
