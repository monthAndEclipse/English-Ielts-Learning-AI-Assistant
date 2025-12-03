from fastapi import FastAPI
from app.api.v1.task_api import router as task_router
import logging
import os
import sys
import socket
import uvicorn
from fastapi.staticfiles import StaticFiles
from pathlib import Path
from starlette.responses import FileResponse
from app.api.v1.user_config_api import router as config_router
from contextlib import asynccontextmanager
import webbrowser
from fastapi.middleware.cors import CORSMiddleware

logger = logging.getLogger(__name__)
def base_path() -> Path:
    """
    项目根路径：
    - 普通 python 运行：项目目录
    - PyInstaller --onefile：_MEIPASS
    """
    if getattr(sys, "frozen", False):
        return Path(sys._MEIPASS)
    return Path(__file__).resolve().parents[1]  # ← 回到项目根

BASE_DIR = base_path()
FRONTEND_DIR = BASE_DIR / "frontend" / "out"
STATIC_DIR = BASE_DIR / "app" / "static"


@asynccontextmanager
async def lifespan(app: FastAPI):
    port = getattr(app.state, "port", None)  # 获取 port，如果没设置返回 None
    if port is not None:
        print("\nEnglish Learning Tool Started Successfully!")
        print(f"Open in browser: http://127.0.0.1:{port}\n")
        webbrowser.open(f"http://127.0.0.1:{port}")

    yield

    print("English Learning Tool Is Shutting Down...")



app = FastAPI(lifespan=lifespan,docs_url=None,redoc_url=None)

# 1. 挂载静态资源
app.mount(
    "/_next",
    StaticFiles(directory=FRONTEND_DIR / "_next"),
    name="nextjs-static"
)
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

#路由设置
app.include_router(task_router, prefix="/api/v1", tags=["task"])
app.include_router(config_router, prefix="/api/v1",tags=["config"])

# 跨域配置
origins = [
    "http://localhost:3000",  # 前端地址
    "http://127.0.0.1:3000",  # 本地开发时可能用到
    "*",  # 如果想允许所有来源，可以用 "*"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,  # 允许跨域的域名
    allow_credentials=True,
    allow_methods=["*"],    # 允许所有方法 GET, POST, PUT, DELETE...
    allow_headers=["*"],    # 允许所有请求头
)

# 2. 处理前端路由（非常重要）
@app.get("/{full_path:path}")
async def serve_frontend(full_path: str):
    """
    所有非 API 路由交给 Next.js 的 index.html
    """
    index_file = FRONTEND_DIR / "index.html"
    if index_file.exists():
        return FileResponse(index_file)
    return {"error": "frontend not found"}


# -------------------------
# 端口检测（防止重复启动）
# -------------------------
def port_in_use(port: int) -> bool:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        return s.connect_ex(("127.0.0.1", port)) == 0


# -------------------------
# 程序入口
# -------------------------
def print_banner(port: int):
    print("=" * 52)
    print(" ENGLISH LEARNING TOOL STARTING ")
    print("=" * 52)
    print(f" • Port        : {port}")
    print(" • Mode        : Production (exe)")
    print("=" * 52)

def find_available_port(start_port: int, max_tries: int = 20) -> int:
    port = start_port
    for _ in range(max_tries):
        if not port_in_use(port):
            return port
        port += 1
    raise RuntimeError("No available port found")

if __name__ == "__main__":
    START_PORT = 8080

    PORT = find_available_port(START_PORT)
    app.state.port = PORT  # ✅ 这一句非常关键！！
    print_banner(PORT)
    if port_in_use(PORT):
        print(f"[INFO] Port {PORT} already in use, exit")
        sys.exit(0)

    uvicorn.run(
        app,
        host="127.0.0.1",      # ✅ 非常重要
        port=PORT,
        log_level="error",    # ✅ 避免命令行刷屏
        access_log=False,
        reload=False
    )


# uvicorn app.main:app --reload
# pip freeze > requirements.txt
#pyinstaller --onefile  --icon=D:/project/EnglishDesktopExe/py-Enlgish-support-backend/english.ico --add-data "app/static;app/static" --add-data "frontend/out;frontend/out" --add-data "app/config/settings.yml;config" --name English_Learning_Tool --hidden-import=uvicorn.protocols.http --hidden-import=uvicorn.protocols.websockets --hidden-import=uvicorn.lifespan.on app/main.py
