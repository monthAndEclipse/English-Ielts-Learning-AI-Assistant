#根据file_path去存储服务获取文件流
import httpx
import json
from app.config import get_settings
from typing import Optional
from app.utils.logger import get_logger
import urllib.parse
import requests

logger =get_logger(__name__)


def download_file_text_from_storage_sync(file_path: str, token: str):
    # 对 file_path 做 URL 编码（尤其是包含斜杠、空格等）
    encoded_path = urllib.parse.quote(file_path, safe="")
    url = f"http://{get_settings().storage_service_container}/v1/storage/download/{encoded_path}"
    headers = {"Authorization": f"Bearer {token}"}
    try:
        response = requests.get(url, headers=headers, timeout=30)
        response.raise_for_status()
        # 获取原始字节内容
        byte_data = response.content
        # 尝试解码为 JSON
        return json.loads(byte_data.decode("utf-8"))
    except requests.HTTPError as e:
        logger.exception(f"[Storage] 请求失败: {e.response.status_code} - {e.response.text}")
        return None
    except Exception as e:
        logger.exception("同步下载失败")
        return None


def upload_file_to_storage_sync(
        token: str,
        file_bytes: bytes,
        filename: str,
        content_type: str = "application/octet-stream"
):
    url = f"http://{get_settings().storage_service_container}/v1/storage/upload"
    headers = {"Authorization": f"Bearer {token}"}
    if not file_bytes or not filename:
        raise ValueError("file_bytes or filename is empty")

    files = {
        "file": (filename, file_bytes, content_type)
    }

    response = requests.post(url, headers=headers, files=files, timeout=30)
    if response.status_code == 200:
        return response.json()
    else:
        logger.exception(f"上传失败详情: {response.status_code} - {response.text}")
        raise Exception(f"上传失败: {response.status_code} - {response.text}")

