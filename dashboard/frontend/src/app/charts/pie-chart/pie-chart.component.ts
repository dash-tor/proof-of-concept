import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { NodeCardsComponent } from 'src/app/dialog/node-cards/node-cards.component';
import {MatDialog} from '@angular/material/dialog';
import { DataService } from 'src/app/services/data.service';


@Component({
  selector: 'app-pie-chart',
  templateUrl: './pie-chart.component.html',
  styleUrls: ['./pie-chart.component.css']
})
export class PieChartComponent implements OnInit, OnChanges{

  constructor(public dialog: MatDialog, private service: DataService) {}

  @Input() data: any;
  @Input() title: any;

  @Output() onPlusClick = new EventEmitter<boolean>();

  option: any;
  chartInstance: any;

  toggleStepper = false;

    ngOnInit(): void {
  
      this.option = {
        tooltip:{
          trigger: 'item',
          formatter: '{b} : {c} ({d}%)'
        },
        // legend: {
        //   align: 'auto',
        //   bottom: 10
        // },
        series: [
          {
            data: [],
            type: 'pie',
          },
        ]
      };
    }


  onChartInit(e: any) {
    this.chartInstance = e;
  }

  ngOnChanges(changes: SimpleChanges): void {

    if(this.chartInstance != undefined){

      let pieData = []
      let names = []
      for(let key in this.data.values){
        pieData.push({
          "value": this.data.values[key].count, "name": this.data.values[key].name
        })
        names.push(this.data.values[key].name)
      }

      this.chartInstance.setOption({
        series: [
          {
            data: pieData,
            type: 'pie',   
          },
        ],
        // legend: {
        //     data: names,
        //     top: "bottom"
        // }
      });
    }

  }
  onChartClick(event: any) {

    console.log("Click Pie", event);

    this.dialog.open(NodeCardsComponent, {
      data: {type: event.name},
      height: '80%',
      width: '80%',
      enterAnimationDuration: "350ms"
    });
  }

}
