export default async function handler(req, res) {
  const { type, id } = req.query;
  const hfUrl = process.env.HF_API_URL || 'https://stycanine1-tmdb-embed-api.hf.space';
  
  if (!type || !id) {
    return res.status(400).json({ success: false, error: 'Missing type or id' });
  }

  try {
    // Forward all extra query parameters (like season and episode)
    const queryParams = new URLSearchParams(req.query);
    queryParams.delete('type');
    queryParams.delete('id');
    const queryString = queryParams.toString();
    const upstreamUrl = `${hfUrl}/api/streams/${type}/${id}${queryString ? '?' + queryString : ''}`;

    console.log('Fetching upstream from:', upstreamUrl);
    const response = await fetch(upstreamUrl);
    if (!response.ok) {
      return res.status(response.status).json({ success: false, error: 'Upstream error' });
    }
    const data = await response.json();
    return res.status(200).json(data);
  } catch (err) {
    console.error('Error fetching stream:', err);
    return res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
}
