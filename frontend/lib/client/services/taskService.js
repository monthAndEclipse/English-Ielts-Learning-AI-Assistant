import {
  getWithParams,
  postJson,
} from "../apiClient";
import endpoints from "../endpoints";


// 1. 生成文章 & 标记词
export async function start({ type, subtype, language, domain, subdomain ,question_type}) {
  const task_req = {
    type,
    subtype,
    language,
    domain,
    subdomain,
    question_type
  };
  return postJson(endpoints.base_url, endpoints.task_start, task_req);
}

// 2. 批改答案
export async function submit({ type, subtype, language, original_article, answers,question_type }) {
  const submit_req = {
    type,
    subtype,
    language,
    original_article,
    question_type,
    answers // { A: "...", B: "..." }
  };
  return postJson(endpoints.base_url, endpoints.task_correction, submit_req);
}


export async function getTaskDataDetail({ task_id, token }) {
  const url = new URL(`${endpoints.base_url}${endpoints.query_service_api.task_detail}/${task_id}`);
  // 添加 ?task_id=xxx 查询参数
  const response = await fetch(url.toString(), {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`请求失败: ${response.status} - ${errorText}`);
  }
  return response.json();
}
