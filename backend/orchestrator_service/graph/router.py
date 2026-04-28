from langchain_groq import ChatGroq
from langchain_core.messages import SystemMessage,HumanMessage
from .state import AgentState
from datetime import datetime
import json
import os
from dotenv import load_dotenv
import re
load_dotenv()

def get_llm(state: AgentState, temperature: float = 0.1):
    api_key = state.get("api_key") or os.getenv("GROQ_API_KEY")
    return ChatGroq(model="llama-3.3-70b-versatile", temperature=temperature, api_key=api_key)

CODE_AGENTS=["bug_hunter","code_reviewer","security_auditor","doc_writer"]
DATA_AGENTS=["data_profiler","stats_analyst","insight_agent","viz_suggester"]
async def router_node(state: AgentState) -> AgentState:
    mode = state["mode"]
    question = state["user_question"]

    agents = CODE_AGENTS if mode == "code" else DATA_AGENTS

    system = f"""You are an orchestrator that decides which specialized agents to invoke.
Available agents for {mode} mode: {agents}

Agent descriptions:
CODE MODE:
- bug_hunter: finds bugs and suggests fixes
- code_reviewer: reviews code quality and patterns
- security_auditor: finds security vulnerabilities
- doc_writer: generates documentation and docstrings

DATA MODE:
- data_profiler: analyzes data shape, nulls, types, basic stats
- stats_analyst: finds distributions, outliers, statistical patterns
- insight_agent: finds correlations, trends, business insights
- viz_suggester: suggests and creates chart configurations

IMPORTANT RULES:
- If user asks for bugs → include bug_hunter
- If user asks for review → include code_reviewer
- If user asks for security → include security_auditor
- If user says "no documentation" → DO NOT include doc_writer
- Prefer multiple agents if multiple intents exist
- CRITICAL: If the question is ambiguous, general chit-chat, or completely unrelated to code analysis or data analysis (e.g. "hi", "how are you", "what is the capital of France"), DO NOT invoke any agents. Set "agents_to_invoke" to an empty array [] and provide a polite "direct_response" replying to the user.

Respond ONLY with valid JSON like:
{{
"agents_to_invoke": ["agent1", "agent2"],
"reason": "why these agents were chosen",
"direct_response": "Optional polite reply if question is completely unrelated"
}}"""

    human = f"User question:{question}"

    if mode == "code":
        human += f"\n\nCode:\n{state.get('code_input','')[:2000]}"
    else:
        human += f"\n\nCSV preview:\n{state.get('csv_data','')[:1000]}"

    llm = get_llm(state)
    response = await llm.ainvoke([
        SystemMessage(content=system),
        HumanMessage(content=human)
    ])
    # print("\n=== RAW LLM RESPONSE ===\n")
    # print(response.content)
    # ✅ Always parse safely


    raw = response.content.strip()

    # ✅ Remove markdown ```json ... ```
    clean = raw.replace("```json", "").replace("```", "").strip()

    try:
        decision = json.loads(clean)
    except:
        # fallback extraction (extra safety)
        match = re.search(r"\{.*\}", clean, re.DOTALL)
        if match:
            try:
                decision = json.loads(match.group())
            except:
                decision = {"agents_to_invoke": agents, "reason": "fallback"}
        else:
            decision = {"agents_to_invoke": agents, "reason": "fallback"}

    # ✅ Optional: enforce rule-based correction (VERY IMPORTANT)
    q = question.lower()
    
    # Do not force agents if the LLM explicitly decided to route it as a direct_response
    if not decision.get("direct_response"):
        forced_agents = []

        if "bug" in q:
            forced_agents.append("bug_hunter")
        if "review" in q:
            forced_agents.append("code_reviewer")
        if "security" in q:
            forced_agents.append("security_auditor")
        if "document" in q and "not" not in q:
            forced_agents.append("doc_writer")

        if forced_agents:
            decision["agents_to_invoke"] = list(set(forced_agents))

    # ✅ Initialize streams ALWAYS
    agent_streams = {}
    for agent in decision["agents_to_invoke"]:
        agent_streams[agent] = {
            "status": "idle",
            "content": "",
            "timestamp": datetime.utcnow().isoformat()
        }

    # ✅ ALWAYS RETURN STATE
    return {
        **state,
        "routing_decision": decision,
        "llm_reasoning": decision["reason"],
        "agent_streams": agent_streams,
        "pandas_code": "",
        "final_response": ""
    }