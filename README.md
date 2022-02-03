# Recursive Crawler Using NodeJs
### Given Problem Statement:
**Objective:** 
Recursively crawl https://stackoverflow.com/questions using Node.js based crawler,
harvest all questions on Stack Overflow and store them in a database of your choice.
What do you need to store?
1. Every unique URL (Stack Overflow question) you encountered.
2. The total reference count for every URL (How many times this URL was encountered).
3. Total # of upvotes and total # of answers for every question.
4. Dump the data in a CSV file when the user kills the script.


### Repository file description
1) `crawler-SinglePage.js` - Crawler for a single page, fecthes te data and stores them in json and csv format. Exports this data to mongo db backend
3) `crawler-MultiPage.js` - Crawler for a n number of pages page (50 in our case), fecthes te data and stores them in json and csv format. Exports this data to mongo db backend
4) `questionDB.csv`- CSV file output of the data
5) `questionBankList.json`- JSON file output of the data

### Node Dependencies used:
1) `cheerio` - Cheerio js is a Javascript technology used for web-scraping in server-side implementations
2) `axios` - Axios is a Javascript library used to make HTTP requests from node. js
3) `csvjson`- Creates CSV from JSON file
4) `MongoClient`- Connects to MongoDB database

### URL Updation
Recusively keep updating the URL page by incrementing i value by 1. We scrap 1 to n pages 
`https://stackoverflow.com/questions?tab=active&page=1` to  `https://stackoverflow.com/questions?tab=active&page=n` (in our case 50)

### DOM value selection
From the HTML code of the page we select particualr DOM values that we require in that are - URL link, Number of answers, Number of views, Number of votes.

### Export Data
The above values are exported to mongoDb database and exported as JSON and CSV files



