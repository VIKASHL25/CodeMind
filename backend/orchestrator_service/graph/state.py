from typing import Optional,TypedDict,Annotated
from datetime import datetime

class AgentStreamData(TypedDict):
    status:str   #idel | streaming | complete | error
    content:str   
    timestamp:str  #last updated

class AgentState(TypedDict):
    #INput
    user_question:str
    mode:str     #code/data
    code_input:Optional[str] #pasted code
    csv_data:Optional[str]
    csv_filname:Optional[str]

    #Routing
    routing_decision:dict  
    llm_reasoning:str

    #agent stream
    def merge_dicts(a, b):
        return {**a, **b}

    agent_streams: Annotated[dict, merge_dicts]
    #Final response
    chart_configs:list
    pandas_code:str
    final_response:str
    


    