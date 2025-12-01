import { useState } from 'react';
import { backendAPI, workerAPI } from '../api/client';
import './ReflectionModal.css';

export default function ReflectionModal({ isOpen, onClose, userId, onReflectionCreated }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [reflectionDate, setReflectionDate] = useState(new Date().toISOString().split('T')[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

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

      // 2. AI 분석 및 코칭
      const analysis = await backendAPI.analyzeReflection({
        userId,
        reflectionId: reflection.id,
        content,
      });

      // 3. 추천 태그 생성 및 연결
      if (analysis.suggestedTags && analysis.suggestedTags.length > 0) {
        for (const tagName of analysis.suggestedTags) {
          try {
            // 태그가 없으면 생성
            const tags = await workerAPI.getTags();
            let tag = tags.find(t => t.name === tagName);
            
            if (!tag) {
              tag = await workerAPI.createTag({ name: tagName });
            }

            // 회고에 태그 연결
            await workerAPI.attachTag({
              reflectionId: reflection.id,
              tagId: tag.id,
            });
          } catch (err) {
            console.error('태그 연결 실패:', err);
          }
        }
      }

      // 4. 장기 기억 생성 (분석 결과 기반)
      if (analysis.summary) {
        try {
          await workerAPI.createMemory({
            userId,
            memoryType: 'reflection_insight',
            memory: analysis.summary,
            metadata: {
              reflectionId: reflection.id,
              sentiment: analysis.sentiment,
            },
          });
        } catch (err) {
          console.error('장기 기억 생성 실패:', err);
        }
      }

      // 성공
      onReflectionCreated(reflection);
      handleClose();
    } catch (err) {
      setError(err.message || '회고 생성에 실패했습니다.');
    } finally {
      setIsLoading(false);
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

