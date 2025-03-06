exports.updateAddress = async (req, res) => {
    const { userId, address } = req.body;

    try {
        await pool.query(
            'UPDATE users SET address = $1 WHERE id = $2 RETURNING *',
            [address, userId]
        );
        res.json({ message: 'Адрес успешно обновлен' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};