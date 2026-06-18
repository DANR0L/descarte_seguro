export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const endpoint = 'https://api.adapta.one/skills/019ed83c-00bc-7790-b1ab-f301b8fb3111/invoke';

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req.body),
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: `Adapta ONE API failed: ${response.statusText}` });
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    console.error('Vercel Serverless Function Error:', error);
    return res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
}
