const express = require("express");
const app = express();
app.use(express.json());

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const path = require("path");

const dbPath = path.join(__dirname, "covid19India.db");

let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

const convertDbObjectToResponseObject = (dbObject) => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
    districtId: dbObject.district_id,
    districtName: dbObject.district_name,
    cases: dbObject.cases,
    cured: dbObject.cured,
    active: dbObject.active,
    deaths: dbObject.deaths,
  };
};

//GET States API
app.get("/states/", async (request, response) => {
  const getStatesQuery = `
        SELECT 
            * 
        FROM 
            state;`;
  const statesArray = await db.all(getStatesQuery);
  response.send(
    statesArray.map((eachState) => {
      return convertDbObjectToResponseObject(eachState);
    })
  );
});

//GET State API
app.get("/states/:stateId", async (request, response) => {
  const { stateId } = request.params;
  const getStateQuery = `
        SELECT 
            *
        FROM 
            state 
        WHERE 
            state_id = ${stateId};`;
  const state = await db.get(getStateQuery);
  response.send(convertDbObjectToResponseObject(state));
});

//ADD District API
app.post("/districts/", async (request, response) => {
  const districtDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;
  const addDistrictQuery = `
        INSERT INTO 
            district (district_name, state_id, cases, cured, active, deaths) 
        VALUES 
            ("${districtName}", ${stateId}, ${cases}, ${cured}, ${active}, ${deaths});
        `;
  await db.run(addDistrictQuery);
  response.send("District Successfully Added");
});

//GET District API
app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictQuery = `
        SELECT 
            * 
        FROM 
            district 
        WHERE 
            district_id = ${districtId};`;
  const district = await db.get(getDistrictQuery);
  response.send(convertDbObjectToResponseObject(district));
});

//REMOVE District API
app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteDistrictQuery = `
        DELETE FROM 
            district 
        WHERE 
            district_id = ${districtId};`;
  await db.run(deleteDistrictQuery);
  response.send("District Removed");
});

//UPDATE District API
app.put("/districts/:districtId", async (request, response) => {
  const { districtId } = request.params;
  const districtDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;
  const updateDistrictQuery = `
        UPDATE 
            district 
        SET 
            district_name = '${districtName}',
            state_id = ${stateId},
            cases = ${cases},
            cured = ${cured},
            active = ${active},
            deaths = ${deaths};
        `;
  await db.run(updateDistrictQuery);
  response.send("District Details Updated");
});

//GET State Statistics API
app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getStateStatsQuery = `
        SELECT 
            SUM(cases), SUM(cured), SUM(active), SUM(deaths)
        FROM 
            district 
        WHERE 
            state_id = ${stateId};`;
  const stats = await db.get(getStateStatsQuery);
  response.send({
    totalCases: stats["SUM(cases)"],
    totalCured: stats["SUM(cured)"],
    totalActive: stats["SUM(active)"],
    totalDeaths: stats["SUM(deaths)"],
  }); 
});
