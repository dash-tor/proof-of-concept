import { Component, Inject, OnInit } from "@angular/core";
import { Nodedata } from "../../shared/models/nodedata.model";
import { Quorumdata } from "../../shared/models/quorumdata.model";
import { MatTreeNestedDataSource } from "@angular/material/tree";
import { NestedTreeControl } from "@angular/cdk/tree";
import { MAT_DIALOG_DATA } from "@angular/material/dialog";
import { DataService } from "../../services/data.service";

@Component({
  selector: "app-node-cards",
  templateUrl: "./node-cards.component.html",
  styleUrls: ["./node-cards.component.css"],
})
export class NodeCardsComponent implements OnInit {
  dataSource = new MatTreeNestedDataSource<any>();
  treeControl = new NestedTreeControl<any>((node) => node.children);

  cardData: any;

  NODETYPES = ["Masternodes", "Fullnodes"];
  STATETYPES = [
    "WAITING_FOR_PROTX",
    "POSE_BANNED",
    "REMOVED",
    "OPERATOR_KEY_CHANGED",
    "PROTX_IP_CHANGED",
    "READY",
    "ERROR",
  ];
  QUORUMTYPES = [
    "llmq_50_60",
    "llmq_60_75",
    "llmq_400_60",
    "llmq_400_85",
    "llmq_100_67",
    "llmq_devnet",
    "llmq_devnet_dip0024",
  ];

  NODESDATA: Nodedata[] = [];
  STATEDATA: Nodedata[] = [];
  QUORUMDATA: Quorumdata[] = [];

  type: string | undefined;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { type: string },
    private service: DataService
  ) {
    this.dataSource.data = this.QUORUMDATA;
    this.service.currentData.subscribe((msg: {}) => (this.cardData = msg));
    this.type = this.data.type;
    console.log("node-cards : Data: ", this.data);
    console.log("node-cards : Data from Service: ", this.cardData);
  }

  ngOnInit(): void {
    this.service.currentData.subscribe((msg: {}) => (this.cardData = msg));

    console.log("Type: ", this.data.type);

    // Create nodedata, if node chart is selected
    if (this.NODETYPES.includes(this.data.type)) {
      let nodeData = [];
      let nodes = this.cardData.clients.filter(
        (client: any) => client.masternode == (this.data.type == "Masternodes")
      );
      for (let client in nodes) {
        nodeData.push({
          block_height: nodes[client].block_height,
          connectioncount: nodes[client].connectioncount,
          masternode: nodes[client].masternode,
          masternode_status: nodes[client].masternode_status,
          onion_addr: nodes[client].address,
        });
      }

      this.NODESDATA = nodeData;
    }

    // Create statedata, if node chart is selected
    else if (this.STATETYPES.includes(this.data.type)) {
      let stateData = [];
      let nodes = this.cardData.clients.filter(
        (client: any) => client.masternode_status == this.data.type
      );
      for (let client in nodes) {
        stateData.push({
          block_height: nodes[client].block_height,
          connectioncount: nodes[client].connectioncount,
          masternode: nodes[client].masternode,
          masternode_status: nodes[client].masternode_status,
          onion_addr: nodes[client].address,
        });
      }

      this.NODESDATA = stateData;
    }
    // Create statedata, if node chart is selected
    else if (this.QUORUMTYPES.includes(this.data.type)) {
      let quorumData = [];
      let quorums = this.cardData.quorum.filter(
        (quorum: any) => quorum.type == this.data.type
      );

      for (let i in quorums) {
        quorumData.push({
          id: i + ". ",
          members: quorums[i].members,
          hash: quorums[i].hash,
        });
      }

      this.QUORUMDATA = quorumData;
    }
  }

  hasChild = (_: number, node: any) =>
    !!node.children && node.children.length > 0;
}
