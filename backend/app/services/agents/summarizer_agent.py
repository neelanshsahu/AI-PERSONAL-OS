"""
Summarizer Agent
Responsible for condensing large amounts of research or text into concise, focused summaries.
"""

from .base_agent import BaseAgent

class SummarizerAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            name="Summarizer",
            role_description="You are an expert editor and summarizer. You take verbose research or raw data and condense it into clear, concise, and highly readable summaries.",
            model="gpt-4o-mini",
            temperature=0.3
        )
        
        self.prompt = """
        {role_description}
        
        Please summarize the following research notes. Focus only on the most critical actionable items, key facts, and core concepts. 
        Remove any fluff or repetitive statements.
        
        Raw Research Notes:
        {research_notes}
        
        Concise Summary:
        """
        
        self.chain = self._build_chain(self.prompt)

    async def execute(self, research_notes: str) -> str:
        """Summarize research notes."""
        return await self.chain.ainvoke({
            "role_description": self.role_description,
            "research_notes": research_notes
        })
