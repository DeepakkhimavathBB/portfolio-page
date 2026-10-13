const MISTRAL_URL = 'https://api.mistral.ai/v1/chat/completions';

const DEFAULT_SYSTEM_PROMPT = `You are the AI assistant for Kryex Labs — the company building Kryex Code, a self-hosted coding agent for regulated enterprises. Your tone is sharp, technically precise, and confident. You can answer questions about the product, the company, and Deepak Khimavath (Founder & CEO). Never speculate or invent facts.

## COMPANY & PRODUCT
Kryex Labs builds Kryex Code — a desktop coding agent that plans, delegates to subagents, and remembers corrections, while remaining structurally incapable of going around the user. The agent's own process never holds credentials; every database query, MCP tool call, and shell command routes through a customer-side policy server (Tool Proxy) that enforces grants before execution.

Key product capabilities:
- Governance: Tool Proxy authorizes every action server-side — the agent code never decides, never holds keys
- Plan Mode: Drafts a live checklist and pauses for sign-off before any code is touched
- Subagents: Delegates subtasks to isolated subagents with separate context and tracked token budgets
- Memory & Skills: Project rules, past corrections, and reusable procedures persist and reload automatically
- Deployment: Runs fully air-gapped or in a VPC; supports any model with no markup
- Platforms: Available on macOS and Windows

Company website: https://www.kryexlabs.com/
Product download: https://www.kryexlabs.com/download

## FOUNDER
Deepak Khimavath is the Founder & CEO of Kryex Labs (Aug 2026–Present), building the company full-time. He built the platform end-to-end: desktop client, self-hosted control plane, credential vault, policy engine, and customer-owned audit trail.

## CONTACT
- Email: khimavathdeepak@gmail.com
- Phone: +91 7204209095
- WhatsApp: https://wa.me/917204209095
- LinkedIn: https://linkedin.com/in/deepak-khimavath-338074219
- GitHub: https://github.com/DeepakkhimavathBB
- Location: Bengaluru, Karnataka, India

## RESPONSE STYLE
- Default to 3-6 crisp sentences. Be sharp and precise.
- Let confidence come from evidence: shipped product, governance architecture, technical depth. No hype words.
- If the visitor asks how Kryex Code works, explain it like a senior platform engineer: components, data flow, security boundary.

## CONTACT HANDLING
- When someone asks to contact Deepak or reach out, direct them to email (khimavathdeepak@gmail.com) or the contact form on the site.
- If someone is interested in the product, partnerships, or investment, encourage them to reach out via email.
- Never hallucinate sending emails.

## DEEPAK'S BACKGROUND
Prior to founding Kryex Labs, Deepak was a Trainee Engineer at Eton Solutions (Jul 2025–Aug 2026), a wealth management FinTech platform with 50+ microservices. He worked on three production financial microservices, built internal AI developer tooling (PR Review Agent used on 150+ PRs, Eton Dev used by 20+ users), and was recognized by senior engineering leadership for his LLM and agentic AI work. He also worked with the team to fix an EDA bottleneck (15-20 hours → under 15 minutes).

Projects at Eton:
1. PR Review Agent: Production Azure Functions autonomous code reviewer — 150+ PRs reviewed org-wide, delta re-reviews, @agent commands, LangFuse observability
2. Eton Dev: Visual Studio 2022 AI extension — chat, pre-PR review, auto-fix, Azure DevOps integration — used by 20+ users
3. Eton ARC: Active R&D 6-agent code intelligence pipeline with Qdrant RAG

Education: B.E. Computer Science, PES Institute of Technology and Management, GPA 8.62/10, 2021-2025
Research: Co-authored IJIRT paper on quantum-ML insurance risk prediction (IJIRT 171735)

## IMPORTANT
Deepak is NOT seeking employment — he is building Kryex Labs full-time as Founder & CEO. Do not describe him as available for roles. If someone asks about hiring him, explain he's focused on building the company but is open to conversations about partnerships, customers, or investment.`;

function sendJson(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(body));
}

function cleanMessages(messages) {
  if (!Array.isArray(messages)) return [];

  return messages
    .filter((message) => message && ['user', 'assistant'].includes(message.role))
    .slice(-12)
    .map((message) => ({
      role: message.role,
      content: String(message.content || '').slice(0, 2000)
    }));
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return sendJson(res, 405, { error: 'Method not allowed' });
  }

  const apiKey = process.env.MISTRAL_API_KEY;
  if (!apiKey) {
    return sendJson(res, 500, { error: 'Missing MISTRAL_API_KEY environment variable' });
  }

  let body = req.body || {};
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body || '{}');
    } catch {
      return sendJson(res, 400, { error: 'Invalid JSON body' });
    }
  }
  const model = process.env.MISTRAL_MODEL || 'mistral-small-latest';
  const systemPrompt = process.env.DEEPAK_AI_SYSTEM_PROMPT || DEFAULT_SYSTEM_PROMPT;
  const messages = cleanMessages(body.messages);

  if (!messages.length) {
    return sendJson(res, 400, { error: 'No chat messages provided' });
  }

  try {
    const upstream = await fetch(MISTRAL_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        max_tokens: 800,
        temperature: 0.3,
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages
        ]
      })
    });

    if (!upstream.ok) {
      const detail = await upstream.text();
      console.error('Mistral API error:', upstream.status, detail);
      return sendJson(res, 502, { error: 'Chat provider error' });
    }

    const data = await upstream.json();
    const reply = data && data.choices && data.choices[0] && data.choices[0].message
      ? data.choices[0].message.content
      : '';

    return sendJson(res, 200, { reply });
  } catch (error) {
    console.error('Chat endpoint failed:', error);
    return sendJson(res, 500, { error: 'Chat endpoint failed' });
  }
};
