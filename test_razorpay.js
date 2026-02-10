import Razorpay from 'razorpay';

const razorpay = new Razorpay({
    key_id: 'rzp_test_SDLStiZjdkxUQc',
    key_secret: '2DwnbAVB7PepgpiBKoDa52re',
});

async function testOrder() {
    try {
        const options = {
            amount: 10000,
            currency: 'INR',
            receipt: `receipt_${Date.now()}`,
        };
        const order = await razorpay.orders.create(options);
        console.log("Order Created Successfully:", order);
    } catch (error) {
        console.error("Razorpay Error:", error);
    }
}

testOrder();
