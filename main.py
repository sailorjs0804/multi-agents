import time
import asyncio
from pathlib import Path

import uvicorn

from app.logger import logger
from app.agent.manus import Manus


def ensure_directories():
    # 创建templates目录
    templates_dir = Path("app/web/templates")
    templates_dir.mkdir(parents=True, exist_ok=True)

    # 创建static目录
    static_dir = Path("app/web/static")
    static_dir.mkdir(parents=True, exist_ok=True)

    # 确保__init__.py文件存在
    init_file = Path("app/web/__init__.py")
    if not init_file.exists():
        init_file.touch()


async def main():
    agent = Manus()
    try:
        prompt = input("Enter your prompt: ")
        if not prompt.strip():
            logger.warning("Empty prompt provided.")
            return

        logger.warning("Processing your request...")
        await agent.run(prompt)
        logger.info("Request processing completed.")
    except KeyboardInterrupt:
        logger.warning("Operation interrupted.")


if __name__ == "__main__":
    s_time = time.time()
    prompt = "help me plan a trip to Japan"
    # agent = Manus()
    # asyncio.run(agent.run(prompt))
    uvicorn.run("app.web.app:app", host="0.0.0.0", port=9000, reload=True)
