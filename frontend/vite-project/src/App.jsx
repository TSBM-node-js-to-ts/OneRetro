import { useState, useEffect } from 'react';
import CalendarView from './components/Calendar';
import Chatbot from './components/Chatbot';
import ReflectionModal from './components/ReflectionModal';
import { backendAPI } from './api/client';
import './App.css';

function App() {
  const [userId] = useState('user-1'); // 임시 사용자 ID
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedReflection, setSelectedReflection] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [reflections, setReflections] = useState([]);

  useEffect(() => {
    loadReflections();
  }, [userId]);

  const loadReflections = async () => {
    try {
      const data = await backendAPI.getReflections(userId);
      setReflections(data || []);
    } catch (error) {
      console.error('회고 로드 실패:', error);
    }
  };

  const handleDateClick = async (date) => {
    setSelectedDate(date);
    // 해당 날짜의 회고 찾기
    const dateStr = date.toISOString().split('T')[0];
    const reflection = reflections.find(
      (r) => r.reflection_date === dateStr || r.reflection_date?.startsWith(dateStr)
    );
    
    if (reflection) {
      try {
        const fullReflection = await backendAPI.getReflection(reflection.id, userId);
        setSelectedReflection(fullReflection);
      } catch (error) {
        console.error('회고 상세 로드 실패:', error);
        setSelectedReflection(reflection);
      }
    } else {
      setSelectedReflection(null);
    }
  };

  const handleReflectionCreated = (newReflection) => {
    setReflections((prev) => [...prev, newReflection]);
    setSelectedReflection(newReflection);
    setSelectedDate(new Date(newReflection.reflection_date));
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>LookBack - 회고 플랫폼</h1>
        <button className="new-reflection-btn" onClick={() => setIsModalOpen(true)}>
          새 회고 작성
        </button>
      </header>

      <main className="app-main">
        <div className="left-panel">
          <CalendarView
            userId={userId}
            onDateClick={handleDateClick}
            selectedDate={selectedDate}
          />
          {selectedReflection && (
            <div className="reflection-detail">
              <h3>{selectedReflection.title}</h3>
              <p className="reflection-date">{selectedReflection.reflection_date}</p>
              <div className="reflection-content">{selectedReflection.content}</div>
            </div>
          )}
        </div>

        <div className="right-panel">
          <Chatbot
            userId={userId}
            reflectionId={selectedReflection?.id}
            reflectionContent={selectedReflection?.content}
          />
        </div>
      </main>

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
