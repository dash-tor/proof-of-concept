#!/bin/bash

# Enable bash job control
set -m

# When script receives sigterm, forward to all processes
trap 'kill $(jobs -p)' SIGTERM


# Get environment variables and set default if not set
DASH_CONFIG_NAME="dash.conf"
INITIAL_NODE="${INITIAL_NODE:=}"
MASTERNODE_ENABLED="${MASTERNODE:=false}"
MASTERNODE_API_SERVER="${MASTERNODE_API_SERVER:=false}"
GENERATE_BLOCKS_EVERY="${GENERATE_BLOCKS_EVERY:=0}"
# Read Masternode registration api url from environment variable or use default docker network ip
MN_API_URL="${MASTERNODE_API_URL:=http://172.17.0.1:5000}"
REPORTING_BACKEND_URL="${REPORTING_BACKEND_URL:=}"

# Check if Masternode and API server are enabled at the same time, which is not allowed
if [ $MASTERNODE_ENABLED = true ] && [ $MASTERNODE_API_SERVER = true ]; then
    echo "Masternode and Masternode API server cannot be enabled at the same time"
    exit 1
fi


# Get my container name from docker daemon
container_name=$(curl -s --unix-socket /var/run/docker.sock http://docker/containers/$(hostname)/json|jq ".Name")
container_name=${container_name:2:-1}

echo "Container name is $container_name"

# use container name as datadir in case we are running multiple containers on the same host
datadir=/dash/data/$container_name
# create dir if necessary
mkdir -p $datadir



tor_running() {
# Function to check if tor is running correctly by using their check webpage
    if curl -s --socks5 127.0.0.1:9050 --connect-timeout 3 'https://check.torproject.org/' | grep -qm1 Congratulations; then
        echo "Tor is running and connected"    
        return 0
    else
        echo "Waiting for tor to start"
        return 1
    fi
}


# Start tor in the background
echo "Starting tor"
tor > $datadir/tor.log 2>&1 &
TOR_PID=$!
# Wait for tor to start
while ! tor_running; do sleep 1; done


# Copy config file to datadir if it does not exist
if [ ! -f $datadir/$DASH_CONFIG_NAME ]; then
    echo "Copying $DASH_CONFIG_NAME to $datadir"
    cp /dash/$DASH_CONFIG_NAME $datadir
fi


# Run dashd in background and save pid
echo "Starting dashd"
dashd -datadir=$datadir -conf=$datadir/$DASH_CONFIG_NAME > /dev/null &
DASH_PID=$!


# Wait 10 seconds and check if dashd is still running. Otherwise start it with reindex parameter.
sleep 10
if ! ps -p $DASH_PID > /dev/null; then
    echo "Dashd exited unexpectedly. Starting with reindex"
    dashd -datadir=$datadir -conf=$datadir/$DASH_CONFIG_NAME -reindex > /dev/null &
    DASH_PID=$!
fi

# print current node address
echo "Node address is $(dash-cli getnetworkinfo | jq -r '.localaddresses[0].address')"


# Check if we have a initial node to bootstrap from and if so connect to it
if [ ! -z "$INITIAL_NODE" ]; then
    sleep 5
    echo "Adding initial node $INITIAL_NODE"
    dash-cli addnode $INITIAL_NODE add
fi

# Run masternode script if masternode is enabled
if [ $MASTERNODE_ENABLED = true ]; then
    echo "Running masternode script"
    sleep 10
    python3 -u /dash/masternode-register.py $MN_API_URL $datadir/$DASH_CONFIG_NAME $datadir/devnet-*/debug.log
    sleep 3
fi

# Run masternode api server if enabled
if [ $MASTERNODE_API_SERVER = true ]; then
    echo "Running masternode api server"
    python3 -u masternode_api.py 2>&1 | tee $datadir/masternode_api.log &
fi

# Generate blocks every x seconds if enabled
if [ $GENERATE_BLOCKS_EVERY -gt 0 ]; then
    # generate address for mining
    ADDR=$(dash-cli getnewaddress)
    echo "Generating blocks every $GENERATE_BLOCKS_EVERY seconds to: $ADDR"
    while true; do
        sleep $GENERATE_BLOCKS_EVERY
        dash-cli generatetoaddress 1 $ADDR > /dev/null
    done &
fi

python3 -u /dash/send_client_status.py "$REPORTING_BACKEND_URL" > $datadir/send_client_status.log 2>&1 &

echo "Startup complete. Waiting for one of the processes to exit"
# Wait for dash or tor to exit
wait $DASH_PID $TOR_PID

# Terminate remaining processes
kill $(jobs -p)
wait
echo "Entrypoint.sh done. Terminating Container"
