const pool = require('../db');

exports.createCategory = async (req, res) => {
    const { name, description } = req.body;

    try {
        const existingCategory = await pool.query('SELECT * FROM categories WHERE name = $1', [name]);
        if (existingCategory.rowCount > 0) {
            return res.status(400).send('Category already exists');
        }

        const result = await pool.query(
            'INSERT INTO categories (name, description) VALUES ($1, $2) RETURNING *',
            [name, description]
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

exports.getAllCategories = async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM categories');
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

exports.getCategoryById = async (req, res) => {
    const { id } = req.params;

    try {
        const category = await pool.query('SELECT * FROM categories WHERE id = $1', [id]);
        if (category.rowCount === 0) {
            return res.status(404).send('Category not found');
        }

        res.json(category.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};


exports.updateCategory = async (req, res) => {
    const { id } = req.params;
    const { name, description } = req.body;

    try {
        const existingCategory = await pool.query('SELECT * FROM categories WHERE id = $1', [id]);
        if (existingCategory.rowCount === 0) {
            return res.status(404).send('Category not found');
        }

        const result = await pool.query(
            'UPDATE categories SET name = $1, description = $2, updated_at = NOW() WHERE id = $3 RETURNING *',
            [name, description, id]
        );

        res.json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

exports.deleteCategory = async (req, res) => {
    const { id } = req.params;

    try {
        const existingCategory = await pool.query('SELECT * FROM categories WHERE id = $1', [id]);
        if (existingCategory.rowCount === 0) {
            return res.status(404).send('Category not found');
        }

        // Удаление категории
        await pool.query('DELETE FROM categories WHERE id = $1', [id]);

        res.json({ message: 'Category deleted successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};