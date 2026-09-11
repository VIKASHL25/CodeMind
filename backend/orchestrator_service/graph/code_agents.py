from langchain_groq import ChatGroq
from langchain_core.messages import SystemMessage,HumanMessage
from .state import AgentState
from datetime import datetime
import json
import os
from dotenv import load_dotenv

load_dotenv()

def get_llm(state: AgentState, temperature: float = 0.2):
    api_key = state.get("api_key") or os.getenv("GROQ_API_KEY")
    return ChatGroq(model="groq/compound-mini", temperature=temperature, api_key=api_key)

def make_code_agent(agent_name: str, system_prompt: str):
    async def agent(state: AgentState) -> AgentState:

        # Skip if not selected
        if agent_name not in state.get("routing_decision", {}).get("agents_to_invoke", []):
            return {}

        code = state.get("code_input", "")
        question = state.get("user_question", "")

        # Step 1: mark as streaming (optional)
        streaming_update = {
            "agent_streams": {
                agent_name: {
                    "status": "streaming",
                    "content": "",
                    "timestamp": datetime.utcnow().isoformat()
                }
            }
        }

        llm = get_llm(state)
        # Call LLM
        response = await llm.ainvoke([
            SystemMessage(content=system_prompt),
            HumanMessage(content=f"Question:{question}\n\nCode:\n'''\n{code}\n'''")
        ])

        content = response.content

        # Step 2: mark as complete
        complete_update = {
            "agent_streams": {
                agent_name: {
                    "status": "complete",
                    "content": content,
                    "timestamp": datetime.utcnow().isoformat()
                }
            }
        }

        # Return ONLY your update (IMPORTANT)
        return complete_update

    return agent
#Defining all code agents
bug_hunter_node=make_code_agent(
    "bug_hunter",
    """You are an expert bug hunter. Analyze the code and:
1. Identify all bugs (logic errors, runtime errors, edge cases)
2. Explain why each is a bug
3. Provide the fixed code
4. Rate severity: Critical / High / Medium / Low
Be specific with line numbers when possible."""
)

code_reviewer_node=make_code_agent(
    "code_reviewer",
    """You are a senior code reviewer. Analyze the code and review:
1. Code quality and readability
2. Design patterns used or missing
3. Performance concerns
4. Best practices violations
5. Suggestions for improvement
Give a quality score out of 10 with justification."""
)


security_auditor_node=make_code_agent(
    "security_auditor",
    """You are a security expert. Audit the code for:
1. Security vulnerabilities (injection, XSS, auth issues)
2. Sensitive data exposure
3. Insecure dependencies or patterns
4. OWASP Top 10 violations
5. Recommended security fixes
Rate each vulnerability: Critical / High / Medium / Low"""
)

        
doc_writer_node=make_code_agent(
    "doc_writer",
    """You are a technical documentation expert. For this code:
1. Write proper docstrings for all functions/classes
2. Generate a README section explaining what the code does
3. Add inline comments for complex logic
4. Document parameters, return types, and exceptions
Return the fully documented version of the code."""
)