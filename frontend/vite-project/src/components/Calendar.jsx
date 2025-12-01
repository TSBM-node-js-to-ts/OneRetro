import { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import { format } from 'date-fns';
import { backendAPI } from '../api/client';
import 'react-calendar/dist/Calendar.css';
import './Calendar.css';

export default function CalendarView({ userId, onDateClick, selectedDate }) {
  const [reflections, setReflections] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReflections();
  }, [userId]);

  const loadReflections = async () => {
    try {
      setLoading(true);
      const data = await backendAPI.getReflections(userId);
      setReflections(data || []);
    } catch (error) {
      console.error('회고 로드 실패:', error);
      setReflections([]);
    } finally {
      setLoading(false);
    }
  };

  // 날짜별 회고 개수
  const getReflectionsByDate = (date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return reflections.filter(
      (r) => r.reflection_date === dateStr || r.reflection_date?.startsWith(dateStr)
    );
  };

  // 캘린더 타일 커스터마이징
  const tileContent = ({ date, view }) => {
    if (view === 'month') {
      const count = getReflectionsByDate(date).length;
      if (count > 0) {
        return (
          <div className="reflection-indicator">
            <span className="reflection-count">{count}</span>
          </div>
        );
      }
    }
    return null;
  };

  const handleDateChange = (date) => {
    if (onDateClick) {
      onDateClick(date);
    }
  };

  return (
    <div className="calendar-container">
      <Calendar
        onChange={handleDateChange}
        value={selectedDate}
        tileContent={tileContent}
      />
      {loading && <div className="loading">로딩 중...</div>}
    </div>
  );
}

