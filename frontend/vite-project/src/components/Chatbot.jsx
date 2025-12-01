import { useState, useRef, useEffect } from 'react';
import { backendAPI } from '../api/client';
import './Chatbot.css';

export default function Chatbot({ userId, reflectionId, reflectionContent }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (reflectionContent) {
      // 회고 내용이 있으면 초기 메시지 추가
      setMessages([
        {
          role: 'assistant',
          content: '안녕하세요! 회고에 대해 궁금한 것이 있으시면 언제든 물어보세요.',
        },
      ]);
    }
  }, [reflectionContent]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
    const question = input;
    setInput('');
    setIsLoading(true);

    try {
      // 챗봇 질문을 분석 API에 전달
      // reflectionContent가 있으면 그것을 분석하고, 없으면 질문 자체를 분석
      const response = await backendAPI.analyzeReflection({
        userId,
        reflectionId: reflectionId || undefined,
        content: reflectionContent || question,
      });

      const assistantMessage = {
        role: 'assistant',
        content: response.coaching || response.summary || response.analysis || '분석 결과를 생성하는 중입니다...',
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage = {
        role: 'assistant',
        content: `죄송합니다. 응답을 생성하는 중 오류가 발생했습니다: ${error.message}`,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="chatbot-container">
      <div className="chatbot-header">
        <h3>AI 코치</h3>
      </div>
      <div className="chatbot-messages">
        {messages.length === 0 && (
          <div className="empty-state">
            회고에 대해 질문해보세요!
          </div>
        )}
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

