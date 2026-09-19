"""
Base Agent Module
Provides the foundation for all specialized agents.
"""

from typing import Any, Dict
from langchain_openai import ChatOpenAI
from langchain.prompts import PromptTemplate
from langchain.schema.output_parser import StrOutputParser

from app.utils.config import settings

class BaseAgent:
    def __init__(self, name: str, role_description: str, model: str = "gpt-4o", temperature: float = 0.5):
        self.name = name
        self.role_description = role_description
        self.model = model
        self.temperature = temperature
        
        if not settings.OPENAI_API_KEY:
            raise RuntimeError(f"OPENAI_API_KEY not set. Cannot initialize {self.name}.")
            
        self.llm = ChatOpenAI(
            api_key=settings.OPENAI_API_KEY,
            model=self.model,
            temperature=self.temperature
        )

    def _build_chain(self, prompt_template: str):
        """Constructs a LangChain pipeline for the agent."""
        prompt = PromptTemplate.from_template(prompt_template)
        return prompt | self.llm | StrOutputParser()

    async def execute(self, **kwargs) -> str:
        """
        Main entry point for agent execution. 
        Must be implemented by subclasses.
        """
        raise NotImplementedError("Agents must implement the execute() method.")
