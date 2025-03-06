const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');

router.post('/add', cartController.addToCart);

router.get('/:userId', cartController.getCart);

router.post('/remove', cartController.removeFromCart);

router.post('/update', cartController.updateCartItemQuantity);

router.delete('/clear/:userId', cartController.clearCart);

module.exports = router;