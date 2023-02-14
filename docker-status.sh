#!/bin/bash
# Script which shows running docker containers and number of connected peers
# Run with number of containers as argument

# Print usage if no argument is given
if [ $# -eq 0 ]; then
    echo "Usage: $0 <number of containers>"
    exit 1
fi
# Read number of containers from args
num_containers=$1

# Use current folder name as docker-compose project name
project_name=${PWD##*/}
# loop through all containers and print their peer count
for (( i=1; i<=$num_containers; i++ ))
do
    # Get the number of peers from the container
    status=$(docker exec "${project_name}_masternode_$i" python3 status.py)
    # if command failed, print error
    if [ $? -ne 0 ]; then
        status="Error"
    fi

    echo "Container: $i	 $status"
done
