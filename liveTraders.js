import fs from "fs";
import axios from "axios";
import utf8 from 'utf8';
import querystring from 'querystring';
import mysql from 'mysql2'; // Import the mysql2 library

const maxRetries = 5; // Maximum number of retry attempts
const retryInterval = 1000; // Time in milliseconds to wait between retries


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
    "Cookie": '_by_l_g_d=891cc628-2194-f03d-12c7-e90c06ddb3f0; BYBIT_REG_REF_prod={"lang":"en-US","g":"891cc628-2194-f03d-12c7-e90c06ddb3f0","referrer":"www.upwork.com/","source":"upwork.com","medium":"other","url":"https://www.bybit.com/copyTrade/"}; deviceId=9aecb98d-2835-ab39-1ac7-21910d390258; b_t_c_k=; _tt_enable_cookie=1; _ttp=TRx_5vzU_VSeFADvit4UsW32Rl_; BYBIT_REG_REF_local={"lang":"en-US","g":"891cc628-2194-f03d-12c7-e90c06ddb3f0","referrer":"www.google.com/","source":"google.com","medium":"other","url":"https://www.bybit.com/future-activity/en-US/developer"}; BYBIT_REG_REF_testnet={"lang":"en-US","g":"891cc628-2194-f03d-12c7-e90c06ddb3f0","referrer":"www.google.com/","source":"google.com","medium":"other","url":"https://testnet.bybit.com/app/terms-service/information"}; _gcl_au=1.1.1397962568.1694443298; _ym_uid=1694443309165681436; _ym_d=1694443309; _ga_LEBL6PF94W=GS1.1.1694499613.2.0.1694499621.0.0.0; _ga=GA1.1.962892806.1694439904; sensorsdata2015jssdkcross=%7B%22distinct_id%22%3A%223160046359%22%2C%22first_id%22%3A%2218a8478c40c1796-0732c752622f9e4-1a525634-1296000-18a8478c40d1f20%22%2C%22props%22%3A%7B%22%24latest_traffic_source_type%22%3A%22%E7%9B%B4%E6%8E%A5%E6%B5%81%E9%87%8F%22%2C%22%24latest_search_keyword%22%3A%22%E6%9C%AA%E5%8F%96%E5%88%B0%E5%80%BC_%E7%9B%B4%E6%8E%A5%E6%89%93%E5%BC%80%22%2C%22%24latest_referrer%22%3A%22%22%2C%22_a_u_v%22%3A%220.0.5%22%7D%2C%22identities%22%3A%22eyIkaWRlbnRpdHlfY29va2llX2lkIjoiMThhODQ3OGM0MGMxNzk2LTA3MzJjNzUyNjIyZjllNC0xYTUyNTYzNC0xMjk2MDAwLTE4YTg0NzhjNDBkMWYyMCIsIiRpZGVudGl0eV9sb2dpbl9pZCI6IjMxNjAwNDYzNTkifQ%3D%3D%22%2C%22history_login_id%22%3A%7B%22name%22%3A%22%24identity_login_id%22%2C%22value%22%3A%223160046359%22%7D%2C%22%24device_id%22%3A%2218a8478c40c1796-0732c752622f9e4-1a525634-1296000-18a8478c40d1f20%22%7D; _ga_SPS4ND2MGC=GS1.1.1695139738.4.1.1695139794.4.0.0; _abck=E95E5A60379E13A5E048AD0D18B71D35~0~YAAQlg7EF/0KMNWKAQAA/jaC1QrzVQRNmKYfpd+bFCSZKWS4U0nbxD7Cmw8LfPjw1+3lp8dJgMMnTlQWaho+6holrmQyqjyxjClVcfkN1D02O4TdTq9nVMcsmUVUIlxt7IweDhUZ4KICKsoRMiove3O9NxP8+bp8366r52vvmAGGp0M0orRgx/rMbeNcqBndi0WaFZ0Togjojm9I83rv2dynIJZT+tBRANe9VU7IdRMaXQXnyk1T0R14Fpy3iquA8Bkihe4pjY7+g3YMDh7R90ifiI6431I89SEsk7GJd08MRBzk16gQbiDB19d7bOUnzlV6ghe9IIfuF9haB6Sfz39jtxHKAIW3fzmhjUZRyWOewLrZoQbNpCieoZfPlwyK+q2PsaMlGHr+WKqdOmoucuCd0P/LEoI=~-1~-1~-1; bm_sz=329B4851D3EC93D93258870EA4D74FF6~YAAQlg7EFwALMNWKAQAA/jaC1RVsLeSmpvxbvxxvZPiEpr8h+Vkb280Iorh6bExZ6VaraPz46tONHYZTeYQ2M1ZdodPCrTbST+/d0WBEAOimnVxLgAJiEE4NK2Zb00Z4T227vsoIWcJsy4d1Tvxfsc+C//H6PYzJ47zDe6+gtcbeerfZXqaMBOo8IHASljGeRzKOKTE0Xup89q4AMRna1Q1WITScP4MTnvPzWG26CJvwpFZuYrB8/HalNKiecpgNNP0QtO0fQyX2KubcT8SP5hrFgHY1JGXl5rwiVr+hX//sQw==~3291188~4474420; ak_bmsc=1159E8646943C3ACD2D7DBA2A37BBCE5~000000000000000000000000000000~YAAQlg7EFxcLMNWKAQAASD2C1RWhwh+rrxqvcWvB41PUenOzba4mWpBJXIbtWoNTAvwSwEqnKELmMspEIVRxmcSn4Ny96B/5O8sS38Cp5xj2UZp9OfS9s5IE7EHKnq4s435g03rGDycgO7kxA68Js2pi3FP67zR4CKf1/n7wUbNgWg/3fLu2hWBn+tERLsx3d5IlTuG2Ebu/bRtSLtqKAxM2jJXt1akBwQnYth64r30O6BvBS2rWGMsMPvlBRyYKEf0iEzeQjo5Ii1cdHVJYV/D65otmXycFOjLcN3DmxrHI5Yx2mHv6V3rPT1jJVjQcun2aI24BxCKnRMC95LwzYY1vaB4RWnMgtk5cQJg4w23trkkff7ljigyeBWvBkJCWyzk9HY5iclMaBClgnDXZojdpPtEt/fp6pEUHwQJdN+suE8x9DuNa2j/ClWE8lXiv2KzE3M6A5UXwGU06bD+pF2I9g6224fZyyVSWgDczClSIl7L9/56/Dn8nesNKOQ==; bm_sv=5A537A21AD5458BEB74FB9EEB75EE342~YAAQlg7EF6ELMNWKAQAA1mmC1RVfUgFsAzvH1nZ+nPYIRGnZCUwEHzPxrqFawD0FcNVKNeZlKvpAdnOGROaLufAm/x4dSvgTHoOSw9PP9LySAX/yzP7RlMD+/hYaOiEJwYRRxv/TIU8QubIk4NNzuYzXtIynd4RjGU3VnkBE5T6pIu0aMhIpUszNrYbtnaVkpb0rph0GZSf1EoeqylOp+q2yRrrc41xjMznBXaQ+6bFNZ9HU1ccDAnOLVLKj5Ubx~1'
  };
  
  const axiosConfig = {
    headers: headers,
  };

  const baseUrl = 'https://api2.bybit.com/fapi/beehive/public/v1/common/dynamic-leader-list';
  const pageSize = 50;
  const dataDuration = 'DATA_DURATION_SEVEN_DAY';

  const outputFileName = 'master-traders.json';
  const totalPageCount = 175; // Set the total page count here
  const timeStamp = Date.now(); // Replace with your desired timestamp

  // MySQL database configuration
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: 'Dragon2502#singh',
  database: 'bybit_trades',
};

// const connection = mysql.createConnection(dbConfig);
let connection;

  function base64Transform(s) {
    // Step 1: Decode the input string from Base64
    const decodedBytes = Buffer.from(s, 'base64');
  
    // Step 2: Encode the decoded bytes back to Base64
    const urlSafeEncodedBytes = Buffer.from(decodedBytes).toString('base64');
  
    // Step 3: Decode the bytes as a UTF-8 string
    const utf8String = utf8.decode(urlSafeEncodedBytes);
  
    // Step 4: URL-encode the resulting string
    const urlSafeEncodedString = querystring.escape(utf8String);
  
    // Return the final URL-safe, UTF-8 encoded, and URL-encoded string
    return urlSafeEncodedString;
  }

const callApiWithRetry = async (retryCount = 0) => {
    let allData = [];

  try {
    for (let pageNo = 1; pageNo <= totalPageCount; pageNo++) {
        const url = `${baseUrl}?pageNo=${pageNo}&pageSize=${pageSize}&dataDuration=${dataDuration}&timeStamp=${timeStamp}`;
        const response = await axios.get(url, axiosConfig);
        // console.log(response.headers);
        if (response.status === 200) {
            console.log(response.data.result.leaderDetails);
            let leaderIds = response.data.result.leaderDetails.map(s=>{
              return [base64Transform(s.leaderMark),s.currentFollowerCount]
            });

            // console.log(response.data.result.res);            
            allData = allData.concat(leaderIds);
            console.log(`Fetched data for page ${pageNo}`);
          } else {
            console.error(`Received a ${response.status} response for page ${pageNo}. Retrying...`);            
            if (retryCount < maxRetries) {
              // Wait for a while before making the next request
              await new Promise(resolve => setTimeout(resolve, retryInterval));
              await callApiWithRetry(retryCount + 1);
            } else {
              console.log('Maximum number of retries reached. Exiting.');
            }
        }
    } 
    return allData;          
} catch (error) {
    console.error('An error occurred:', error.message);
    if (retryCount < maxRetries) {
      // Wait for a while before making the next request
      await new Promise(resolve => setTimeout(resolve, retryInterval));
      await callApiWithRetry(retryCount + 1);
    } else {
      console.log('Maximum number of retries reached. Exiting.');
    }
  }
};


const main = async () => {
    try {
      const jsonDataArray = await callApiWithRetry();
      fs.writeFileSync(outputFileName, JSON.stringify(jsonDataArray, null, 2));
      console.log(`JSON data saved to ${outputFileName}`);
      // Insert data into the MySQL database
    //   if (jsonDataArray.length > 0) {
    //     connection.connect(); // Connect to the database
    //     insertDataIntoDatabase(jsonDataArray);
    //   }
    } catch (error) {
      console.error('An error occurred:', error.message);
    }
  }


// Function to insert data into the MySQL database
function insertDataIntoDatabase(data) {
  const query = 'INSERT INTO master_traders (trader_id, follower_count) VALUES ?';
  const values = data;

  connection.query(query, [values], (err) => {
    if (err) {
      console.error('Error inserting data into the database:', err);
    } else {
      console.log('Data inserted into the database successfully.');
    }
    connection.end(); // Close the database connection
  });
}

export default main