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
                `${process.env.BASE_LINK}/${id}`,
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
}

module.exports = new DB();
