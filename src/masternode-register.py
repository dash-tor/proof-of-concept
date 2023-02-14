""" 
This script calls the masternode api to register the masternode and adds the bls private key to the dash.conf
"""
import requests
import sys
import time

# read url and log path from args
URL_MN_API = sys.argv[1]
DASH_CONF = sys.argv[2]
DASH_LOG = sys.argv[3]

def getOnionAddrSimple(file: str, port = None) -> str:
    with open(file) as debuglog:
        for line in debuglog:
            if("Got service ID") in line:
                addr = line.split(" ")[-1].rstrip()
                print("Got Onion Adress:", addr)
                return addr
    print("No onion address found - stopping!")
    sys.exit(-1)


def main():
    # Check if we are already registered
    with open(DASH_CONF, "r") as f:
        for line in f:
            if "masternodeblsprivkey" in line:
                print("Node is already registered as a masternode. Stopping registration script.")
                sys.exit(0)

    onion_addr = getOnionAddrSimple(DASH_LOG, 20001)
    response_reg_mn = requests.get(f"{URL_MN_API}/registerMasternode", params={"onionAddr": onion_addr})
    if response_reg_mn.status_code == 200:
        bls_priv_key = response_reg_mn.content.decode("utf-8")
        print(f"MASTERNODE SCRIPT: recieved bls private key from api: {bls_priv_key}")
        # change config
        with open(DASH_CONF, "a") as conffile:
            conffile.write(f'\nmasternodeblsprivkey={bls_priv_key}\n')
            conffile.write(f'externalip={onion_addr}\n')
        return True
    else:
        print(f"Error: {response_reg_mn.status_code} - {response_reg_mn.content}")
        return False

if __name__ == "__main__":
    # Check if all args are given
    if len(sys.argv) != 4:
        print("Usage: python3 masternode-register.py <masternode api url> <dash.conf path> <dashd log path>")
        sys.exit(-1)
    while True:
        try:
            if main():
                print("Masternode registration successful!")
                break
        except Exception as e:
            print(f"Masternode registration failed: {e}")
        print("retrying...")
        time.sleep(15)