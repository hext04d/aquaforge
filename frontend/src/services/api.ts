export const getBaseUrl = () => {
  return process.env.NEXT_PUBLIC_API_URL || (typeof window !== 'undefined' && window.location.port === '3000' ? 'http://localhost:5000' : '');
};

export const checkHealth = async () => {
  const res = await fetch(`${getBaseUrl()}/api/health`);
  if (!res.ok) throw new Error('API Offline');
  return true;
};

export const fetchVisits = async (isNewVisit: boolean = false) => {
  const method = isNewVisit ? 'POST' : 'GET';
  const res = await fetch(`${getBaseUrl()}/api/visits`, { method });
  if (!res.ok) throw new Error('Failed to fetch visits');
  const data = await res.json();
  return data.visits;
};

export const fetchVideoInfo = async (url: string) => {
  const res = await fetch(`${getBaseUrl()}/api/info`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to fetch video info');
  }
  return res.json();
};

export const downloadVideoBlob = async (url: string, format: string, quality: string) => {
  const response = await fetch(`${getBaseUrl()}/api/download`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, format, quality })
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to download video');
  }

  const blob = await response.blob();
  let filename = 'download';
  const disposition = response.headers.get('Content-Disposition');
  if (disposition && disposition.indexOf('attachment') !== -1) {
    const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
    const matches = filenameRegex.exec(disposition);
    if (matches != null && matches[1]) {
      filename = matches[1].replace(/['"]/g, '');
    }
  }

  return { blob, filename };
};
