import main from "./liveTraders.js";
import mainTrade from "./liveTrades.js";
import express from "express";
import { CronJob } from 'cron';

const app = express()
const PORT = 3000
let isJobRunning = false; // Flag to track if the job is currently running

app.listen(PORT, () => {
  console.log(`API listening on PORT ${PORT} `)
})

app.get('/', (req, res) => {
  res.send('Hey this is my API running 🥳')
})

app.get('/about', (req, res) => {
  res.send('This is my about route..... ')
})

const getLiveTrades = new CronJob(
	'*/20 * * * *',
	async () => {
        if (!isJobRunning) {
            isJobRunning = true;
            console.log("running now!")
            mainTrade()
                .then(tradesResponse => {
                // Process the tradesResponse if needed
                })
                .catch(error => {
                console.error(error);
                })
                .finally(() => {
                isJobRunning = false;
                });
        }else{
            console.log("else called")
        }		
	  },
	null,
	true,
	''
);
getLiveTrades.start();
if (!getLiveTrades.running) {
	getLiveTrades.start();
  }

app.get('/traders',async (req,res)=>{
    
    const data = await main();
    console.log(data);
    res.status(200).json({status:"success",message: data})
})

