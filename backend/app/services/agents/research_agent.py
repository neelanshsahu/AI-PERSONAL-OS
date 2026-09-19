"""
Research Agent
Responsible for gathering information, generating search queries, or extracting facts based on a given topic or step.
"""

from .base_agent import BaseAgent

class ResearchAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            name="Researcher",
            role_description="You are an expert researcher. You analyze tasks and extract the key information, context, and actionable facts required to complete them.",
            model="gpt-4o",
            temperature=0.4
        )
        
        self.prompt = """
        {role_description}
        
        You have been given a specific step from a larger project plan. 
        Your goal is to "research" this step by outlining the necessary facts, data points, or context needed to execute it properly.
        (Since you do not have live web access, synthesize the best known information and outline what the execution needs).
        
        Overall Project Task: {overall_task}
        Current Step to Research: {step}
        
        Research Notes & Key Information:
        """
        
        self.chain = self._build_chain(self.prompt)

    async def execute(self, overall_task: str, step: str) -> str:
        """Generate research notes for a specific step."""
        return await self.chain.ainvoke({
            "role_description": self.role_description,
            "overall_task": overall_task,
            "step": step
        })
