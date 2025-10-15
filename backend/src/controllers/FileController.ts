import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { AuthenticatedRequest } from '../utils/auth';

export class FileController {
  constructor(private prisma: PrismaClient) {}

  // Configure multer for file uploads
  private storage = multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadPath = path.join(process.cwd(), 'uploads');
      
      // Create uploads directory if it doesn't exist
      if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true });
      }

      // Create subdirectories based on file type
      let subDir = 'documents';
      if (file.fieldname === 'worksheets') {
        subDir = 'worksheets';
      } else if (file.fieldname === 'reports') {
        subDir = 'reports';
      } else if (file.fieldname === 'profile') {
        subDir = 'profiles';
      }

      const finalPath = path.join(uploadPath, subDir);
      if (!fs.existsSync(finalPath)) {
        fs.mkdirSync(finalPath, { recursive: true });
      }

      cb(null, finalPath);
    },
    filename: (req, file, cb) => {
      // Generate unique filename
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(file.originalname);
      const name = path.basename(file.originalname, ext);
      cb(null, `${name}-${uniqueSuffix}${ext}`);
    }
  });

  private fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    // Allowed file types
    const allowedTypes = [
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/gif',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images, PDFs, and documents are allowed.'));
    }
  };

  public upload = multer({
    storage: this.storage,
    fileFilter: this.fileFilter,
    limits: {
      fileSize: 10 * 1024 * 1024 // 10MB limit
    }
  });

  // Upload single file
  async uploadSingle(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'No file uploaded'
        });
      }

      const fileData = {
        fileName: req.file.originalname,
        filePath: req.file.path,
        fileType: req.file.mimetype,
        fileSize: req.file.size,
        uploadedBy: req.user?.userId
      };

      res.json({
        success: true,
        data: fileData,
        message: 'File uploaded successfully'
      });
    } catch (error: any) {
      console.error('Upload single file error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to upload file'
      });
    }
  }

  // Upload multiple files
  async uploadMultiple(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'No files uploaded'
        });
      }

      const filesData = req.files.map(file => ({
        fileName: file.originalname,
        filePath: file.path,
        fileType: file.mimetype,
        fileSize: file.size,
        uploadedBy: req.user?.userId
      }));

      res.json({
        success: true,
        data: filesData,
        message: `${filesData.length} files uploaded successfully`
      });
    } catch (error: any) {
      console.error('Upload multiple files error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to upload files'
      });
    }
  }

  // Upload assessment worksheets
  async uploadAssessmentWorksheets(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'No worksheet files uploaded'
        });
      }

      const { studentId, assessmentId, domain } = req.body;

      if (!studentId || !assessmentId || !domain) {
        return res.status(400).json({
          success: false,
          error: 'Student ID, Assessment ID, and domain are required'
        });
      }

      // Verify assessment exists and user has access
      const assessment = await this.prisma.assessment.findFirst({
        where: {
          id: assessmentId,
          studentId: studentId,
          specialEducatorId: req.user?.userId
        }
      });

      if (!assessment) {
        return res.status(404).json({
          success: false,
          error: 'Assessment not found or access denied'
        });
      }

      const filesData = req.files.map(file => ({
        fileName: file.originalname,
        filePath: file.path,
        fileType: file.mimetype,
        fileSize: file.size
      }));

      // Update assessment with file paths
      const filePaths = req.files.map(file => file.path);
      const updateData: any = {};

      switch (domain.toLowerCase()) {
        case 'reading':
          updateData.readingFiles = [...(assessment.readingFiles || []), ...filePaths];
          break;
        case 'writing':
          updateData.writingFiles = [...(assessment.writingFiles || []), ...filePaths];
          break;
        case 'math':
          updateData.mathFiles = [...(assessment.mathFiles || []), ...filePaths];
          break;
        case 'vp':
        case 'visual_perception':
          updateData.vpFiles = [...(assessment.vpFiles || []), ...filePaths];
          break;
        case 'motor':
          updateData.motorFiles = [...(assessment.motorFiles || []), ...filePaths];
          break;
        case 'attention':
          updateData.attentionFiles = [...(assessment.attentionFiles || []), ...filePaths];
          break;
        default:
          return res.status(400).json({
            success: false,
            error: 'Invalid domain specified'
          });
      }

      await this.prisma.assessment.update({
        where: { id: assessmentId },
        data: updateData
      });

      // Also save to student documents
      const documentPromises = filesData.map(fileData => 
        this.prisma.studentDocument.create({
          data: {
            studentId,
            fileName: fileData.fileName,
            filePath: fileData.filePath,
            fileType: fileData.fileType,
            fileSize: fileData.fileSize,
            category: `Assessment - ${domain}`,
            description: `Worksheet for ${domain} assessment`,
            uploadedBy: req.user?.userId || ''
          }
        })
      );

      await Promise.all(documentPromises);

      res.json({
        success: true,
        data: filesData,
        message: `${filesData.length} worksheet files uploaded successfully for ${domain} assessment`
      });
    } catch (error: any) {
      console.error('Upload assessment worksheets error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to upload worksheet files'
      });
    }
  }

  // Upload parent documents
  async uploadParentDocument(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'No file uploaded'
        });
      }

      const { category, description } = req.body;
      const parentId = req.user?.userId;

      // Verify parent profile exists
      const parentProfile = await this.prisma.parentProfile.findUnique({
        where: { userId: parentId }
      });

      if (!parentProfile) {
        return res.status(404).json({
          success: false,
          error: 'Parent profile not found'
        });
      }

      const document = await this.prisma.parentDocument.create({
        data: {
          parentId: parentProfile.id,
          fileName: req.file.originalname,
          filePath: req.file.path,
          fileType: req.file.mimetype,
          fileSize: req.file.size,
          category: category || 'General',
          description: description || ''
        }
      });

      res.json({
        success: true,
        data: document,
        message: 'Document uploaded successfully'
      });
    } catch (error: any) {
      console.error('Upload parent document error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to upload document'
      });
    }
  }

  // Download file
  async downloadFile(req: AuthenticatedRequest, res: Response) {
    try {
      const { fileId, type } = req.params;

      let filePath: string | null = null;
      let fileName: string | null = null;

      // Get file path based on type
      switch (type) {
        case 'student-document':
          const studentDoc = await this.prisma.studentDocument.findUnique({
            where: { id: fileId },
            include: {
              student: {
                include: {
                  assignments: {
                    select: { specialEducatorId: true }
                  },
                  parent: {
                    select: { userId: true }
                  }
                }
              }
            }
          });

          if (!studentDoc) {
            return res.status(404).json({
              success: false,
              error: 'Document not found'
            });
          }

          // Check access permissions
          const hasAccess = req.user?.role === 'ADMIN' ||
            studentDoc.student.assignments.some(a => a.specialEducatorId === req.user?.userId) ||
            studentDoc.student.parent?.userId === req.user?.userId;

          if (!hasAccess) {
            return res.status(403).json({
              success: false,
              error: 'Access denied'
            });
          }

          filePath = studentDoc.filePath;
          fileName = studentDoc.fileName;
          break;

        case 'parent-document':
          const parentDoc = await this.prisma.parentDocument.findUnique({
            where: { id: fileId },
            include: {
              parent: {
                select: { userId: true }
              }
            }
          });

          if (!parentDoc) {
            return res.status(404).json({
              success: false,
              error: 'Document not found'
            });
          }

          // Check access permissions
          if (req.user?.role !== 'ADMIN' && parentDoc.parent.userId !== req.user?.userId) {
            return res.status(403).json({
              success: false,
              error: 'Access denied'
            });
          }

          filePath = parentDoc.filePath;
          fileName = parentDoc.fileName;
          break;

        default:
          return res.status(400).json({
            success: false,
            error: 'Invalid file type'
          });
      }

      if (!filePath || !fs.existsSync(filePath)) {
        return res.status(404).json({
          success: false,
          error: 'File not found on server'
        });
      }

      // Set appropriate headers
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.setHeader('Content-Type', 'application/octet-stream');

      // Stream the file
      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);
    } catch (error: any) {
      console.error('Download file error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to download file'
      });
    }
  }

  // Delete file
  async deleteFile(req: AuthenticatedRequest, res: Response) {
    try {
      const { fileId, type } = req.params;

      let filePath: string | null = null;
      let deleteQuery: any = null;

      switch (type) {
        case 'student-document':
          const studentDoc = await this.prisma.studentDocument.findUnique({
            where: { id: fileId }
          });

          if (!studentDoc) {
            return res.status(404).json({
              success: false,
              error: 'Document not found'
            });
          }

          filePath = studentDoc.filePath;
          deleteQuery = () => this.prisma.studentDocument.delete({ where: { id: fileId } });
          break;

        case 'parent-document':
          const parentDoc = await this.prisma.parentDocument.findUnique({
            where: { id: fileId },
            include: {
              parent: {
                select: { userId: true }
              }
            }
          });

          if (!parentDoc) {
            return res.status(404).json({
              success: false,
              error: 'Document not found'
            });
          }

          // Check access permissions
          if (req.user?.role !== 'ADMIN' && parentDoc.parent.userId !== req.user?.userId) {
            return res.status(403).json({
              success: false,
              error: 'Access denied'
            });
          }

          filePath = parentDoc.filePath;
          deleteQuery = () => this.prisma.parentDocument.delete({ where: { id: fileId } });
          break;

        default:
          return res.status(400).json({
            success: false,
            error: 'Invalid file type'
          });
      }

      // Delete from database
      await deleteQuery();

      // Delete physical file
      if (filePath && fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      res.json({
        success: true,
        message: 'File deleted successfully'
      });
    } catch (error: any) {
      console.error('Delete file error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete file'
      });
    }
  }
}
