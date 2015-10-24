/**
 * Creates an interactive hierarchical pie chart
 * @param  {Object} config [Configuration object]
 * @param  {Array} data   [Data object]
 */

/*

 */
pieChart = function(config, data){
    var self = this;
    var dataChain = [];     //stores parent object when going inside the tree
    var levelCounter = 0;   //keeps track of hierarchy
    this.oldPieData = [];
    var pie = Math.PI * 2;
    var hoverTime = 250;
    this.objBuffer = [];
    var pieChart = d3.layout.pie()
                    .value(function(d){ return d[config.valueProp]; });

    var color = d3.scale.ordinal()
            .range(['#ff7f0e', '#2ca02c', '#d62728', '#9467bd', '#8c564b', '#e377c2', '#7f7f7f', '#1f77b4','#8f7540', '#bcbd22', '#17becf', '#d7de85', '#754a5f', '#857c57', '#46a2b0', '#ff9896']);
	this.colorScale = color;
	var arc = d3.svg.arc()
            .innerRadius(config.innerRadius)
            .outerRadius(config.outerRadius);


    function pieTween(d, i) {
        var s0;
        var e0;
        if(self.oldPieData[i]){
            s0 = self.oldPieData[i].startAngle;
            e0 = self.oldPieData[i].endAngle;
        } else if (!(self.oldPieData[i]) && self.oldPieData[i-1]) {
            s0 = self.oldPieData[i-1].endAngle;
            e0 = self.oldPieData[i-1].endAngle;
        } else if(!(self.oldPieData[i-1]) && self.oldPieData.length > 0){
            s0 = self.oldPieData[self.oldPieData.length-1].endAngle;
            e0 = self.oldPieData[self.oldPieData.length-1].endAngle;
        } else {
            s0 = 0;
            e0 = 0;
        }
        var i = d3.interpolate({startAngle: s0, endAngle: e0}, {startAngle: d.startAngle, endAngle: d.endAngle});
        return function(t) {
            var b = i(t);
            return arc(b);
        };
    }

	function removePieTween(d, i) {
		s0 = 2 * Math.PI;
		e0 = 2 * Math.PI;
		var i = d3.interpolate({startAngle: d.startAngle, endAngle: d.endAngle}, {startAngle: s0, endAngle: e0});
		return function(t) {
			var b = i(t);
			return arc(b);
		};
	}

	function textTween(d, i) {
		var a;
		if(self.oldPieData[i]){
		a = (self.oldPieData[i].startAngle + self.oldPieData[i].endAngle - Math.PI)/2;
		} else if (!(self.oldPieData[i]) && self.oldPieData[i-1]) {
		a = (self.oldPieData[i-1].startAngle + self.oldPieData[i-1].endAngle - Math.PI)/2;
		} else if(!(self.oldPieData[i-1]) && self.oldPieData.length > 0) {
		a = (self.oldPieData[self.oldPieData.length-1].startAngle + self.oldPieData[self.oldPieData.length-1].endAngle - Math.PI)/2;
		} else {
		a = 0;
		}
		var b = (d.startAngle + d.endAngle - Math.PI)/2;

		var fn = d3.interpolateNumber(a, b);
		return function(t) {
			var val = fn(t);
			return "translate(" + Math.cos(val) * (config.outerRadius+config.textOffset) + "," + Math.sin(val) * (config.outerRadius+config.textOffset) + ")";
		};
	}

    this.init = function(){

		var container = d3.select(config.containerId);
		//container for buttons
		var c = container.append('div')
				.attr('id', 'pie-nav')
				.attr('class', 'btn-group')
				.style('visibility','hidden');
		addNavBtns(c,'btnRoot','Go back to root','fa-angle-double-left');
		addNavBtns(c,'btnLevelUp','Go up a level','fa-angle-left');

		var svg = container.append('div')
							.attr('class', 'chart-container')
							.append('svg')
							.attr('class', 'chart');

        //selecting svg element
        self.chart = svg.attr('width', config.width)
            .attr('height',config.height);

            //adding parent div for hover table
        d3.select('div.chart-container')
            .append('div')
            .attr('class', 'popup-window')
            .append('table')
            .attr('id', 'popup-table')
            .attr('class', 'table');

        self.groups = self.chart.append('g')
                                .attr('transform', 'translate('+config.width/2+','+ config.height/2 + ')');

        // group at the center of donut
        self.center_group = self.chart.append('g')
                                .attr("class", "center_group")
                                .attr("transform", "translate(" + (config.width/2) + "," + (config.height/2) + ")");

        self.center_group.append('circle')
                    .attr('cx', 0)
                    .attr('cy', 0)
                    .attr('r', config.innerRadius)
                    .attr('fill', 'white');

        self.center_group.append('text')
                    .attr('text-anchor', 'middle')
                    .attr('id', 'sub-total')
                    .attr('class', 'center-label')
                    .attr('dx', '-30')
                    .attr('fill', '#A1A1A1')
                    .text(0);

        self.center_group.append('text')
                    .attr('text-anchor', 'middle')
                    .attr('class', 'center-label')
                    .attr('fill', '#A1A1A1')
                    .text(' / ');
        // displaying total calls at the center
        self.totalValue = self.center_group.append('text')
                                .attr('text-anchor', 'middle')
                                .attr('class', 'center-label')
                                .attr('fill', '#A1A1A1')
                                .attr('dx', '30')
                                .text('0');

        //group for text labels
        self.label_group = self.chart.append("g")
                            .attr('class', 'label_group')
                            .attr("transform", "translate(" + (config.width/2) + "," + (config.height/2) + ")");

        self.btnLevelUp = document.getElementById('btnLevelUp');
        self.btnLevelUp.addEventListener('click', climbUpALevel);

        self.btnRoot = document.getElementById('btnRoot');
        self.btnRoot.addEventListener('click', goToRoot);

		var elm = document.getElementById('pie-nav');
        if(levelCounter) elm.style.visibility = 'visible';
        else elm.style.visibility = 'hidden';
    }

	/**
	 * Creates btn for pie chart navigation
	 * @param {String} c     Container selection for btn
	 * @param {String} id    id to assign to btn
	 * @param {String} title Title to display on hover
	 * @param {String} icon  Icon code to display inside (font awesome)
	 */
	function addNavBtns(c, id, title, icon){
		var b = c.append('a')
					.attr('href', '#')
					.attr('id', id)
					.attr('class', 'btn btn-default btn-small')
					.attr('title', title)
					.attr('rel', 'tooltip');
		b.append('i')
			.attr('class', 'fa '+icon);
	}

    this.updateChart = function(newData){
        self.oldPieData = self.objBuffer;
		if(levelCounter) goToRoot(); //if inside the tree, go to root level (levelCounter=0)
		data = newData;
        createPieChart(newData);
    }

    function createPieChart(data){
//		color.domain(data.map(function(d){ return d['id']}));
        //calculating total
		var sum = getSum(data,config.valueProp);
        var subTotal = sum;
        if(!levelCounter){
            var total = sum;
            self.totalValue.text(total);
        }
        $('#sub-total').text(subTotal);

        var elm = document.getElementById('pie-nav');
        if(levelCounter) elm.style.visibility = 'visible';
        else elm.style.visibility = 'hidden';

        self.objBuffer = pieChart(data);

        /*
            adding arcs of donut chart
         */
        var arcs = self.groups.selectAll('path')
            .data((pieChart(data)), function(d){ return d.data.id; });

        arcsEnter = arcs.enter().append('path');
        var timer;
        arcs.attr('class', function(d){
                if(d.data[config.subProp]) return 'hover-effect arc';
                else return 'arc';
                        })
            .attr('fill', function(d){ return color(d.data['id']); })
            .attr("stroke", 'white')
            .attr("stroke-width", 0.5)
            .on('mouseenter', function(d){
					var arcOver = d3.svg.arc()
									.outerRadius(config.outerRadius+10)
									.innerRadius(config.innerRadius);
					d3.select(this)
						.transition()
						.delay(100)
						.duration(hoverTime)
						.attr('d', arcOver)
						.each(function(d){
							var fillColor = $(this).attr('fill');
							// console.log(this.getBoundingClientRect());
							var ev = event;
							if(timer){
								clearTimeout(timer);
								timer = null;
							}
							timer = setTimeout(function(){
								if(d.data[config.subProp])	showHoverWindow(d, config.hoverProps, ev, fillColor);
							},1000)
						})
			})
            .on('mouseleave', function(d){
					var arcOver = d3.svg.arc()
									.outerRadius(config.outerRadius)
									.innerRadius(config.innerRadius);

					if(timer){
						clearTimeout(timer);
						timer = null;
					}
					self.removePopup(config.slideTime); //remove popup
					d3.select(this)
						.transition()
						.duration(hoverTime)
						.attr('d', arcOver);
			})
            .on('click', function(d,i){
					if(d.data[config.subProp]){
						self.newLevelProp = d.data[config.labelProp];
						sendEvent(self.newLevelProp);
						dataChain.push(d.data);
						levelCounter++;
						//On click, remove the popup table
						if(timer){
							clearTimeout(timer);
							timer = null;
						}
						self.removePopup(0);
						self.oldPieData = [];
						createPieChart(d.data[config.subProp]);
					}
			})
            .transition().duration(config.duration).attrTween("d", pieTween);

        //exit selection
        arcs.exit()
            .transition()
            .attrTween("d", removePieTween)
            .remove();

        /*
            adding text labels for each arc
         */
        var text = self.label_group.selectAll('text')
                    .data(pieChart(data), function(d){ return d.data.id; });

        textEnter = text.enter().append('text');
        // text.attr('transform', function(d){
        //     return "translate(" + Math.cos(((d.startAngle+d.endAngle - Math.PI)/2)) * (config.outerRadius+config.textOffset) + "," + Math.sin((d.startAngle+d.endAngle - Math.PI)/2) * (config.outerRadius+config.textOffset) +")";
        // })
        text.attr("text-anchor", function(d) {
            return (d.endAngle + d.startAngle)/2 > Math.PI ?
                "end" : "start";
        })
        .attr('class', 'font-label')
        .attr('fill', '#A1A1A1')
        .text(function(d){
            return d.data[config.labelProp];
        });
        text.transition().duration(config.duration).attrTween("transform", textTween);

        text.exit()
            .remove();

    }

	function getSum(data, prop){
		var sum = 0;
        data.forEach(function(item){
            sum+=item[prop];
        });
		return sum;
	}

    this.removePopup = function(time){
        $('div.popup-window').slideUp(time, function(){
            d3.select('table#popup-table').selectAll("*").remove();
        });
    }

    function climbUpALevel(){
    	if(!levelCounter || levelCounter == 1)
    		return goToRoot();
    	dataChain.splice(dataChain.length-1,1);
    	levelCounter--;
        self.oldPieData = []
    	createPieChart(dataChain[dataChain.length-1][config.subProp]);
		sendEvent(null);
    }

    function goToRoot(){
    	levelCounter = 0;
    	dataChain = [];
        self.oldPieData = []
    	createPieChart(data);
		sendEvent(null);
	}

	this.goToRoot = goToRoot;

	function sendEvent(data){
		var event = new CustomEvent('path-clicked',{'detail': data});
		document.dispatchEvent(event);
	}

    /**
     * Creates a hover table over an arc displaying children under the property subProp
     * @param  {Object} d       arc's data object
     * @param  {Array} columns  Property names whose values to be shown in table
     * @param  {Object} event   Mouse event
     * @param  {String} fill    Background color of the table
     */
    function showHoverWindow(d, columns, event, fill){
		var totalAllocatedCalls = getSum(d.data[config.subProp], 'attempted_calls');
		d.data.attempted_calls = totalAllocatedCalls;
    	var popupDiv = d3.select('table#popup-table');
        var evenColor = colorLuminance(fill, 0.2);
        var oddColor = colorLuminance(fill, -0.2);
    	popupDiv.append('thead')
                .style({'background-color': fill})
				.append('tr')
				.selectAll('td')
				.data(columns)
				.enter()
				.append('td')
				.html(function(c){ return d.data[c]; });

    	var tBody = popupDiv.append('tbody');
    	var tr = tBody.selectAll('tr')
    					.data(d.data[config.subProp])
    					.enter()
    					.append('tr');

    	tr.selectAll('td')
    		.data(function(d){
    			return columns.map(function(c){
    				return {column: c, value: d[c]};
    			});
    		})
    		.enter().append('td')
    		.html(function(d){ return d.value });

		d3.selectAll('table#popup-table>tbody>tr:nth-child(even)')
			.style({'background-color': evenColor});
		d3.selectAll('table#popup-table>tbody>tr:nth-child(odd)')
			.style({'background-color': oddColor});

		var div = $('div.popup-window');
		div.css('left', event.x);
		div.css('top', event.y+5);
		div.slideDown(config.slideTime);
            // popupDiv.on('mouseenter', function(){
            //     self.onTable = true;
            // })
            // .on('mouseleave', function(){
            //     self.onTable = false;
            // })
    }

    function colorLuminance(hex, lum) {
    	// validate hex string
    	hex = String(hex).replace(/[^0-9a-f]/gi, '');
    	if (hex.length < 6) {
    		hex = hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2];
    	}
    	lum = lum || 0;
    	// convert to decimal and change luminosity
    	var rgb = "#", c, i;
    	for (i = 0; i < 3; i++) {
    		c = parseInt(hex.substr(i*2,2), 16);
    		c = Math.round(Math.min(Math.max(0, c + (c * lum)), 255)).toString(16);
    		rgb += ("00"+c).substr(c.length);
    	}
    	return rgb;
    }

	self.init();
    if(data && data.length){
    	createPieChart(data);
	}
//	else
}
