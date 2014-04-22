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