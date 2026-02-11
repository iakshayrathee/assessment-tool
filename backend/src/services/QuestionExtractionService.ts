import Groq from 'groq-sdk';

interface ExtractedQuestion {
    question: string;
    answer: string;
    domain: string; // Reading, Comprehension, Spelling, Numeracy, Writing
    difficulty: 'easy' | 'medium' | 'hard';
    gradeLevel: string;
}

interface ExtractionResult {
    questions: ExtractedQuestion[];
    totalExtracted: number;
    suggestedDomain: string;
}

export class QuestionExtractionService {
    private groq: Groq;

    constructor() {
        this.groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    }

    /**
     * Extract questions and answers from document text
     */
    async extractQuestions(
        text: string,
        targetDomain?: string,
        gradeLevel?: string
    ): Promise<ExtractionResult> {
        const prompt = this.buildExtractionPrompt(text, targetDomain, gradeLevel);

        try {
            const completion = await this.groq.chat.completions.create({
                model: 'llama-3.3-70b-versatile', // Fast and accurate
                messages: [
                    {
                        role: 'system',
                        content:
                            'You are an expert educational content analyzer specializing in K-5 assessments. Extract questions and answers from documents, categorizing them by domain (Reading, Reading Comprehension, Spelling, Numeracy, Writing).',
                    },
                    {
                        role: 'user',
                        content: prompt,
                    },
                ],
                temperature: 0.3, // Lower temperature for more consistent extraction
                max_tokens: 4000,
                response_format: { type: 'json_object' },
            });

            const response = completion.choices[0]?.message?.content;
            if (!response) {
                throw new Error('Failed to extract questions from document');
            }

            const result = JSON.parse(response);
            return this.validateAndFormat(result);
        } catch (error) {
            console.error('Question extraction error:', error);
            throw new Error(
                `Failed to extract questions: ${(error as Error).message}`
            );
        }
    }

    /**
     * Build extraction prompt for Groq
     */
    private buildExtractionPrompt(
        text: string,
        targetDomain?: string,
        gradeLevel?: string
    ): string {
        return `
Extract all questions and their answers from the following document text.
For each question, identify:
1. The question text
2. The correct answer
3. The domain (Reading, Reading Comprehension, Spelling, Numeracy, or Writing)
4. Difficulty level (easy, medium, hard)
5. Appropriate grade level (K-5)

${targetDomain ? `Focus on questions related to: ${targetDomain}` : ''}
${gradeLevel ? `Target grade level: ${gradeLevel}` : ''}

Document Text:
${text.substring(0, 8000)} ${text.length > 8000 ? '...[truncated]' : ''}

Return the result as a JSON object with this structure:
{
  "suggestedDomain": "primary domain of the document",
  "questions": [
    {
      "question": "question text",
      "answer": "answer text",
      "domain": "domain name",
      "difficulty": "easy|medium|hard",
      "gradeLevel": "K|1|2|3|4|5"
    }
  ]
}

IMPORTANT: Return ONLY valid JSON, no additional text.
`;
    }

    /**
     * Validate and format extraction result
     */
    private validateAndFormat(result: any): ExtractionResult {
        if (!result.questions || !Array.isArray(result.questions)) {
            throw new Error('Invalid extraction result format');
        }

        const validDomains = [
            'Reading',
            'Reading Comprehension',
            'Spelling',
            'Numeracy',
            'Writing',
        ];
        const validDifficulties = ['easy', 'medium', 'hard'];

        const validatedQuestions = result.questions
            .filter((q: any) => q.question && q.answer)
            .map((q: any) => ({
                question: q.question.trim(),
                answer: q.answer.trim(),
                domain: validDomains.includes(q.domain) ? q.domain : 'Reading',
                difficulty: validDifficulties.includes(q.difficulty)
                    ? q.difficulty
                    : 'medium',
                gradeLevel: q.gradeLevel || 'K',
            }));

        return {
            questions: validatedQuestions,
            totalExtracted: validatedQuestions.length,
            suggestedDomain: result.suggestedDomain || 'Reading',
        };
    }
}
