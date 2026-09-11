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
    return ChatGroq(model="openai/gpt-oss-120b", temperature=temperature, api_key=api_key)

async def data_profile_node(state:AgentState)->AgentState:
    if "data_profiler" not in state.get("routing_decision",{}).get("agents_to_invoke",[]):
        return {}
    
    streams=dict(state.get("agent_streams",{}))
    streams["data_profiler"]={"status":"streaming","content":"","timestamp":datetime.utcnow().isoformat()}

    csvdata=state.get("csv_data","")
    question=state.get("user_question","")

    llm = get_llm(state)
    response=await llm.ainvoke([
        SystemMessage(content="""You are a data profiling expert. Analyze the CSV data and provide:
1. Dataset shape (rows, columns)
2. Column names and their data types
3. Missing values per column
4. Basic statistics (min, max, mean, median) for numeric columns
5. Unique value counts for categorical columns
6. Data quality issues found
Be precise and structured in your analysis."""),
        HumanMessage(content=f"Question: {question}\n\nCSV Data:\n{csvdata[:3000]}")
    ])


    streams["data_profiler"]={"status":"complete","content":response.content,"timestamp":datetime.utcnow().isoformat()}

    return {"agent_streams": {"data_profiler": streams["data_profiler"]}}


async def stats_analyst_node(state:AgentState)->AgentState:
    if "stats_analyst" not in state.get("routing_decision",{}).get("agents_to_invoke",[]):
        return {}
    
    streams=dict(state.get("agent_streams",{}))
    streams["stats_analyst"]={"status":"streaming","content":"","timestamp":datetime.utcnow().isoformat()}
    
    llm = get_llm(state)
    response=await llm.ainvoke([
        SystemMessage(content="""You are a statistical analysis expert. Analyze the data and identify:
1. Distributions of key columns (normal, skewed, bimodal?)
2. Outliers and anomalies with specific values
3. Statistical correlations between columns
4. Trends over time if date columns exist
5. Key statistical findings the user should know
Use statistical terminology but explain clearly."""),
        HumanMessage(content=f"Question: {state['user_question']}\n\nCSV Data:\n{state.get('csv_data','')[:3000]}")
    ])

    streams["stats_analyst"]={"status":"complete","content":response.content,"timestamp":datetime.utcnow().isoformat()}

    return {"agent_streams": {"stats_analyst": streams["stats_analyst"]}}


async def insight_agent_node(state:AgentState)->AgentState:
    if "insight_agent" not in state.get("routing_decision", {}).get("agents_to_invoke", []):
        return {}

    streams=dict(state.get("agent_streams",{}))
    streams["insight_agent"]={"status":"streaming","content":"","timestamp":datetime.utcnow().isoformat()}

    llm = get_llm(state)
    response=await llm.ainvoke([
        SystemMessage(content="""You are a business intelligence expert. From this data:
1. Identify the top 3-5 business insights
2. Find hidden patterns or correlations
3. Identify what's performing well vs poorly
4. Suggest actionable recommendations
5. Predict likely trends based on the data
Think like a business analyst presenting to executives."""),
        HumanMessage(content=f"Question: {state['user_question']}\n\nCSV Data:\n{state.get('csv_data','')[:3000]}")
    ])

    streams["insight_agent"]={
        "status":"complete",
        "content":response.content,
        "timestamp":datetime.utcnow().isoformat()
    }
    return {"agent_streams": {"insight_agent": streams["insight_agent"]}}


async def viz_suggester_node(state:AgentState)->AgentState:
    if "viz_suggester" not in state.get("routing_decision",{}).get("agents_to_invoke",[]):
        return {}

    streams=dict(state.get("agent_streams",{}))
    streams["viz_suggester"]={"status":"streaming","content":"","timestamp":datetime.utcnow().isoformat()}

    llm = get_llm(state)
    response=await llm.ainvoke([
        SystemMessage(content="""You are a data visualization expert.
Based on the user question and data, generate:

1. CHART CONFIGURATIONS as JSON array (for React Recharts rendering)
2. PANDAS CODE to reproduce the analysis

Respond ONLY with this exact JSON structure:
{
  "charts":[
    {
      "chart_type":"line|bar|pie|scatter|histogram",
      "title":"Chart title",
      "description":"What this chart shows",
      "x_key":"column_name_for_x",
      "y_key":"column_name_for_y",
      "data":[{"x_key_value":...,"y_key_value":...}]
    }
  ],
  "pandas_code":"import pandas as pd\\n# full working pandas code here",
  "summary": "Brief text explanation of the visualizations"
}

Generate 2-3 charts maximum. Make data realistic based on the CSV."""),
        HumanMessage(content=f"Question: {state['user_question']}\n\nCSV Data:\n{state.get('csv_data','')[:3000]}\nFilename: {state.get('csv_filename','data.csv')}")
    ])

    
    content=response.content
    chart_configs=[]
    pandas_code=""
    summary=""

    try:
        # Clean response — remove markdown fences if present
        clean=content.replace("```json","").replace("```","").strip()
        parsed=json.loads(clean)
        chart_configs=parsed.get("charts",[])
        pandas_code=parsed.get("pandas_code","")
        summary=parsed.get("summary","")
    except:                                                                 
        summary=content

    streams["viz_suggester"]={
        "status":"complete",
        "content":summary,
        "timestamp":datetime.utcnow().isoformat()
    }

    return {
        "agent_streams": {
            "viz_suggester": streams["viz_suggester"]
        },
        "chart_configs": chart_configs,
        "pandas_code": pandas_code
    }
