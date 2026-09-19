"""
Coordinator Agent
The orchestrator that manages the multi-agent workflow.
It delegates tasks to the Planner, Researcher, Summarizer, and Writer.
"""

import asyncio
from typing import Dict, Any

from .planner_agent import PlannerAgent
from .research_agent import ResearchAgent
from .summarizer_agent import SummarizerAgent
from .writer_agent import WriterAgent

class CoordinatorAgent:
    def __init__(self):
        self.planner = PlannerAgent()
        self.researcher = ResearchAgent()
        self.summarizer = SummarizerAgent()
        self.writer = WriterAgent()

    async def execute(self, task: str) -> Dict[str, Any]:
        """
        Main execution loop for a complex task.
        1. Plan
        2. For each step -> Research -> Summarize
        3. Write final output
        """
        # 1. Planning Phase
        plan = await self.planner.execute(task)
        
        # Parse plan into steps (assuming numbered list from the Planner)
        steps = [step.strip() for step in plan.split("\n") if step.strip() and step[0].isdigit()]
        if not steps:
            # Fallback if the planner didn't number them properly
            steps = [plan]
            
        # 2. Research & Summarize Phase
        # We can run the research for all steps concurrently for speed
        research_tasks = [self.researcher.execute(task, step) for step in steps]
        raw_research = await asyncio.gather(*research_tasks)
        
        # Summarize the raw research concurrently
        summarize_tasks = [self.summarizer.execute(notes) for notes in raw_research]
        summaries = await asyncio.gather(*summarize_tasks)
        
        # Combine summaries
        combined_summaries = "\n\n".join([f"Step {i+1} Summary: {summary}" for i, summary in enumerate(summaries)])
        
        # 3. Writing Phase
        final_output = await self.writer.execute(task, plan, combined_summaries)
        
        return {
            "task": task,
            "plan": plan,
            "steps_executed": len(steps),
            "research_summaries": combined_summaries,
            "final_output": final_output
        }
