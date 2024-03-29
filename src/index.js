require("dotenv").config();
const axios = require("axios");
const db = require("./dbController");

const cryptoLink = process.env.BASE_LINK;

const start = async () => {
    try {
        console.log(`Starting script`);
        let allData = await db.getAll(cryptoLink);
        if (allData && allData.length) {
            for (const objData of allData) {
                try {
                    let newData;
                    try {
                        newData = await axios.get(
                            `https://fapi.binance.com/fapi/v1/openInterest?symbol=${objData["pair"]}`
                        );
                    } catch (error) {
                        if (error.response && error.response.status === 418) {
                            const retryAfter =
                                error.response.headers["retry-after"];
                            console.log(
                                `https://fapi.binance.com/fapi/v1/openInterest?symbol=${objData["pair"]} Received status 418. \nWaiting ${retryAfter} seconds before retrying.`
                            );
                            await new Promise((resolve) =>
                                setTimeout(resolve, retryAfter * 1000)
                            );
                            newData = await axios.get(
                                `https://fapi.binance.com/fapi/v1/openInterest?symbol=${objData["pair"]}`
                            );
                        }
                        if (error.response && error.response.status === 400) {
                            console.log(
                                `https://fapi.binance.com/fapi/v1/openInterest?symbol=${objData["pair"]} Received status 400.`
                            );
                            continue;
                        } else {
                            console.log(
                                `For https://fapi.binance.com/fapi/v1/openInterest?symbol=${objData["pair"]} ` +
                                    error.message
                            );
                        }
                    }

                    if (newData && newData.data) {
                        let valueNew = newData.data.openInterest;
                        let valueOld = objData["value-new"] || 1;
                        let openInterest = (
                            (valueNew * 100) / valueOld -
                            100
                        ).toFixed(2);
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
                        `For https://fapi.binance.com/fapi/v1/openInterest?symbol=${objData["pair"]} ` +
                            error.message
                    );
                    continue;
                }
            }
            console.log("Script succefully ended");
        } else {
            console.log("Bubble io database is offline or data set is empty");
        }
        process.exit(0);
    } catch (error) {
        console.log(error);
        process.exit(0);
    }
};

start(); // Start the server
