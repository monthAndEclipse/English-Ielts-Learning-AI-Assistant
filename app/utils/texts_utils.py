from typing import List, Dict, Any,Set
import logging
import json

logger = logging.getLogger(__name__)

# 分段函数
def split_json_chunks(max_chars: int, index_and_text: List[Dict[str, Any]]) -> List[List[Dict[str, Any]]]:
    chunks = []
    current_chunk = []
    current_length = 0
    for item in index_and_text:
        item_str = json.dumps(item, ensure_ascii=False)  # 以实际发送的字符串长度为准
        item_length = len(item_str)
        # 如果加上当前 item 会超过最大限制，则新建一个 chunk
        if current_length + item_length > max_chars:
            if current_chunk:
                chunks.append(current_chunk)
            current_chunk = [item]
            current_length = item_length
        else:
            current_chunk.append(item)
            current_length += item_length
    # 把最后一组加进去
    if current_chunk:
        chunks.append(current_chunk)
    return chunks

def format_prompts(chunks: List[List[str]], prompt_template: str) -> List[str]:
    """
    使用prompt模板格式化文本块
    """
    prompts = []

    for chunk in chunks:
        # 将chunk中的文本合并
        combined_text = '\n'.join(chunk)

        # 使用模板格式化
        try:
            formatted_prompt = prompt_template.format(combined_text)
            prompts.append(formatted_prompt)
        except Exception as e:
            logger.error(f"格式化prompt失败: {e}")
            # 使用简单替换作为后备方案
            formatted_prompt = prompt_template.replace('{}', combined_text)
            prompts.append(formatted_prompt)

    logger.info(f"生成 {len(prompts)} 个格式化的prompts")
    return prompts
