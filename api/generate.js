export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { aliKey, imageBase64, imageMime, prompt } = req.body;
    if (!aliKey) return res.status(400).json({ error: '缺少阿里云百炼 API Key' });
    if (!imageBase64 || !prompt) return res.status(400).json({ error: '缺少参数' });

    const dataUrl = `data:${imageMime || 'image/jpeg'};base64,${imageBase64}`;

    const resp = await fetch('https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + aliKey
      },
      body: JSON.stringify({
        model: 'wan2.7-image',
        input: {
          messages: [
            {
              role: 'user',
              content: [
                { text: prompt },
                { image: dataUrl }
              ]
            }
          ]
        },
        parameters: {
          size: '1K',
          n: 1,
          watermark: false
        }
      })
    });

    const data = await resp.json();

    if (!resp.ok) {
      return res.status(resp.status).json({ error: data.message || data.code || JSON.stringify(data) });
    }

    // 提取图片URL：返回结构在 output.choices[0].message.content 中
    let imageUrl = null;
    try {
      const content = data.output.choices[0].message.content;
      for (const item of content) {
        if (item.image) { imageUrl = item.image; break; }
      }
    } catch (e) {}

    if (!imageUrl) return res.status(500).json({ error: '未返回图片，原始返回：' + JSON.stringify(data) });

    res.status(200).json({ url: imageUrl });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
