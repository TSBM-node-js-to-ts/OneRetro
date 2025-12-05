-- Coach 분석 결과 보관 테이블
CREATE TABLE IF NOT EXISTS coach_analyses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    reflection_id INTEGER NOT NULL,
    result_json TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_coach_analyses_user ON coach_analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_coach_analyses_reflection ON coach_analyses(reflection_id);

