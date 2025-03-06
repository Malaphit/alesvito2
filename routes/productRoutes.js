const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');

router.post('add', productController.createProduct);

router.get('get all', productController.getAllProducts);

router.put('put', productController.updateProduct);

router.delete('/:id', productController.deleteProduct);

module.exports = router;