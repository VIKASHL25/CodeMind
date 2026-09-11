from langchain_groq import ChatGroq
from langchain_core.messages import SystemMessage,HumanMessage
from .state import AgentState
from datetime import datetime
import json
import os
from dotenv import load_dotenv

load_dotenv()

def get_llm(state: AgentState, temperature: float = 0.3):
    api_key = state.get("api_key") or os.getenv("GROQ_API_KEY")
    return ChatGroq(model="groq/compound", temperature=temperature, api_key=api_key)

async def syntesizer_node(state:AgentState)->AgentState:
    agent_outputs=[]
    for agent_name, stream_data in state.get("agent_streams",{}).items():
        if stream_data["status"]=="complete" and stream_data["content"]:
            agent_outputs.append(f"==={agent_name.upper().replace('_',' ')}===\n{stream_data['content']}")

    combined="\n\n".join(agent_outputs)
    mode=state.get("mode","code")
    question=state.get("user_question","")

    direct_response = state.get("routing_decision", {}).get("direct_response")
    if direct_response:
        return {**state, "final_response": direct_response}


    improved_code_section = ""
    requirements_section = ""
    additional_section = ""

    if mode == "code":
        lang = state.get("language", "python")
        improved_code_section = f"""## Improved Code
```{lang}
<fully corrected production-ready code in {lang}>
```"""

        requirements_section = """
### IMPROVED CODE REQUIREMENTS (MANDATORY):
- Handle null / None inputs
- Handle empty inputs
- Validate input types
- Cover edge cases
- Use try-except for safety
- Avoid security vulnerabilities
- Sanitize inputs
- Ensure all return paths exist
- No hardcoded secrets
- Follow best practices
"""

        additional_section = """
### ADDITIONAL REQUIREMENTS:
- Follow PEP8 conventions
- Keep code clean and modular
- Do NOT include explanation inside code
- Code must be directly runnable
"""

    system = f"""
You are a senior {'software engineer' if mode == 'code' else 'data analyst'}.

Multiple specialized agents have analyzed the {'code' if mode == 'code' else 'data'}.

Your task is to synthesize their outputs into a FINAL, PRODUCTION-READY response.

----------------------------------------

OBJECTIVES:

1. Summarize EACH agent's contribution briefly
2. Provide precise, non-redundant actionable fixes
3. {"Generate a COMPLETE, production-ready improved version of the code" if mode == "code" else "Provide final structured insights"}

----------------------------------------

OUTPUT FORMAT (STRICT):

## Agent Summary
- <Agent Name>: <max 30 words summary>

## {"Key Fixes" if mode == "code" else "Data Insights"}
- <clear actionable fix>

{improved_code_section}

----------------------------------------

STRICT ENGINEERING RULES:

- One bullet per agent (no merging)
- No repetition
- Use exact agent names
- Be concise and technical

{requirements_section}

{additional_section}

----------------------------------------

INTELLIGENCE RULES:

- If agents miss something important → YOU must add it
- If user asks for "improved code" → ALWAYS generate full code
- Prefer correctness over brevity
- Avoid generic suggestions — be concrete

----------------------------------------

IMPORTANT:

- Output ONLY the specified sections
- Do NOT add extra explanations
"""
    llm = get_llm(state)
    response=await llm.ainvoke([
        SystemMessage(content=system),
        HumanMessage(content=f"User question: {question}\n\nAgent findings:\n{combined}")
    ])

    return {**state, "final_response":response.content}

