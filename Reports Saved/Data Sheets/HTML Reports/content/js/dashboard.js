/*
   Licensed to the Apache Software Foundation (ASF) under one or more
   contributor license agreements.  See the NOTICE file distributed with
   this work for additional information regarding copyright ownership.
   The ASF licenses this file to You under the Apache License, Version 2.0
   (the "License"); you may not use this file except in compliance with
   the License.  You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/
var showControllersOnly = false;
var seriesFilter = "";
var filtersOnlySampleSeries = true;

/*
 * Add header in statistics table to group metrics by category
 * format
 *
 */
function summaryTableHeader(header) {
    var newRow = header.insertRow(-1);
    newRow.className = "tablesorter-no-sort";
    var cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 1;
    cell.innerHTML = "Requests";
    newRow.appendChild(cell);

    cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 3;
    cell.innerHTML = "Executions";
    newRow.appendChild(cell);

    cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 6;
    cell.innerHTML = "Response Times (ms)";
    newRow.appendChild(cell);

    cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 1;
    cell.innerHTML = "Throughput";
    newRow.appendChild(cell);

    cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 2;
    cell.innerHTML = "Network (KB/sec)";
    newRow.appendChild(cell);
}

/*
 * Populates the table identified by id parameter with the specified data and
 * format
 *
 */
function createTable(table, info, formatter, defaultSorts, seriesIndex, headerCreator) {
    var tableRef = table[0];

    // Create header and populate it with data.titles array
    var header = tableRef.createTHead();

    // Call callback is available
    if(headerCreator) {
        headerCreator(header);
    }

    var newRow = header.insertRow(-1);
    for (var index = 0; index < info.titles.length; index++) {
        var cell = document.createElement('th');
        cell.innerHTML = info.titles[index];
        newRow.appendChild(cell);
    }

    var tBody;

    // Create overall body if defined
    if(info.overall){
        tBody = document.createElement('tbody');
        tBody.className = "tablesorter-no-sort";
        tableRef.appendChild(tBody);
        var newRow = tBody.insertRow(-1);
        var data = info.overall.data;
        for(var index=0;index < data.length; index++){
            var cell = newRow.insertCell(-1);
            cell.innerHTML = formatter ? formatter(index, data[index]): data[index];
        }
    }

    // Create regular body
    tBody = document.createElement('tbody');
    tableRef.appendChild(tBody);

    var regexp;
    if(seriesFilter) {
        regexp = new RegExp(seriesFilter, 'i');
    }
    // Populate body with data.items array
    for(var index=0; index < info.items.length; index++){
        var item = info.items[index];
        if((!regexp || filtersOnlySampleSeries && !info.supportsControllersDiscrimination || regexp.test(item.data[seriesIndex]))
                &&
                (!showControllersOnly || !info.supportsControllersDiscrimination || item.isController)){
            if(item.data.length > 0) {
                var newRow = tBody.insertRow(-1);
                for(var col=0; col < item.data.length; col++){
                    var cell = newRow.insertCell(-1);
                    cell.innerHTML = formatter ? formatter(col, item.data[col]) : item.data[col];
                }
            }
        }
    }

    // Add support of columns sort
    table.tablesorter({sortList : defaultSorts});
}

$(document).ready(function() {

    // Customize table sorter default options
    $.extend( $.tablesorter.defaults, {
        theme: 'blue',
        cssInfoBlock: "tablesorter-no-sort",
        widthFixed: true,
        widgets: ['zebra']
    });

    var data = {"OkPercent": 100.0, "KoPercent": 0.0};
    var dataset = [
        {
            "label" : "KO",
            "data" : data.KoPercent,
            "color" : "#FF6347"
        },
        {
            "label" : "OK",
            "data" : data.OkPercent,
            "color" : "#9ACD32"
        }];
    $.plot($("#flot-requests-summary"), dataset, {
        series : {
            pie : {
                show : true,
                radius : 1,
                label : {
                    show : true,
                    radius : 3 / 4,
                    formatter : function(label, series) {
                        return '<div style="font-size:8pt;text-align:center;padding:2px;color:white;">'
                            + label
                            + '<br/>'
                            + Math.round10(series.percent, -2)
                            + '%</div>';
                    },
                    background : {
                        opacity : 0.5,
                        color : '#000'
                    }
                }
            }
        },
        legend : {
            show : true
        }
    });

    // Creates APDEX table
    createTable($("#apdexTable"), {"supportsControllersDiscrimination": true, "overall": {"data": [0.19, 500, 1500, "Total"], "isController": false}, "titles": ["Apdex", "T (Toleration threshold)", "F (Frustration threshold)", "Label"], "items": [{"data": [0.0, 500, 1500, "HomePageHTTP Request"], "isController": false}, {"data": [0.0, 500, 1500, "AboutPageHTTP Request"], "isController": false}, {"data": [0.5, 500, 1500, "ArchivePageHTTP Request-0"], "isController": false}, {"data": [0.1, 500, 1500, "ArchivePageHTTP Request-1"], "isController": false}, {"data": [0.0, 500, 1500, "BooksPageHTTP Request"], "isController": false}, {"data": [0.0, 500, 1500, "ArchivePageHTTP Request"], "isController": false}, {"data": [0.4, 500, 1500, "BooksPageHTTP Request-0"], "isController": false}, {"data": [0.4, 500, 1500, "BooksPageHTTP Request-1"], "isController": false}, {"data": [0.1, 500, 1500, "AboutPageHTTP Request-1"], "isController": false}, {"data": [0.4, 500, 1500, "AboutPageHTTP Request-0"], "isController": false}]}, function(index, item){
        switch(index){
            case 0:
                item = item.toFixed(3);
                break;
            case 1:
            case 2:
                item = formatDuration(item);
                break;
        }
        return item;
    }, [[0, 0]], 3);

    // Create statistics table
    createTable($("#statisticsTable"), {"supportsControllersDiscrimination": true, "overall": {"data": ["Total", 50, 0, 0.0, 2003.6200000000003, 1209, 4348, 3037.2, 3373.45, 4348.0, 3.866079022655223, 106.80383092186655, 0.6380540574499343], "isController": false}, "titles": ["Label", "#Samples", "KO", "Error %", "Average", "Min", "Max", "90th pct", "95th pct", "99th pct", "Transactions\/s", "Received", "Sent"], "items": [{"data": ["HomePageHTTP Request", 5, 0, 0.0, 2478.6, 2019, 3355, 3355.0, 3355.0, 3355.0, 1.363884342607747, 73.61379270662847, 0.15983019639934534], "isController": false}, {"data": ["AboutPageHTTP Request", 5, 0, 0.0, 3296.6, 2882, 4348, 4348.0, 4348.0, 4348.0, 0.9727626459143969, 32.840048942120625, 0.23844084387159534], "isController": false}, {"data": ["ArchivePageHTTP Request-0", 5, 0, 0.0, 1245.8, 1209, 1309, 1309.0, 1309.0, 1309.0, 1.5105740181268883, 1.3394543051359515, 0.18882175226586104], "isController": false}, {"data": ["ArchivePageHTTP Request-1", 5, 0, 0.0, 1530.0, 1484, 1584, 1584.0, 1584.0, 1584.0, 1.4100394811054708, 59.30620549562888, 0.17763192681895093], "isController": false}, {"data": ["BooksPageHTTP Request", 5, 0, 0.0, 2706.6, 2437, 3396, 3396.0, 3396.0, 3396.0, 0.9798157946306093, 33.74125820595728, 0.2650478272584754], "isController": false}, {"data": ["ArchivePageHTTP Request", 5, 0, 0.0, 2776.2, 2693, 2893, 2893.0, 2893.0, 2893.0, 1.0429703796412182, 44.79211481800167, 0.26176112067167295], "isController": false}, {"data": ["BooksPageHTTP Request-0", 5, 0, 0.0, 1362.6, 1213, 1845, 1845.0, 1845.0, 1845.0, 1.4076576576576576, 1.2619430954391893, 0.18970386402027026], "isController": false}, {"data": ["BooksPageHTTP Request-1", 5, 0, 0.0, 1344.2, 1213, 1552, 1552.0, 1552.0, 1552.0, 1.288992008249549, 43.23259055168858, 0.1749705948698118], "isController": false}, {"data": ["AboutPageHTTP Request-1", 5, 0, 0.0, 1909.2, 1372, 3021, 3021.0, 3021.0, 3021.0, 1.3473457289140394, 44.233202388170305, 0.1657866814874697], "isController": false}, {"data": ["AboutPageHTTP Request-0", 5, 0, 0.0, 1386.4, 1237, 1602, 1602.0, 1602.0, 1602.0, 1.5455950540958268, 1.4369204018547141, 0.188671271251932], "isController": false}]}, function(index, item){
        switch(index){
            // Errors pct
            case 3:
                item = item.toFixed(2) + '%';
                break;
            // Mean
            case 4:
            // Mean
            case 7:
            // Percentile 1
            case 8:
            // Percentile 2
            case 9:
            // Percentile 3
            case 10:
            // Throughput
            case 11:
            // Kbytes/s
            case 12:
            // Sent Kbytes/s
                item = item.toFixed(2);
                break;
        }
        return item;
    }, [[0, 0]], 0, summaryTableHeader);

    // Create error table
    createTable($("#errorsTable"), {"supportsControllersDiscrimination": false, "titles": ["Type of error", "Number of errors", "% in errors", "% in all samples"], "items": []}, function(index, item){
        switch(index){
            case 2:
            case 3:
                item = item.toFixed(2) + '%';
                break;
        }
        return item;
    }, [[1, 1]]);

        // Create top5 errors by sampler
    createTable($("#top5ErrorsBySamplerTable"), {"supportsControllersDiscrimination": false, "overall": {"data": ["Total", 50, 0, null, null, null, null, null, null, null, null, null, null], "isController": false}, "titles": ["Sample", "#Samples", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors"], "items": [{"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}]}, function(index, item){
        return item;
    }, [[0, 0]], 0);

});
