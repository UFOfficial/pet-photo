export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { aliKey, imageUrl, styleIndex, taskId } = req.body;
    if (!aliKey) return res.status(400).json({ error: '缺少 API Key' });

    // 查询任务状态
    if (taskId) {
      const poll = await fetch(`https://dashscope.aliyuncs.com/api/v1/tasks/${taskId}`, {
        headers: { 'Authorization': 'Bearer ' + aliKey }
      });
      const data = await poll.json();
      return res.status(200).json(data);
    }

    // 提交新任务
    if (!imageUrl && styleIndex === undefined) return res.status(400).json({ error: '缺少参数' });

    const submitResp = await fetch('https://dashscope.aliyuncs.com/api/v1/services/aigc/image-generation/generation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + aliKey,
        'X-DashScope-Async': 'enable'
      },
      body: JSON.stringify({
        model: 'wanx-style-repaint-v1',
        input: { image_url: imageUrl, style_index: styleIndex }
      })
    });
    const data = await submitResp.json();
    res.status(submitResp.status).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
