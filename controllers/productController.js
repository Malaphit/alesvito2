const pool = require('../db');

// Добавление товара
exports.createProduct = async (req, res) => {
    const { name, description, price, category_id, sizes } = req.body;

    try {
        // Добавление товара в базу данных
        const productResult = await pool.query(
            'INSERT INTO products (name, description, price, category_id) VALUES ($1, $2, $3, $4) RETURNING id',
            [name, description, price, category_id]
        );
        const productId = productResult.rows[0].id;

        // Добавление размеров товара
        if (sizes && sizes.length > 0) {
            const sizeQueries = sizes.map((size) => {
                return pool.query('INSERT INTO product_sizes (product_id, size_id) VALUES ($1, $2)', [productId, size]);
            });

            await Promise.all(sizeQueries);
        }

        res.status(201).json({ message: 'Product created successfully', productId });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

exports.getAllProducts = async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT p.*, c.name AS category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id'
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

exports.updateProduct = async (req, res) => {
    const { id } = req.params; // Получаем id из параметров URL
    const { name, description, price, category_id, sizes } = req.body;

try {
    // Проверка, существует ли товар
    const productExists = await pool.query('SELECT * FROM products WHERE id = $1', [id]);
    if (productExists.rowCount === 0) {
        return res.status(404).send('Product not found');
    }

    // Обновление товара
    await pool.query(
        'UPDATE products SET name = $1, description = $2, price = $3, category_id = $4 WHERE id = $5',
        [name, description, price, category_id, id]
    );

    // Удаление старых размеров
    await pool.query('DELETE FROM product_sizes WHERE product_id = $1', [id]);

    // Добавление новых размеров
    if (sizes && sizes.length > 0) {
        const sizeQueries = sizes.map((size) => {
            return pool.query('INSERT INTO product_sizes (product_id, size_id) VALUES ($1, $2)', [id, size]);
        });

        await Promise.all(sizeQueries);
    }

    res.json({ message: 'Product updated successfully' });
} catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
}
};

// Удаление товара
exports.deleteProduct = async (req, res) => {
const { id } = req.params; // Получаем id из параметров URL

try {
    // Проверка, существует ли товар
    const productExists = await pool.query('SELECT * FROM products WHERE id = $1', [id]);
    if (productExists.rowCount === 0) {
        return res.status(404).send('Product not found');
    }

    // Удаление товара
    await pool.query('DELETE FROM products WHERE id = $1', [id]);

    res.json({ message: 'Product deleted successfully' });
} catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
}
};