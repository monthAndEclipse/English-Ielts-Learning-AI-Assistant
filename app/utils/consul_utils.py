import consul
from app.utils.logger import get_logger
import threading
import time
from typing import Optional

logger = get_logger(__name__)

class ConsulServiceRegistrar:
    def __init__(
        self,
        service_name: str,
        service_port: int,
        hostname: str ,
        consul_host: str = "consul",
        consul_port: int = 8500,
        config_prefix: str = "app/config/",
        update_interval: int = 59,
    ):
        self.service_name = service_name
        self.service_id = f"{service_name}-{hostname}"
        self.service_port = int(service_port)
        self.consul = consul.Consul(host=consul_host, port=int(consul_port))
        self.hostname = hostname
        self.config_prefix = config_prefix
        self.config = {}
        self.update_interval = update_interval
        self._config_thread: Optional[threading.Thread] = None
        self._stop_event = threading.Event()

    def register_service(self):
        check = consul.Check.tcp(self.hostname, self.service_port, interval="10s")
        self.consul.agent.service.register(
            name=self.service_name,
            service_id=self.service_id,
            address=self.hostname,
            port=self.service_port,
            check=check,
        )
        logger.info(f"[Consul] ✅ 注册服务: {self.service_id} ({self.hostname}:{self.service_port})")

    def deregister_service(self):
        self.consul.agent.service.deregister(self.service_id)
        logger.info(f"[Consul] ❎ 注销服务: {self.service_id}")

    def _load_config_once(self):
        index, keys = self.consul.kv.get(self.config_prefix, recurse=True)
        if not keys:
            logger.warning("[Consul] ⚠️ 未找到配置前缀")
            return
        for item in keys:
            key = item['Key'].replace(self.config_prefix, "")
            val = item['Value'].decode('utf-8') if item['Value'] else None
            self.config[key] = val
        logger.debug(f"[Consul] 🔧 拉取配置成功: {self.config}")

    def start_config_updater(self):
        def loop():
            while not self._stop_event.is_set():
                try:
                    self._load_config_once()
                except Exception as e:
                    logger.error(f"[Consul] ❌ 配置拉取错误: {e}")
                time.sleep(self.update_interval)

        self._config_thread = threading.Thread(target=loop, daemon=True)
        self._config_thread.start()

    def stop(self):
        self._stop_event.set()
        self.deregister_service()


# 全局访问配置（示例）
_global_config: Optional[ConsulServiceRegistrar] = None

def get_config(key: str, default=None):
    if _global_config and key in _global_config.config:
        return _global_config.config[key]
    return default

def set_global_config(cfg: ConsulServiceRegistrar):
    global _global_config
    _global_config = cfg
