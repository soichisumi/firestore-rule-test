const firebase = require("@firebase/testing");
const fs = require("fs");

const projectIdBase = "firestore-emulator-example-" + Date.now();

const rules = fs.readFileSync("firestore.rules", "utf8");

let testNumber = 0;

function getProjectId() {
  return `${projectIdBase}-${testNumber}`;
}

beforeEach(async () => {
  testNumber++;
  await firebase.loadFirestoreRules({
    projectId: getProjectId(),
    rules: rules
  });
});

after(async () => {
  await Promise.all(firebase.apps().map(app => app.delete()));
});

function getDB(auth) {
  return firebase
    .initializeTestApp({
      projectId: getProjectId(),
      auth: auth
    })
    .firestore();
}

describe("Test rule", () => {
  it("can r/w to open1", async () => {
    const db = getDB(null);
    const target = db.collection("open1").doc("data");
    await firebase.assertSucceeds(target.get());
    await firebase.assertSucceeds(target.set({ data: "yo" }));
  });

  it("cannot r/w to deep document of open1", async ()=> {
    const db = getDB(null);
    const target = db.doc("open1/data/col/data");
    await firebase.assertFails(target.get());
    await firebase.assertFails(target.set({data: "yo"}));
  });

  it("can r/w to open2", async () => {
    const db = getDB(null);
    const target = db.collection("open2").doc("data");
    await firebase.assertSucceeds(target.get());
    await firebase.assertSucceeds(target.set({ data: "yo" }));
  });

  it("can r/w to deep document of open2", async ()=> {
    const db = getDB(null);
    const target = db.doc("open2/data/col/data");
    await firebase.assertSucceeds(target.get());
    await firebase.assertSucceeds(target.set({data: "yo"}));
  })

  it("can r/w to users/private if authenticated", async () => {
    const db = getDB({ uid: "user1" });
    const target = db.collection("users/user1/private").doc("testdoc");
    await firebase.assertSucceeds(target.get());
    await firebase.assertSucceeds(target.set({ uid: "user1", age: 20 }));
  });

  it("can r/w to users/private if authenticated with other user", async () => {
    const db = getDB({ uid: "dummy_user" });
    const target = db.collection("users/user1/private").doc("testdoc");
    await firebase.assertFails(target.get());
    await firebase.assertFails(target.set({ uid: "user1", age: 20 }));
  });
  
  it("cannot r/w to users/private if unauthenticated", async () => {
    const db = getDB(null);
    const target = db.collection("users/user1/private").doc("testdoc");
    await firebase.assertFails(target.get());
    await firebase.assertFails(target.set({ uid: "user1", age: 20 }));
  });

  it("can r/w to users/private if unauthenticated", async () => {
    const db = getDB(null);
    const target = db.collection("users/user1/private").doc("testdoc");
    await firebase.assertFails(target.get());
    await firebase.assertFails(target.set({ uid: "user1", age: 20 }));
  });

  it("can r/w to users/public if unauthenticated", async () => {
    const db = getDB(null);
    const target = db.collection("users/user1/public").doc("testdoc");
    await firebase.assertSucceeds(target.get());
    await firebase.assertFails(target.set({ uid: "user1", age: 20 }));
  });

  it("cannot r/w to any collection which has any firestore rule", async () => {
    const db = getDB({uid: "user1"});
    const target = db.collection("OtherCollection").doc("testdoc");
    await firebase.assertFails(target.get());
    await firebase.assertFails(target.set({ data: "test"}));
  });
});