/**
 * AI Service - supports OpenAI-compatible and Claude APIs.
 * Set AI_PROVIDER and AI_API_KEY in .env.
 *
 * Supported providers:
 *   openai     -> https://api.openai.com/v1
 *   deepseek   -> https://api.deepseek.com/v1
 *   siliconflow -> https://api.siliconflow.cn/v1
 *   ollama     -> http://localhost:11434/v1 (local)
 *   custom     -> AI_BASE_URL
 */

import { env } from '../../common/env';

type AIMessage = { role: 'system' | 'user' | 'assistant'; content: string };

const PROVIDER = process.env.AI_PROVIDER || 'deepseek';
const API_KEY = process.env.AI_API_KEY || '';
const BASE_URL_MAP: Record<string, string> = {
  openai: 'https://api.openai.com/v1',
  deepseek: 'https://api.deepseek.com/v1',
  siliconflow: 'https://api.siliconflow.cn/v1',
  ollama: 'http://localhost:11434/v1',
};
const BASE_URL = process.env.AI_BASE_URL || BASE_URL_MAP[PROVIDER] || BASE_URL_MAP.deepseek;
const MODEL = process.env.AI_MODEL || (PROVIDER === 'deepseek' ? 'deepseek-chat' : 'gpt-4o-mini');

export async function chat(messages: AIMessage[], options?: { stream?: boolean; temperature?: number; maxTokens?: number }): Promise<string> {
  const response = await fetch(`${BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens ?? 2048,
      stream: false,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`AI API error (${response.status}): ${err}`);
  }

  const data = await response.json() as { choices: Array<{ message: { content: string } }> };
  return data.choices[0]?.message?.content || '';
}

// ---- Prompt Templates ----

export function rewritePrompt(text: string): AIMessage[] {
  return [
    { role: 'system', content: '你是一个专业的学术写作助手。请用学术化的中文改写以下文本，保持原意不变，降低重复率。输出改写后的文本，不要添加额外解释。' },
    { role: 'user', content: `请改写以下文本：\n\n${text}` },
  ];
}

export function summarizePrompt(text: string): AIMessage[] {
  return [
    { role: 'system', content: '你是一个学术助手。请用中文对以下论文内容进行摘要，300字以内，捕捉核心观点。' },
    { role: 'user', content: `请摘要以下内容：\n\n${text}` },
  ];
}

export function resumeSectionPrompt(sectionType: string, context: Record<string, unknown>): AIMessage[] {
  const labels: Record<string, string> = {
    summary: '个人总结',
    experience: '工作经历',
    projects: '项目经验',
    skills: '技能特长',
  };

  let prompt = '';
  switch (sectionType) {
    case 'summary':
      prompt = `请根据以下信息生成一段专业的个人总结（100-150字）：\n${JSON.stringify(context)}`;
      break;
    case 'experience':
      prompt = `请根据以下公司和职位信息，生成3-4条专业的工作经历描述（每条用动词开头）：\n${JSON.stringify(context)}`;
      break;
    case 'projects':
      prompt = `请根据以下项目信息，生成2-3条项目亮点描述：\n${JSON.stringify(context)}`;
      break;
    case 'skills':
      prompt = `根据以下职位信息，推荐8-10项相关技能：\n${JSON.stringify(context)}`;
      break;
    default:
      prompt = `请根据信息生成${labels[sectionType] || '内容'}：\n${JSON.stringify(context)}`;
  }

  return [
    { role: 'system', content: '你是一个专业的简历顾问。请用中文生成简历内容，语言简洁有力，用数据说话。只输出生成的内容，不要添加解释。' },
    { role: 'user', content: prompt },
  ];
}

export function novelContinuePrompt(context: string, style: string): AIMessage[] {
  return [
    { role: 'system', content: `你是一个专业的小说写手。请根据上文和风格要求续写小说内容。风格：${style}。续写要自然流畅，保持人物性格一致。输出续写内容，不要添加解释。` },
    { role: 'user', content: `上文内容：\n\n${context}\n\n请续写接下来的内容（约500字）：` },
  ];
}

export function novelExpandPrompt(scene: string, direction: string): AIMessage[] {
  return [
    { role: 'system', content: '你是一个小说创作顾问。请根据场景和方向要求展开描写，增加细节、对话、心理活动等。只输出展开后的内容。' },
    { role: 'user', content: `场景：${scene}\n\n展开方向：${direction}\n\n请展开描写：` },
  ];
}

export function novelCharacterPrompt(novelInfo: string): AIMessage[] {
  return [
    { role: 'system', content: '你是一个小说人物设计师。请根据小说信息，生成一个有趣的人物设定，包括姓名、性格、背景故事、外貌特征、动机。用JSON格式输出。' },
    { role: 'user', content: `小说信息：${novelInfo}\n\n请生成一个新的人物设定（JSON格式）：\n{\n  "name": "...",\n  "role": "protagonist/antagonist/supporting/other",\n  "description": "...",\n  "attributes": {"age": ..., "gender": "...", "personality": "...", "background": "..."}\n}` },
  ];
}

export function novelBrainstormPrompt(novelInfo: string, type: string): AIMessage[] {
  return [
    { role: 'system', content: '你是一个创意写作顾问。请根据小说信息和需求类型提供创意建议。建议要具体可行。' },
    { role: 'user', content: `小说信息：${novelInfo}\n\n需求类型：${type}\n\n请提供3-5个具体的创意建议：` },
  ];
}
