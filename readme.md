
Get all traders -> https://api2.bybit.com/fapi/beehive/public/v1/common/dynamic-leader-list?timeStamp=1695642319169&pageNo=1&pageSize=100&isAvailableLeader=true&dataDuration=DATA_DURATION_SEVEN_DAY&leaderTag=&code=&leaderLevel=&userTag=


Get Traders from DB

Call API for each trader -> https://api2.bybit.com/fapi/beehive/public/v1/common/order/list-detail?timeStamp=1696057120899&leaderMark=x97dwd%2BUULkEnbzk83ErVQ%3D%3D

    -> we know that a trader has hidden or open trades  
    -> push it into DB to exempt this trader for next API call

    -> get all Live trades of the trader (we get this trades in paginated format of 50 trades each time)
    -> save it into DB

    -> check if the live trades of the trader are in DB,
        -> if yes, skip
        -> else close it in the DB

