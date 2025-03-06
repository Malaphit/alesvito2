const pool = require('../db');

exports.addToCart = async (req, res) => {
    const { userId, productId, quantity } = req.body;

    try {
        const productExists = await pool.query('SELECT id, price FROM products WHERE id = $1', [productId]);
        if (productExists.rowCount === 0) {
            return res.status(404).send('Product not found');
        }

        const productPrice = productExists.rows[0].price;

        const existingCartItem = await pool.query(
            'SELECT * FROM order_items WHERE user_id = $1 AND product_id = $2 AND order_id IS NULL',
            [userId, productId]
        );

        if (existingCartItem.rowCount > 0) {
            const updatedQuantity = existingCartItem.rows[0].quantity + quantity;
            await pool.query(
                'UPDATE order_items SET quantity = $1 WHERE id = $2',
                [updatedQuantity, existingCartItem.rows[0].id]
            );
        } else {
            await pool.query(
                'INSERT INTO order_items (user_id, product_id, quantity, price, order_id) VALUES ($1, $2, $3, $4, NULL)',
                [userId, productId, quantity, productPrice]
            );
        }

        res.json({ message: 'Item added to cart' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

exports.getCart = async (req, res) => {
    const { userId } = req.params;

    try {
        const cartItems = await pool.query(
            'SELECT oi.id, p.name AS product_name, p.price, oi.quantity FROM order_items oi JOIN products p ON oi.product_id = p.id WHERE oi.user_id = $1 AND oi.order_id IS NULL',
            [userId]
        );

        const totalAmount = cartItems.rows.reduce((total, item) => total + item.price * item.quantity, 0);

        res.json({ cartItems: cartItems.rows, totalAmount });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

exports.removeFromCart = async (req, res) => {
    const { userId, cartItemId } = req.body;

    try {
        await pool.query(
            'DELETE FROM order_items WHERE id = $1 AND user_id = $2 AND order_id IS NULL',
            [cartItemId, userId]
        );

        res.json({ message: 'Item removed from cart' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

exports.updateCartItemQuantity = async (req, res) => {
    const { userId, cartItemId, quantity } = req.body;

    try {
        const existingCartItem = await pool.query(
            'SELECT * FROM order_items WHERE id = $1 AND user_id = $2 AND order_id IS NULL',
            [cartItemId, userId]
        );

        if (existingCartItem.rowCount === 0) {
            return res.status(404).send('Cart item not found');
        }

        await pool.query(
            'UPDATE order_items SET quantity = $1, updated_at = NOW() WHERE id = $2 AND user_id = $3 AND order_id IS NULL',
            [quantity, cartItemId, userId]
        );

        res.json({ message: 'Cart item quantity updated' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

exports.clearCart = async (req, res) => {
    const { userId } = req.params;

    try {
        // Удаление всех элементов корзины
        await pool.query('DELETE FROM order_items WHERE user_id = $1 AND order_id IS NULL', [userId]);

        res.json({ message: 'Cart cleared successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};