//////// array of possible dimensions the user could chose to visualize
var dimension_options = ["BattleNumber", "AttackerSizeApproximate","DefenderSizeApproximate","year", "attacker1",  "defender1", "AttackerOutcome", "BattleType","MajorDeath","MajorCapture","season","Location","region",]
//////// array of dimensions, the user has chosen to visualize or are given as starting example
var selected_options = ["AttackerSizeApproximate","year","season","region",]


/////////////   replaces all examples of a certain character in a string
function findAndReplace(string, target, replacement) {
 var i = 0, length = string.length;
 for (i; i < length; i++) {
   string = string.replace(target, replacement);
 }
 return string;
}

///////////////// returns array of only unique items in the given array
function uniq(a) {
    return a.sort().filter(function(item, pos, ary) {
        return !pos || item != ary[pos - 1];
    })
}

//////// removes an item from array if present
function removeA(arr) {
    var what, a = arguments, L = a.length, ax;
    while (L > 1 && arr.length) {
        what = a[--L];
        while ((ax= arr.indexOf(what)) !== -1) {
            arr.splice(ax, 1);
        }
    }
    return arr;
}

/////// builds drop-down options as li 
function build_dd_list(dimension_options,selected_options){
  $("ul#dimensions_list").empty()
  for (dimension in dimension_options){
    var checked_class = "not_checked";
    console.log("build_dd_list check array thing missing words, ", dimension_options[dimension])
    if (selected_options.indexOf(dimension_options[dimension]) !== -1){
      checked_class = "checked"
    }
  var dimension_id = String(dimension_options[dimension]);
  console.log("type = ", typeof(dimension_id))
  console.log("dimension_id=",dimension_id)
  dimension_id = findAndReplace(dimension_id," ","_")
  console.log("dimension_id=",dimension_id)
  $("ul#dimensions_list").append("<li><a id="+dimension_id+" class=' "+checked_class+" dimensions '"+">"+dimension_id+"</a></li>")
  }
};

////////// listens for when document is ready and builds drop-down options as li using the function above, build_dd_list
$(document).ready(function(){
  build_dd_list(dimension_options,selected_options)
})

///// when document ready, this handles the user interface of clicks resulting in 
///// changing CSS classes and putting items in and out of the selected diemnsions array
$(document).ready(function(){
  $("li a.dimensions").click(function(){
    var nonsense = $(this).hasClass("not_checked");
    if ($(this).hasClass("not_checked")===true){
      $(this).removeClass("not_checked");
      $(this).addClass("checked");
      var id_helper = $(this).attr('id')
      // id_helper = id_helper.split('_').join(" ");
      id_helper = findAndReplace(id_helper,"_"," ")
      selected_options.push(id_helper);
    }
    else{
      $(this).addClass("not_checked");
      $(this).removeClass("checked");
      var id_helper = $(this).attr('id')
      id_helper = findAndReplace(id_helper,"_"," ")
      removeA(selected_options, id_helper);
    }
    
    selected_options = uniq(selected_options);
    console.log("check ",nonsense)
    console.log("check selected_options ", selected_options)
  })

  $("li a.dimensions").mousedown(function(){
    $(this).addClass("mouseD")
  })
  $("li a.dimensions").mouseup(function(){
    $(this).removeClass("mouseD")
  })
})

//////////////////////////////////////////  


function build_parallel_sets(curves_checkbox){
  var chart = d3.parsets()
      .dimensions(selected_options);
          // .dimensions(["Bureau", "Bureau From", "Org", "Org From",  "Date Effective",  "Noa 1", "Noa Table Id 1",  "Grade", "Grade Or Level From", "Occ Series",  "Psn Occ", "Retire Plan Desc",  "Step",  "Supv Status Desc",  "Vet Pref",  "Center",  "CenterFrom",  "Age Group", "S&E", "Combined"]);
  var vis = d3.select("#vis").append("svg")
      .attr("width", chart.width())
      .attr("height", chart.height());

  var partition = d3.layout.partition()
      .sort(null)
      .size([chart.width(), chart.height() * 5 / 4])
      .children(function(d) { return d.children ? d3.values(d.children) : null; })
      .value(function(d) { return d.count; });

  var ice = false;

  function curves() {
    var t = vis.transition().duration(500);
    if (ice) {
      t.delay(1000);
      icicle();
    }
    // t.call(chart.tension(curves_checkbox ? .5 : 1));
    if (curves_checkbox === true){var curves_checkbox2 =.5;}
    if (curves_checkbox === false){var curves_checkbox2 =.5}
    t.call(chart.tension(curves_checkbox2));
  }


  // function curves() {
  //   var t = vis.transition().duration(500);
  //   if (ice) {
  //     t.delay(1000);
  //     icicle();
  //   }
  //   t.call(chart.tension(this.checked ? .5 : 1));
  // }

  d3.csv("ParaSet_transfer/titanic.csv", function(error, csv) {
    vis.datum(csv).call(chart);

    window.icicle = function() {
      var newIce = this.checked,
          tension = chart.tension();
      if (newIce === ice) return;
      if (ice = newIce) {
        var dimensions = [];
        vis.selectAll("g.dimension")
           .each(function(d) { dimensions.push(d); });
        dimensions.sort(function(a, b) { return a.y - b.y; });
        var root = d3.parsets.tree({children: {}}, csv, dimensions.map(function(d) { return d.name; }), function() { return 1; }),
            nodes = partition(root),
            nodesByPath = {};
        nodes.forEach(function(d) {
          var path = d.data.name,
              p = d;
          while ((p = p.parent) && p.data.name) {
            path = p.data.name + "\0" + path;
          }
          if (path) nodesByPath[path] = d;
        });
        var data = [];
        vis.on("mousedown.icicle", stopClick, true)
          .select(".ribbon").selectAll("path")
            .each(function(d) {
              var node = nodesByPath[d.path],
                  s = d.source,
                  t = d.target;
              s.node.x0 = t.node.x0 = 0;
              s.x0 = t.x0 = node.x;
              s.dx0 = s.dx;
              t.dx0 = t.dx;
              s.dx = t.dx = node.dx;
              data.push(d);
            });
        iceTransition(vis.selectAll("path"))
            .attr("d", function(d) {
              var s = d.source,
                  t = d.target;
              return ribbonPath(s, t, tension);
            })
            .style("stroke-opacity", 1);
        iceTransition(vis.selectAll("text.icicle")
            .data(data)
          .enter().append("text")
            .attr("class", "icicle")
            .attr("text-anchor", "middle")
            .attr("dy", ".3em")
            .attr("transform", function(d) {
              return "translate(" + [d.source.x0 + d.source.dx / 2, d.source.dimension.y0 + d.target.dimension.y0 >> 1] + ")rotate(90)";
            })
            .text(function(d) { return d.source.dx > 15 ? d.node.name : null; })
            .style("opacity", 1e-6))
            .style("opacity", 1);
        iceTransition(vis.selectAll("g.dimension rect, g.category")
            .style("opacity", 1))
            .style("opacity", 1e-6)
            .each("end", function() { d3.select(this).attr("visibility", "hidden"); });
        iceTransition(vis.selectAll("text.dimension"))
            .attr("transform", "translate(0,-5)");
        vis.selectAll("tspan.sort").style("visibility", "hidden");
      } else {
        vis.on("mousedown.icicle", null)
          .select(".ribbon").selectAll("path")
            .each(function(d) {
              var s = d.source,
                  t = d.target;
              s.node.x0 = s.node.x;
              s.x0 = s.x;
              s.dx = s.dx0;
              t.node.x0 = t.node.x;
              t.x0 = t.x;
              t.dx = t.dx0;
            });
        iceTransition(vis.selectAll("path"))
            .attr("d", function(d) {
              var s = d.source,
                  t = d.target;
              return ribbonPath(s, t, tension);
            })
            .style("stroke-opacity", null);
        iceTransition(vis.selectAll("text.icicle"))
            .style("opacity", 1e-6).remove();
        iceTransition(vis.selectAll("g.dimension rect, g.category")
            .attr("visibility", null)
            .style("opacity", 1e-6))
            .style("opacity", 1);
        iceTransition(vis.selectAll("text.dimension"))
            .attr("transform", "translate(0,-25)");
        vis.selectAll("tspan.sort").style("visibility", null);
      }
    };
    d3.select("#icicle")
        .on("change", icicle)
        .each(icicle);
  });

  function iceTransition(g) {
    return g.transition().duration(1000);
  }

  function ribbonPath(s, t, tension) {
    var sx = s.node.x0 + s.x0,
        tx = t.node.x0 + t.x0,
        sy = s.dimension.y0,
        ty = t.dimension.y0;
    return (tension === 1 ? [
        "M", [sx, sy],
        "L", [tx, ty],
        "h", t.dx,
        "L", [sx + s.dx, sy],
        "Z"]
     : ["M", [sx, sy],
        "C", [sx, m0 = tension * sy + (1 - tension) * ty], " ",
             [tx, m1 = tension * ty + (1 - tension) * sy], " ", [tx, ty],
        "h", t.dx,
        "C", [tx + t.dx, m1], " ", [sx + s.dx, m0], " ", [sx + s.dx, sy],
        "Z"]).join("");
  }

  function stopClick() { d3.event.stopPropagation(); }

  // Given a text function and width function, truncates the text if necessary to
  // fit within the given width.
  function truncateText(text, width) {
    return function(d, i) {
      var t = this.textContent = text(d, i),
          w = width(d, i);
      if (this.getComputedTextLength() < w) return t;
      this.textContent = "…" + t;
      var lo = 0,
          hi = t.length + 1,
          x;
      while (lo < hi) {
        var mid = lo + hi >> 1;
        if ((x = this.getSubStringLength(0, mid)) < w) lo = mid + 1;
        else hi = mid;
      }
      return lo > 1 ? t.substr(0, lo - 2) + "…" : "";
    };
  }

  d3.select("#file").on("change", function() {
    var file = this.files[0],
        reader = new FileReader;
    reader.onloadend = function() {
      var csv = d3.csv.parse(reader.result);
      vis.datum(csv).call(chart
          .value(csv[0].hasOwnProperty("Number") ? function(d) { return +d.Number; } : 1)
          .dimensions(function(d) { return d3.keys(d[0]).filter(function(d) { return d !== "Number"; }).sort(); }));
    };
    reader.readAsText(file);
  });
}

/////////////////////////////////////////

$(document).ready(function(){
  build_parallel_sets()
})


$(document).ready(function(){
  $("a.rebuild").click(function(){
    $("div#vis").empty();
    build_parallel_sets();
  })
})

$(document).ready(function(){
  $("button.rebuild").click(function(){
    $("div#vis").empty();
    build_parallel_sets();
  })
})

// function curves() {
//     var t = vis.transition().duration(500);
//     if (ice) {
//       t.delay(1000);
//       icicle();
//     }
//     t.call(chart.tension(this.checked ? .5 : 1));
//   }

$(document).ready(function(){
  $("input#curved").click(function(){
    $("div#vis").empty();
    var checked=true 
    build_parallel_sets(checked)
    // bigViz.curves(this);
    ////var bigViz = build_parallel_sets().curves.call(this);
  })
})


