const FORMSPREE_URL = 'https://formspree.io/f/xgodgbao';

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
    .slice(-40)
    .map((message) => ({
      role: message.role,
      content: String(message.content || '').slice(0, 3000)
    }));
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return sendJson(res, 405, { error: 'Method not allowed' });
  }

  let body = req.body || {};
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body || '{}');
    } catch {
      return sendJson(res, 400, { error: 'Invalid JSON body' });
    }
  }

  const messages = cleanMessages(body.messages);
  const userTurns = messages.filter((m) => m.role === 'user').length;
  const aiTurns = messages.filter((m) => m.role === 'assistant').length;

  if (!userTurns || !aiTurns) {
    return sendJson(res, 400, { error: 'Transcript needs at least one user and one AI message' });
  }

  const timestamp = new Date().toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    dateStyle: 'medium',
    timeStyle: 'short'
  });
  const reason = String(body.reason || 'conversation_inactive').slice(0, 80);
  const page = String(body.page || '').slice(0, 500);
  const transcript = messages
    .map((m, i) => `${i + 1}. ${m.role.toUpperCase()}\n${m.content}`)
    .join('\n\n---\n\n');

  const form = new URLSearchParams();
  form.set('name', 'Portfolio AI Chat');
  form.set('email', 'deepakkhimavath@gmail.com');
  form.set('_subject', `Portfolio AI chat transcript - ${timestamp}`);
  form.set('source', 'portfolio-ai-chat');
  form.set('reason', reason);
  form.set('timestamp', timestamp);
  form.set('page', page);
  form.set(
    'message',
    `Portfolio AI Chat Transcript\n\nTime: ${timestamp}\nReason: ${reason}\nVisitor turns: ${userTurns}\nAI turns: ${aiTurns}\nPage: ${page}\n\n${transcript}`
  );

  try {
    const upstream = await fetch(FORMSPREE_URL, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: form.toString()
    });

    const responseText = await upstream.text();
    if (!upstream.ok) {
      console.error('Formspree transcript failed:', upstream.status, responseText);
      return sendJson(res, 502, { error: 'Transcript delivery failed' });
    }

    return sendJson(res, 200, { ok: true });
  } catch (error) {
    console.error('Transcript endpoint failed:', error);
    return sendJson(res, 500, { error: 'Transcript endpoint failed' });
  }
};
