"""
Writer Agent
Responsible for generating final, polished output based on plans and summarized research.
"""

from .base_agent import BaseAgent

class WriterAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            name="Writer",
            role_description="You are an expert copywriter, technical writer, and communicator. You take raw plans and research summaries and turn them into beautifully formatted, highly readable final outputs.",
            model="gpt-4o",
            temperature=0.7
        )
        
        self.prompt = """
        {role_description}
        
        You are tasked with writing the final output for a user's request.
        You have been provided with the overall task, the execution plan, and the synthesized research summaries for all steps.
        
        Using this information, generate the final, polished response for the user. 
        Use markdown formatting where appropriate (headings, bullet points, bold text).
        
        User's Task: {task}
        
        Execution Plan: 
        {plan}
        
        Research Summaries:
        {research_summaries}
        
        Final Polished Output:
        """
        
        self.chain = self._build_chain(self.prompt)

    async def execute(self, task: str, plan: str, research_summaries: str) -> str:
        """Write the final polished output based on gathered context."""
        return await self.chain.ainvoke({
            "role_description": self.role_description,
            "task": task,
            "plan": plan,
            "research_summaries": research_summaries
        })
