'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useIntakeForm } from '@/hooks/useAssessments';
import { useStudent } from '@/hooks/useStudents';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'motion/react';
import toast from '@/lib/toast';
import { PageWrapper } from '@/components/layout/PageWrapper';
import {
  Brain,
  Users,
  AlertTriangle,
  RefreshCw,
  ArrowLeft,
  CheckCircle,
  Clock,
  Info,
  BookOpen,
  Globe,
  Home,
  Flag,
  Target,
  HelpCircle,
  Loader2,
  GraduationCap,
  Sparkles,
  ChevronRight,
  Activity,
  Heart,
  Stethoscope,
} from 'lucide-react';
import Link from 'next/link';

// ── Types ──────────────────────────────────────────────────────────────────────

interface AIProfile {
  child_context_summary: string;
  language_context: string;
  educational_context: string;
  family_home_context: string;
  developmental_milestone_context?: {
    post_natal_summary?: string;
    milestone_summary?: Record<string, string[]>;
    context_factors?: string[];
    missing_information?: string[];
    assessment_planning_notes?: string;
  };
  medical_history_context?: {
    medical_history_summary?: string;
    medical_context_factors?: string[];
    missing_information?: string[];
    assessment_planning_notes?: string;
    educational_accommodations?: string[];
  };
  educational_history_context?: {
    educational_summary?: string;
    academic_strengths?: string[];
    academic_support_areas?: string[];
    teacher_observation_summary?: string;
    educational_context_factors?: string[];
    missing_information?: string[];
    assessment_planning_notes?: string;
  };
  contextual_factors: string[];
  recommended_domains: string[];
  missing_information: string[];
  reasoning: string;
  confidence: string;
  tabs_completed: string[];
  contextual_flags: string[];
}

type ConfidenceLevel = 'LOW' | 'LOW_MEDIUM' | 'MEDIUM' | 'MEDIUM_HIGH' | 'HIGH';

const CONFIDENCE_CONFIG: Record<ConfidenceLevel, { label: string; color: string; bg: string; border: string; barWidth: string }> = {
  LOW: { label: 'Low', color: 'text-red-600', bg: 'bg-red-500', border: 'border-red-200', barWidth: 'w-[20%]' },
  LOW_MEDIUM: { label: 'Low–Medium', color: 'text-orange-600', bg: 'bg-orange-500', border: 'border-orange-200', barWidth: 'w-[40%]' },
  MEDIUM: { label: 'Medium', color: 'text-yellow-600', bg: 'bg-yellow-500', border: 'border-yellow-200', barWidth: 'w-[60%]' },
  MEDIUM_HIGH: { label: 'Medium–High', color: 'text-lime-600', bg: 'bg-lime-500', border: 'border-lime-200', barWidth: 'w-[80%]' },
  HIGH: { label: 'High', color: 'text-emerald-600', bg: 'bg-emerald-500', border: 'border-emerald-200', barWidth: 'w-full' },
};

// ── Helper Components ──────────────────────────────────────────────────────────

function ProfileSection({
  icon: Icon,
  title,
  content,
  iconColor,
  delay = 0,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  content: string;
  iconColor: string;
  delay?: number;
}) {
  if (!content) return null;
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}>
      <Card className="border-border shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <Icon className={`w-4 h-4 ${iconColor}`} />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-foreground text-sm leading-relaxed">{content}</p>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function TagChip({ label, variant }: { label: string; variant: 'success' | 'muted' | 'warning' }) {
  const styles = {
    success: 'bg-success/10 text-success border-success/20',
    muted: 'bg-muted text-muted-foreground border-border',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${styles[variant]}`}>
      {label}
    </span>
  );
}

// ── Main Content ───────────────────────────────────────────────────────────────

function AIProfileContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const studentId = searchParams.get('studentId') || '';

  const { student } = useStudent(studentId);
  const { intakeForm, updateIntakeForm } = useIntakeForm(studentId || undefined);

  const [isGenerating, setIsGenerating] = useState(false);
  const [profile, setProfile] = useState<AIProfile | null>(null);
  const [generatedAt, setGeneratedAt] = useState<Date | null>(null);
  const [autoGenerating, setAutoGenerating] = useState(false);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

  // Load persisted profile from intake form
  useEffect(() => {
    if (intakeForm && (intakeForm as any).intakeAIProfile) {
      setProfile((intakeForm as any).intakeAIProfile as AIProfile);
      if ((intakeForm as any).intakeAIGeneratedAt) {
        setGeneratedAt(new Date((intakeForm as any).intakeAIGeneratedAt));
      }
    }
  }, [intakeForm]);

  // Auto-generate if no profile exists yet (and form data available)
  useEffect(() => {
    if (intakeForm && !(intakeForm as any).intakeAIProfile && !autoGenerating && !isGenerating) {
      setAutoGenerating(true);
      runGenerate(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intakeForm]);

  // ── Generate ─────────────────────────────────────────────────────────────────

  const buildPayload = () => {
    if (!intakeForm) return null;
    const form = intakeForm as any;

    const tabs_completed: string[] = [];
    if (form.referralAreas?.length > 0 || form.referralSource?.length > 0) tabs_completed.push('referral');
    if (form.student?.age || form.mediumOfInstruction || form.student?.motherTongue || form.city || form.languageSpokenAtHome) tabs_completed.push('demographics');
    if (form.familyType || form.primaryCaregiver || form.languagesSpokenAtHome?.length > 0) tabs_completed.push('family');
    if (form.pregnancyNormal !== null && form.pregnancyNormal !== undefined) tabs_completed.push('prenatal');
    if (form.ageOfWalking || form.ageOfTwoWordSpeech) tabs_completed.push('postnatal');
    if (form.epilepticHistory !== null || form.onMedication !== null || form.healthConcerns || form.sleepDifficulties) tabs_completed.push('medical');
    if (form.attendedPreschool !== null || form.dominantWritingHand) tabs_completed.push('educational');

    return {
      referral: {
        referral_areas: form.referralAreas || [],
        referral_source: form.referralSource || [],
        duration_of_concern: form.durationOfConcern,
        severity_of_concern: form.severityOfConcern,
      },
      demographics: {
        name: form.student?.fullName,
        gender: form.student?.gender,
        age: form.student?.age,
        grade: form.student?.grade,
        mother_tongue: form.student?.motherTongue,
        syllabus: form.student?.syllabus,
        school_type: form.schoolType,
        medium_of_instruction: form.mediumOfInstruction,
        years_exposed_to_instruction: form.yearsExposedToInstruction,
        number_of_languages_understood: form.numberOfLanguagesUnderstood,
        school_attendance: form.schoolAttendance,
        city: form.city,
        state: form.state,
        urban_or_rural: form.urbanOrRural,
        chronological_age: form.chronologicalAge,
        language_spoken_at_home: form.languageSpokenAtHome,
        previous_grade_retention: form.previousGradeRetention,
      },
      family: {
        family_type: form.familyType,
        primary_caregiver: form.primaryCaregiver,
        child_lives_with: form.childLivesWith || [],
        number_of_siblings: form.numberOfSiblings,
        birth_order: form.birthOrder,
        family_history_of_difficulties: form.familyHistoryOfDifficulties,
        family_history_details: form.familyHistoryDetails,
        digital_resource_types: form.digitalResourceTypes || [],
        languages_spoken_at_home: form.languagesSpokenAtHome || [],
        parent_helps_with_homework: form.parentHelpsWithHomework,
        enjoy_school_rating: form.enjoySchoolRating,
        enjoy_reading_rating: form.enjoyReadingRating,
        external_support_types: form.externalSupportTypes || [],
        daily_digital_use: form.dailyDigitalUse,
      },
      prenatal: {
        pregnancy_normal: form.pregnancyNormal,
        medications_during_pregnancy: form.medicationsDuringPregnancy,
        full_term_or_premature: form.fullTermOrPremature,
        delivery_type: form.deliveryType,
        gestational_age: form.gestationalAge,
        nicu_stay: form.nicuStay,
        birth_weight: form.birthWeight,
        pregnancy_complications: form.pregnancyComplications || [],
        specify_medication: form.medicationsDuringPregnancyDetails,
        miscarriages_abortions: form.miscarriagesAbortions,
        jaundice_after_birth: form.infantJaundice,
        feeding_difficulties: form.feedingDifficulties,
        significant_illness: form.significantIllness,
        significant_illness_details: form.significantIllnessDetails,
      },
      postnatal: {
        birth_cry: form.birthCry,
        birth_cry_delay_duration: form.birthCryDelayDuration,
        resuscitation_required: form.resuscitationRequired,
        age_of_walking: form.ageOfWalking,
        age_of_two_word_speech: form.ageOfTwoWordSpeech,
        breast_fed: form.breastFed,
        breast_fed_duration: form.breastFedDuration,
        infant_jaundice: form.infantJaundice,
        infant_jaundice_treatment: form.infantJaundiceTreatment,
        incubation: form.incubation,
        incubation_days: form.incubationDays,
        incubation_reason: form.incubationReason || [],
        immunization_done: form.immunizationDone,
        consanguineous_marriage: form.consanguineousMarriage,
        delay_in_neck_standing: form.delayInNeckStanding,
        delay_in_neck_standing_details: form.delayInNeckStandingDetails,
        seizures_infancy: form.seizuresInfancy,
        seizures_infancy_details: form.seizuresInfancyDetails,
        vision_problems_early: form.visionProblemsEarly,
        hearing_problems_early: form.hearingProblemsEarly,
        hospitalization_first_two_years: form.hospitalizationFirstTwoYears,
        hospitalization_first_two_years_reason: form.hospitalizationFirstTwoYearsReason,
      },
      medical: {
        health_concerns: form.healthConcerns,
        epileptic_history: form.epilepticHistory,
        epilepsy_type: form.epilepsyType,
        epilepsy_last_episode: form.epilepsyLastEpisode,
        epilepsy_frequency: form.epilepsyFrequency,
        epilepsy_under_medical_care: form.epilepsyUnderMedicalCare,
        on_medication: form.onMedication,
        medication_details: form.medicationDetails,
        medication_name: form.medicationName,
        medication_dosage: form.medicationDosage,
        medication_frequency: form.medicationFrequency,
        medication_purpose: form.medicationPurpose || [],
        asthma_wheezing: form.asthmaWheezing,
        asthma_uses_inhaler: form.asthmaUsesInhaler,
        asthma_frequency: form.asthmaFrequency,
        asthma_emergency_plan: form.asthmaEmergencyPlan,
        wears_glasses: form.wearsGlasses,
        glasses_usage: form.glassesUsage,
        vision_test_done: form.visionTestDone,
        vision_test_result: form.visionTestResult,
        vision_test_date: form.visionTestDate,
        hearing_test_done: form.hearingTestDone,
        hearing_test_result: form.hearingTestResult,
        hearing_test_date: form.hearingTestDate,
        sleep_difficulties: form.sleepDifficulties,
        sleep_difficulties_details: form.sleepDifficultiesDetails || [],
        hospitalization_history: form.hospitalizationHistory,
        hospitalization_history_reason: form.hospitalizationHistoryReason,
        hospitalization_history_date: form.hospitalizationHistoryDate,
      },
      educational: {
        attended_preschool: form.attendedPreschool,
        repeated_grades: form.repeatedGrades,
        which_grade_repeated: form.whichGradeRepeated,
        struggles_in_languages: form.strugglesInLanguages,
        age_started_preschool: form.ageStartedPreschool ? parseInt(form.ageStartedPreschool, 10) : null,
        years_preschool: form.yearsPreschool ? parseInt(form.yearsPreschool, 10) : null,
        reason_for_repeating: form.reasonForRepeating,
        dominant_writing_hand: form.dominantWritingHand,
        overall_performance: form.overallPerformance,
        overall_percentage: form.overallPercentage ? parseInt(form.overallPercentage, 10) : null,
        subject_performance: form.subjectPerformance,
        subject_marks: form.subjectMarks,
        academic_trend: form.academicTrend,
        teacher_comments: form.teacherComments,
        language_struggles: form.languageStruggles,
        math_struggles: form.mathStruggles,
        homework_completion: form.homeworkCompletion,
        classroom_participation: form.classroomParticipation,
        attendance_percentage: form.attendancePercentage ? parseInt(form.attendancePercentage, 10) : null,
        learning_strengths: form.learningStrengths,
        areas_support: form.areasSupport,
        previous_support: form.previousSupport,
      },
      tabs_completed,
      skip_cache: true,
    };
  };

  const runGenerate = async (silent = false) => {
    if (!intakeForm) {
      if (!silent) toast.error('No intake form found. Please complete the intake form first.');
      setAutoGenerating(false);
      return;
    }

    const payload = buildPayload();
    if (!payload) { setAutoGenerating(false); return; }

    setIsGenerating(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';

      const res = await fetch(`${apiUrl}/ai/intake/profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(err.error || err.detail || `HTTP ${res.status}`);
      }

      const json = await res.json();
      const aiProfile: AIProfile = json.data;

      // Persist back to intake form
      if (intakeForm) {
        await updateIntakeForm({
          id: intakeForm.id,
          data: {
            intakeAIProfile: aiProfile,
            intakeAIGeneratedAt: new Date().toISOString(),
            intakeAIConfidence: aiProfile.confidence,
          } as any,
        });
      }

      setProfile(aiProfile);
      setGeneratedAt(new Date());
      if (!silent) toast.success('AI Intake Profile generated successfully');
    } catch (err: any) {
      console.error('AI profile generation error:', err);
      if (!silent) toast.error(err.message || 'Failed to generate AI profile');
    } finally {
      setIsGenerating(false);
      setAutoGenerating(false);
    }
  };

  // ── No student guard ─────────────────────────────────────────────────────────

  if (!studentId) {
    return (
      <PageWrapper
        title="AI Intake Profile"
        description="AI-generated contextual profile from intake form data"
        breadcrumbs={[{ label: 'Educator' }, { label: 'Intake', href: '/educator/intake' }, { label: 'AI Profile' }]}
      >
        <Card className="max-w-md mx-auto text-center p-8 border-border shadow-sm">
          <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-4" />
          <h2 className="text-lg font-semibold mb-2">No Student Selected</h2>
          <p className="text-muted-foreground text-sm mb-6">Please go back and select a student from the intake form.</p>
          <Link href="/educator/intake">
            <Button variant="outline">← Back to Intake Form</Button>
          </Link>
        </Card>
      </PageWrapper>
    );
  }

  const conf = CONFIDENCE_CONFIG[(profile?.confidence as ConfidenceLevel) || 'LOW'];

  return (
    <PageWrapper
      title="AI Intake Profile"
      description={student ? `Contextual profile for ${student.fullName}` : 'AI-generated contextual profile from intake form data'}
      breadcrumbs={[
        { label: 'Educator' },
        { label: 'Intake', href: `/educator/intake?studentId=${studentId}` },
        { label: 'AI Profile' },
      ]}
    >
      <div className="space-y-6">

        {/* ── Advisory Banner ── */}
        <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <Info className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-amber-800">
            <strong>Advisory only.</strong> This AI profile is a contextual summary to support pre-assessment planning.
            It is not a clinical finding or diagnostic report. All insights must be reviewed by the educator.
          </p>
        </div>

        {/* ── Header Actions ── */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            {generatedAt && (
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Clock className="w-3 h-3" />
                Generated: {generatedAt.toLocaleString()}
              </p>
            )}
            {profile && (
              <div className="flex items-center gap-3 mt-2">
                <span className={`text-xs font-semibold ${conf.color}`}>
                  Confidence: {conf.label}
                </span>
                <div className="w-28 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-700 ${conf.bg} ${conf.barWidth}`} />
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <Link href={`/educator/intake?studentId=${studentId}`}>
              <Button variant="outline" size="sm" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back to Intake Form
              </Button>
            </Link>
            <Button
              id="generate-ai-profile-btn"
              onClick={() => runGenerate(false)}
              disabled={isGenerating}
              size="sm"
              className="gap-2 bg-primary hover:bg-primary/90"
            >
              {isGenerating ? (
                <><Loader2 className="w-4 h-4 animate-spin" />Generating…</>
              ) : profile ? (
                <><RefreshCw className="w-4 h-4" />Regenerate</>
              ) : (
                <><Sparkles className="w-4 h-4" />Generate Profile</>
              )}
            </Button>
          </div>
        </div>

        {/* ── Loading State ── */}
        <AnimatePresence mode="wait">
          {isGenerating && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="bg-background border border-border rounded-2xl p-24 text-center shadow-sm"
            >
              <div className="w-12 h-12 border-4 border-border border-t-primary rounded-full animate-spin mx-auto mb-6" />
              <h3 className="text-lg font-bold text-foreground mb-2">
                {autoGenerating ? 'Generating your AI Intake Profile…' : 'Regenerating profile…'}
              </h3>
              <p className="text-muted-foreground text-sm max-w-sm mx-auto">
                Analysing intake data, detecting contextual flags, and building your advisory profile.
              </p>
            </motion.div>
          )}

          {/* ── Empty State ── */}
          {!profile && !isGenerating && (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="bg-background border border-border rounded-2xl p-24 text-center shadow-sm"
            >
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Brain className="w-10 h-10 text-primary" strokeWidth={1.5} />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">No profile yet</h3>
              <p className="text-muted-foreground text-sm max-w-md mx-auto mb-6">
                Click <strong>Generate Profile</strong> to create a contextual summary from the intake data collected so far. You can regenerate after each tab save.
              </p>
              <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5"><CheckCircle className="w-3 h-3 text-success" /> Non-diagnostic</span>
                <span className="flex items-center gap-1.5"><CheckCircle className="w-3 h-3 text-success" /> Advisory only</span>
                <span className="flex items-center gap-1.5"><CheckCircle className="w-3 h-3 text-success" /> Educator-reviewed</span>
              </div>
            </motion.div>
          )}

          {/* ── Profile Content ── */}
          {profile && !isGenerating && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              {/* Tabs completed badge row */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-muted-foreground font-medium">Tabs analysed:</span>
                {profile.tabs_completed?.map(tab => (
                  <span key={tab} className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full border border-primary/20 capitalize font-medium">
                    {tab}
                  </span>
                ))}
              </div>

              {/* Context sections */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ProfileSection icon={Brain} title="Child Context Summary" content={profile.child_context_summary} iconColor="text-primary" delay={0.05} />
                <ProfileSection icon={Globe} title="Language Context" content={profile.language_context} iconColor="text-blue-600" delay={0.1} />
                <ProfileSection icon={BookOpen} title="Educational Context" content={profile.educational_context} iconColor="text-emerald-600" delay={0.15} />
                {profile.family_home_context && (
                  <ProfileSection icon={Home} title="Family & Home Context" content={profile.family_home_context} iconColor="text-orange-600" delay={0.2} />
                )}
              </div>

              {/* Developmental Milestone Context Layer */}
              {profile.developmental_milestone_context && profile.developmental_milestone_context.post_natal_summary && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }}>
                  <Card className="border-border shadow-sm overflow-hidden">
                    <CardHeader className="bg-primary/5 border-b border-border/60 pb-3">
                      <CardTitle className="text-sm font-semibold text-primary flex items-center gap-2">
                        <Activity className="w-4 h-4" />
                        Developmental Milestone Context Layer
                      </CardTitle>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Summary of early developmental milestones and neonatal medical background. Non-diagnostic.
                      </p>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-4">
                      {/* Section 1: Post Natal Summary */}
                      {profile.developmental_milestone_context.post_natal_summary && (
                        <div className="space-y-1">
                          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Post Natal Summary</h4>
                          <p className="text-foreground text-sm leading-relaxed">{profile.developmental_milestone_context.post_natal_summary}</p>
                        </div>
                      )}

                      {/* Section 2: Developmental Milestone Summary */}
                      {profile.developmental_milestone_context.milestone_summary && Object.keys(profile.developmental_milestone_context.milestone_summary).length > 0 && (
                        <div className="space-y-2 pt-2 border-t border-border/40">
                          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Developmental Milestone Summary</h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {Object.entries(profile.developmental_milestone_context.milestone_summary).map(([category, items]) => (
                              Array.isArray(items) && items.length > 0 && (
                                <div key={category} className="bg-muted/40 p-3 rounded-lg border border-border/40">
                                  <span className="text-xs font-semibold text-foreground capitalize block mb-1.5">{category}</span>
                                  <ul className="list-disc list-inside space-y-1 text-xs text-muted-foreground">
                                    {items.map((item, i) => (
                                      <li key={i} className="list-item leading-normal">{item}</li>
                                    ))}
                                  </ul>
                                </div>
                              )
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Section 3: Developmental Context Factors */}
                      {profile.developmental_milestone_context.context_factors && profile.developmental_milestone_context.context_factors.length > 0 && (
                        <div className="space-y-1.5 pt-2 border-t border-border/40">
                          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Developmental Context Factors</h4>
                          <div className="flex flex-wrap gap-1.5">
                            {profile.developmental_milestone_context.context_factors.map((factor, i) => (
                              <span key={i} className="inline-flex items-center px-2 py-1 rounded bg-amber-50 text-amber-800 text-xs border border-amber-200">
                                {factor}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Section 4: Missing Information */}
                      {profile.developmental_milestone_context.missing_information && profile.developmental_milestone_context.missing_information.length > 0 && (
                        <div className="space-y-1.5 pt-2 border-t border-border/40">
                          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Missing Milestone Information</h4>
                          <div className="flex flex-wrap gap-1.5">
                            {profile.developmental_milestone_context.missing_information.map((info, i) => (
                              <span key={i} className="inline-flex items-center px-2 py-1 rounded bg-red-50 text-red-800 text-xs border border-red-200">
                                {info}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Section 5: Assessment Planning Notes */}
                      {profile.developmental_milestone_context.assessment_planning_notes && (
                        <div className="space-y-1 pt-2 border-t border-border/40 bg-blue-50/40 p-3 rounded-lg border border-blue-100/60">
                          <h4 className="text-xs font-semibold text-blue-800 uppercase tracking-wider flex items-center gap-1.5">
                            <Info className="w-3.5 h-3.5 text-blue-600" />
                            Assessment Planning Notes
                          </h4>
                          <p className="text-blue-900/90 text-xs leading-relaxed mt-1">{profile.developmental_milestone_context.assessment_planning_notes}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Medical History Context Layer */}
              {profile.medical_history_context && profile.medical_history_context.medical_history_summary && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.23 }}>
                  <Card className="border-border shadow-sm overflow-hidden">
                    <CardHeader className="bg-primary/5 border-b border-border/60 pb-3">
                      <CardTitle className="text-sm font-semibold text-primary flex items-center gap-2">
                        <Stethoscope className="w-4 h-4" />
                        Medical History Context Layer
                      </CardTitle>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Summary of reported health conditions, medical management, visual/hearing supports, and test results. Non-diagnostic.
                      </p>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-4">
                      {/* Section 1: Medical History Summary */}
                      {profile.medical_history_context.medical_history_summary && (
                        <div className="space-y-1">
                          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Medical History Summary</h4>
                          <p className="text-foreground text-sm leading-relaxed">{profile.medical_history_context.medical_history_summary}</p>
                        </div>
                      )}

                      {/* Section 2: Medical Context Factors */}
                      {profile.medical_history_context.medical_context_factors && profile.medical_history_context.medical_context_factors.length > 0 && (
                        <div className="space-y-1.5 pt-2 border-t border-border/40">
                          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Medical Context Factors</h4>
                          <div className="flex flex-wrap gap-1.5">
                            {profile.medical_history_context.medical_context_factors.map((factor, i) => (
                              <span key={i} className="inline-flex items-center px-2 py-1 rounded bg-amber-50 text-amber-800 text-xs border border-amber-200">
                                {factor}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Section 3: Missing Information */}
                      {profile.medical_history_context.missing_information && profile.medical_history_context.missing_information.length > 0 && (
                        <div className="space-y-1.5 pt-2 border-t border-border/40">
                          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Missing Medical Details</h4>
                          <div className="flex flex-wrap gap-1.5">
                            {profile.medical_history_context.missing_information.map((info, i) => (
                              <span key={i} className="inline-flex items-center px-2 py-1 rounded bg-red-50 text-red-800 text-xs border border-red-200">
                                {info}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Section 4: Suggested Educational Accommodations */}
                      {profile.medical_history_context.educational_accommodations && profile.medical_history_context.educational_accommodations.length > 0 && (
                        <div className="space-y-2 pt-2 border-t border-border/40">
                          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Suggested Educational Accommodations</h4>
                          <ul className="list-disc list-inside space-y-1 text-xs text-muted-foreground bg-muted/40 p-3 rounded-lg border border-border/40">
                            {profile.medical_history_context.educational_accommodations.map((acc, i) => (
                              <li key={i} className="list-item leading-normal">{acc}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Section 5: Assessment Planning Notes */}
                      {profile.medical_history_context.assessment_planning_notes && (
                        <div className="space-y-1 pt-2 border-t border-border/40 bg-blue-50/40 p-3 rounded-lg border border-blue-100/60">
                          <h4 className="text-xs font-semibold text-blue-800 uppercase tracking-wider flex items-center gap-1.5">
                            <Info className="w-3.5 h-3.5 text-blue-600" />
                            Assessment Planning Notes
                          </h4>
                          <p className="text-blue-900/90 text-xs leading-relaxed mt-1">{profile.medical_history_context.assessment_planning_notes}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Educational History Context Layer */}
              {profile.educational_history_context && profile.educational_history_context.educational_summary && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.24 }}>
                  <Card className="border-border shadow-sm overflow-hidden">
                    <CardHeader className="bg-primary/5 border-b border-border/60 pb-3">
                      <CardTitle className="text-sm font-semibold text-primary flex items-center gap-2">
                        <GraduationCap className="w-4 h-4" />
                        Academic Context Layer (Educational History)
                      </CardTitle>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Summary of child's academic journey, classroom observations, learning strengths, challenges, and support. Non-diagnostic.
                      </p>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-4">
                      {/* Section 1: Educational Summary */}
                      {profile.educational_history_context.educational_summary && (
                        <div className="space-y-1">
                          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Educational Summary</h4>
                          <p className="text-foreground text-sm leading-relaxed">{profile.educational_history_context.educational_summary}</p>
                        </div>
                      )}

                      {/* Section 2 & 3: Strengths & Support Areas (Side by Side Grid) */}
                      {((profile.educational_history_context.academic_strengths && profile.educational_history_context.academic_strengths.length > 0) ||
                        (profile.educational_history_context.academic_support_areas && profile.educational_history_context.academic_support_areas.length > 0)) && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-border/40">
                            {/* Strengths */}
                            {profile.educational_history_context.academic_strengths && profile.educational_history_context.academic_strengths.length > 0 && (
                              <div className="bg-emerald-50/40 p-3 rounded-lg border border-emerald-100/60">
                                <h4 className="text-xs font-semibold text-emerald-800 uppercase tracking-wider mb-2">Academic Strengths</h4>
                                <ul className="list-disc list-inside space-y-1 text-xs text-emerald-950">
                                  {profile.educational_history_context.academic_strengths.map((strength, i) => (
                                    <li key={i} className="list-item leading-normal">{strength}</li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {/* Support Areas */}
                            {profile.educational_history_context.academic_support_areas && profile.educational_history_context.academic_support_areas.length > 0 && (
                              <div className="bg-amber-50/40 p-3 rounded-lg border border-amber-100/60">
                                <h4 className="text-xs font-semibold text-amber-800 uppercase tracking-wider mb-2">Academic Support Areas</h4>
                                <ul className="list-disc list-inside space-y-1 text-xs text-amber-950">
                                  {profile.educational_history_context.academic_support_areas.map((area, i) => (
                                    <li key={i} className="list-item leading-normal">{area}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        )}

                      {/* Section 4: Teacher Observation Summary */}
                      {profile.educational_history_context.teacher_observation_summary && (
                        <div className="space-y-1 pt-2 border-t border-border/40">
                          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Teacher Observation Summary</h4>
                          <p className="text-foreground text-sm leading-relaxed">{profile.educational_history_context.teacher_observation_summary}</p>
                        </div>
                      )}

                      {/* Section 5: Educational Context Factors */}
                      {profile.educational_history_context.educational_context_factors && profile.educational_history_context.educational_context_factors.length > 0 && (
                        <div className="space-y-1.5 pt-2 border-t border-border/40">
                          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Educational Context Factors</h4>
                          <div className="flex flex-wrap gap-1.5">
                            {profile.educational_history_context.educational_context_factors.map((factor, i) => (
                              <span key={i} className="inline-flex items-center px-2 py-1 rounded bg-amber-50 text-amber-800 text-xs border border-amber-200">
                                {factor}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Section 6: Missing Information */}
                      {profile.educational_history_context.missing_information && profile.educational_history_context.missing_information.length > 0 && (
                        <div className="space-y-1.5 pt-2 border-t border-border/40">
                          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Missing Educational Information</h4>
                          <div className="flex flex-wrap gap-1.5">
                            {profile.educational_history_context.missing_information.map((info, i) => (
                              <span key={i} className="inline-flex items-center px-2 py-1 rounded bg-red-50 text-red-800 text-xs border border-red-200">
                                {info}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Section 7: Assessment Planning Notes */}
                      {profile.educational_history_context.assessment_planning_notes && (
                        <div className="space-y-1 pt-2 border-t border-border/40 bg-blue-50/40 p-3 rounded-lg border border-blue-100/60">
                          <h4 className="text-xs font-semibold text-blue-800 uppercase tracking-wider flex items-center gap-1.5">
                            <Info className="w-3.5 h-3.5 text-blue-600" />
                            Assessment Planning Notes
                          </h4>
                          <p className="text-blue-900/90 text-xs leading-relaxed mt-1">{profile.educational_history_context.assessment_planning_notes}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Contextual Factors */}
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
                <Card className="border-border shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                      <Flag className="w-4 h-4 text-amber-500" />
                      Contextual Factors
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {profile.contextual_factors?.length > 0 ? (
                      profile.contextual_factors.map((factor, i) => (
                        <div key={i} className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-100 rounded-lg">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-500 mt-0.5 flex-shrink-0" />
                          <p className="text-foreground text-sm">{factor}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-muted-foreground text-sm italic">No significant contextual factors detected with current data.</p>
                    )}
                  </CardContent>
                </Card>
              </motion.div>

              {/* Recommended Domains */}
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                <Card className="border-border shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                      <Target className="w-4 h-4 text-success" />
                      Recommended Assessment Domains
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {profile.recommended_domains?.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {profile.recommended_domains.map((d, i) => (
                          <TagChip key={i} label={d} variant="success" />
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-sm italic">Complete more tabs to receive domain recommendations.</p>
                    )}
                  </CardContent>
                </Card>
              </motion.div>

              {/* Missing Information */}
              {profile.missing_information?.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
                  <Card className="border-border shadow-sm">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                        <HelpCircle className="w-4 h-4 text-muted-foreground" />
                        Missing Information
                      </CardTitle>
                      <p className="text-xs text-muted-foreground">Complete these fields to improve profile confidence.</p>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {profile.missing_information.map((m, i) => (
                          <TagChip key={i} label={m} variant="muted" />
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Reasoning */}
              {profile.reasoning && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                  <Card className="border-border bg-muted/30 shadow-sm">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                        <Info className="w-3 h-3" />
                        Profile Reasoning
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground text-xs leading-relaxed italic">{profile.reasoning}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PageWrapper>
  );
}

// ── Export ─────────────────────────────────────────────────────────────────────

export const dynamic = 'force-dynamic';

export default function AIProfilePage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    }>
      <AIProfileContent />
    </Suspense>
  );
}
