import multer from 'multer';
import { Request } from 'express';
import { S3Service } from '../services/s3Service';

// Configure multer for memory storage
const storage = multer.memoryStorage();

// File filter function
const fileFilter = (
    req: Request,
    file: Express.Multer.File,
    cb: multer.FileFilterCallback
) => {
    // Check file type
    if (!S3Service.isValidFileType(file.mimetype)) {
        cb(new Error('Invalid file type. Only PDF and DOC/DOCX files are allowed.'));
        return;
    }

    cb(null, true);
};

// Configure multer
export const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
        files: 5, // Maximum 5 files per upload
    },
});

// Error handler for multer errors
export const handleMulterError = (err: any, req: Request, res: any, next: any) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                error: 'File size exceeds 10MB limit',
            });
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({
                success: false,
                error: 'Maximum 5 files allowed per upload',
            });
        }
        if (err.code === 'LIMIT_UNEXPECTED_FILE') {
            return res.status(400).json({
                success: false,
                error: 'Unexpected file field',
            });
        }
    }

    if (err.message.includes('Invalid file type')) {
        return res.status(400).json({
            success: false,
            error: err.message,
        });
    }

    next(err);
};
