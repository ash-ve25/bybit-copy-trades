import main from "./liveTraders.js";
import mainTrade from "./liveTrades.js";
import express from "express";
import { CronJob } from 'cron';

const app = express()
const PORT = 3000
let isJobRunning = false; 

app.listen(PORT, () => {
  console.log(`API listening on PORT ${PORT} `)  
})

const response = await mainTrade();

app.get('/', (req, res) => {
  res.send('Hey this is my API running 🥳')
})

// const getLiveTrades = new CronJob(
// 	'*/2 * * * *',
// 	async () => {
//         if (!isJobRunning) {
//             isJobRunning = true;
//             console.log("running now!", Date.now())
//             // await mainTrade()
//             //     .then(tradesResponse => {                
//             //         console.log("cron running in API response!")
//             //     })
//             //     .catch(error => {
//             //     console.error(error);
//             //     })
//             //     .finally(() => {
//             //     isJobRunning = false;
//             //     });

//         }else{
//             console.log("else called")
//         }		
// 	  },
//       null,
//       true,
//       ''	
// );
// getLiveTrades.start();
// if (!getLiveTrades.running) {
// 	getLiveTrades.start();
//   }

app.get('/traders',async (req,res)=>{
    
    const data = await main();
    console.log(data);
    res.status(200).json({status:"success",message: data})
})

