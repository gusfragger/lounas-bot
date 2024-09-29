const schedule = require("node-schedule");

function scheduleDaily(job) {
  // Schedule job to run at 10 AM on weekdays (Monday to Friday)
  return schedule.scheduleJob("0 10 * * 1-5", job);
}

module.exports = { scheduleDaily };
