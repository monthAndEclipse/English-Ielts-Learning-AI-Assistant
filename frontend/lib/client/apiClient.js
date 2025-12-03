export async function postJson(base_url, endpoint, data,) {
  const response = await fetch(`${base_url}${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json" 
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`请求失败: ${response.status} - ${errorText}`);
  }

  return response.json();
}


export async function getWithParams(base_url, endpoint, params,) {
  const query = new URLSearchParams(params).toString();
  const url = `${base_url}${endpoint}?${query}`;


  const response = await fetch(url, {
    method: "GET",
    headers: headers,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`请求失败: ${response.status} - ${errorText}`);
  }

  return response.json();
}
