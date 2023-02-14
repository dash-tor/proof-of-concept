"""
Prints a status line for the dash node to be called from the outside of the container
"""
import subprocess
import json

# Print dashd status
def dash_cli(commands):
    """Run dash-cli commands"""
    result = subprocess.run(['dash-cli', '-conf=/dash/dash.conf', '--rpcclienttimeout=1'] +
                            commands, check=False, capture_output=True, text=True)
    if result.returncode != 0:
        #print(f"Error running dash-cli. Command: \ndash-cli {' '.join(commands)}\nOutput: \n{result.stderr}")
        raise Exception(result.stderr)
    return result.stdout.strip()
try:
    connectioncount = dash_cli(['getconnectioncount'])
except:
    connectioncount = "E"
try:
    blocks = json.loads(dash_cli(['getblockchaininfo'])).get('blocks')
except:
    blocks = "E"
try:
    mn_status = json.loads(dash_cli(['masternode', 'status'])).get('status')
except:
    mn_status = "-"

print(f"Clients: {connectioncount} \tBlocks: {blocks} \tMN: {mn_status}")
