const crypto =  require('crypto');
const axios = require('axios');
// import axios from "axios";


// const {salt_key, merchant_id} = require('./secret')

const newPayment = async (req, res) => {
    const merchant_id = "M22VUO6F0UCZI";
    const salt_key = "b08aa1a4-66d7-42b5-a8df-9df382f87a58";

    try {
        const merchantTransactionId = req.body.transactionId;
        const data = {
            merchantId: merchant_id,
            merchantTransactionId: merchantTransactionId,
            merchantUserId: req.body.MUID,
            name: req.body.name,
            amount: req.body.amount * 100,
            redirectUrl: `https://server.pushtishangar.com/api/status/${merchantTransactionId}`,
            redirectMode: 'POST',
            mobileNumber: req.body.number.toString(),
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
            return res.status(200).json({  url:url});
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

const checkStatus = async (req, res) => {
    try {
        const merchantTransactionId = res.req.body.transactionId;
        const merchantId = res.req.body.merchantId;

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

        const response = await axios.request(options);

        if (response.data.success === true) {
            return res.redirect(getSuccessRedirectURL());
        } else {
            return res.redirect(getFailureRedirectURL());
        }
    } catch (error) {
        console.error("Error in checkStatus:", error);
    
        return res.status(500).send("Internal Server Error");
    }
};

const getSuccessRedirectURL = () => {
    
    return `https://pushtishangar.com/success`;
};

const getFailureRedirectURL = () => {
    
    return `https://pushtishangar.com/failure`;
};


module.exports = {
    newPayment,
    checkStatus
}