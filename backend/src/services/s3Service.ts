import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';

export class S3Service {
    private s3Client: S3Client;
    private bucketName: string;

    constructor() {
        // Initialize S3 client with credentials from environment variables
        this.s3Client = new S3Client({
            region: process.env.AWS_REGION || '',
            credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
            },
        });

        this.bucketName = process.env.AWS_S3_BUCKET || '';
    }

    /**
     * Upload a file to S3
     * @param file - File buffer and metadata
     * @param folder - Optional folder path in S3 bucket
     * @returns S3 key (path) of uploaded file
     */
    async uploadFile(
        file: { buffer: Buffer; originalname: string; mimetype: string },
        folder: string = 'homework'
    ): Promise<string> {
        try {
            // Generate unique filename while preserving original name
            const fileExtension = path.extname(file.originalname);
            const originalNameWithoutExt = path.basename(file.originalname, fileExtension);

            // Sanitize the original filename (remove special characters)
            const sanitizedName = originalNameWithoutExt.replace(/[^a-zA-Z0-9_-]/g, '_');

            // Create unique key: uuid-timestamp-originalname.ext
            const uniquePrefix = `${uuidv4()}-${Date.now()}`;
            const fileName = `${uniquePrefix}-${sanitizedName}${fileExtension}`;
            const key = `${folder}/${fileName}`;

            // Upload to S3
            const command = new PutObjectCommand({
                Bucket: this.bucketName,
                Key: key,
                Body: file.buffer,
                ContentType: file.mimetype,
                // Set metadata
                Metadata: {
                    originalName: file.originalname,
                    uploadedAt: new Date().toISOString(),
                },
            });

            await this.s3Client.send(command);

            return key;
        } catch (error) {
            console.error('Error uploading file to S3:', error);
            throw new Error('Failed to upload file to S3');
        }
    }

    /**
     * Upload multiple files to S3
     * @param files - Array of file buffers and metadata
     * @param folder - Optional folder path in S3 bucket
     * @returns Array of S3 keys
     */
    async uploadMultipleFiles(
        files: Array<{ buffer: Buffer; originalname: string; mimetype: string }>,
        folder: string = 'homework'
    ): Promise<string[]> {
        try {
            const uploadPromises = files.map((file) => this.uploadFile(file, folder));
            return await Promise.all(uploadPromises);
        } catch (error) {
            console.error('Error uploading multiple files to S3:', error);
            throw new Error('Failed to upload files to S3');
        }
    }

    /**
     * Generate a signed URL for secure file access
     * @param key - S3 key (path) of the file
     * @param expiresIn - URL expiration time in seconds (default: 1 hour)
     * @returns Signed URL
     */
    async getSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
        try {
            const command = new GetObjectCommand({
                Bucket: this.bucketName,
                Key: key,
            });

            const signedUrl = await getSignedUrl(this.s3Client, command, { expiresIn });
            return signedUrl;
        } catch (error) {
            console.error('Error generating signed URL:', error);
            throw new Error('Failed to generate signed URL');
        }
    }

    /**
     * Generate signed URLs for multiple files
     * @param keys - Array of S3 keys
     * @param expiresIn - URL expiration time in seconds
     * @returns Array of objects with key and signed URL
     */
    async getSignedUrls(
        keys: string[],
        expiresIn: number = 3600
    ): Promise<Array<{ key: string; url: string; fileName: string }>> {
        try {
            const urlPromises = keys.map(async (key) => {
                const url = await this.getSignedUrl(key, expiresIn);

                // Extract original filename from S3 key
                // Format: folder/uuid-timestamp-originalname.ext
                const parts = key.split('/');
                const s3FileName = parts[parts.length - 1];

                // Try to extract original filename from the S3 key
                // Pattern: uuid-timestamp-originalname.ext
                const match = s3FileName.match(/^[a-f0-9-]+-\d+-(.+)$/i);
                const fileName = match ? match[1] : s3FileName;

                return { key, url, fileName };
            });

            return await Promise.all(urlPromises);
        } catch (error) {
            console.error('Error generating signed URLs:', error);
            throw new Error('Failed to generate signed URLs');
        }
    }

    /**
     * Delete a file from S3
     * @param key - S3 key (path) of the file to delete
     */
    async deleteFile(key: string): Promise<void> {
        try {
            const command = new DeleteObjectCommand({
                Bucket: this.bucketName,
                Key: key,
            });

            await this.s3Client.send(command);
        } catch (error) {
            console.error('Error deleting file from S3:', error);
            throw new Error('Failed to delete file from S3');
        }
    }

    /**
     * List all files in a folder
     * @param folder - Folder path in S3 bucket
     * @returns Array of files with metadata and signed URLs
     */
    async listFiles(folder: string): Promise<Array<{
        key: string;
        fileName: string;
        size: number;
        lastModified: Date;
        url: string;
    }>> {
        try {
            const command = new ListObjectsV2Command({
                Bucket: this.bucketName,
                Prefix: folder,
            });

            const response = await this.s3Client.send(command);

            if (!response.Contents || response.Contents.length === 0) {
                return [];
            }

            // Filter out folder entries (keys ending with /) and generate signed URLs for files
            const fileObjects = response.Contents.filter(obj => obj.Key && !obj.Key.endsWith('/'));

            const filesWithUrls = await Promise.all(
                fileObjects.map(async (object) => {
                    const key = object.Key!;
                    const url = await this.getSignedUrl(key);

                    // Extract original filename from S3 key
                    // Format: folder/uuid-timestamp-originalname.ext
                    const parts = key.split('/');
                    const s3FileName = parts[parts.length - 1];

                    // Try to extract original filename from the S3 key
                    // Pattern: uuid-timestamp-originalname.ext
                    const match = s3FileName.match(/^[a-f0-9-]+-\d+-(.+)$/i);
                    const fileName = match ? match[1] : s3FileName;

                    return {
                        key,
                        fileName,
                        size: object.Size || 0,
                        lastModified: object.LastModified || new Date(),
                        url,
                    };
                })
            );

            return filesWithUrls;
        } catch (error) {
            console.error('Error listing files from S3:', error);
            throw new Error('Failed to list files from S3');
        }
    }

    /**
     * Delete multiple files from S3
     * @param keys - Array of S3 keys to delete
     */
    async deleteMultipleFiles(keys: string[]): Promise<void> {
        try {
            const deletePromises = keys.map((key) => this.deleteFile(key));
            await Promise.all(deletePromises);
        } catch (error) {
            console.error('Error deleting multiple files from S3:', error);
            throw new Error('Failed to delete files from S3');
        }
    }

    /**
     * Validate file type
     * @param mimetype - MIME type of the file
     * @returns true if valid, false otherwise
     */
    static isValidFileType(mimetype: string): boolean {
        const allowedTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ];
        return allowedTypes.includes(mimetype);
    }

    /**
     * Validate file size
     * @param size - File size in bytes
     * @param maxSizeInMB - Maximum allowed size in MB (default: 10MB)
     * @returns true if valid, false otherwise
     */
    static isValidFileSize(size: number, maxSizeInMB: number = 10): boolean {
        const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
        return size <= maxSizeInBytes;
    }

    /**
     * Extract file name from S3 key
     * @param key - S3 key
     * @returns Original file name
     */
    static getFileNameFromKey(key: string): string {
        return path.basename(key);
    }
}
