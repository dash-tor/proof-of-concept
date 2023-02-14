import requests
import time
import json
import subprocess
import sys
import os
import random

INSTANTSEND_FREQUENCY = 60 # seconds
STATUS_UPDATE_FREQUENCY = 60 # seconds

QUORUM_TYPES = {
    "llmq_50_60": 1,
    "llmq_400_60": 2,
    "llmq_400_85": 3,
    "llmq_100_67": 4,
    "llmq_60_75": 5,
    "llmq_test": 100,
    "llmq_devnet": 101,
    "llmq_test_v17": 102,
    "llmq_test_dip0024": 103,
    "llmq_test_instantsend": 104,
    "llmq_devnet_dip0024": 105
}



# Check if backend server address is provided
if len(sys.argv) < 2:
    print("Usage: python3 send_client_status.py <backend_server_address>")
    sys.exit(1)
# Read backend server address from args
api_url = sys.argv[1]
api_url = api_url.removesuffix("/") + "/set_client_info"
instantsend_enabled = False

last_update_timestamp = 0
last_instantsend_timestamp = 0
outstanding_instantsend_txid = None
instantsend_result = {
    "timestamp": None,
    "txid": None,
    "confirmation_duration": None,
}
own_address = None
# Check if we are a running on a masternoe via environment variable MASTERNODE=True
if "MASTERNODE" in os.environ:
    if os.environ["MASTERNODE"].lower() == "true":
        # Disable instant send because the masternode does not have a wallet
        print("Disabling InstantSend because we are running on a masternode")
        instantsend_enabled = False
    else:
        instantsend_enabled = True




def instantSendCheck():
    global last_update_timestamp
    global last_instantsend_timestamp
    global outstanding_instantsend_txid
    global own_address

    # Check if we have a outstanding transaction
    if outstanding_instantsend_txid:
        # Check if the transaction is locked
        tx_lock_res = runCliCommand(f"gettransaction {outstanding_instantsend_txid}")
        tx_lock_res = json.loads(tx_lock_res)
        if tx_lock_res["instantlock"]:
            # Calculate the time it took to lock the transaction
            time_diff = time.time() - last_instantsend_timestamp
            # Update the result
            instantsend_result["timestamp"] = last_instantsend_timestamp
            instantsend_result["txid"] = outstanding_instantsend_txid
            instantsend_result["confirmation_duration"] = time_diff
            # Reset the last_instantsend_txid
            outstanding_instantsend_txid = None
            print(f"InstantSend transaction {outstanding_instantsend_txid} locked in {time_diff} seconds")
        # Check if transaction is older than INSTANTSEND_FREQUENCY
        elif time.time() - last_instantsend_timestamp > INSTANTSEND_FREQUENCY:
            # Reset the last_instantsend_txid
            print(f"InstantSend transaction {outstanding_instantsend_txid} timed out")
            # Save 0 as confirmation duration to indicate a timeout
            instantsend_result["timestamp"] = last_instantsend_timestamp
            instantsend_result["txid"] = outstanding_instantsend_txid
            instantsend_result["confirmation_duration"] = None
            outstanding_instantsend_txid = None
            

    # Check if we have to create a new transaction and send it
    if not outstanding_instantsend_txid and time.time() - last_update_timestamp >= INSTANTSEND_FREQUENCY:
        # Check if we know our own address
        if not own_address:
            # Get our own address
            own_address = runCliCommand("getnewaddress")
        # Check if we have enough balance
        balance = runCliCommand("getbalance")
        if float(balance) < 10:
            # Not enough balance to send a transaction. Generate some blocks
            print("Not enough balance to send a transaction. Generating some blocks")
            runCliCommand("generatetoaddress 2 " + own_address)
            # Set instantsend timestamp to now+ 60 seconds to wait for the transaction to be confirmed
            last_instantsend_timestamp = time.time() + 60
            return
        # Send a transaction
        outstanding_instantsend_txid = runCliCommand(f"sendtoaddress {own_address} {(random.random()*10):.2f}")
        # Set instantsend timestamp to now
        last_instantsend_timestamp = time.time()
        print(f"InstantSend transaction {outstanding_instantsend_txid} created")

        


def runCliCommand(cmd):
    cmd = f"dash-cli {cmd}".split(" ")
    result = subprocess.run(cmd, check=False, capture_output=True, text=True)

    if result.stdout:
        return result.stdout.rstrip()
    
    raise Exception(f"ERROR: RPC command {cmd} failed with error: {result.stderr}")

def sendClientStatus(data):
    response = requests.post(api_url, json = data)
    if response.status_code == 200:
        return True
    return False

def get_quorum_info():
    # Get quorum info
    quorum_list = runCliCommand("quorum list")
    quorum_list = json.loads(quorum_list)
    res = []
    # Loop through quorum types
    for quorum_type in quorum_list.keys():
        quorum = quorum_list[quorum_type]
        # Lookup quorum type id
        quorum_type_id = QUORUM_TYPES[quorum_type.lower()]
        # Loop through quorum hashes in type
        for hash in quorum:
            # Lookup quorum info
            quorum_info = runCliCommand(f"quorum info {quorum_type_id} {hash}")
            quorum_info = json.loads(quorum_info)
            # Add quorum info to result
            res.append(
                {"type": quorum_type,
                 "hash": hash,
                 "members": [member["service"] for member in quorum_info["members"]]
                 })
    return res



def getClientStatus():
    data = {
            "ip": None,
            "masternode": None,
            "masternode_status": None,
            "mean_latency": None,
            "quorum": None
        }

    # masternode status
    try:
        masternode_status_res = runCliCommand("masternode status")
        data["masternode"] = True
        data["masternode_status"] = json.loads(masternode_status_res)["state"]
    except Exception as e:
        data["masternode_status"] = None
        data["masternode"] = False
    
    try:
        networkinfo_res = json.loads(runCliCommand("getnetworkinfo"))
        data["ip"] = networkinfo_res["localaddresses"][0]["address"] 
    except Exception as e:
        print(f"Error getting node address: {e}")
    
    # Get quorum info
    data["quorum"] = get_quorum_info()


    return data

def statusUpdate():
    global last_update_timestamp
    # Check if we need to send a status update
    if last_update_timestamp + STATUS_UPDATE_FREQUENCY < time.time():

        data = getClientStatus()
        # Check if there is a new instant send result
        if instantsend_result["timestamp"]:
            data["instantsend"] = instantsend_result.copy()
            # Clear the result
            instantsend_result["timestamp"] = None
            instantsend_result["txid"] = None
            instantsend_result["confirmation_duration"] = None
        last_update_timestamp = time.time()
        print(f"Sending status update: {data}")
        send_flag = sendClientStatus(data)
        print("updated") if send_flag else print("error during update")

def main():
    print("Starting status reporting script")
    while True:
        try:
            if instantsend_enabled:
                instantSendCheck()
            statusUpdate()
        except Exception as e:
            print(e)
        time.sleep(0.3)


if __name__ == "__main__":
    main()
