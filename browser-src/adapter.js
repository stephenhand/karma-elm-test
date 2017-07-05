/**
 * Created by stephen.hand on 18/06/2017.
 */
(function(window){
    var karma = window.__karma__;
    karma.start = function(){
        var app = window.Elm.Bootstrap.fullscreen();

        app.ports.sendReport.subscribe(function(report) {
            if (report.infoOnly){
                karma.info(report.title);
                app.ports.acknowledge.send(true);
            }
            else if (typeof(report.testsToRun)==="number") {
                karma.info({total: report.testsToRun});
                app.ports.acknowledge.send(true);
            }
            else if (report.runComplete) {
                karma.complete();
                app.ports.acknowledge.send(false);
            }
            else{
                karma.result({
                    id: '',
                    description: report.title,
                    suite: [],
                    success: report.success,
                    skipped: report.skipped,
                    pending: false,
                    time: 0,
                    log:  [],
                    assertionErrors: [],
                    startTime: Date.now(),
                    endTime: Date.now()
                });
                app.ports.acknowledge.send(true);
            }
        });
    };
})(window);