from typing import List, Dict, Any,Set
import logging
import json

logger = logging.getLogger(__name__)

def split_json_chunks(texts: List[str],max_chars: int) -> List[List[str]]:
    chunks = []
    current_chunk = []
    current_length = 0

    for text in texts:
        text_str = json.dumps(text, ensure_ascii=False)  # 模拟真实发送长度
        text_length = len(text_str)

        if current_length + text_length > max_chars:
            if current_chunk:
                chunks.append(current_chunk)
            current_chunk = [text]
            current_length = text_length
        else:
            current_chunk.append(text)
            current_length += text_length

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
        json_array_str = json.dumps(chunk, ensure_ascii=False)

        # 使用模板格式化
        try:
            formatted_prompt = prompt_template.format(json_array_str)
            prompts.append(formatted_prompt)
        except Exception as e:
            logger.error(f"格式化prompt失败: {e}")
            # 使用简单替换作为后备方案
            formatted_prompt = prompt_template.replace('{}', json_array_str)
            prompts.append(formatted_prompt)

    logger.info(f"生成 {len(prompts)} 个格式化的prompts")
    return prompts
