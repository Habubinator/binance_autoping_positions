require("dotenv").config();
const axios = require("axios");
const db = require("./dbController");

const checkApi = async () => {
    let allData = await db.getAll();
    for (const objData of allData) {
        try {
            const newData = await axios.get(
                `https://fapi.binance.com/fapi/v1/openInterest?symbol=${objData["pair"]}`
            );
            if (newData.data) {
                valueNew = newData.data.openInterest;
                valueOld = objData["value-new"] || 1;
                openInterest = (valueNew * 100) / valueOld - 100;
                console.log(`${objData.pair} - ${openInterest}%`);
                db.updateElement(
                    objData._id,
                    objData.pair,
                    valueOld,
                    valueNew,
                    openInterest
                );
            }
        } catch (error) {
            console.log(
                `For https://fapi.binance.com/fapi/v1/openInterest?symbol=${objData["pair"]}` +
                    error.message
            );
            continue;
        }
    }
};

const start = async () => {
    try {
        checkApi().then(() =>
            setTimeout(checkApi, process.env.TIMEOUT_IN_MINUTES * 60 * 1000)
        );
    } catch (error) {
        console.log(error);
    }
};

start(); // Start the server
