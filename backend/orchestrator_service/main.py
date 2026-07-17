from fastapi import FastAPI, WebSocket, WebSocketDisconnect, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from graph.graph import codemind_graph
from graph.state import AgentState
import json
from datetime import datetime

app=FastAPI(title="CodeMind")

import os

CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:5173,https://your-app.vercel.app").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)

#REST endpoints -analyse code

@app.post("/analyze/code")
async def analyse_code(question:str=Form(...),code:str=Form(...)):
    api_key=None
    state:AgentState={
        "user_question":question,
        "mode":"code",
        "api_key":api_key,
        "language":"python", # default for REST
        "code_input":code,
        "csv_data":None,
        "csv_filename":None,
        "routing_decision":{},
        "llm_reasoning":"",
        "agent_streams":{},
        "chart_configs":[],
        "pandas_code":"",
        "final_response":""
    }
    result=await codemind_graph.ainvoke(state)
    return result

#analyse csv
@app.post("/analyze/data")
async def analyse_data(question:str=Form(...),file:UploadFile=File(...)):
    contents=await file.read()
    csv_str=contents.decode("utf-8")
    api_key=None
    state:AgentState={
        "user_question":question,
        "mode":"data",
        "api_key":api_key,
        "language":None,
        "code_input":None,
        "csv_data":csv_str,
        "csv_filename":file.filename,
        "routing_decision":{},
        "llm_reasoning":"",
        "agent_streams":{},
        "chart_configs":[],
        "pandas_code":"",
        "final_response":""
    }
    result=await codemind_graph.ainvoke(state)
    return result

#Wesocket streamning agent updates live
@app.websocket("/ws/analyze")
async def ws_analyse(websocket:WebSocket):
    await websocket.accept()
    try:
        #recerinvg data from the frontend
        raw=await websocket.receive_text()
        data=json.loads(raw)
        mode=data.get("mode","code")
        question=data.get("question","")
        code=data.get("code","")
        csv_data=data.get("csv_data","")
        filename=data.get("filename","data.csv")
        
        api_key=data.get("api_key", None)
        lang=data.get("language", "python")
        
        state:AgentState={
                "user_question":question,
                "mode":mode,
                "api_key":api_key,
                "language":lang if mode=="code" else None,
                "code_input":code if mode=="code" else None,
                "csv_data":csv_data if mode=="data" else None,
                "csv_filename":filename,
                "routing_decision":{},
                "llm_reasoning":"",
                "agent_streams":{},
                "chart_configs":[],
                "pandas_code":"",
                "final_response":""
            }
        
        #send intial status
        await websocket.send_json({"type":"status","message":"Starting analysis..."})
        sent_agents = set()
        #stream through nodes
        async for event in codemind_graph.astream(state):
            for node_name,node_state in event.items():
                #router finsihed
                if node_name == "router" and node_state:
                    await websocket.send_json({
                        "type":"routing",
                        "agents":node_state.get("routing_decision",{}).get("agents_to_invoke",[]),
                        "reason":node_state.get("llm_reasoning","")
                    })
                #agent finished
                if "agent_streams" in node_state:
                    streams = node_state.get("agent_streams", {})

                    for agent, stream_data in streams.items():
                        if (
                            stream_data.get("status") == "complete"
                            and agent not in sent_agents
                        ):
                            sent_agents.add(agent)

                            await websocket.send_json({
                                "type": "agent_complete",
                                "agent": agent,
                                "content": stream_data.get("content", ""),
                                "timestamp": stream_data.get("timestamp")
                            })
                #Charts genrated
                if node_state.get("chart_configs"):
                    await websocket.send_json({
                        "type":"charts",
                        "chart_configs":node_state["chart_configs"],
                        "pandas_code":node_state.get("pandas_code","")
                    })                   
                
                #final response
                if node_state.get("final_response"):
                    await websocket.send_json({
                        "type":"final",
                        "response":node_state["final_response"]
                    })
        await websocket.send_json({"type": "done"})                  
    except WebSocketDisconnect:
        print("Client disconnected")
    except Exception as e:
        print("ERROR:", e)  
        await websocket.send_json({
            "type": "error",
            "message": str(e)
        })
                



