FROM debian:stable-slim
RUN apt-get update -y && apt-get install -y curl tor wget bash jq net-tools python3 python3-pip procps
RUN pip3 install requests flask Flask-Limiter
# Volume which holts tors persistent state
VOLUME ["/root/.tor"]

# Download binaries
RUN curl -L https://github.com/dash-tor/dash/releases/download/poc-release/dashd -o /usr/local/bin/dashd
RUN curl -L https://github.com/dash-tor/dash/releases/download/poc-release/dash-cli -o /usr/local/bin/dash-cli

# Make binaries executable
RUN chmod +x /usr/local/bin/dashd
RUN chmod +x /usr/local/bin/dash-cli


COPY send_client_status.py /dash/send_client_status.py
COPY masternode_api.py /dash/masternode_api.py
COPY torrc /etc/tor/torrc
COPY entrypoint.sh /entrypoint.sh
RUN mkdir -p /dash
COPY *.conf /dash/

# Create link to /root/.dashcore so that dash-cli can find the config file
RUN ln -s /dash/ /root/.dashcore

COPY masternode-register.py /dash/masternode-register.py
COPY status.py /dash/status.py

VOLUME ["/dash/data"]
WORKDIR /dash
RUN chmod 777 -R /dash/data
HEALTHCHECK --interval=1m --start-period=300s CMD test $(dash-cli -conf=/dash/dash.conf getconnectioncount) -gt 0

CMD ["/entrypoint.sh"]

