const crypto =  require('crypto');
const axios = require('axios');
// import axios from "axios";


// const {salt_key, merchant_id} = require('./secret')

const newPayment = async (req, res) => {
    const merchant_id = "M22VUO6F0UCZI";
    const salt_key = "b08aa1a4-66d7-42b5-a8df-9df382f87a58";
    // const url = "https://pushtishangar.com";

    try {
        const merchantTransactionId = req.body.transactionId;
        const data = {
            merchantId: merchant_id,
            merchantTransactionId: merchantTransactionId,
            merchantUserId: req.body.MUID,
            name: req.body.name,
            amount: req.body.amount * 100,
            redirectUrl: "/",
            redirectMode: 'POST',
            mobileNumber: req.body.number,
            paymentInstrument: {
                type: 'PAY_PAGE'
            }
        };

        const payload = JSON.stringify(data);
        const payloadMain = Buffer.from(payload).toString('base64');
        const keyIndex = 1;
        const string = payloadMain + '/pg/v1/pay' + salt_key;
        const sha256 = crypto.createHash('sha256').update(string).digest('hex');
        const checksum = sha256 + '###' + keyIndex;

        const prod_URL = "https://api.phonepe.com/apis/hermes/pg/v1/pay";
        const options = {
            method: 'POST',
            url: prod_URL,
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'X-VERIFY': checksum
            },
            data: {
                request: payloadMain
            }
        };

        const response = await axios(options);

        if (response.data.success === true) {
            const url = response.data.data.instrumentResponse.redirectInfo.url;
            console.log("Response of payment:", response.data);
            console.log("Data:", response.data.data.instrumentResponse);
            res.status(200).json({ url: url });
        } else {
            console.error("Payment request failed:", response.data);
            res.status(500).json({
                message: "Payment request failed",
                success: false
            });
        }
    } catch (error) {
        console.error("Error in newPayment:", error);
        res.status(500).json({
            message: "Internal server error",
            success: false
        });
    }
};

const checkStatus = async(req, res) => {
    const merchantTransactionId = req.params.txnId
    const merchantId = req.params.merchantId

    const keyIndex = 1;
    const string = `/pg/v1/status/${merchantId}/${merchantTransactionId}` + salt_key;
    const sha256 = crypto.createHash('sha256').update(string).digest('hex');
    const checksum = sha256 + "###" + keyIndex;

    const options = {
    method: 'GET',
    url: `https://api.phonepe.com/apis/hermes/pg/v1/status/${merchantId}/${merchantTransactionId}`,
    headers: {
        accept: 'application/json',
        'Content-Type': 'application/json',
        'X-VERIFY': checksum,
        'X-MERCHANT-ID': `${merchantId}`
    }
    };

    // CHECK PAYMENT TATUS
    axios.request(options)
    .then(async (response) => {
      if (response.data.success === true) {
        // Payment successful
        res.status(200).json({ success: true, message: 'Payment successful' });
      } else {
        // Payment failed
        res.status(400).json({ success: false, message: 'Payment failed' });
      }
    })
    .catch((error) => {
      console.error(error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    });
};

module.exports = {
    newPayment,
    checkStatus
}