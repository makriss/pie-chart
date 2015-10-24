# pie-chart
Creates an interactive, dynamic and multi level pie chart

PRE REQUISITES-
1. Besides d3, include following libraries as well
    jQuery
    bootstrap.min.css
    font-awesome.min.css

HOW TO START-
1. Create a container element in your html file, Eg-
        <div id="chart-container">
        </div>

2. Include pie-chart.css and pie-chart.js in your code

3. Create a configuration object as given below-
        Dummy configuration object
        config = {
            width: 450,             //width of the svg
            height: 350,            //height of svg
            innerRadius: 90,        //inner radius of the donut (if 0 => will give a pie chart)
            outerRadius: 150,       //outer radius of the donut
            duration: 1000,         //transition duration for pie chart
            textOffset: 15,         //offset distance of text labels from donut
            valueProp: 'cost',      //numeric property name in the passed in array
            labelProp: 'category',  //property name whose values will be used to display labels around the donut
            subProp: 'categories',  //(tree node) property under which children array is stored
            hoverProps: ['category', 'cost'], //columns to be displayed in hover table
            slideTime: 250,                      //hover table transition time
            containerId: '#chart-container'   //id of the containing div
        }

4. Instantiate pieChart and pass in config and data object

5. Voila!

IMPORTANT POINTS-
1. Each object MUST have an id property, which should be unique in the entire data object hierarchy

2. Passed in data should be an array of objects (Sample data given in index.html)
