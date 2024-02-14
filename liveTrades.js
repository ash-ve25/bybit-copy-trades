import fs from "fs";
import axios from "axios";
import winston from 'winston';
import winstonDaily from 'winston-daily-rotate-file';
import mysql from 'mysql2';
import async from "async"; 

const maxRetries = 5; // Maximum number of retry attempts
const retryInterval = 1000; // Time in milliseconds to wait between retries

// MySQL database configuration
const dbConfig = {
  host: '',
  user: '',
  password: '',
  database: '',
  connectionLimit : 10, //important
};

const pool = mysql.createPool(dbConfig);
// Define log format
const logFormat = winston.format.printf(({ timestamp, level, message }) => `${timestamp} ${level}: ${message}`);

/*
 * Log Level
 * error: 0, warn: 1, info: 2, http: 3, verbose: 4, debug: 5, silly: 6
 */
const logger = winston.createLogger({
  format: winston.format.combine(
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss.SSS',
    }),
    logFormat,
  ),
  transports: [
    // debug log setting
    new winstonDaily({
      level: 'debug',
      datePattern: 'YYYY-MM-DD',
      dirname: `./debug`, // log file /logs/debug/*.log in save
      filename: `%DATE%.log`,
      maxFiles: 30, // 30 Days saved
      json: false,
      zippedArchive: true,
    }),
    // error log setting
    
    new winstonDaily({
      level: 'error',
      datePattern: 'YYYY-MM-DD',
      dirname: `./error`, // log file /logs/error/*.log in save
      filename: `%DATE%.log`,
      maxFiles: 30, // 30 Days saved
      handleExceptions: true,
      json: false,
      zippedArchive: true,
    }),
  ],
});

logger.add(
  new winston.transports.Console({
    format: winston.format.combine(winston.format.splat(), winston.format.colorize()),
  }),
);



const headers = {
    "authority": "api2.bybit.com",
    "method": "GET",    
    "scheme": "https",
    "Accept": "application/json",
    "Accept-Encoding": "gzip, deflate, br",
    "Accept-Language": "en-US,en-IN;q=0.9,en;q=0.8,hi-IN;q=0.7,hi;q=0.6",
    "Content-Type": "application/json",
    "Distinctid": "3160046359",
    "Lang": "en-us",
    "Origin": "https://www.bybit.com",
    "Platform": "pc",
    "Referer": "https://www.bybit.com/",
    "Sec-Ch-Ua": "\"Not/A)Brand\";v=\"99\", \"Google Chrome\";v=\"115\", \"Chromium\";v=\"115\"",
    "Sec-Ch-Ua-Mobile": "?0",    
    "Sec-Fetch-Dest": "empty",
    "Sec-Fetch-Mode": "cors",
    "Sec-Fetch-Site": "same-site",
    "Traceparent": "00-cbe355c4d532303bae36dfd4ce55269b-7f0f46029feae57e-00",    
    "Cookie": ''
  };
  
  const axiosConfig = {
    headers: headers,
  };

  const baseUrl = 'https://api2.bybit.com/fapi/beehive/public/v1/common/order/list-detail';

  const outputFileName = 'live-trades.json';  
  const timeStamp = Date.now(); // Replace with your desired timestamp  
  let pageNo = 1;

  
const callApiWithRetry = async (retryCount = 0, pageNo) => {
  let allData = [];

  try {   
    for(let t=0;t<traders.length;t++){       
        if(retryCount > 0){
            pageNo = pageNo;
        }else{
            pageNo = 1;
        }
        let individualTradersTradeFromAPI = [];
        let url = `${baseUrl}?page=${pageNo}&pageSize=50&timeStamp=${timeStamp}&leaderMark=${traders[t]['trader_id']}`;
        const response = await axios.get(url, axiosConfig);
          if (response.status === 200) {                        
            console.log(response.data.result.totalCount);
            let totalCount = response.data.result.totalCount;
            if(totalCount > 0){
                let liveTradesRaw = response.data.result.data;
                if(response.data.result.openTradeInfoProtection === 1){
                    //is trade open is 1 means its hidden from profile
                    updateTrader(traders[t]['trader_id']);
                    console.log("trader profile is hidden: ", response.data.result.openTradeInfoProtection);
                    logger.info("trader profile is hidden: ", response.data.result.openTradeInfoProtection);
                }
            
                let liveTrades= liveTradesRaw.map(s=>{
                    s.traderID = traders[t]['trader_id'];
                    s.leaderFollowerCount = traders[t]['follower_count'];
                    return s;
                });
      
                  console.log("trades length: ", liveTrades.length);
                  // Insert liveTrades data into the MySQL database
                  // if (liveTrades.length > 0) {
                  //   await insertLiveTradesIntoDatabase(liveTrades);
                  //   console.log(`Inserted liveTrades data for trader ${traders[t]['trader_id']} into the database.`);
                  //   logger.info(`Inserted liveTrades data for trader ${traders[t]['trader_id']} into the database.`);
                  // }
      
                  console.log("total trade count: ", response.data.result.totalCount);
                  logger.info(`total trade count: ${response.data.result.totalCount}`);
                  individualTradersTradeFromAPI = individualTradersTradeFromAPI.concat(liveTrades);
                  console.log(`Fetched data for trader ${traders[t]['trader_id']} from position ${t} with page ${pageNo}`);
                  logger.info(`Fetched data for trader ${traders[t]['trader_id']} from position ${t} with page ${pageNo}`);
                  if(totalCount > 50){
                    for(let i=1;i<=(totalCount/50);i++){
                      pageNo++; 
                      console.log(pageNo)
                      url = `${baseUrl}?page=${pageNo}&pageSize=50&timeStamp=${timeStamp}&leaderMark=${traders[t]['trader_id']}`;
                      const responseNext = await axios.get(url, axiosConfig);
                      if (responseNext.status === 200) {
                        let liveTradesNextRaw = responseNext.data.result.data;
      
                        let liveTradesNext= liveTradesNextRaw.map(s=>{
                          s.traderID = traders[t]['trader_id'];
                          s.leaderFollowerCount = traders[t]['follower_count'];
                          return s;
                        });
      
                        // // Insert liveTrades data into the MySQL database
                        // if (liveTrades.length > 0) {
                        //   await insertLiveTradesIntoDatabase(liveTrades);
                        //   console.log(`Inserted liveTrades data for trader ${traders[t]['trader_id']} into the database.`);
                        //   logger.info(`Inserted liveTrades data for trader ${traders[t]['trader_id']} into the database.`);
                        // }
                        // console.log(responseNext.data.result);                  
                        individualTradersTradeFromAPI = individualTradersTradeFromAPI.concat(liveTradesNext);                  
                        console.log(`Fetched data for trader ${traders[t]['trader_id']} from position ${t} with page ${pageNo}`);
                        logger.info(`Fetched data for trader ${traders[t]['trader_id']} from position ${t} with page ${pageNo}`);
                      }                
                    }
                }
                //get all trades of a trader from DB
                const individualTradersTradeFromDB = await fetchTradesFromDatabase(traders[t]['trader_id']);        
                //compare all the DB trades with the current trades
                // Find trade objects exclusive to the DB array
                const exclusiveToDB = individualTradersTradeFromDB.filter((dbTrade) => !individualTradersTradeFromAPI.some((apiTrade) => apiTrade.crossSeq === dbTrade.crossSeq));

                // Find trade objects exclusive to the API array
                const exclusiveToAPI = individualTradersTradeFromAPI.filter((apiTrade) => !individualTradersTradeFromDB.some((dbTrade) => dbTrade.crossSeq === apiTrade.crossSeq));

                console.log('Trade objects exclusive to DB:', exclusiveToDB.length);        
                logger.info(`Trade objects exclusive to DB: ${exclusiveToDB.length}`);
                console.log('Trade objects exclusive to API:', exclusiveToAPI.length);
                logger.info(`Trade objects exclusive to API: ${exclusiveToAPI.length}`);
                
                if(exclusiveToDB.length > 0){
                    console.log("closing trades");
                    //update the old trades that were in DB to closed
                    const res = await updateClosedTradesIntoDatabase(exclusiveToDB);
                }
                // //add new trades to DB
                // allData = allData.concat(exclusiveToAPI);  
                if(exclusiveToAPI.length > 0){
                    // Insert liveTrades data into the MySQL database          
                    console.log("inserting live trades in DB");      
                    await insertLiveTradesIntoDatabase(exclusiveToAPI);
                    console.log(`Inserted liveTrades data for trader ${traders[t]['trader_id']} into the database.`);
                    logger.info(`Inserted liveTrades data for trader ${traders[t]['trader_id']} into the database.`);
                }                                    
            }                      
        } else {
              console.error(`Received a ${response.status} response for page ${pageNo}. Retrying...`);            
              logger.error(`Received a ${response.status} response for page ${pageNo}. Retrying...`);            
              if (retryCount < maxRetries) {
                // Wait for a while before making the next request
                await new Promise(resolve => setTimeout(resolve, retryInterval));
                await callApiWithRetry(retryCount + 1, pageNo);
              } else {
                console.log('Maximum number of retries reached. Exiting.');
                logger.info('Maximum number of retries reached. Exiting.');
              }
        }                  
    } 
    return allData;          
} catch (error) {
    console.error('An error occurred:', error.message);
    logger.error(`An error occurred:', ${error.message}`);
    if (retryCount < maxRetries) {
      // Wait for a while before making the next request
      await new Promise(resolve => setTimeout(resolve, retryInterval));
      await callApiWithRetry(retryCount + 1);
    } else {
      console.log('Maximum number of retries reached. Exiting.');
      logger.info('Maximum number of retries reached. Exiting.');
    }
  }
};

async function sleep(time = 1) {
	const sleepMilliseconds = time
	
	return new Promise(resolve => {
		setTimeout(() => {
			resolve(`Slept for: ${sleepMilliseconds}ms`)
		}, sleepMilliseconds)
	})
}

const fetchTradesFromDatabase = (traderID) => {
  return new Promise((resolve, reject) => {
    pool.getConnection((err, connection) => {
        if (err) {
            console.log('query connec error!', err);
            reject(err);
        } else{
            connection.query(`SELECT  * FROM live_trades where traderID = '${traderID}'`, (err, results) => {
                if (err) {
                  reject(err);
                } else {
                  resolve(results);                  
                }
                connection.release();
              });
        }
    });    
  });
};


const fetchTradersFromDatabase = () => {
  return new Promise((resolve, reject) => {
    pool.getConnection((err, connection) => {
        if (err) {
            console.log('query connec error!', err);
            reject(err);
        } else{
            connection.query('SELECT  * FROM master_traders where is_trade_open=0', (err, results) => {
                if (err) {
                  reject(err);
                } else {
                  resolve(results);                  
                }
                
            });
        }
    });
  });
};

// Function to insert liveTrades data into the MySQL database
const insertLiveTradesIntoDatabase = (liveTrades) => {
  return new Promise((resolve, reject) => {
    const query = 'INSERT INTO live_trades (symbol,entryPrice,size,createdAtE3,side,leverageE2,isIsolated,transactTimeE3,stopLossPrice,takeProfitPrice,orderCostE8,reCalcEntryPrice,positionEntryPrice,positionCycleVersion,crossSeq,closeFreeQtyX,minPositionCostE8,positionBalanceE8,traderID,leaderFollowerCount) VALUES ?';
    const values = liveTrades.map((trade) => [         
      trade.symbol,
      trade.entryPrice,
      trade.sizeX,
      trade.createdAtE3,
      trade.side,
      trade.leverageE2,
      trade.isIsolated,
      trade.transactTimeE3,
      trade.stopLossPrice,
      trade.takeProfitPrice,
      trade.orderCostE8,
      trade.reCalcEntryPrice,
      trade.positionEntryPrice,
      trade.positionCycleVersion,
      trade.crossSeq,
      trade.closeFreeQtyX,
      trade.minPositionCostE8,
      trade.positionBalanceE8,
      trade.traderID,
      trade.leaderFollowerCount
    ]);  
    pool.getConnection((err, connection) => {
        if (err) {
            console.log("error");
            reject( err )            
        }else{
            connection.query(query, [values], (err) => {
                if (err) {
                  reject(err);
                } else {
                  resolve();
                }
                connection.release()
              });
        }
    });    
  });
};

const updateClosedTradesIntoDatabase = async (closedTrades) => {
  
  if(closedTrades.length > 0){
    try {
      for (const trade of closedTrades) {
            pool.execute(
                `UPDATE live_trades SET isClosed = 1 WHERE traderId = '${trade.traderID}' AND crossSeq = ?`,
                [trade.crossSeq]
              );
                   
      }
      console.log(`As per the API, Trade closed into the database successfully.`);
      logger.info(`As per the API, Trade closed into the database successfully.`);      
    } catch (error) {
      console.error('Error updating trade objects:', error);
    }
  }
}


// Function to insert data into the MySQL database
function updateTrader(traderID) {   
    pool.getConnection( (err, connection) => {    
        const query = `UPDATE master_traders set is_trade_open = 1 where trader_id = '${traderID}'`;
        connection.query(query, (err) => {
            if (err) {
            console.error('Error inserting data into the database:', err);
            logger.error(`Error inserting data into the database: ${err}`);
            } else {
            console.log(`Data updated for ${traderID} into the database successfully.`);
            logger.info(`Data updated for ${traderID} into the database successfully.`);            
            }    
            connection.release();
        });
    });
}

let traders = [];
const mainTrade = async () => {  
  try{
    traders = await fetchTradersFromDatabase();    
    console.log('Fetched all traders from DB');
    logger.info(`Fetched all traders from DB`);
    await getLiveTrades();  
  }  catch (error) {
    console.error('An error occurred while fetching traders from the database:', error);
    logger.error(`An error occurred while fetching traders from the database: ${error}`);
  } 
};

const getLiveTrades = async () => {
    try {      
      const jsonDataArray = await callApiWithRetry();
    //   await insertLiveTradesIntoDatabase(jsonDataArray);
    //   console.log(`Inserted liveTrades data into the database.`);
    //   logger.info(`Inserted liveTrades data into the database.`);

      await sleep(1000);
      await mainTrade();
    //   fs.writeFileSync(outputFileName, JSON.stringify(jsonDataArray, null, 2));        
    //   console.log(`JSON data saved to ${outputFileName}`);
    //   logger.info(`JSON data saved to ${outputFileName}`);
    } catch (error) {
      console.error('An error occurred closing current request pool:', error.message);
      logger.error(`An error occurred closing current request pool: ${error.message}`);
    }finally {
        //restarting the trade request
        await mainTrade();
    }
  };

export default mainTrade;
// mainTrade();
