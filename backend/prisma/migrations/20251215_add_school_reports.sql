-- Add risk category to students
ALTER TABLE students ADD COLUMN risk_category TEXT DEFAULT 'ON_TRACK';
ALTER TABLE students ADD COLUMN last_risk_assessment TIMESTAMP;

-- Create school report snapshots table
CREATE TABLE school_report_snapshots (
  id TEXT PRIMARY KEY,
  school_id TEXT NOT NULL,
  period_type TEXT NOT NULL,
  period_start TIMESTAMP NOT NULL,
  period_end TIMESTAMP NOT NULL,
  
  -- Reach & Coverage
  total_enrolled INTEGER NOT NULL,
  total_screened INTEGER NOT NULL,
  total_supported INTEGER NOT NULL,
  grades_covered TEXT[] NOT NULL,
  
  -- Risk Categories
  high_support_count INTEGER NOT NULL,
  moderate_support_count INTEGER NOT NULL,
  on_track_count INTEGER NOT NULL,
  high_support_reduction DOUBLE PRECISION,
  moderate_support_reduction DOUBLE PRECISION,
  on_track_increase DOUBLE PRECISION,
  
  -- Skill Area Metrics
  reading_readiness_percent DOUBLE PRECISION,
  writing_readiness_percent DOUBLE PRECISION,
  numeracy_readiness_percent DOUBLE PRECISION,
  attention_engagement_percent DOUBLE PRECISION,
  processing_memory_percent DOUBLE PRECISION,
  
  -- Impact Metrics
  total_sessions INTEGER NOT NULL,
  average_improvement JSONB,
  
  -- AI Narratives
  executive_summary TEXT,
  coverage_narrative TEXT,
  impact_narrative TEXT,
  recommendations TEXT,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX idx_school_report_snapshots_school_period ON school_report_snapshots(school_id, period_type, period_start);
CREATE INDEX idx_students_risk_category ON students(risk_category);
CREATE INDEX idx_students_school_status ON students(school_id, status);
