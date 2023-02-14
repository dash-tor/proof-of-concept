"""
This script is used to register masternodes on the local devnet.
It generates some transactions and outputs to be used for the registration.
Masternode containers call this script to obtain a bls key and register the masternode.
"""

from flask import Flask
from flask import request
from flask_limiter import Limiter
import datetime
import json
import subprocess
import time
import random
import os

REACTIVATE_FILE = "./data/reactivate_masternodes.sh"

def func():
    return 1

app = Flask(__name__)
limiter = Limiter(
    app=app,
    key_func=func,
    default_limits=["1 per second"]
)



MAX_NUM_MASTERNODES = 230
GENERATE_DEFAULT_ADDRESS = None



def generate_balance(target_balance=10000):
    global GENERATE_DEFAULT_ADDRESS
    """Generate blocks until balance is reached"""
    if not GENERATE_DEFAULT_ADDRESS:
        GENERATE_DEFAULT_ADDRESS = getnewadress()
    balance = float(dash_cli(['getbalance']))

    while balance < target_balance:
        print(
            f"Insufficient balance. Need {target_balance} Dash. Generating blocks...")
        generate_blocks(GENERATE_DEFAULT_ADDRESS, 105)
        balance = float(dash_cli(['getbalance']))

def get_unused_outputs_from_dash():
    masternode_outputs = dash_cli(['masternode', 'outputs'])
    masternode_outputs = json.loads(masternode_outputs)
    masternode_list = dash_cli(['masternode', 'list'])
    available_outputs = [output for output in masternode_outputs if output not in masternode_list]
    print(f"Available masternode outputs: {len(available_outputs)}") 
    return available_outputs




def generate_outputs():
    """Check if there are unused 1000 Dash outputs"""
    # get masternode outputs
    unused_outputs = get_unused_outputs_from_dash()

    while len(unused_outputs) < MAX_NUM_MASTERNODES:
        missing = MAX_NUM_MASTERNODES - len(unused_outputs)
        print(f"Missing {missing} masternode outputs")
        # check balance to send enough funds
        generate_balance(missing * 1200)
        # send 1000 dash transactions
        for i in range(missing):
            transaction_hash = dash_cli(['sendtoaddress', getnewadress(), '1000'])
            # Lock transaction outputs
            tmp = [{"txid": transaction_hash, "vout": 0}]
            dash_cli(['lockunspent', 'false', json.dumps(tmp)])

        # Check outputs again
        generate_blocks(GENERATE_DEFAULT_ADDRESS, 110)
        unused_outputs = get_unused_outputs_from_dash()

    print(
        f"Available masternode outputs: {len(get_unused_outputs_from_dash())}")





def dash_cli(commands):
    """Run dash-cli commands"""
    result = subprocess.run(['dash-cli'] +
                            commands, check=False, capture_output=True, text=True)
    if result.returncode != 0:
        #print(f"Error running dash-cli. Command: \ndash-cli {' '.join(commands)}\nOutput: \n{result.stderr}")
        raise Exception(result.stderr)
    return result.stdout.strip()


def getnewadress():
    return dash_cli(['getnewaddress'])


def generate_blocks(target_address, blocks=200):
    dash_cli(['generatetoaddress', str(blocks), target_address])


def performMasternodeRegistration(
        onionAndPort: str) -> str:
    """Method return bls private key"""

    # Generate outputs if necessary
    if len(get_unused_outputs_from_dash()) < 10:
        generate_outputs()

    # Get the next funding transaction from masternode outputs and use that for the registration
    fundingTransactionId = random.choice(get_unused_outputs_from_dash())

    # split into transaction id and index
    fundingTransactionId, collateral_idx = fundingTransactionId.split("-")

  


    # gettransaction = dash_cli(['gettransaction', fundingTransactionId])

    print(f"Funding TX id: {fundingTransactionId}")

    # generate bls key
    bls = json.loads(dash_cli(['bls', 'generate']))
    blssecret = bls["secret"]
    blspublic = bls["public"]

    ownerKeyAddress = dash_cli(['getnewaddress'])
    # Get voting and payout address from listbalances
    listbalances = json.loads(dash_cli(['listaddressbalances']))
    # Select first address with a balance > 5k dash
    candidate_addresses = [
        address for address in listbalances if listbalances[address] > 5000]
    votingKeyAddress = getnewadress()
    payoutAddress = getnewadress()

    fee_address = random.choice(candidate_addresses)

    reg_prepare_dict = {
        "fundingTransactionId": fundingTransactionId,
        "collateralIndex": collateral_idx,
        "ipAndPort": onionAndPort,
        "ownerKeyAddr": ownerKeyAddress,
        "operatorPubKey": blspublic,
        "votingKeyAddr": votingKeyAddress,
        "operatorReward": "0",
        "payoutAddress": payoutAddress,
        "feeSourceAddress": fee_address
    }

    print(f"Funding TX id: {json.dumps(reg_prepare_dict, sort_keys=True, indent=4)}")

    # build register prepare
    output_register_prepare = dash_cli([
        'protx',
        'register_prepare',
        reg_prepare_dict["fundingTransactionId"],
        reg_prepare_dict["collateralIndex"],
        reg_prepare_dict["ipAndPort"],
        reg_prepare_dict["ownerKeyAddr"],
        reg_prepare_dict["operatorPubKey"],
        reg_prepare_dict["votingKeyAddr"],
        reg_prepare_dict["operatorReward"],
        reg_prepare_dict["payoutAddress"],
        reg_prepare_dict["feeSourceAddress"]
    ])

    proRegTxTransaction = json.loads(output_register_prepare)

    proRegTxId = proRegTxTransaction["tx"]
    print(f"proRegTxId: {proRegTxId}")
    proRegTxCollateralAddress = proRegTxTransaction["collateralAddress"]
    proRegTxSignMessage = proRegTxTransaction["signMessage"]

    # sign transaction
    signMessageOutput = dash_cli(
        ['signmessage', proRegTxCollateralAddress, proRegTxSignMessage])

    # register submit
    submitedSignedMessage = dash_cli(
        ['protx', 'register_submit', proRegTxId, signMessageOutput])

    print(f"submitedSignedMessage: {submitedSignedMessage}")

    print(f"signMessageOutput: {signMessageOutput}")

    # return blsprivkey -> client write to config
    print(f"BLS KEYPAIR: \n\tprivate: {blssecret}\n\tpublic: {blspublic}")

    # Generate 3 blocks
    generate_blocks(fee_address, 3)


    with open(REACTIVATE_FILE, "a") as reactivate_f:
        reactivate_f.write(f"dash-cli protx update_service {submitedSignedMessage} {reg_prepare_dict['ipAndPort']} {blssecret}\n")



    return blssecret


@app.route('/registerMasternode')
def registerMasternode():
    # extract onion address from request
    onionAddr = request.args.get('onionAddr')

    print(f"\n\nREGISTERING MASTERNODE: {onionAddr}")

    bls_priv_key = performMasternodeRegistration(onionAddr)

    return bls_priv_key


@app.route('/validateMasternodeTX')
def validateMasternodeTX():
    n = 100
    generate_blocks(getnewadress(), n)
    return f'genereated {n} Blocks'


if __name__ == '__main__':
    # Generate Masternode funding outputs if needed
    generate_outputs()
    # print(dash_cli(["getnewaddress"]))
    app.run(host="0.0.0.0")
