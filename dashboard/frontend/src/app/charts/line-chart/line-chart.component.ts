import { Component, Input, OnInit, OnChanges, SimpleChanges} from '@angular/core';
import { number } from 'echarts';

@Component({
  selector: 'app-line-chart',
  templateUrl: './line-chart.component.html',
  styleUrls: ['./line-chart.component.css']
})
export class LineChartComponent implements OnInit {

  @Input() data: any;
  @Input() title: any;
  
  chartInstance: any;
  option: any;

  lineData: {name: string, value: [Date, number], itemStyle: {color: string}}[] = []

  val = 0;

  constructor() { }

  ngOnInit(): void {
    this.option = {
      title: {
        text: this.title,
        left: "center",
        textStyle: {
          fontSize: 25
        }
      },
      dataZoom: [{
        type: 'slider',
        start: 0,
        end: new Date(),
        filterMode: 'none'
      }],
      xAxis: {
        type: 'time',
      },
      yAxis: {
        type: 'value',
      },
      tooltip: {
        trigger: 'item',
        formatter: '{b}'
      }
    };
  }

  onChartInit(e: any) {
      this.chartInstance = e;
  }

  ngOnChanges(changes: SimpleChanges): void {
  
      if(this.chartInstance != undefined){

        // Get the current newest date
        var lineTime = new Date(0);
        if(this.lineData.length > 0){
          lineTime = new Date(this.lineData[this.lineData.length-1].value[0]);
        }

        for(let wert in this.data){
          // Check if maximal count of values is reached
          if(this.lineData.length < 100){

            // Check if value is newer than current newest data point
            if(new Date(this.data[wert].timestamp* 1000) > lineTime){
              
              // Add 'timout' to data, when value is null
              if(this.data[wert].value == null){
                this.lineData.push({
                  name : "Timeout",
                  value: [new Date(this.data[wert].timestamp * 1000), 0],
                  itemStyle: {color: "red"}
                })
              }
              // Else push actual value
              else{
                this.lineData.push({
                  name : this.data[wert].value,
                  value: [new Date(this.data[wert].timestamp * 1000),  this.data[wert].value],
                  itemStyle: {color: "#0693E3"}
                })
              }

            }
          }
          // Array is already filled     
          else{
            // Check if value is newer than current newest data point
            if(new Date(this.data[wert].timestamp* 1000) > lineTime){

              // Shift array to make place for the newer data point
              this.lineData.shift()
              
              // Add 'timout' to data, when value is null
              if(this.data[wert].value == null){
                this.lineData.push({
                  name : "Timeout",
                  value: [new Date(this.data[wert].timestamp * 1000), 0],
                  itemStyle: {color: "red"}
                })
              }
              // Else push actual value
              else{
                this.lineData.push({
                  name : this.data[wert].value,
                  value: [new Date(this.data[wert].timestamp * 1000), this.data[wert].value],
                  itemStyle: {color: "#0693E3"}
                })
              }
              
            }
          }
        }

        // Create second series to show line 
        let averageData = []
        let medianData = []
        let average = this.calcAverage(this.lineData)
        let median = this.calcMedian(this.lineData)
        if(this.lineData.length > 1){
          averageData.push({name: "Average: " + average, value: [this.lineData[0].value[0], average]}, {name: "Average: " + average, value: [this.lineData[this.data.length - 1].value[0], average]})
          medianData.push({name: "Median: " + median, value: [this.lineData[0].value[0], median]}, {name: "Average: " + median, value: [this.lineData[this.data.length - 1].value[0], median]}) 
        }

        // Update the series
        this.chartInstance.setOption({
          series: [
            {
              type: 'scatter',
              name: 'InstantSend',
              data: this.lineData
            },
            {
              type: 'line',
              name: 'InstantSend',
              data: averageData
            },
            {
              type: 'line',
              name: 'InstantSend',
              data: medianData,
              itemStyle: {color: "green"}
            }
          ],
        });
      }
    } 

    calcAverage(data: {name: string, value: [Date, number], itemStyle: {color: string}}[]): number {
      // Get the average value of all data
      var valueSum = 0;
      var count = 0;
      for(let wert in data){
        if(data[wert].value[1] != 0){
          valueSum += data[wert].value[1]
          count++;
        }
      }
      return valueSum / count
    }

    calcMedian(data: {name: string, value: [Date, number], itemStyle: {color: string}}[]): number {

      // Filter and sort values
      var median = 0;
      var m = data.filter(function(v) {
        return v.value[1] != 0;
      }).map(function(v) {
        return v.value[1];
      }).sort(function(a, b) {
        return a - b;
      });
  
      // Get median from the sorted list
      var middle = Math.floor((m.length - 1) / 2); // NB: operator precedence
      if (m.length % 2) {
          median = m[middle];
      } else {
          median = (m[middle] + m[middle + 1]) / 2.0;
      }
      
      return median
    }
  }