const category = require('../models/categories');
const movieModel = require('../models/movies');

const toCategoryDto = c => ({ id: c._id, name: c.name, promoted: c.promoted });

const parseCategoryBody = ({ name, promoted }, { partial }) => {
    const fields = {};
    if (name !== undefined || !partial) {
        if (typeof name !== 'string' || !name.trim()) {
            return { error: 'Name is required' };
        }
        fields.name = name.trim();
    }
    if (promoted !== undefined) {
        if (typeof promoted !== 'boolean') {
            return { error: 'promoted must be a boolean' };
        }
        fields.promoted = promoted;
    }
    if (partial && Object.keys(fields).length === 0) {
        return { error: 'Nothing to update' };
    }
    return { fields };
};

const getCategories = async (req, res) => {
    res.status(200).json((await category.find().sort({ name: 1 })).map(toCategoryDto));
};

const createCategory = async (req, res) => {
    const { error, fields } = parseCategoryBody(req.body, { partial: false });
    if (error) {
        return res.status(400).json({ error });
    }
    if (await category.exists({ name: fields.name })) {
        return res.status(409).json({ error: 'Category already exists' });
    }
    const newCategory = await category.create(fields);
    res.status(201).location(`/api/categories/${newCategory._id}`).end();
};

const getCategory = async (req, res) => {
    const foundCategory = await category.findById(req.params.id);
    if (!foundCategory) {
        return res.status(404).json({ error: 'Category not found' });
    }
    res.status(200).json(toCategoryDto(foundCategory));
};

const updateCategory = async (req, res) => {
    const { error, fields } = parseCategoryBody(req.body, { partial: true });
    if (error) {
        return res.status(400).json({ error });
    }
    if (fields.name && await category.exists({ name: fields.name, _id: { $ne: req.params.id } })) {
        return res.status(409).json({ error: 'Category already exists' });
    }
    const updatedCategory = await category.findByIdAndUpdate(req.params.id, fields, { new: true, runValidators: true });
    if (!updatedCategory) {
        return res.status(404).json({ error: 'Category not found' });
    }
    res.status(204).send();
};

const deleteCategory = async (req, res) => {
    const deletedCategory = await category.findByIdAndDelete(req.params.id);
    if (!deletedCategory) {
        return res.status(404).json({ error: 'Category not found' });
    }
    await movieModel.updateMany({ categories: deletedCategory._id }, { $pull: { categories: deletedCategory._id } });
    res.status(204).send();
};

module.exports = { createCategory, getCategories, getCategory, updateCategory, deleteCategory };
