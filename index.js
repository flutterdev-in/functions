const functions = require("firebase-functions");
const admin = require("firebase-admin");
const Razorpay = require("razorpay");

admin.initializeApp();

const db = admin.firestore();
const authUserCR = db.collection("authUsers");

var instance = new Razorpay({ key_id: 'rzp_test_hRloZF3oVbYuXn', key_secret: 'dflDYn0SXmCaVUy1Vf7b7xPt' });


exports.orderStatusUpdate = functions.https.onCall(async (data, context) => {
    const orderID = data.orderID;
    const uid = data.userUID;
    const refMemberId = data.refMemberId;

    var order = await instance.orders.fetch(orderID);
    var paymentDR = authUserCR.doc(uid).collection("docs").doc('payment');
    if (order.status == "paid") {
        await paymentDR.update({ "orderID": orderID, "isPaid": true, });


        // 1. Get last memberPosition
        const lastPosUserSnap = await authUserCR.orderBy("memberPosition", "desc").limit(1).get();
        const thisUserDocSnap = await authUserCR.doc(uid).get();
        if (lastPosUserSnap.docs.length > 0) {
            // 2. Get thisMemberPos
            const lastUserDocSnap = lastPosUserSnap.docs.at(0);
            const memberPos = lastUserDocSnap.get("memberPosition");
            var thisMemberPos = 0;
            if (memberPos == null) {
                thisMemberPos = 1;
            } else {
                thisMemberPos = memberPos + 1;
            }
            // 3. update this member positions
            await thisUserDocSnap.ref.update(
                {
                    "memberPosition": thisMemberPos,
                    "refMemberId": refMemberId,
                }
            );

            // 4. Add 500 to refMember directIncome & history income

            const refMemberDocsSnap = await authUserCR.where(memberID, equalTo, thisUserDocSnap.get(refMemberId)).limit(1).get();
            if (refMemberDocsSnap.docs.length > 0) {
                const refMemberDocSnap = refMemberDocsSnap.docs.at(0);
                const directInc = refMemberDocSnap.get(directIncome);

                await refMemberDocSnap.ref.update(
                    {
                        directIncome: directInc + 1,
                    }
                );
            }
        } else {
            await thisUserDocSnap.ref.update(
                {
                    "memberPosition": 1,
                    "refMemberId": refMemberId,
                }
            );
        }
    }
});
