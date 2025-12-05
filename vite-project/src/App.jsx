import { useEffect, useMemo, useState } from 'react';
import { MessageCircle, X } from 'lucide-react';
import CalendarView from './components/Calendar';
import Chatbot from './components/Chatbot';
import ReflectionModal from './components/ReflectionModal';
import { backendAPI } from './api/client';
import './App.css';

function App() {
  const [userId] = useState('G0MG2D3a9ty8jcH9'); // 데모용
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedReflection, setSelectedReflection] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [reflections, setReflections] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadReflections();
  }, [userId]);

  const sortedReflections = useMemo(
    () =>
      [...reflections].sort(
        (a, b) => new Date(b.reflection_date) - new Date(a.reflection_date)
      ),
    [reflections]
  );

  const loadReflections = async () => {
    try {
      setLoading(true);
      const data = await backendAPI.getReflections(userId);
      setReflections(data || []);
    } catch (error) {
      console.error('회고 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDateClick = async (date) => {
    setSelectedDate(date);
    const dateStr = date.toISOString().split('T')[0];
    const reflection = sortedReflections.find(
      (r) => r.reflection_date === dateStr || r.reflection_date?.startsWith(dateStr)
    );

    if (reflection) {
      try {
        const fullReflection = await backendAPI.getReflection(reflection.id, userId);
        setSelectedReflection(fullReflection);
        setAnalysis(null);
      } catch (error) {
        console.error('회고 상세 로드 실패:', error);
        setSelectedReflection(reflection);
        setAnalysis(null);
      }
    } else {
      setSelectedReflection(null);
      setAnalysis(null);
    }
  };

  const handleReflectionCreated = (newReflection) => {
    setReflections((prev) => [...prev, newReflection]);
    setSelectedReflection(newReflection);
    setSelectedDate(new Date(newReflection.reflection_date));
  };

  const runCoachAnalyze = async () => {
    if (!selectedReflection) return;
    try {
      const res = await backendAPI.analyzeReflection({
        userId,
        reflectionId: selectedReflection.id
      });
      setAnalysis(res);
    } catch (err) {
      console.error('코칭 분석 실패:', err);
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <div>
          <h1>LookBack</h1>
          <p className="subtitle">주말 회고, 직관적인 캘린더 + AI 요약/코칭</p>
        </div>
        <div className="header-actions">
          <button className="new-reflection-btn" onClick={() => setIsModalOpen(true)}>
            새 회고 작성
          </button>
          <button className="ghost-btn" onClick={runCoachAnalyze} disabled={!selectedReflection}>
            코칭 받기
          </button>
        </div>
      </header>

      <main className="app-main">
        <div className="left-panel">
          <CalendarView
            userId={userId}
            onDateClick={handleDateClick}
            selectedDate={selectedDate}
          />
          {loading && <div className="loading">불러오는 중...</div>}
          {selectedReflection && (
            <div className="reflection-detail">
              <h3>{selectedReflection.title}</h3>
              <p className="reflection-date">{selectedReflection.reflection_date}</p>
              <div className="reflection-content">{selectedReflection.content}</div>
              {selectedReflection.tags && selectedReflection.tags.length > 0 && (
                <div className="tags">
                  {selectedReflection.tags.map((t) => (
                    <span key={t.id} className="tag-chip">#{t.name}</span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="right-panel">
          <div className="panel-card">
            <div className="panel-head">
              <h3>AI 코칭 요약</h3>
              <span className="muted-sm">BFF → Worker AI</span>
            </div>
            {!selectedReflection && <div className="muted">회고를 선택해주세요.</div>}
            {selectedReflection && !analysis && (
              <div className="muted">코칭 받기를 눌러 분석을 시작하세요.</div>
            )}
            {analysis && (
              <div className="analysis-block">
                <div className="analysis-row">
                  <strong>요약</strong>
                  <p>{analysis.analysis?.summary || '요약 없음'}</p>
                </div>
                <div className="analysis-row">
                  <strong>감정</strong>
                  <p>{analysis.analysis?.sentiment?.label || 'unknown'}</p>
                </div>
                <div className="analysis-row">
                  <strong>추천 태그</strong>
                  <div className="tags">
                    {(analysis.analysis?.suggested_tags || []).map((t, idx) => (
                      <span key={idx} className="tag-chip">#{t.name || t}</span>
                    ))}
                  </div>
                </div>
                <div className="analysis-row">
                  <strong>피드백</strong>
                  <ul className="feedback-list">
                    {(analysis.coaching?.feedback || []).map((line, idx) => (
                      <li key={idx}>{line}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <button
        className="chat-floating-btn"
        onClick={() => setIsChatOpen(!isChatOpen)}
        aria-label="챗봇 열기"
      >
        <span className="icon-default"><MessageCircle size={18} /></span>
        <span className="icon-hover"><X size={18} /></span>
      </button>
      <Chatbot
        userId={userId}
        references={selectedReflection ? [selectedReflection.id] : []}
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
      />

      <ReflectionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        userId={userId}
        onReflectionCreated={handleReflectionCreated}
      />
    </div>
  );
}

export default App;
