import { useState } from 'react';
import { backendAPI, workerAPI } from '../api/client';
import './ReflectionModal.css';

export default function ReflectionModal({ isOpen, onClose, userId, onReflectionCreated }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [reflectionDate, setReflectionDate] = useState(new Date().toISOString().split('T')[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isGeneratingTitle, setIsGeneratingTitle] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setError('제목과 내용을 입력해주세요.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // 1. 회고 생성
      const reflection = await backendAPI.createReflection({
        userId,
        title,
        content,
        reflection_date: reflectionDate,
      });

      onReflectionCreated(reflection);
      handleClose();
    } catch (err) {
      setError(err.message || '회고 생성에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateTitle = async () => {
    if (!content.trim()) {
      setError('내용을 먼저 입력해주세요.');
      return;
    }
    setIsGeneratingTitle(true);
    setError(null);
    try {
      const res = await backendAPI.generateTitle({ content });
      if (res?.title) {
        setTitle(res.title);
      }
    } catch (err) {
      setError(err.message || '제목 생성에 실패했습니다.');
    } finally {
      setIsGeneratingTitle(false);
    }
  };

  const handleClose = () => {
    setTitle('');
    setContent('');
    setReflectionDate(new Date().toISOString().split('T')[0]);
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>새 회고 작성</h2>
          <button className="close-btn" onClick={handleClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="reflection-form">
          <div className="form-group">
            <label>제목</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="회고 제목을 입력하세요"
              disabled={isLoading}
            />
            <button
              type="button"
              className="secondary-btn"
              onClick={handleGenerateTitle}
              disabled={isLoading || isGeneratingTitle}
            >
              {isGeneratingTitle ? '생성 중...' : '제목 자동 생성'}
            </button>
          </div>

          <div className="form-group">
            <label>날짜</label>
            <input
              type="date"
              value={reflectionDate}
              onChange={(e) => setReflectionDate(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label>내용</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="오늘 하루를 돌아보며 회고를 작성해보세요..."
              rows={10}
              disabled={isLoading}
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="form-actions">
            <button type="button" onClick={handleClose} disabled={isLoading}>
              취소
            </button>
            <button type="submit" disabled={isLoading}>
              {isLoading ? '저장 중...' : '저장'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}



