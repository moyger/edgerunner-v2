import requests
from fastapi import APIRouter, HTTPException

router = APIRouter()

FLEX_BASE_URL = "https://www.interactivebrokers.com/Universal/servlet/FlexWebService"

@router.get("/api/ibkr/flex/send")
def send_flex_query(token: str, query_id: str):
    url = f"{FLEX_BASE_URL}/SendRequest"
    params = {
        "t": token,
        "q": query_id,
        "v": 3  # version
    }
    response = requests.get(url, params=params)
    if response.status_code != 200:
        raise HTTPException(status_code=response.status_code, detail="SendRequest failed")
    return response.text  # XML with <ReferenceCode>

@router.get("/api/ibkr/flex/retrieve")
def get_flex_report(token: str, refcode: str):
    url = f"{FLEX_BASE_URL}/GetStatement"
    params = {
        "t": token,
        "q": refcode,
        "v": 3
    }
    response = requests.get(url, params=params)
    if response.status_code != 200:
        raise HTTPException(status_code=response.status_code, detail="GetStatement failed")
    return response.text  # XML report
