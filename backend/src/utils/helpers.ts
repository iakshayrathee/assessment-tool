import { Response } from 'express';
import { ApiResponse, PaginatedResponse } from '../models';

export class ResponseHelper {
  static success<T>(res: Response, data?: T, message?: string): Response {
    return res.json({
      success: true,
      data,
      message
    } as ApiResponse<T>);
  }

  static error(res: Response, error: string, statusCode: number = 400): Response {
    return res.status(statusCode).json({
      success: false,
      error
    } as ApiResponse);
  }

  static validationError(res: Response, errors: any[], statusCode: number = 400): Response {
    const formattedErrors = errors.map(err => ({
      field: err.path || err.param,
      message: err.msg,
      value: err.value
    }));

    return res.status(statusCode).json({
      success: false,
      error: 'Validation failed',
      details: formattedErrors,
      message: 'Please check the following fields and try again'
    } as ApiResponse);
  }

  static paginated<T>(
    res: Response,
    data: T[],
    page: number,
    limit: number,
    total: number
  ): Response {
    return res.json({
      success: true,
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    } as PaginatedResponse<T>);
  }
}

export class DateHelper {
  static calculateAge(dateOfBirth: Date): number {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  }

  static isValidDateRange(startDate: Date, endDate: Date): boolean {
    return new Date(endDate) > new Date(startDate);
  }

  static formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  static addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  static addMonths(date: Date, months: number): Date {
    const result = new Date(date);
    result.setMonth(result.getMonth() + months);
    return result;
  }
}

export class FileHelper {
  static readonly ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
  static readonly ALLOWED_DOCUMENT_TYPES = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
  static readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

  static isValidImageType(mimeType: string): boolean {
    return this.ALLOWED_IMAGE_TYPES.includes(mimeType);
  }

  static isValidDocumentType(mimeType: string): boolean {
    return this.ALLOWED_DOCUMENT_TYPES.includes(mimeType);
  }

  static isValidFileType(mimeType: string): boolean {
    return this.isValidImageType(mimeType) || this.isValidDocumentType(mimeType);
  }

  static isValidFileSize(size: number): boolean {
    return size <= this.MAX_FILE_SIZE;
  }

  static generateFileName(originalName: string): string {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const extension = originalName.split('.').pop();
    return `${timestamp}_${randomString}.${extension}`;
  }

  static getFileCategory(mimeType: string): string {
    if (this.isValidImageType(mimeType)) {
      return 'image';
    } else if (this.isValidDocumentType(mimeType)) {
      return 'document';
    }
    return 'other';
  }
}

export class StringHelper {
  static capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  }

  static generateRandomString(length: number = 8): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  static slugify(str: string): string {
    return str
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  static truncate(str: string, length: number = 100): string {
    if (str.length <= length) return str;
    return str.substring(0, length) + '...';
  }
}

export class ValidationHelper {
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static isValidPhone(phone: string): boolean {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
  }

  static isValidUUID(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }

  static sanitizeString(str: string): string {
    return str.trim().replace(/[<>]/g, '');
  }
}

export class ErrorHelper {
  static handlePrismaError(error: any): string {
    if (error.code === 'P2002') {
      return 'A record with this information already exists';
    }
    if (error.code === 'P2025') {
      return 'Record not found';
    }
    if (error.code === 'P2003') {
      return 'Invalid reference to related record';
    }
    return 'Database operation failed';
  }

  static isOperationalError(error: any): boolean {
    return error.isOperational === true;
  }
}
