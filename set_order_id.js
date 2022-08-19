const functions = require("firebase-functions");
const admin = require("firebase-admin");
const Razorpay = require("razorpay");

admin.initializeApp();

const db = admin.firestore();
const authUserCR = db.collection("authUsers");

var instance = new Razorpay({ key_id: 'rzp_test_hRloZF3oVbYuXn', key_secret: 'dflDYn0SXmCaVUy1Vf7b7xPt' });


exports.setOrderID = functions.https.onCall(async (data, context) => {
    var uid = data.at(0);
    var paymentDR = authUserCR.doc(uid).collection("docs").doc('payment');


    var order = await instance.orders.create({
        amount: 100000,
        currency: "INR",
    });
    //
    await paymentDR.set({ "orderID": order.id });

});