import { renderHook, act } from '@testing-library/react';

// Mock dependencies
jest.mock('@/lib/api', () => ({
  apiClient: {
    refineReportWithAI: jest.fn(),
    updateReport: jest.fn(),
  },
}));

jest.mock('@/lib/toast', () => ({
  __esModule: true,
  default: Object.assign(jest.fn(), {
    success: jest.fn(),
    error: jest.fn(),
  }),
}));

import { useReportEditor } from '@/hooks/useReportEditor';
import { apiClient } from '@/lib/api';
import toast from '@/lib/toast';

const mockReport = {
  id: 'report-1',
  content: '## 1. Introduction\nThis is the original content.\n\n## 2. Findings\nSome findings here.',
};

describe('useReportEditor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('initializes with the report content', () => {
    const { result } = renderHook(() => useReportEditor({ report: mockReport }));

    expect(result.current.editedContent).toBe(mockReport.content);
    expect(result.current.originalContent).toBe(mockReport.content);
    expect(result.current.isDirty).toBe(false);
  });

  it('initializes with empty string when report has no content', () => {
    const { result } = renderHook(() => useReportEditor({ report: {} }));
    expect(result.current.editedContent).toBe('');
  });

  it('tracks dirty state when content is edited', () => {
    const { result } = renderHook(() => useReportEditor({ report: mockReport }));

    act(() => {
      result.current.setEditedContent('Modified content');
    });

    expect(result.current.isDirty).toBe(true);
  });

  it('isDirty is false when content matches original', () => {
    const { result } = renderHook(() => useReportEditor({ report: mockReport }));

    act(() => {
      result.current.setEditedContent('Something else');
    });
    expect(result.current.isDirty).toBe(true);

    act(() => {
      result.current.setEditedContent(mockReport.content);
    });
    expect(result.current.isDirty).toBe(false);
  });

  it('resetChanges restores original content', () => {
    const { result } = renderHook(() => useReportEditor({ report: mockReport }));

    act(() => {
      result.current.setEditedContent('Changed!');
    });
    expect(result.current.isDirty).toBe(true);

    act(() => {
      result.current.resetChanges();
    });
    expect(result.current.editedContent).toBe(mockReport.content);
    expect(result.current.isDirty).toBe(false);
  });

  it('rejectAIChanges clears AI refined content', () => {
    const { result } = renderHook(() => useReportEditor({ report: mockReport }));

    // Manually test rejectAIChanges
    act(() => {
      result.current.rejectAIChanges();
    });

    expect(result.current.aiRefinedContent).toBeNull();
  });

  it('diffLines is empty when no AI content', () => {
    const { result } = renderHook(() => useReportEditor({ report: mockReport }));
    expect(result.current.diffLines).toEqual([]);
  });

  it('diffStats defaults to zeros when no AI content', () => {
    const { result } = renderHook(() => useReportEditor({ report: mockReport }));
    expect(result.current.diffStats).toEqual({ added: 0, removed: 0, unchanged: 0 });
  });

  it('promptHistory starts empty', () => {
    const { result } = renderHook(() => useReportEditor({ report: mockReport }));
    expect(result.current.promptHistory).toEqual([]);
  });

  describe('refineWithAI', () => {
    it('shows error toast for empty prompt', async () => {
      const { result } = renderHook(() => useReportEditor({ report: mockReport }));

      await act(async () => {
        await result.current.refineWithAI('   ');
      });

      expect(toast.error).toHaveBeenCalledWith('Please enter a prompt');
    });

    it('performs mock refinement and updates state', async () => {
      const { result } = renderHook(() => useReportEditor({ report: mockReport }));

      await act(async () => {
        await result.current.refineWithAI('Make it more specific');
      });

      expect(result.current.isRefining).toBe(false);
      expect(result.current.aiRefinedContent).toBeTruthy();
      expect(result.current.promptHistory).toHaveLength(1);
      expect(result.current.promptHistory[0].status).toBe('success');
      expect(toast.success).toHaveBeenCalledWith('AI refinement complete');
    });
  });

  describe('applyAIChanges', () => {
    it('applies AI content to edited content', async () => {
      const { result } = renderHook(() => useReportEditor({ report: mockReport }));

      // Trigger refinement to get AI content
      await act(async () => {
        await result.current.refineWithAI('Make more encouraging');
      });

      const refinedContent = result.current.aiRefinedContent;
      expect(refinedContent).toBeTruthy();

      act(() => {
        result.current.applyAIChanges();
      });

      expect(result.current.editedContent).toBe(refinedContent);
      expect(result.current.aiRefinedContent).toBeNull();
      expect(toast.success).toHaveBeenCalledWith('AI changes applied');
    });
  });

  describe('saveChanges', () => {
    it('shows info toast when there are no changes', async () => {
      const { result } = renderHook(() => useReportEditor({ report: mockReport }));

      await act(async () => {
        await result.current.saveChanges();
      });

      expect(toast).toHaveBeenCalledWith('No changes to save', expect.any(Object));
      expect(apiClient.updateReport).not.toHaveBeenCalled();
    });

    it('calls apiClient.updateReport when dirty', async () => {
      (apiClient.updateReport as jest.Mock).mockResolvedValue({});

      const onSaveSuccess = jest.fn();
      const { result } = renderHook(() =>
        useReportEditor({ report: mockReport, onSaveSuccess })
      );

      act(() => {
        result.current.setEditedContent('Updated content');
      });

      await act(async () => {
        await result.current.saveChanges();
      });

      expect(apiClient.updateReport).toHaveBeenCalledWith('report-1', {
        content: 'Updated content',
      });
      expect(toast.success).toHaveBeenCalledWith('Report saved successfully');
      expect(onSaveSuccess).toHaveBeenCalled();
    });

    it('handles save errors gracefully', async () => {
      (apiClient.updateReport as jest.Mock).mockRejectedValue(
        new Error('Network error')
      );

      const { result } = renderHook(() => useReportEditor({ report: mockReport }));

      act(() => {
        result.current.setEditedContent('new content');
      });

      await act(async () => {
        await result.current.saveChanges();
      });

      expect(toast.error).toHaveBeenCalled();
      expect(result.current.isSaving).toBe(false);
    });
  });
});
