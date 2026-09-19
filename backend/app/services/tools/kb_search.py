"""
Knowledge Base Search Tool
Uses the existing RAG pipeline to search the user's uploaded documents.
"""

from langchain.tools import tool
from typing import Optional

# We will need the user_id context to perform this search securely.
# LangChain tools by default don't have access to request context unless passed in.
# We will create a factory function to generate this tool bound to a specific user.

def get_kb_search_tool(user_id: str, db):
    """Factory to inject user_id and db client into the tool."""
    
    @tool
    def search_knowledge_base(query: str) -> str:
        """
        Search the user's personal knowledge base (uploaded documents and PDFs).
        Use this tool when the user asks about their own files, notes, or specific documents.
        """
        from app.services.rag_service import get_embeddings
        
        try:
            embeddings_model = get_embeddings()
            query_vector = embeddings_model.embed_query(query)
            
            res = db.rpc(
                "match_document_chunks",
                {
                    "query_embedding": query_vector,
                    "user_id_filter": user_id,
                    "match_count": 3,
                    "min_similarity": 0.2
                }
            ).execute()
            
            chunks = res.data
            if not chunks:
                return "No relevant information found in the knowledge base."
                
            summaries = []
            for i, chunk in enumerate(chunks):
                src = chunk.get("metadata", {}).get("source", "Unknown")
                page = chunk.get("metadata", {}).get("page", "?")
                summaries.append(f"Document: {src} (Page {page})\nContent: {chunk['content']}")
                
            return "\n\n---\n\n".join(summaries)
            
        except Exception as e:
            return f"Error searching knowledge base: {str(e)}"

    return search_knowledge_base
