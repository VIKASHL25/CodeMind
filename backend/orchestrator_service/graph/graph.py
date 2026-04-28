from langgraph.graph import StateGraph, END
from langgraph.types import Send
from .state import AgentState
from .router import router_node
from .code_agents import (
    bug_hunter_node, code_reviewer_node,
    security_auditor_node, doc_writer_node
)
from .data_agents import (
    data_profile_node, stats_analyst_node,
    insight_agent_node, viz_suggester_node
)
from .synthesizer import syntesizer_node
from dotenv import load_dotenv
load_dotenv()   

AGENT_NODE_MAP = {
    "bug_hunter":bug_hunter_node,
    "code_reviewer":code_reviewer_node,
    "security_auditor":security_auditor_node,
    "doc_writer":doc_writer_node,
    "data_profiler":data_profile_node,
    "stats_analyst":stats_analyst_node,
    "insight_agent":insight_agent_node,
    "viz_suggester":viz_suggester_node,
}

def fan_out(state:AgentState):
    agents=state.get("routing_decision",{}).get("agents_to_invoke",[])
    if not agents:
        return [Send("synthesizer", state)]
    return [Send(agent,state)for agent in agents if agent in AGENT_NODE_MAP]

def build_graph():
    graph=StateGraph(AgentState)
    #adding all the nodes

    graph.add_node("router",router_node)
    for name,fn in AGENT_NODE_MAP.items():
        graph.add_node(name,fn)
    graph.add_node("synthesizer",syntesizer_node)

    #entry here
    graph.set_entry_point("router")
    graph.add_conditional_edges("router",fan_out)

    #all agents to synthesizer node
    for name in AGENT_NODE_MAP:
        graph.add_edge(name,"synthesizer")
    
    #end
    graph.add_edge("synthesizer",END)
    
    return graph.compile()

codemind_graph=build_graph()
