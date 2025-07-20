const category = require('../models/categories');

const getCategories = async (req, res) => {
    try {
        const categories = await category.find();
        res.status(200).json(categories);

    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
}

const createCategory = async (req, res) => {
    try {
        const { name, isPromoted } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'Name is required' });
        }

        const existingCategory = await category.findOne({ name });
        if (existingCategory) {
            return res.status(409).json({ error: 'Category already exists' });
        }

        const newCategory = new category({ name, isPromoted });
        await newCategory.save();

        res.status(201)
            .location(`/api/categories/${newCategory._id}`)
            .end();

    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
}

const getCategory = async (req, res) => {
    try {
        const categoryId = req.params.id;
        const foundCategory = await category.findById(categoryId);

        if (!foundCategory) {
            return res.status(404).json({ error: 'Category not found' });
        }
        res.status(200).json(foundCategory);

    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
}

const updateCategory = async (req, res) => {
    try {
        const categoryId = req.params.id;
        const { name, isPromoted } = req.body;
        const updatedCategory = await category.findByIdAndUpdate(
            categoryId,
            { name, isPromoted },
            { new: true }
        );

        if (!updatedCategory) {
            return res.status(404).json({ error: 'Category not found' });
        }

        res.status(204).send();
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
}

const deleteCategory = async (req, res) => {
    try {
        const categoryId = req.params.id;
        const deletedCategory = await category.findByIdAndDelete(categoryId);

        if (!deletedCategory) {
            return res.status(404).json({ error: 'Category not found' });
        }

        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
}



module.exports = { createCategory, getCategories, getCategory, updateCategory, deleteCategory };