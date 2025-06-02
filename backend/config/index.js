const primary = mongoose.createConnection(
  process.env.USERS_WEB_URI,
  { dbName: 'users_web', useNewUrlParser: true, useUnifiedTopology: true }
);

const preAssessment = mongoose.createConnection(
  process.env.PRE_ASSESS_URI,
  { dbName: 'Pre_Assessment', useNewUrlParser: true, useUnifiedTopology: true }
);

const testDb = mongoose.createConnection(
  process.env.TEST_URI,
  { dbName: 'test', useNewUrlParser: true, useUnifiedTopology: true }
);
