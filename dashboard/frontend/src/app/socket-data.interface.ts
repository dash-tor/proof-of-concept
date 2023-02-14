export interface Client {
    ip: string;
    masternode: boolean;
    masternode_status: string;
    mean_latency: number;
}

export interface Duration {
    timestamp: number;
    value: number;
}

export interface Instantsend {
    duration: Duration[];
    average: number;
}

export interface Qourum {
    type: string;
    nodes: any[];
}

export interface SocketData {
    clients: Client[];
    instantsend: Instantsend;
    qourum: Qourum[];
}