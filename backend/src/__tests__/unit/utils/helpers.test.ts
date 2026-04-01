import {
  ResponseHelper,
  DateHelper,
  FileHelper,
  StringHelper,
  ValidationHelper,
  ErrorHelper
} from '../../../utils/helpers';
import { createMockRes } from '../../helpers/mockPrisma';

// ─── ResponseHelper ────────────────────────────────────────────────────────────

describe('ResponseHelper', () => {
  describe('success', () => {
    it('responds with 200 and wraps data in success envelope', () => {
      const res = createMockRes();
      ResponseHelper.success(res, { id: 1 }, 'Created');
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, data: { id: 1 }, message: 'Created' })
      );
    });

    it('responds with no data when called without data argument', () => {
      const res = createMockRes();
      ResponseHelper.success(res);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true })
      );
    });
  });

  describe('error', () => {
    it('uses 400 as default status code', () => {
      const res = createMockRes();
      ResponseHelper.error(res, 'Something went wrong');
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, error: 'Something went wrong' })
      );
    });

    it('uses provided status code', () => {
      const res = createMockRes();
      ResponseHelper.error(res, 'Not found', 404);
      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('validationError', () => {
    it('maps errors to field/message/value structure', () => {
      const res = createMockRes();
      const errors = [{ path: 'email', msg: 'Required', value: '' }];
      ResponseHelper.validationError(res, errors);
      expect(res.status).toHaveBeenCalledWith(400);
      const call = res.json.mock.calls[0][0];
      expect(call.details[0]).toEqual({ field: 'email', message: 'Required', value: '' });
    });
  });

  describe('paginated', () => {
    it('calculates totalPages correctly', () => {
      const res = createMockRes();
      ResponseHelper.paginated(res, [1, 2], 1, 2, 5);
      const call = res.json.mock.calls[0][0];
      expect(call.pagination.totalPages).toBe(3);
      expect(call.pagination.total).toBe(5);
    });

    it('wraps data array in success envelope', () => {
      const res = createMockRes();
      ResponseHelper.paginated(res, ['a', 'b'], 1, 10, 2);
      const call = res.json.mock.calls[0][0];
      expect(call.success).toBe(true);
      expect(call.data).toEqual(['a', 'b']);
    });
  });
});

// ─── DateHelper ───────────────────────────────────────────────────────────────

describe('DateHelper', () => {
  describe('calculateAge', () => {
    it('calculates age correctly for a past date', () => {
      const dob = new Date();
      dob.setFullYear(dob.getFullYear() - 10);
      expect(DateHelper.calculateAge(dob)).toBe(10);
    });
  });

  describe('isValidDateRange', () => {
    it('returns true when end is after start', () => {
      expect(
        DateHelper.isValidDateRange(new Date('2024-01-01'), new Date('2024-12-31'))
      ).toBe(true);
    });

    it('returns false when end is before start', () => {
      expect(
        DateHelper.isValidDateRange(new Date('2024-12-31'), new Date('2024-01-01'))
      ).toBe(false);
    });
  });

  describe('formatDate', () => {
    it('returns YYYY-MM-DD format', () => {
      expect(DateHelper.formatDate(new Date('2024-06-15T00:00:00.000Z'))).toBe('2024-06-15');
    });
  });

  describe('addDays', () => {
    it('adds days correctly', () => {
      const base = new Date('2024-01-01');
      const result = DateHelper.addDays(base, 10);
      expect(result.getDate()).toBe(11);
    });

    it('does not mutate the original date', () => {
      const base = new Date('2024-01-01');
      DateHelper.addDays(base, 5);
      expect(base.getDate()).toBe(1);
    });
  });

  describe('addMonths', () => {
    it('adds months correctly', () => {
      const base = new Date('2024-01-01');
      const result = DateHelper.addMonths(base, 3);
      expect(result.getMonth()).toBe(3); // April (0-indexed)
    });
  });
});

// ─── FileHelper ───────────────────────────────────────────────────────────────

describe('FileHelper', () => {
  describe('isValidImageType', () => {
    it('accepts jpeg, png, gif', () => {
      expect(FileHelper.isValidImageType('image/jpeg')).toBe(true);
      expect(FileHelper.isValidImageType('image/png')).toBe(true);
      expect(FileHelper.isValidImageType('image/gif')).toBe(true);
    });

    it('rejects non-image types', () => {
      expect(FileHelper.isValidImageType('application/pdf')).toBe(false);
    });
  });

  describe('isValidDocumentType', () => {
    it('accepts PDF and Word docs', () => {
      expect(FileHelper.isValidDocumentType('application/pdf')).toBe(true);
      expect(
        FileHelper.isValidDocumentType(
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        )
      ).toBe(true);
    });
  });

  describe('isValidFileSize', () => {
    it('accepts files under 10MB', () => {
      expect(FileHelper.isValidFileSize(5 * 1024 * 1024)).toBe(true);
    });

    it('rejects files over 10MB', () => {
      expect(FileHelper.isValidFileSize(11 * 1024 * 1024)).toBe(false);
    });

    it('accepts exactly 10MB', () => {
      expect(FileHelper.isValidFileSize(10 * 1024 * 1024)).toBe(true);
    });
  });

  describe('generateFileName', () => {
    it('preserves the original file extension', () => {
      const name = FileHelper.generateFileName('report.pdf');
      expect(name.endsWith('.pdf')).toBe(true);
    });

    it('generates unique names for the same original file', () => {
      const a = FileHelper.generateFileName('file.png');
      const b = FileHelper.generateFileName('file.png');
      expect(a).not.toBe(b);
    });
  });

  describe('getFileCategory', () => {
    it('returns "image" for image types', () => {
      expect(FileHelper.getFileCategory('image/jpeg')).toBe('image');
    });

    it('returns "document" for PDF', () => {
      expect(FileHelper.getFileCategory('application/pdf')).toBe('document');
    });

    it('returns "other" for unknown types', () => {
      expect(FileHelper.getFileCategory('application/octet-stream')).toBe('other');
    });
  });
});

// ─── StringHelper ─────────────────────────────────────────────────────────────

describe('StringHelper', () => {
  describe('capitalize', () => {
    it('uppercases first letter and lowercases the rest', () => {
      expect(StringHelper.capitalize('hELLO')).toBe('Hello');
    });
  });

  describe('generateRandomString', () => {
    it('generates a string of given length', () => {
      expect(StringHelper.generateRandomString(12)).toHaveLength(12);
    });

    it('defaults to length 8', () => {
      expect(StringHelper.generateRandomString()).toHaveLength(8);
    });
  });

  describe('slugify', () => {
    it('converts to lowercase and replaces spaces with hyphens', () => {
      expect(StringHelper.slugify('Hello World')).toBe('hello-world');
    });

    it('removes special characters', () => {
      expect(StringHelper.slugify('Café & Bar!')).toBe('caf-bar');
    });
  });

  describe('truncate', () => {
    it('truncates long strings and appends ellipsis', () => {
      const result = StringHelper.truncate('a'.repeat(110), 100);
      expect(result).toHaveLength(103); // 100 + '...'
    });

    it('does not truncate strings within limit', () => {
      expect(StringHelper.truncate('short', 100)).toBe('short');
    });
  });
});

// ─── ValidationHelper ─────────────────────────────────────────────────────────

describe('ValidationHelper', () => {
  describe('isValidEmail', () => {
    it('accepts valid emails', () => {
      expect(ValidationHelper.isValidEmail('user@example.com')).toBe(true);
      expect(ValidationHelper.isValidEmail('user.name+tag@domain.co')).toBe(true);
    });

    it('rejects invalid emails', () => {
      expect(ValidationHelper.isValidEmail('notanemail')).toBe(false);
      expect(ValidationHelper.isValidEmail('@nodomain.com')).toBe(false);
    });
  });

  describe('isValidUUID', () => {
    it('accepts a valid v4 UUID', () => {
      expect(
        ValidationHelper.isValidUUID('550e8400-e29b-41d4-a716-446655440000')
      ).toBe(true);
    });

    it('rejects a plain string', () => {
      expect(ValidationHelper.isValidUUID('not-a-uuid')).toBe(false);
    });
  });

  describe('sanitizeString', () => {
    it('trims whitespace and removes < >', () => {
      expect(ValidationHelper.sanitizeString('  <script>  ')).toBe('script');
    });
  });
});

// ─── ErrorHelper ──────────────────────────────────────────────────────────────

describe('ErrorHelper', () => {
  describe('handlePrismaError', () => {
    it('returns duplicate message for P2002', () => {
      const msg = ErrorHelper.handlePrismaError({ code: 'P2002' });
      expect(msg).toMatch(/already exists/i);
    });

    it('returns not found message for P2025', () => {
      const msg = ErrorHelper.handlePrismaError({ code: 'P2025' });
      expect(msg).toMatch(/not found/i);
    });

    it('returns generic message for unknown codes', () => {
      const msg = ErrorHelper.handlePrismaError({ code: 'P9999' });
      expect(msg).toMatch(/database operation failed/i);
    });
  });
});
