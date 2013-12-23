function resize_canvas() {
    var div = document.getElementById("graph_container");
    var canvas = document.getElementById("graph");
    canvas.height = div.offsetHeight;
    canvas.width  = div.offsetWidth;
}

function draw_graph() {
	var canvas = document.getElementById('graph');
	if (canvas.getContext) {
        var ctx = canvas.getContext("2d");

        ctx.fillStyle = "rgb(200,0,0)";
        ctx.fillRect (10, 10, 55, 50);

        ctx.fillStyle = "rgba(0, 0, 200, 0.5)";
        ctx.fillRect (30, 30, 55, 50);
    }
}