const axios = require("axios");
const { doWhilst } = require("async");
const config = {
    headers: { Authorization: `Bearer ${process.env.TOKEN}` },
};

class DB {
    async getAll(link) {
        const pageCount = 100;
        let allRecords = [],
            noOfPages = 0,
            cursor = 0;
        await doWhilst(
            async () => {
                try {
                    const { data } = await axios.get(
                        `${link}?cursor=${cursor}`,
                        config
                    );
                    const { remaining, results } = data.response;
                    if (allRecords.length) {
                        noOfPages -= 1;
                    } else {
                        noOfPages = Math.ceil(remaining / pageCount);
                    }
                    cursor += results.length;
                    allRecords = [...allRecords, ...results];
                    return Boolean(noOfPages);
                } catch (err) {
                    console.log("Error: ", err);
                }
            },
            (hasMorePages, cb2) => {
                cb2(null, hasMorePages);
            }
        );
        return allRecords;
    }

    async updateElement(id, pair, valueOld, valueNew, openInterest) {
        if (
            pair != undefined &&
            valueOld != undefined &&
            valueNew != undefined &&
            openInterest != undefined
        ) {
            await axios.put(
                `${link}/${id}`,
                {
                    pair: pair,
                    "value-old": valueOld,
                    "value-new": valueNew,
                    "open-int%": openInterest,
                },
                config
            );
        } else {
            console.log("Some data is undefined");
        }
    }

    async checkUNIX(unixStampLink) {
        let obj = await this.getAll(unixStampLink);
        if (unixStampLink) {
            let dateNow = Date.now();
            let timestamp = obj["data-time-unix"];
            if (dateNow > timestamp) {
                axios.put(
                    `${link}/${obj["_id"]}`,
                    {
                        "data-time-unix": dateNow + TIMEOUT_IN_MINUTES * 60,
                    },
                    config
                );
                return 0;
            }
            return timestamp - dateNow;
        } else {
            console.log("Bubble io database is offline or data set is empty");
        }
    }
}

module.exports = new DB();
