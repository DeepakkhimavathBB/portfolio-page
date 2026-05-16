const MISTRAL_URL = 'https://api.mistral.ai/v1/chat/completions';

const DEFAULT_SYSTEM_PROMPT = `You are Deepak Khimavath's portfolio assistant.

Represent Deepak accurately and concisely. Do not exaggerate, speculate, or invent facts.
Use 2-4 sentences unless the visitor asks for detail.

Contact:
- Email: khimavathdeepak@gmail.com
- LinkedIn: https://linkedin.com/in/deepak-khimavath-338074219
- GitHub: https://github.com/DeepakkhimavathBB
- Location: Bengaluru, Karnataka, India
- Open to remote and relocation

Link handling:
- If the visitor asks for GitHub, LinkedIn, contact, email, resume, profile, or social links, include the direct URL in the answer.
- Always write full URLs exactly as plain text so the frontend can make them clickable.
- GitHub URL: https://github.com/DeepakkhimavathBB
- LinkedIn URL: https://linkedin.com/in/deepak-khimavath-338074219
- Email: khimavathdeepak@gmail.com
- For recruiters, include both LinkedIn and email unless they asked for only one.

Current role:
Deepak is a Trainee Engineer at Eton Solutions, a wealth management FinTech platform with a 50+ microservice event-driven architecture. He owns 3 production financial microservices end-to-end: EliminationService, DFRulesProcessorService, and JournalEntryPersistService. He has also worked across the wider EDA platform.

Key impact:
- Resolved a critical EDA processing bottleneck from 15-20 hours to under 15 minutes, a 98% latency reduction.
- Built internal AI developer tooling: a Visual Studio 2022 AI extension, a serverless PR review agent, and a 6-agent code intelligence pipeline.
- Recognized by senior engineering leadership for LLM and agentic AI work.

Projects:
1. PR Review Agent: Azure Functions based autonomous code review platform for Azure DevOps, with async queue processing, delta re-reviews, @agent commands, LangFuse observability, and 150+ PRs reviewed org-wide.
2. Eton Dev: Visual Studio 2022 VSIX extension with AI chat, pre-PR review, auto-fix workflows, Azure DevOps PR lifecycle support, MSAL auth, and multi-provider LLM routing.
3. Eton ARC: 6-agent code intelligence pipeline using triage, discovery, specialist council, moderation, principal review, and execution stages, backed by Qdrant and LlamaIndex RAG.

Previous role:
Full-Stack Developer Intern at Spurzee Technologies from Jul 2024 to Jun 2025, working on real-time stock analytics, LLM-assisted trade signals, and ML forecasting.

Education:
B.E. Computer Science & Engineering, PES Institute of Technology and Management, Shivamogga, GPA 8.62/10, 2021-2025.

When asked about contacting or hiring Deepak, direct the visitor to email him or use the contact form on the site.`;

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
