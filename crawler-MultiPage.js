// Node Dependencies
const cheerio = require("cheerio");
const axios = require("axios");
const fs = require("fs");
const csvjson = require('csvjson');
const MongoClient = require('mongodb').MongoClient;

//Base URL
let trmUrl = "https://stackoverflow.com/questions";
//URL for different pages
let nextpage = trmUrl + "?tab=active&page=";
// Keeps track of page numbers
let i = 1;


// Function call with total number of pages to crawl
recursiveFunction(100);


//Recursive Function to Fetch Data
function recursiveFunction(rep) {
    if (rep == 0) return;
    trmUrl = nextpage + i;
    console.log(trmUrl);
    i += 1;
    fetchData(trmUrl);
    recursiveFunction(rep - 1);
}

// Function to Fetch Data from the given URL
function fetchData(URL) {

    // Uses Axios to make http requests 
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

    // Used to get particular values needed from DOM Structure of the html
    const questions = async() => {
            try {
                const html = await fetchPage(URL, 5);
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
                    return {
                        link,
                        views,
                        votes,
                        answers

                    }
                }).get();

                return Promise.all(questionBank);

            } catch (error) {
                throw error;
            }
        }
        //Exports results data to JSON file and keeps on appending new values
    const exportResults = (results, outputFile) => {
            try {
                var data = fs.readFileSync(outputFile);
                var myObject = JSON.parse(data);
                myObject.push(results);
                var newData2 = JSON.stringify(myObject);
                fs.writeFile(outputFile, newData2, (err) => {
                    if (err) throw err;
                    console.log("New data added");
                });
            } catch (error) {
                throw error;
            }
        }
        // Stores data locally in MongoDB server
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

    // Gets the result values (link,views,votes,answers) and calls 2 more functions. One to store data in JSON file, other to store data in Mongo DB 
    questions().then(results => {
        console.log("number of results: " + results.length);
        exportResults(results, "questionBankList.json");
        exportToMongoDB(results);
        console.log(results);
    }).catch(err => {
        console.log("Error while fetching questions :::: " + err);
    })

}


//Function call to convert JSON file to CSV
saveJsonToCsv();


//Exports results data to CSV file and keeps on appending new values
function saveJsonToCsv() {
    const readFile = fs.readFile;
    const writeFile = fs.writeFile;

    readFile('./questionBankList.json', 'utf-8', (err, fileContent) => {
        if (err) {
            console.log(err);
            throw new Error(err);
        }

        const csvData = csvjson.toCSV(fileContent, {
            headers: 'key'
        });

        writeFile('./questionDB.csv', csvData, (err) => {
            if (err) {
                console.log(err);
                throw new Error(err);
            }
            console.log('Data stored into csv file successfully');
        });
    });

}