/**
 * Alert the user about something. Currently uses a modal dialog for alerts.
 * @param {String} message What this alert is about
 * @param {String} explanation Why this alert is happening
 */
function alert_user (message, explanation) {
	$("#modal-info h4").text(message);
	$("#modal-info p").text(explanation);
	$("#modal-info").modal();
}

/**
 * Too much trouble to make a hobby website work with IE. Just tell the user about it.
 */
function warn_ie () {
	// http://stackoverflow.com/a/19999868/257583
	if (window.navigator.userAgent.indexOf("MSIE ") > 0 || !!navigator.userAgent.match(/Trident.*rv\:11\./)) {
		alert("Sorry, this website currently does not work at all with Internet Explorer. Please try using another browser.");
	}
}

// call the function as soon as this file is loaded
warn_ie();