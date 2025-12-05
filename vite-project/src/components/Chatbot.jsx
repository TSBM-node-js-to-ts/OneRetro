import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { backendAPI } from '../api/client';
import './Chatbot.css';

export default function Chatbot({ userId, references = [], isOpen, onClose }) {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: '안녕하세요! 회고를 기반으로 궁금한 점을 물어보세요.' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  if (!isOpen) return null;

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const question = input.trim();
    setMessages((prev) => [...prev, { role: 'user', content: question }]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await backendAPI.chat({
        userId,
        message: question,
        references,
        topK: 6
      });
      const answer = res?.answer || '응답을 생성하지 못했습니다.';
      setMessages((prev) => [...prev, { role: 'assistant', content: answer }]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `오류: ${error.message}` }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="chatbot-container floating">
      <div className="chatbot-header">
        <h3>AI 챗봇</h3>
        <button className="close-btn" onClick={onClose} aria-label="close chatbot">
          <X size={16} />
        </button>
      </div>
      <div className="chatbot-messages">
        {messages.map((msg, idx) => (
          <div key={idx} className={`message ${msg.role}`}>
            <div className="message-content">{msg.content}</div>
          </div>
        ))}
        {isLoading && (
          <div className="message assistant">
            <div className="message-content">생성 중...</div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSend} className="chatbot-input">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="질문을 입력하세요..."
          disabled={isLoading}
        />
        <button type="submit" disabled={isLoading || !input.trim()}>
          전송
        </button>
      </form>
    </div>
  );
}

