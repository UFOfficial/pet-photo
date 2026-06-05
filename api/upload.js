export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { image, imgbbKey } = req.body;
    if (!image || !imgbbKey) return res.status(400).json({ error: '缺少参数' });

    const form = new URLSearchParams();
    form.append('image', image);

    const resp = await fetch(`https://api.imgbb.com/1/upload?key=${imgbbKey}`, {
      method: 'POST',
      body: form,
    });
    const data = await resp.json();
    if (!data.success) throw new Error(data.error?.message || 'imgbb上传失败');
    res.status(200).json({ url: data.data.url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
