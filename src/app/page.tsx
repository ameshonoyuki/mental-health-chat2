'use client';

import { useState } from 'react';

type Message = {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
};

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId] = useState(() => `conv-${Date.now()}`);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      role: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messages: [{ role: 'user', content: input }],
          conversationId: conversationId
        }),
      });

      const data = await response.json();
      
      if (!response.ok) throw new Error(data.error || 'エラーが発生しました');

      const assistantMessage: Message = {
        id: `msg-${Date.now()}`,
        content: data.reply,
        role: 'assistant',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error:', error);
      alert(`エラーが発生しました: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ 
      maxWidth: '800px', 
      margin: '0 auto', 
      padding: '20px',
      fontFamily: 'sans-serif',
      display: 'flex',
      flexDirection: 'column',
      height: '100vh'
    }}>
      <h1 style={{ 
        fontSize: '24px', 
        fontWeight: 'bold', 
        marginBottom: '20px',
        textAlign: 'center'
      }}>
        メンタルヘルスサポート
      </h1>
      
      <div style={{ 
        flex: 1,
        overflowY: 'auto',
        marginBottom: '20px',
        padding: '10px',
        border: '1px solid #e0e0e0',
        borderRadius: '8px'
      }}>
        {messages.length === 0 ? (
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '100%',
            color: '#666'
          }}>
            メッセージを入力して会話を始めましょう
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              style={{ 
                margin: '10px 0',
                padding: '10px 15px',
                borderRadius: '15px',
                maxWidth: '80%',
                alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                backgroundColor: msg.role === 'user' ? '#e3f2fd' : '#f5f5f5',
                marginLeft: msg.role === 'assistant' ? '0' : 'auto',
                marginRight: msg.role === 'user' ? '0' : 'auto',
                border: '1px solid #e0e0e0'
              }}
            >
              <div>{msg.content}</div>
              <div style={{ 
                fontSize: '0.8em', 
                color: '#666', 
                marginTop: '5px',
                textAlign: 'right'
              }}>
                {msg.timestamp.toLocaleTimeString()}
              </div>
            </div>
          ))
        )}
      </div>

      <form 
        onSubmit={handleSubmit}
        style={{ 
          display: 'flex', 
          gap: '10px',
          marginTop: 'auto'
        }}
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          style={{ 
            flex: 1, 
            padding: '12px 15px',
            borderRadius: '20px',
            border: '1px solid #ddd',
            fontSize: '16px',
            outline: 'none',
            boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
          }}
          placeholder="メッセージを入力..."
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading}
          style={{ 
            padding: '0 25px',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '20px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: 'bold',
            transition: 'background-color 0.2s',
            opacity: isLoading ? 0.7 : 1
          }}
          onMouseOver={e => {
            if (!isLoading) e.currentTarget.style.backgroundColor = '#2563eb';
          }}
          onMouseOut={e => {
            e.currentTarget.style.backgroundColor = '#3b82f6';
          }}
        >
          {isLoading ? '送信中...' : '送信'}
        </button>
      </form>
    </div>
  );
}