import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { N } from 'chart.js/dist/chunks/helpers.core';

@Component({
  selector: 'app-main-comp',
  templateUrl: './main-comp.component.html',
  styleUrls: ['./main-comp.component.css']
})
export class MainCompComponent implements OnInit, OnChanges {
  @Input() data: any;

  //Data for pie charts
  nodeCountData = {};
  masternodeStatusData = {}
  quorumData = {}

  instantSendData = {};

  constructor() { }

  prepareNodeTypes(data: any): any{
    var masternodes = 0;
    var fullnodes = 0;
    for (var client of data.clients){
      if(client.masternode){
        masternodes++;
      }
      else{
        fullnodes++;
      }
    }
    return {"values":[
      {
        "name":"Masternodes",
        "count":masternodes
      },
      {
        "name":"Fullnodes",
        "count":fullnodes
      }
    ]}
  }

  prepareNodeStatus(data: any): any{
    var waitingForProtx = 0;
    var posebanned = 0;
    var removed = 0;
    var keyChanged = 0;
    var ipChanged = 0;
    var ready = 0;
    var error = 0;

    for (var client of data.clients){
      if(client.masternode){
        switch(client.masternode_status){
          case "WAITING_FOR_PROTX": {
            waitingForProtx++;
            break
          }
          case "POSE_BANNED": {
            posebanned++;
            break
          }
          case "REMOVED": {
            removed++;
            break
          }
          case "OPERATOR_KEY_CHANGED": {
            keyChanged++;
            break
          }
          case "PROTX_IP_CHANGED": {
            ipChanged++;
            break
          }
          case "READY": {
            ready++;
            break
          }
          case "ERROR": {
            error++;
            break
          }
          default: {
            break
          }
        };
      }
    }
    return {"values":[
      {
        "name":"WAITING_FOR_PROTX",
        "count":waitingForProtx
      },
      {
        "name":"POSE_BANNED",
        "count":posebanned
      },
      {
        "name":"REMOVED",
        "count":removed
      },
      {
        "name":"OPERATOR_KEY_CHANGED",
        "count":keyChanged
      },
      {
        "name":"PROTX_IP_CHANGED",
        "count":ipChanged
      },
      {
        "name":"READY",
        "count":ready
      },
      {
        "name":"ERROR",
        "count":error
      }
    ]}
  }

  prepareQuorumData(data: any): any{
    var llmq_50_60 = 0;
    var llmq_60_75 = 0;
    var llmq_400_60 = 0;
    var llmq_400_85 = 0;
    var llmq_100_67 = 0;
    var llmq_devnet = 0;
    var llmq_devnet_dip0024 = 0;
    for (var q of data.quorum){
      switch(q.type){
        case "llmq_50_60":{
          llmq_50_60++;
          break;
        }
        case "llmq_60_75":{
          llmq_60_75++;
          break;
        }
        case "llmq_400_60":{
          llmq_400_60++;
          break;
        }
        case "llmq_400_85":{
          llmq_400_85++;
          break;
        }
        case "llmq_100_67":{
          llmq_100_67++;
          break;
        }
        case "llmq_devnet":{
          llmq_devnet++;
          break;
        }
        case "llmq_devnet_dip0024":{
          llmq_devnet_dip0024++;
          break;
        }
      }
    }
    return {"values":[
      {
        "name":"llmq_50_60",
        "count":llmq_50_60
      },
      {
        "name":"llmq_60_75",
        "count":llmq_60_75
      },
      {
        "name":"llmq_400_60",
        "count":llmq_400_60
      },
      {
        "name":"llmq_400_85",
        "count":llmq_400_85
      },
      {
        "name":"llmq_100_67",
        "count":llmq_100_67
      },
      {
        "name":"llmq_devnet",
        "count":llmq_devnet
      },
      {
        "name":"llmq_devnet_dip0024",
        "count":llmq_devnet_dip0024
      }
    ]}
  }

  prepareInstantSendData(data: any): any{
    for (var q of data.quorum){
    }

  }

  ngOnChanges(changes: SimpleChanges): void {
    
    if(this.data.clients != undefined){
      this.nodeCountData = this.prepareNodeTypes(this.data);
      this.masternodeStatusData = this.prepareNodeStatus(this.data);
      this.quorumData = this.prepareQuorumData(this.data);

      this.instantSendData = this.data.instantsend;
    }
  }

  ngOnInit(): void {
  }

  public getNodeData(type:any): any{
    return this.data.clients.filter((client:any) => client.masternode == type)
  }
}
