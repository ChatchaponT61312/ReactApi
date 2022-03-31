import React, { Component } from "react";
import logo from "./logo.svg";
import "./App.css";
import * as am4core from "@amcharts/amcharts4/core";
import * as am4charts from "@amcharts/amcharts4/charts";
import am4themes_animated from "@amcharts/amcharts4/themes/animated";
import * as am5 from "@amcharts/amcharts5";
import * as am5xy from "@amcharts/amcharts5/xy";
import am5themes_Animated from "@amcharts/amcharts5/themes/Animated";
import * as api from "./service/Api";

am4core.useTheme(am4themes_animated);

class App extends Component {
  async componentDidMount() {
    // get data from Api.js file.
    let res = await api.getUser();
    if (res) {
      // set format data.
      let data = res["data"];
      let cases = data[0].timeline.cases;
      let keyOfCases = [];
      let newCases = [];
      let kkey = [
          "2/1/22",
          "2/2/22",
          "2/3/22",
          "2/4/22",
          "2/5/22",
          "2/6/22",
          "2/7/22",
          "2/8/22",
          "2/9/22",
          "2/10/22",
          "2/11/22",
          "2/12/22",
          "2/13/22",
          "2/14/22",
          "2/15/22",
          "2/16/22",
          "2/17/22",
          "2/18/22",
          "2/19/22",
          "2/20/22",
          "2/21/22",
          "2/22/22",
          "2/23/22",
          "2/24/22",
          "2/25/22",
          "2/26/22",
          "2/27/22",
          "2/28/22"
      ];
      //ไม่กำหนดวัน แต่ group by วันที่
      // for (let key in cases) {
      //   // keyOfCases.push(key);
      //   newCases[key] = {};
      // }
      // console.log(cases); //เช็ดข้อมูล
      //กำหนดวันเอง
      for (let i = 0; i <= 27; i++) {
         
         keyOfCases.push(kkey[i]);
        newCases[kkey[i]] = {};

      }
      for (let item of data) {
        for (let key of keyOfCases) {
          newCases[key][item["country"]] = item["timeline"]["cases"][key];
        }
      }
      // call function setChart()
      this.setChart(newCases);
      console.log(newCases);
    } else {
      window.alert("Api not responding.");
    }
  }

  // this is setChart function. (เอามาจาก amchart แล้วก็เปลี่ยนตัวแปรนิดหน่อย)
  setChart(allData) {
    let root = am5.Root.new("race-chart");
    root.numberFormatter.setAll({
      numberFormat: "#a",
      bigNumberPrefixes: [//ค่าตัวเลข
        { number: 1, suffix: "" },
        // { number: 1e3, suffix: "K" },
        // { number: 1e6, suffix: "M" },
      ],
      smallNumberPrefixes: [],
    });
    let stepDuration = 1000;
    root.setThemes([am5themes_Animated.new(root)]);
    let chart = root.container.children.push(
      am5xy.XYChart.new(root, {
        panX: true,
        panY: true,
        wheelX: "none",
        wheelY: "none",
      })
    );
    chart.zoomOutButton.set("forceHidden", true);
    let yRenderer = am5xy.AxisRendererY.new(root, {
      minGridDistance: 20,
      inversed: true,
    });
    yRenderer.grid.template.set("visible", false);
    let yAxis = chart.yAxes.push(
      am5xy.CategoryAxis.new(root, {
        maxDeviation: 0,
        categoryField: "country",
        renderer: yRenderer,
      })
    );
    let xAxis = chart.xAxes.push(
      am5xy.ValueAxis.new(root, {
        maxDeviation: 0,
        min: 0,
        strictMinMax: true,
        extraMax: 0.1,
        renderer: am5xy.AxisRendererX.new(root, {}),
      })
    );
    xAxis.set("interpolationDuration", stepDuration / 100);
    xAxis.set("interpolationEasing", am5.ease.linear);
    let series = chart.series.push(
      am5xy.ColumnSeries.new(root, {
        xAxis: xAxis,
        yAxis: yAxis,
        valueXField: "value",
        categoryYField: "country",
      })
    );
    series.columns.template.setAll({ cornerRadiusBR: 0, cornerRadiusTR: 0 }); //มุมโค้งมนของแท่งกราฟ
    series.columns.template.adapters.add("fill", function (fill, target) {
      return chart.get("colors").getIndex(series.columns.indexOf(target));
    });
    series.columns.template.adapters.add("stroke", function (stroke, target) {
      return chart.get("colors").getIndex(series.columns.indexOf(target));
    });
    series.bullets.push(function () {
      return am5.Bullet.new(root, {
        locationX: 1,
        sprite: am5.Label.new(root, {
          text: "{valueXWorking.formatNumber('#. a')}",
          fill: root.interfaceColors.get("alternativeText"),
          centerX: am5.p100,
          centerY: am5.p50,
          populateText: true,
        }),
      });
    });
    //แสดงวันที่
    let label = chart.plotContainer.children.push(
      am5.Label.new(root, {
        // text: "",
        fontSize: "8em",
        opacity: 0.5,
        x: am5.p100,
        y: am5.p100,
        centerY: am5.p100,
        centerX: am5.p100,
      })
    );
    function getSeriesItem(category) {
      for (var i = 0; i < series.dataItems.length; i++) {
        let dataItem = series.dataItems[i];
        if (dataItem.get("categoryY") == category) {
          return dataItem;
        }
      }
    }
    function sortCategoryAxis() {
      series.dataItems.sort(function (x, y) {
        return y.get("valueX") - x.get("valueX");
      });
      am5.array.each(yAxis.dataItems, function (dataItem) {
        let seriesDataItem = getSeriesItem(dataItem.get("category"));
        if (seriesDataItem) {
          let index = series.dataItems.indexOf(seriesDataItem);
          let deltaPosition =
            (index - dataItem.get("index", 0)) / series.dataItems.length;
          if (dataItem.get("index") != index) {
            dataItem.set("index", index);
            dataItem.set("deltaPosition", -deltaPosition);
            dataItem.animate({
              key: "deltaPosition",
              to: 0,
              duration: stepDuration / 2,
              easing: am5.ease.out(am5.ease.cubic),
            });
          }
        }
      });
      yAxis.dataItems.sort(function (x, y) {
        return x.get("index") - y.get("index");
      });
    }

    let caseIndex = 0;
    let caseList = Object.keys(allData);
    let interval = setInterval(function () {
      caseIndex++;
      if (caseIndex >= caseList.length) {   //กำหนดรอบ caseList.length
        clearInterval(interval);
        clearInterval(sortInterval);
      }
      updateData();
    }, stepDuration);
    let sortInterval = setInterval(function () {
      sortCategoryAxis();
    }, 100);
    function setInitialData() {
      let d = allData[caseList[caseIndex]];
      for (var n in d) {
        series.data.push({ country: n, value: d[n] });
        yAxis.data.push({ country: n });
      }
    }
    function updateData() {
      let itemsWithNonZero = 0;
      if (allData[caseList[caseIndex]]) {
        label.set("text", caseList[caseIndex].toString());
        am5.array.each(series.dataItems, function (dataItem, index) {
          //แสดงแถวกราฟ
          if (index < 30) {
            let category = dataItem.get("categoryY");
            let value = allData[caseList[caseIndex]][category];
            if (value > 0) {
              itemsWithNonZero++;
            }
            dataItem.animate({
              key: "valueX",
              to: value,
              duration: stepDuration,
              easing: am5.ease.linear,
            });
            dataItem.animate({
              key: "valueXWorking",
              to: value,
              duration: stepDuration,
              easing: am5.ease.linear,
            });
          }
        });
        yAxis.zoom(0, itemsWithNonZero / yAxis.dataItems.length);
      }
    }
    setInitialData();
    setTimeout(function () {
      caseIndex++;
      updateData();
    }, 50);
    series.appear(1000);
    chart.appear(1000, 100);
  }

  componentWillUnmount() {
    if (this.chart) {
      this.chart.dispose();
    }
  }

  render() {
    return (
      <div id="race-chart" style={{ width: "100%", height: "700px" }}></div>
    );
  }
}


export default App;
