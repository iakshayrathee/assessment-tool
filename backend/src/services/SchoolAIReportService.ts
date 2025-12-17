import OpenAI from 'openai';

interface SchoolSnapshot {
    totalEnrolled: number;
    totalScreened: number;
    totalSupported: number;
    gradesCovered: string[];
    highSupportCount: number;
    moderateSupportCount: number;
    onTrackCount: number;
    highSupportReduction: number | null;
    moderateSupportReduction: number | null;
    onTrackIncrease: number | null;
    readingReadinessPercent: number | null;
    writingReadinessPercent: number | null;
    numeracyReadinessPercent: number | null;
    attentionEngagementPercent: number | null;
    processingMemoryPercent: number | null;
    totalSessions: number;
    averageImprovement: any;
}

interface SchoolReportNarratives {
    executiveSummary: string;
    coverageNarrative: string;
    impactNarrative: string;
    recommendations: string;
}

export class SchoolAIReportService {
    private openai: OpenAI;

    constructor() {
        this.openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY!
        });
    }

    /**
     * Generate ALL AI narratives in a single API call to minimize costs
     * This replaces the previous approach of 4 separate API calls
     */
    async generateAllNarratives(
        snapshot: SchoolSnapshot,
        schoolData: { name: string; principalName?: string }
    ): Promise<SchoolReportNarratives> {
        const prompt = this.buildComprehensivePrompt(snapshot, schoolData);
        const response = await this.callOpenAI(prompt);
        return this.parseNarratives(response);
    }

    /**
     * Build comprehensive prompt that requests all narratives in one go
     * OPTIMIZED: Minimal prompt to reduce token costs
     */
    private buildComprehensivePrompt(snapshot: SchoolSnapshot, schoolData: any): string {
        const totalStudents = snapshot.highSupportCount + snapshot.moderateSupportCount + snapshot.onTrackCount;
        const improvements = snapshot.averageImprovement || {};

        return `Generate 4 brief school report sections using these markers:

DATA:
School: ${schoolData.name}
Enrolled: ${snapshot.totalEnrolled}, Screened: ${snapshot.totalScreened}, Supported: ${snapshot.totalSupported}
Grades: ${snapshot.gradesCovered.join(', ')}
Risk: High ${snapshot.highSupportCount}, Moderate ${snapshot.moderateSupportCount}, On Track ${snapshot.onTrackCount}
${snapshot.highSupportReduction !== null ? `Trends: High ${snapshot.highSupportReduction > 0 ? '-' : '+'}${Math.abs(snapshot.highSupportReduction)}%, Moderate ${snapshot.moderateSupportReduction! > 0 ? '-' : '+'}${Math.abs(snapshot.moderateSupportReduction!)}%, On Track ${snapshot.onTrackIncrease! > 0 ? '+' : '-'}${Math.abs(snapshot.onTrackIncrease!)}%` : 'No prior data'}
Skills needing support: Reading ${snapshot.readingReadinessPercent}%, Writing ${snapshot.writingReadinessPercent}%, Math ${snapshot.numeracyReadinessPercent}%, Attention ${snapshot.attentionEngagementPercent}%, Processing ${snapshot.processingMemoryPercent}%
Improvement: ${Object.entries(improvements).map(([d, v]) => `${d} ${v}%`).join(', ')}
Sessions: ${snapshot.totalSessions} (avg ${Math.round(snapshot.totalSessions / (snapshot.totalSupported || 1))} per student)

===EXECUTIVE_SUMMARY===
Write 2 paragraphs: program overview, key insights from data.

===COVERAGE_NARRATIVE===
Write 2 paragraphs: coverage analysis, risk distribution insights.

===IMPACT_NARRATIVE===
Write 2 paragraphs: intervention impact, improvement trends.

===RECOMMENDATIONS===
List 4-5 numbered actionable recommendations based on data.

Keep each section concise and data-focused.`;
    }

    /**
     * Parse the AI response into separate narratives
     */
    private parseNarratives(response: string): SchoolReportNarratives {
        try {
            // Extract each section using the markers
            const executiveSummary = this.extractSection(response, 'EXECUTIVE_SUMMARY');
            const coverageNarrative = this.extractSection(response, 'COVERAGE_NARRATIVE');
            const impactNarrative = this.extractSection(response, 'IMPACT_NARRATIVE');
            const recommendations = this.extractSection(response, 'RECOMMENDATIONS');

            return {
                executiveSummary,
                coverageNarrative,
                impactNarrative,
                recommendations
            };
        } catch (error) {
            console.error('Error parsing AI narratives:', error);
            // Fallback: return the full response for each section
            return {
                executiveSummary: response,
                coverageNarrative: response,
                impactNarrative: response,
                recommendations: response
            };
        }
    }

    /**
     * Extract a specific section from the AI response
     */
    private extractSection(response: string, sectionName: string): string {
        const startMarker = `===${sectionName}===`;
        const startIndex = response.indexOf(startMarker);

        if (startIndex === -1) {
            console.warn(`Section ${sectionName} not found in AI response`);
            return response; // Fallback to full response
        }

        // Find the start of the actual content (after the marker and any whitespace)
        const contentStart = startIndex + startMarker.length;
        let content = response.substring(contentStart);

        // Find the next section marker or end of string
        const nextMarkerIndex = content.search(/===\w+===/);
        if (nextMarkerIndex !== -1) {
            content = content.substring(0, nextMarkerIndex);
        }

        return content.trim();
    }

    /**
     * Call OpenAI API with prompt - SINGLE API CALL using GPT-5-nano
     */
    private async callOpenAI(prompt: string): Promise<string> {
        try {
            const systemPrompt = `Expert education analyst. Generate concise, data-driven school reports.`;

            console.log('Calling OpenAI GPT-5-nano for ALL school report narratives (single API call)...');

            const response = await this.openai.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: prompt }
                ],
                temperature: 0.3,
                max_tokens: 1500
            });

            const content = response.choices[0]?.message?.content;

            //console.log('AI response:', content);

            if (!content) {
                throw new Error('OpenAI response was empty');
            }

            console.log('All AI narratives generated successfully in single call');
            return content;

        } catch (error) {
            console.error('AI Report Generation Error:', error);
            throw new Error(`Failed to generate AI narratives: ${(error as Error).message}`);
        }
    }

    // Legacy methods for backward compatibility - now just call generateAllNarratives
    async generateSchoolOverviewNarrative(
        snapshot: SchoolSnapshot,
        schoolData: { name: string; principalName?: string }
    ): Promise<string> {
        const narratives = await this.generateAllNarratives(snapshot, schoolData);
        return narratives.executiveSummary;
    }

    async generateAssessmentCoverageNarrative(
        snapshot: SchoolSnapshot,
        trends: any
    ): Promise<string> {
        const narratives = await this.generateAllNarratives(snapshot, { name: 'School' });
        return narratives.coverageNarrative;
    }

    async generateSchoolImpactNarrative(
        snapshot: SchoolSnapshot,
        schoolData: { name: string }
    ): Promise<string> {
        const narratives = await this.generateAllNarratives(snapshot, schoolData);
        return narratives.impactNarrative;
    }

    async generateRecommendations(
        snapshot: SchoolSnapshot,
        trends: any
    ): Promise<string> {
        const narratives = await this.generateAllNarratives(snapshot, { name: 'School' });
        return narratives.recommendations;
    }
}
