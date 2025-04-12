import time
import asyncio

from app.logger import logger
from app.agent.manus import Manus


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
    finally:
        # Ensure agent resources are cleaned up before exiting
        await agent.cleanup()


if __name__ == "__main__":
    # asyncio.run(main())
    s_time = time.time()
    # prompt = "help me plan a trip to Japan"
    prompt = "Tell me a interesting story"
    agent = Manus()
    asyncio.run(agent.run(prompt))
    e_time = time.time()
    logger.info(f"Request processed in {e_time - s_time:.2f} seconds")
