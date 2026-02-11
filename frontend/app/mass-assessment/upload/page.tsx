'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, FileText, X, Loader2 } from 'lucide-react';
import CenterSchoolSelectionModal from '@/components/modals/CenterSchoolSelectionModal';

interface ExtractedQuestion {
    question: string;
    answer: string;
    domain: string;
    difficulty: string;
    gradeLevel: string;
}

export default function DocumentUpload() {
    const router = useRouter();
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [extractedQuestions, setExtractedQuestions] = useState<ExtractedQuestion[]>([]);
    const [extractedText, setExtractedText] = useState('');
    const [assessment, setAssessment] = useState<any>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isSchoolModalOpen, setIsSchoolModalOpen] = useState(false);
    const [selectedSchoolName, setSelectedSchoolName] = useState('');
    
    const [formData, setFormData] = useState({
        schoolId: '',
        grade: '',
        targetDomain: '',
    });

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            const validTypes = [
                'application/pdf',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'application/msword',
            ];

            if (!validTypes.includes(selectedFile.type)) {
                alert('Please upload a PDF or DOCX file');
                return;
            }

            if (selectedFile.size > 10 * 1024 * 1024) {
                alert('File size must be less than 10MB');
                return;
            }

            setFile(selectedFile);
        }
    };

    const handleSchoolSelect = (schoolId: string, schoolName: string) => {
        setFormData({ ...formData, schoolId });
        setSelectedSchoolName(schoolName);
        setIsSchoolModalOpen(false);
    };

    const handleSchoolSelected = (schoolId: string, schoolName: string) => {
        handleSchoolSelect(schoolId, schoolName);
    };

    const handleUpload = async () => {
        if (!file || !formData.schoolId || !formData.grade) {
            alert('Please select school and grade, and upload a file');
            return;
        }

        setUploading(true);
        try {
            const uploadFormData = new FormData();
            uploadFormData.append('document', file);
            uploadFormData.append('schoolId', formData.schoolId);
            uploadFormData.append('grade', formData.grade);
            if (formData.targetDomain) {
                uploadFormData.append('targetDomain', formData.targetDomain);
            }

            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:5000/api/mass-assessment/upload-document', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: uploadFormData,
            });

            if (response.ok) {
                const data = await response.json();
                setAssessment(data.assessment);
                setExtractedQuestions(data.extractedQuestions || []);
                setExtractedText(data.extractedText || '');
            } else {
                const errorData = await response.json().catch(() => ({}));
                alert('Failed to upload document: ' + (errorData.error || 'Unknown error'));
            }
        } catch (error) {
            console.error('Upload error:', error);
            alert('Failed to upload document');
        } finally {
            setUploading(false);
        }
    };

    const removeFile = () => {
        setFile(null);
        setExtractedQuestions([]);
        setExtractedText('');
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const updateQuestion = (index: number, field: string, value: string) => {
        setExtractedQuestions((prev) =>
            prev.map((q, i) => (i === index ? { ...q, [field]: value } : q))
        );
    };

    const removeQuestion = (index: number) => {
        setExtractedQuestions((prev) => prev.filter((_, i) => i !== index));
    };

    const handleSaveQuestions = async () => {
        if (!assessment) {
            alert('No assessment created');
            return;
        }

        if (extractedQuestions.length === 0) {
            alert('No questions to save');
            return;
        }

        // Assessment is already created, navigate to assessments list to show the new assessment
        alert(`Assessment created successfully with ${extractedQuestions.length} questions!`);
        router.push('/mass-assessment/assessments');
    };


    return (
        <div className="p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Assessment</h1>
            <p className="text-gray-600 mb-8">Upload a document to create a new mass assessment</p>

            {/* School and Grade Selection */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Assessment Details</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            School *
                        </label>
                        <button
                            type="button"
                            onClick={() => setIsSchoolModalOpen(true)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-left focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            {selectedSchoolName || 'Select School'}
                        </button>
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Grade *
                        </label>
                        <select
                            value={formData.grade}
                            onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        >
                            <option value="">Select Grade</option>
                            <option value="1">Grade 1</option>
                            <option value="2">Grade 2</option>
                            <option value="3">Grade 3</option>
                            <option value="4">Grade 4</option>
                            <option value="5">Grade 5</option>
                            <option value="6">Grade 6</option>
                            <option value="7">Grade 7</option>
                            <option value="8">Grade 8</option>
                            <option value="9">Grade 9</option>
                            <option value="10">Grade 10</option>
                        </select>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Target Domain (Optional)
                    </label>
                    <select
                        value={formData.targetDomain}
                        onChange={(e) => setFormData({ ...formData, targetDomain: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">All Domains</option>
                        <option value="reading">Reading</option>
                        <option value="writing">Writing</option>
                        <option value="numeracy">Numeracy</option>
                        <option value="spelling">Spelling</option>
                    </select>
                </div>
            </div>

            {/* Upload Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Upload Document</h2>

                {!file ? (
                    <div
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center cursor-pointer hover:border-blue-500 transition-colors"
                    >
                        <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-700 font-medium mb-2">Click to upload or drag and drop</p>
                        <p className="text-sm text-gray-500">PDF or DOCX (max 10MB)</p>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".pdf,.docx,.doc"
                            onChange={handleFileSelect}
                            className="hidden"
                        />
                    </div>
                ) : (
                    <div className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <FileText className="h-8 w-8 text-blue-600" />
                                <div>
                                    <p className="font-medium text-gray-900">{file.name}</p>
                                    <p className="text-sm text-gray-500">
                                        {(file.size / 1024 / 1024).toFixed(2)} MB
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={removeFile}
                                className="text-gray-400 hover:text-red-600 transition-colors"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <button
                            onClick={handleUpload}
                            disabled={uploading}
                            className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                        >
                            {uploading ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Extracting Questions...
                                </>
                            ) : (
                                <>
                                    <Upload className="h-4 w-4" />
                                    Extract Questions
                                </>
                            )}
                        </button>
                    </div>
                )}
            </div>

            {/* Extracted Text Preview */}
            {extractedText && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Extracted Text Preview</h2>
                    <div className="bg-gray-50 p-4 rounded-lg max-h-48 overflow-y-auto">
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{extractedText}</p>
                    </div>
                </div>
            )}

            {/* Extracted Questions */}
            {extractedQuestions.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold text-gray-900">
                            Extracted Questions ({extractedQuestions.length})
                        </h2>
                        <button
                            onClick={handleSaveQuestions}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        >
                            Save Questions
                        </button>
                    </div>

                    <div className="space-y-4">
                        {extractedQuestions.map((q, index) => (
                            <div key={index} className="border border-gray-200 rounded-lg p-4">
                                <div className="flex justify-between items-start mb-3">
                                    <span className="text-sm font-semibold text-gray-500">Question {index + 1}</span>
                                    <button
                                        onClick={() => removeQuestion(index)}
                                        className="text-gray-400 hover:text-red-600"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Question
                                        </label>
                                        <textarea
                                            value={q.question}
                                            onChange={(e) => updateQuestion(index, 'question', e.target.value)}
                                            rows={2}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>

                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Answer
                                        </label>
                                        <textarea
                                            value={q.answer}
                                            onChange={(e) => updateQuestion(index, 'answer', e.target.value)}
                                            rows={2}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Domain
                                        </label>
                                        <select
                                            value={q.domain}
                                            onChange={(e) => updateQuestion(index, 'domain', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        >
                                            <option value="Reading">Reading</option>
                                            <option value="Reading Comprehension">Reading Comprehension</option>
                                            <option value="Spelling">Spelling</option>
                                            <option value="Numeracy">Numeracy</option>
                                            <option value="Writing">Writing</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Difficulty
                                        </label>
                                        <select
                                            value={q.difficulty}
                                            onChange={(e) => updateQuestion(index, 'difficulty', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        >
                                            <option value="easy">Easy</option>
                                            <option value="medium">Medium</option>
                                            <option value="hard">Hard</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Grade Level
                                        </label>
                                        <select
                                            value={q.gradeLevel}
                                            onChange={(e) => updateQuestion(index, 'gradeLevel', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        >
                                            <option value="K">Kindergarten</option>
                                            <option value="1">Grade 1</option>
                                            <option value="2">Grade 2</option>
                                            <option value="3">Grade 3</option>
                                            <option value="4">Grade 4</option>
                                            <option value="5">Grade 5</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* School Selection Modal */}
            {isSchoolModalOpen && (
                <CenterSchoolSelectionModal
                    isOpen={isSchoolModalOpen}
                    onClose={() => setIsSchoolModalOpen(false)}
                    onSchoolSelected={handleSchoolSelected}
                />
            )}
        </div>
    );
}

