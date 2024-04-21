// import express from 'express';
// import cors from 'cors';


const express = require("express"); // used in node.js to import modules. Argument specifies the name of the module.
const app = express(); // creates an instance of express
const cors = require("cors");
const dotenv = require("dotenv").config(); // loads environment variables from a .env file into process.env
const http = require("http");
const axios = require("axios");
const bodyParser = require("body-parser");
const moment = require("moment");
const { access } = require("fs");

const port = process.env.PORT || 3000;
const hostname = "localhost";
app.use(bodyParser.json()); // parse incoming request bodies in a middleware before your handlers, available under the req.body property.
app.use(cors()); // middleware that can be used to enable CORS with various options.
const server = http.createServer(app);

app.get("/", (req, res) => {
  res.send({message: "MPESA DARAJA API INTEGRATION"});
  let timestamp = moment().format("YYYYMMDDHHmmss");
  console.log(timestamp);
});

app.get("/access_token", (req, res) => {
  getAccessToken().then((accessToken) => { 
    res.send("Your access token is " + accessToken);
  }).catch((error) => {
    res.send("An error occurred: " + error);
  });
});

app.get("/stkpush", (req, res) => {
  getAccessToken()
    .then((accessToken) => {
      const url =
        "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest";
      const auth = "Bearer " + accessToken;
      const timestamp = moment().format("YYYYMMDDHHmmss");
      const password = new Buffer.from(
        process.env.BUSINESS_SHORT_CODE +
        process.env.PASS_KEY +
        timestamp
      ).toString("base64");

      axios
        .post(
          url,
          {
            BusinessShortCode: process.env.BUSINESS_SHORT_CODE,
            Password: password,
            Timestamp: timestamp,
            TransactionType: "CustomerPayBillOnline",
            Amount: 1,
            PartyA: process.env.STKPUSH_PHONE, //phone number to receive the stk push
            PartyB: process.env.BUSINESS_SHORT_CODE,
            PhoneNumber: process.env.STKPUSH_PHONE,
            CallBackURL: "https://mydomain.com/path",
            AccountReference: "CompanyXLTD",
            TransactionDesc: "Payment of X",
          },
          {
            headers: {
              Authorization: auth,
            },
          }
        )
        .then((response) => {
          res.send("😀 Request is successful done ✔✔. Please enter mpesa pin to complete the transaction");
        })
        .catch((error) => {
          console.log(error);
          res.status(500).send("❌ Request failed");
        });
    })
    .catch(console.log);
});

app.post("/callback", (req, res) => {
  console.log("STK PUSH CALLBACK");
  const CheckoutRequestID = req.body.Body.stkCallback.CheckoutRequestID;
  const ResultCode = req.body.Body.stkCallback.ResultCode;
  var json = JSON.stringify(req.body);
  fs.writeFile("stkcallback.json", json, "utf8", function (err) {
    if (err) {
      return console.log(err);
    }
    console.log("STK PUSH CALLBACK JSON FILE SAVED");
  });
  console.log(req.body);
});

async function getAccessToken() {
  const consumer_key = process.env.CONSUMER_KEY; // from safaricom developer portal
  const consumer_secret = process.env.CONSUMER_SECRET; // from safaricom developer portal
  const url =
    process.env.ACCESS_TOKEN_URL || "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials";
  const auth =
    "Basic " +
    new Buffer.from(consumer_key + ":" + consumer_secret).toString("base64");

  try {
    const response = await axios.get(url, {
      headers: {
        Authorization: auth,
      },
    });

    const dataresponse = response.data;
    // console.log(data);
    const accessToken = dataresponse.access_token;
    return accessToken;
  } catch (error) {
    throw error;
  }
}


app.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});