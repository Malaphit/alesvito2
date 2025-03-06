const pool = require('../db');

exports.createSize = async (req, res) => {
    const { size_value } = req.body;

    try {
        const existingSize = await pool.query('SELECT * FROM sizes WHERE size_value = $1', [size_value]);
        if (existingSize.rowCount > 0) {
            return res.status(400).send('Size already exists');
        }

        const result = await pool.query(
            'INSERT INTO sizes (size_value) VALUES ($1) RETURNING *',
            [size_value]
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

exports.getAllSizes = async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM sizes');
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

exports.getSizeById = async (req, res) => {
    const { id } = req.params;

    try {
        const size = await pool.query('SELECT * FROM sizes WHERE id = $1', [id]);
        if (size.rowCount === 0) {
            return res.status(404).send('Size not found');
        }

        res.json(size.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

exports.updateSize = async (req, res) => {
    const { id } = req.params;
    const { size_value } = req.body;

    try {
        const existingSize = await pool.query('SELECT * FROM sizes WHERE id = $1', [id]);
        if (existingSize.rowCount === 0) {
            return res.status(404).send('Size not found');
        }

        const result = await pool.query(
            'UPDATE sizes SET size_value = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
            [size_value, id]
        );

        res.json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

exports.deleteSize = async (req, res) => {
    const { id } = req.params;

    try {
        const existingSize = await pool.query('SELECT * FROM sizes WHERE id = $1', [id]);
        if (existingSize.rowCount === 0) {
            return res.status(404).send('Size not found');
        }

        await pool.query('DELETE FROM sizes WHERE id = $1', [id]);

        res.json({ message: 'Size deleted successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};