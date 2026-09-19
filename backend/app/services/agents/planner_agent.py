"""
Planner Agent
Responsible for breaking down complex tasks into a structured, step-by-step execution plan.
"""

from .base_agent import BaseAgent

class PlannerAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            name="Planner",
            role_description="You are an expert project planner. You break complex user requests into clear, sequential steps.",
            model="gpt-4o",
            temperature=0.2
        )
        
        self.prompt = """
        {role_description}
        
        Given the following complex task, create a detailed step-by-step execution plan.
        Output ONLY the steps as a numbered list. Do not include introductory or concluding text.
        Make each step actionable and specific.

        Task: {task}
        
        Execution Plan:
        """
        
        self.chain = self._build_chain(self.prompt)

    async def execute(self, task: str) -> str:
        """Generate a plan for the given task."""
        return await self.chain.ainvoke({
            "role_description": self.role_description,
            "task": task
        })
