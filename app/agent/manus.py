from typing import List, Optional

from pydantic import Field, model_validator

from app.tool import Terminate, ToolCollection
from app.config import config
from app.schema import Message
from app.prompt.manus import SYSTEM_PROMPT, NEXT_STEP_PROMPT
from app.agent.browser import BrowserContextHelper
from app.agent.toolcall import ToolCallAgent
from app.tool.python_execute import PythonExecute
from app.tool.browser_use_tool import BrowserUseTool
from app.tool.str_replace_editor import StrReplaceEditor


class Manus(ToolCallAgent):
    """A versatile general-purpose agent."""

    name: str = "Manus"
    description: str = (
        "A versatile agent that can solve various tasks using multiple tools"
    )

    system_prompt: str = SYSTEM_PROMPT.format(directory=config.workspace_root)
    next_step_prompt: str = NEXT_STEP_PROMPT

    max_observe: int = 10000
    max_steps: int = 20

    # Add general-purpose tools to the tool collection
    available_tools: ToolCollection = Field(
        default_factory=lambda: ToolCollection(
            PythonExecute(), BrowserUseTool(), StrReplaceEditor(), Terminate()
        )
    )

    special_tool_names: list[str] = Field(default_factory=lambda: [Terminate().name])

    browser_context_helper: Optional[BrowserContextHelper] = None

    @model_validator(mode="after")
    def initialize_helper(self) -> "Manus":
        self.browser_context_helper = BrowserContextHelper(self)
        return self

    async def think(self) -> bool:
        """Process current state and decide next actions with appropriate context."""
        original_prompt = self.next_step_prompt
        recent_messages = self.memory.messages[-3:] if self.memory.messages else []
        browser_in_use = any(
            tc.function.name == BrowserUseTool().name
            for msg in recent_messages
            if msg.tool_calls
            for tc in msg.tool_calls
        )

        if browser_in_use:
            self.next_step_prompt = (
                await self.browser_context_helper.format_next_step_prompt()
            )

        result = await super().think()

        # Restore original prompt
        self.next_step_prompt = original_prompt

        return result

    async def run(self, request: Optional[str] = None) -> str:
        """Execute the agent with cleanup and summarize results when done."""
        try:
            results = await super().run(request)

            # Add a summary of results based on the user's request and tool executions
            if request:
                summary = await self.summarize_results(request)
                return f"{results}\n\n{summary}"

            return results
        finally:
            await self.cleanup()

    async def summarize_results(self, user_request: str) -> str:
        """Generate a summary of the agent's execution based on the user's question and tool results.

        Args:
            user_request: The original user request/question

        Returns:
            A concise summary of what was accomplished and the answer to the user's question
        """
        # Collect tool calls and results from memory
        tool_results = []
        for i, msg in enumerate(self.memory.messages):
            if msg.role == "tool" and i > 0:
                prev_msg = self.memory.messages[i - 1]
                if prev_msg.tool_calls and len(prev_msg.tool_calls) > 0:
                    tool_name = prev_msg.tool_calls[0].function.name
                    tool_results.append(
                        f"Used {tool_name}: {msg.content[:100]}..."
                        if len(msg.content) > 100
                        else msg.content
                    )

        tool_results_context = (
            "\n".join(tool_results[-5:]) if tool_results else "No tools were used."
        )

        # Create a prompt for summarization
        summary_prompt = f"""
        Based on the user's request: "{user_request}"

        I've taken the following actions:
        {tool_results_context}

        Please provide a concise summary of the results and directly answer the user's question.
        """

        # Get a summary from the LLM
        summary_response = await self.llm.ask(
            messages=[Message.user_message(summary_prompt)],
            system_msgs=[
                Message.system_message(
                    "You are a helpful assistant that provides concise summaries of complex tasks."
                )
            ],
        )

        # Handle both cases where summary_response is an object with content attribute or a string
        if isinstance(summary_response, str):
            return f"Summary: {summary_response}"
        elif hasattr(summary_response, "content") and summary_response.content:
            return f"Summary: {summary_response.content}"
        else:
            return "No summary available."

    async def cleanup(self):
        """Clean up Manus agent resources."""
        if self.browser_context_helper:
            await self.browser_context_helper.cleanup_browser()

        await super().cleanup()
