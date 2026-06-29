'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import toast from '@/lib/toast';
import { useIntakeForm } from '@/hooks/useAssessments';
import { useStudent } from '@/hooks/useStudents';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { motion } from 'motion/react';
import { ArrowRight, Brain, AlertTriangle, Users, Clock, Activity, Info, ChevronRight } from 'lucide-react';
import Link from 'next/link';

// ── Types ──────────────────────────────────────────────────────────────────────

interface ReferralFormData {
  referralSource:    string[];
  referralAreas:     string[];
  durationOfConcern: string;
  severityOfConcern: string;
}

const REFERRAL_SOURCES = [
  { id: 'PARENT',           label: 'Parent / Guardian' },
  { id: 'TEACHER',          label: 'Teacher' },
  { id: 'SCHOOL',           label: 'School Administration' },
  { id: 'PEDIATRICIAN',     label: 'Pediatrician / Doctor' },
  { id: 'PSYCHOLOGIST',     label: 'Psychologist' },
  { id: 'SPECIAL_EDUCATOR', label: 'Special Educator' },
];

const REFERRAL_AREAS = [
  { id: 'READING',          label: 'Reading' },
  { id: 'WRITING',          label: 'Writing' },
  { id: 'MATH',             label: 'Mathematics' },
  { id: 'ATTENTION',        label: 'Attention / Focus' },
  { id: 'BEHAVIOUR',        label: 'Behaviour' },
  { id: 'SPEECH',           label: 'Speech / Language' },
  { id: 'SCHOOL_READINESS', label: 'School Readiness' },
];

const DURATION_OPTIONS = [
  { value: 'LESS_THAN_6_MONTHS', label: 'Less than 6 months' },
  { value: '6_TO_12_MONTHS',     label: '6 – 12 months' },
  { value: '1_TO_2_YEARS',       label: '1 – 2 years' },
  { value: 'MORE_THAN_2_YEARS',  label: 'More than 2 years' },
];

const SEVERITY_OPTIONS = [
  { value: 'MILD',     label: 'Mild — minimal impact on day-to-day functioning' },
  { value: 'MODERATE', label: 'Moderate — noticeable impact on learning and functioning' },
  { value: 'SEVERE',   label: 'Severe — significant impact requiring immediate support' },
];

// ── Page Content ───────────────────────────────────────────────────────────────

function ReferralPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const studentId = searchParams.get('studentId') || '';

  const { student } = useStudent(studentId);
  const { intakeForm, createIntakeForm, updateIntakeForm } = useIntakeForm(studentId || undefined);

  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<ReferralFormData>({
    referralSource:    [],
    referralAreas:     [],
    durationOfConcern: '',
    severityOfConcern: '',
  });

  // Pre-fill if intake form already has referral data
  useEffect(() => {
    if (intakeForm) {
      setFormData({
        referralSource:    (intakeForm as any).referralSource    || [],
        referralAreas:     (intakeForm as any).referralAreas     || [],
        durationOfConcern: (intakeForm as any).durationOfConcern || '',
        severityOfConcern: (intakeForm as any).severityOfConcern || '',
      });
    }
  }, [intakeForm]);

  // ── Helpers ─────────────────────────────────────────────────────────────────

  const toggleArray = (field: 'referralSource' | 'referralAreas', value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter(v => v !== value)
        : [...prev[field], value],
    }));
  };

  // ── Submit ───────────────────────────────────────────────────────────────────

  const handleContinue = async () => {
    if (formData.referralSource.length === 0) {
      toast.error('Please select at least one referral source.');
      return;
    }
    if (formData.referralAreas.length === 0) {
      toast.error('Please select at least one area of concern.');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        studentId,
        referralSource:    formData.referralSource,
        referralAreas:     formData.referralAreas,
        durationOfConcern: formData.durationOfConcern || null,
        severityOfConcern: formData.severityOfConcern || null,
      };

      if (intakeForm) {
        await updateIntakeForm({ id: intakeForm.id, data: payload as any });
      } else {
        await createIntakeForm(payload);
      }

      toast.success('Referral information saved');
      router.push(`/educator/intake?studentId=${studentId}`);
    } catch (err) {
      console.error('Referral save error:', err);
      toast.error('Failed to save referral information. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────────

  if (!studentId) {
    return (
      <PageWrapper
        title="Referral Information"
        description="Record who referred the child and the areas of concern"
        breadcrumbs={[{ label: 'Educator' }, { label: 'Intake', href: '/educator/intake' }, { label: 'Referral' }]}
      >
        <Card className="max-w-md mx-auto text-center p-8 border-border shadow-sm">
          <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-4" />
          <h2 className="text-lg font-semibold mb-2">No Student Selected</h2>
          <p className="text-muted-foreground text-sm mb-6">Please select a student before filling out the referral form.</p>
          <Link href="/educator/students">
            <Button variant="outline">Go to Students</Button>
          </Link>
        </Card>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper
      title="Referral Information"
      description={student ? `Recording referral details for ${student.fullName}` : 'Record who referred the child and the areas of concern'}
      breadcrumbs={[
        { label: 'Educator' },
        { label: 'Intake', href: `/educator/intake?studentId=${studentId}` },
        { label: 'Referral' },
      ]}
    >
      <div className="max-w-3xl space-y-6">

        {/* Step indicator */}
        <div className="flex items-center gap-2">
          {['Referral', 'Intake Form', 'AI Profile'].map((step, i) => (
            <React.Fragment key={step}>
              <div className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                  i === 0 ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'
                }`}>
                  {i + 1}
                </div>
                <span className={`text-sm font-medium ${i === 0 ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {step}
                </span>
              </div>
              {i < 2 && <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />}
            </React.Fragment>
          ))}
        </div>

        {/* Advisory notice */}
        <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl">
          <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-blue-800">
            Referral information is the first input to the AI Intake Profile. The profile is advisory only and is
            not a clinical diagnosis — it helps guide pre-assessment planning.
          </p>
        </div>

        {/* Section A: Referral Source */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <Card className="border-border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2 text-foreground">
                <Users className="w-4 h-4 text-primary" />
                Who referred the child?
                <span className="text-destructive ml-1 text-sm">*</span>
              </CardTitle>
              <p className="text-sm text-muted-foreground">Select all that apply.</p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {REFERRAL_SOURCES.map(src => (
                  <label
                    key={src.id}
                    htmlFor={`referral-source-${src.id}`}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all text-sm ${
                      formData.referralSource.includes(src.id)
                        ? 'border-primary bg-primary/10 text-foreground font-medium'
                        : 'border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground'
                    }`}
                  >
                    <Checkbox
                      id={`referral-source-${src.id}`}
                      checked={formData.referralSource.includes(src.id)}
                      onCheckedChange={() => toggleArray('referralSource', src.id)}
                      className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                    />
                    {src.label}
                  </label>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Section B: Areas of Concern */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="border-border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2 text-foreground">
                <Activity className="w-4 h-4 text-primary" />
                Areas of concern
                <span className="text-destructive ml-1 text-sm">*</span>
              </CardTitle>
              <p className="text-sm text-muted-foreground">Select all areas where difficulties have been observed.</p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {REFERRAL_AREAS.map(area => (
                  <label
                    key={area.id}
                    htmlFor={`referral-area-${area.id}`}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all text-sm ${
                      formData.referralAreas.includes(area.id)
                        ? 'border-primary bg-primary/10 text-foreground font-medium'
                        : 'border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground'
                    }`}
                  >
                    <Checkbox
                      id={`referral-area-${area.id}`}
                      checked={formData.referralAreas.includes(area.id)}
                      onCheckedChange={() => toggleArray('referralAreas', area.id)}
                      className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                    />
                    {area.label}
                  </label>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Section C & D: Duration + Severity */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="grid grid-cols-1 sm:grid-cols-2 gap-4"
        >
          <Card className="border-border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2 text-foreground">
                <Clock className="w-4 h-4 text-primary" />
                Duration of concern
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Select
                value={formData.durationOfConcern}
                onValueChange={val => setFormData(p => ({ ...p, durationOfConcern: val }))}
              >
                <SelectTrigger id="duration-of-concern">
                  <SelectValue placeholder="Select duration…" />
                </SelectTrigger>
                <SelectContent>
                  {DURATION_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <Card className="border-border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2 text-foreground">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                Severity of concern
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Select
                value={formData.severityOfConcern}
                onValueChange={val => setFormData(p => ({ ...p, severityOfConcern: val }))}
              >
                <SelectTrigger id="severity-of-concern">
                  <SelectValue placeholder="Select severity…" />
                </SelectTrigger>
                <SelectContent>
                  {SEVERITY_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex items-center justify-between pt-2 border-t border-border"
        >
          <Link href={studentId ? `/educator/intake?studentId=${studentId}` : '/educator/intake'}>
            <Button variant="outline">← Back to Intake Form</Button>
          </Link>
          <Button
            id="referral-continue-btn"
            onClick={handleContinue}
            disabled={isSaving}
            className="gap-2 bg-primary hover:bg-primary/90"
          >
            {isSaving ? 'Saving…' : 'Continue to Intake Form'}
            {!isSaving && <ArrowRight className="w-4 h-4" />}
          </Button>
        </motion.div>
      </div>
    </PageWrapper>
  );
}

// ── Export ─────────────────────────────────────────────────────────────────────

export const dynamic = 'force-dynamic';

export default function ReferralPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    }>
      <ReferralPageContent />
    </Suspense>
  );
}
