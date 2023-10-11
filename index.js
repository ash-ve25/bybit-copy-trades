// index.js
import main from "./liveTraders.js";
import express from "express";
import { CronJob } from 'cron';

const app = express()
const PORT = 3000

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
	'* * * * * *',
	async () => {
		try {
		  const tradesResponse = await main();		          
		} catch (error) {
		  getLiveTrades.stop();
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

