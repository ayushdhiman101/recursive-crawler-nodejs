const cheerio = require("cheerio");
const axios = require("axios");
const fs = require("fs");
const baseUrl = "https://stackoverflow.com";
const trmUrl = baseUrl + "/questions";
const MongoClient = require('mongodb').MongoClient;
const csvwriter = require('csv-writer');
var createCsvWriter = csvwriter.createObjectCsvWriter


const fetchPage = async(url, n) => {
    try {
        const result = await axios.get(url);
        return result.data;
    } catch (err) {
        if (n === 0) throw err;

        console.log("fetchPage(): Waiting For 3 seconds before retrying the request.")
        console.log(`Request Retry Attempt Number: ${n} ====> URL: ${url}`)
        return await fetchPage(url, n - 1);
    }
};

const questions = async() => {
    try {
        const html = await fetchPage(trmUrl, 5);
        const $ = cheerio.load(html);
        const questionBank = $('#questions > .question-summary ').map(async(index, element) => {

            // 1) EVERY UNIQUE URL (STACK OVERFLOW QUESTION).
            let link = $(element).find('.summary > h3 > a').attr('href');

            // 2) THE TOTAL REFERENCE COUNT FOR EVERY URL (HOW MANY TIMES THIS URL WAS ENCOUNTERED).

            let views = $(element).find('.statscontainer > .views').text();

            // 3) TOTAL # OF UPVOTES AND TOTAL # OF ANSWERS FOR EVERY QUESTION.

            // COUNT OF VOTES
            let votes = $(element).find('.statscontainer > .stats > .vote > .votes > .vote-count-post').text();

            // NUMBER OF ANSWERS
            let answers = $(element).find('.statscontainer > .stats > .answered > *').text();
            if (answers == '') {
                let num = 0;
                answers = num.toString();
            }

            // 4)ADITIONAL FEATURE - NUMBER OF TIMES OUR CRAWLER HAS ENCOUNTERED A PARTICULAR QUESTION (COUNT INCREASES BY 1 IF THE QUESTION LINK ALREADY IN JSON FILE) 
            var json = require('./questionBankList.json');
            let count = 1;
            let unique = link;
            for (var index = 0; index < json.length; ++index) {
                var a = json[index];
                if (a.link == unique) {
                    count = a.count
                    count++;
                    break;
                }
            }
            return {
                link,
                views,
                votes,
                answers,
                count
            }
        }).get();

        return Promise.all(questionBank);

    } catch (error) {
        throw error;
    }
}

questions().then(results => {
    console.log("number of results: " + results.length);
    exportResults(results, "./questionBankList.json");
    exportToMongoDB(results);
    jsonToCSV(results);
    //console.log(results);
}).catch(err => {
    console.log("Error while fetching questions :::: " + err);
})


const exportResults = (results, outputFile) => {
    try {
        fs.writeFile(outputFile, JSON.stringify(results, null, 4), (err) => {
            if (err) {
                console.log(err);
            }
            console.log('\n' + results.length + ' Results exported successfully to ' + outputFile);
        })
    } catch (error) {
        throw error;
    }


}

const exportToMongoDB = (results, outputFile) => {
    var url = "mongodb://localhost:27017/";
    MongoClient.connect(url, function(err, db) {
        if (err) throw err;
        var dbo = db.db("stackoverflowQuestions");
        var myobj = { results };
        dbo.collection("questionsDB").insertOne(myobj, function(err, res) {
            if (err) throw err;
            console.log("1 document inserted");
            db.close();
        });
    });
}

const jsonToCSV = (results) => {
    const csvWriter = createCsvWriter({
        // OUTPUT CSV
        path: 'question-data.csv',
        header: [

            // COLUMN NAMES
            { id: 'link', title: 'LINK' },
            { id: 'views', title: 'VIEWS' },
            { id: 'votes', title: 'VOTES' },
            { id: 'answers', title: 'ANSWERS' },
            { id: 'count', title: 'COUNT' }
        ]
    });
    // ADD VALUES
    csvWriter
        .writeRecords(results)
        .then(() => console.log('Data uploaded into csv successfully'));
}