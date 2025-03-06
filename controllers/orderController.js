const pool = require('../db');

exports.createOrder = async (req, res) => {
    const { userId, address, saveAddress } = req.body;

    try {
        const orderResult = await pool.query(
            'INSERT INTO orders (user_id, total_amount, status) VALUES ($1, $2, $3) RETURNING id',
            [userId, await calculateTotal(userId), 'pending']
        );
        const orderId = orderResult.rows[0].id;

        await pool.query(
            'UPDATE order_items SET order_id = $1 WHERE user_id = $2 AND order_id IS NULL',
            [orderId, userId]
        );

        if (saveAddress) {
            await pool.query(
                'INSERT INTO user_addresses (user_id, full_address, is_default) VALUES ($1, $2, TRUE)',
                [userId, address]
            );
        }

        res.json({ message: 'Order created successfully', orderId });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

const calculateTotal = async (userId) => {
    const cartItems = await pool.query(
        'SELECT price, quantity FROM order_items WHERE user_id = $1 AND order_id IS NULL',
        [userId]
    );

    return cartItems.rows.reduce((total, item) => total + item.price * item.quantity, 0);
};