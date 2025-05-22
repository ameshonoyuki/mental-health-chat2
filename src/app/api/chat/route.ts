import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

// 環境変数の確認
console.log('API Key:', process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY ? '*** (exists)' : 'MISSING');
console.log('API URL:', process.env.ANTHROPIC_API_URL || 'Using default');

const anthropic = new Anthropic({
  apiKey: process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY || '',
  timeout: 30000, // 30秒のタイムアウトを設定
});

// 簡易的な会話履歴管理
const conversationHistory = new Map<string, Array<{ role: 'user' | 'assistant', content: string }>>();

export async function POST(request: Request) {
  try {
    console.log('Request received at:', new Date().toISOString());
    const body = await request.json();
    console.log('Request body:', JSON.stringify(body, null, 2));
    
    const { messages: messageList, conversationId = 'default' } = body;
    const message = messageList?.[0]?.content || '';
    
    if (!message) {
      console.error('No message provided in request');
      return NextResponse.json(
        { error: 'メッセージがありません' },
        { status: 400 }
      );
    }

    // 会話履歴を取得または初期化
    if (!conversationHistory.has(conversationId)) {
      conversationHistory.set(conversationId, []);
    }
    const history = conversationHistory.get(conversationId)!;

    // ユーザーのメッセージを履歴に追加
    history.push({ role: 'user', content: message });

    // システムプロンプト
    const systemPrompt = `あなたは共感的で親身なメンタルヘルスサポートの専門家です。
ユーザーの気持ちに寄り添い、共感を示しながら、建設的なアドバイスを提供してください。
会話の流れを理解し、自然な会話を心がけてください。`;

    // 会話履歴を考慮したメッセージを作成
    const messages = [
      { role: 'user' as const, content: systemPrompt },
      ...history.slice(-6).map(msg => ({
        role: msg.role === 'user' ? 'user' as const : 'assistant' as const,
        content: msg.content
      }))
    ];

    console.log('Sending to Anthropic:', JSON.stringify(messages, null, 2));

    // APIコール
    const response = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 1000,
      messages: messages,
      temperature: 0.7,
    }).catch(error => {
      console.error('Anthropic API call failed:', {
        error: error.message,
        status: error.status,
        response: error.response?.data,
        stack: error.stack
      });
      throw error;
    });

    const assistantMessage = response.content[0].type === 'text' ? response.content[0].text : '';
    console.log('Received response:', assistantMessage);

    // アシスタントの応答を履歴に追加
    history.push({ role: 'assistant', content: assistantMessage });

    // 会話履歴が長くなりすぎないように制限
    if (history.length > 10) {
      history.splice(0, 2); // 古いメッセージを削除
    }

    return NextResponse.json({ 
      reply: assistantMessage,
      conversationId
    });

  } catch (error: any) {
    console.error('Error in chat API:', {
      message: error.message,
      name: error.name,
      stack: error.stack,
      response: error.response?.data,
      request: error.request
    });
    
    return NextResponse.json(
      { 
        error: 'メッセージの処理中にエラーが発生しました',
        details: error.message || '不明なエラー',
        type: error.name || 'UnknownError',
        // 開発環境でのみ詳細情報を返す
        ...(process.env.NODE_ENV === 'development' ? {
          stack: error.stack,
          fullError: JSON.stringify(error, Object.getOwnPropertyNames(error))
        } : {})
      },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';