#!/usr/bin/env python
import asyncio
import websockets
import threading
import time, datetime
import json
import argparse
from datetime import datetime
from flask import Flask, request

WEBSOCKET_CONNECTIONS = set()
LOG_FILE="instantsend.log"
time_last_client_udpate = None
stop_loop = False

DASH_CLIENTS = []

client_info = []
instant_send_duration = []
quorum_info = []



# function inserts client info into list or updates if information for client already exists
def insert_or_replace_client_info(arr, el):
    # address is used to identify client since it is assumed to be unique
    temp_arr = arr.copy()
    replaced = False
    for index, entry in enumerate(arr):
        if entry["address"] == el["address"]:
           temp_arr[index] = el 
           replaced = True # flag set if replaced
           break
    # if not replaced, just append client info
    if not replaced:
        temp_arr.append(el)
    return temp_arr


# init flask server 
app = Flask(__name__, static_url_path="")

@app.route('/')
def index():
    # return index.html
    return app.send_static_file('index.html')

# define route
@app.route('/set_client_info', methods=['POST'])
def set_client_info():
    global client_info
    global quorum_info
    data = request.json
    # if all required keys exist
    if not {"ip", "masternode", "masternode_status", "mean_latency"}.issubset(set(data.keys())): 
        return {"state": "missing values"}, 400
    
    # create temporary object
    temp_client_data = {
        "address": data["ip"],
        "masternode": data["masternode"],
        "masternode_status": data["masternode_status"],
        "mean_latency": data["mean_latency"],
        "timestamp": int(time.time())
    } 

    if "quorum" in data.keys():
        quorum_info = data["quorum"]

    if "instantsend" in data.keys():
        try:
            instant_send_duration.append({"timestamp": data["instantsend"].get("timestamp"), "value": data["instantsend"].get("confirmation_duration")})
            if len(instant_send_duration) > 100:
                instant_send_duration.pop(0)
        except Exception as e:
            print(f"Failed to parse instant send duration: {e}")
    # insert or replace and update client_info reference to new list
    client_info = insert_or_replace_client_info(client_info, temp_client_data)
    return {"state": "success"}, 200





# def update_quorum_loop():
#     global quorum_info
#     while not stop_loop:
#         # get quorum info
#         try:
#             quorum_info = dash_data_utils.get_quorum_info(DASH_CLIENTS[0])
#             print(f"Quorum info updated. We have {len(quorum_info)} quorums")
#         except Exception as e:
#             print(f"Quorum info failed: {e}")
#         time.sleep(30)

async def register(websocket):
    WEBSOCKET_CONNECTIONS.add(websocket)
    try:
        print("New client connected:", websocket)
        await websocket.wait_closed()
    finally:
        WEBSOCKET_CONNECTIONS.remove(websocket)


async def show_time():
    global time_last_client_udpate
    while not stop_loop:
        # update dash node informatoion
        if len(WEBSOCKET_CONNECTIONS) > 0 and (not time_last_client_udpate or time.time() - time_last_client_udpate > 5):
            time_last_client_udpate = time.time()
            payload = {
                "clients": client_info,
                "instantsend": instant_send_duration,
                "quorum": quorum_info
            }
            print("Broadcasting status to clients")
            websockets.broadcast(WEBSOCKET_CONNECTIONS, json.dumps(payload))
        await asyncio.sleep(1)


async def main():
 
    # Start websocket server
    async with websockets.serve(register, "", 5678):
        await show_time()


if __name__ == "__main__":
    try:
        threading.Thread(target=lambda: app.run(host="0.0.0.0", port=5000, debug=True, use_reloader=False)).start()
        asyncio.run(main())
    except KeyboardInterrupt:
        print("Stopping loop")
        stop_loop = True
