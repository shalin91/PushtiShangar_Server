const Category = require('../models/ProductCat');
const subCategory = require('../models/ProductSubCat');
const subSubCategory = require('../models/ProductSubSubCat');
const mongoose = require('mongoose');


// Create a new category

exports.createCategory = async (req, res) => {
  console.log(req.file)
  const body = {
    name: req.body.name,
    description: req.body.description,
    image: req.file ? req.file.filename : "",
    isActive : req.body.isActive,
  };
  console.log(body)
  const ItemIsUnique =
    (await Category.find({
      name: req.body.name,
     
    }).count()) === 0;
    if (ItemIsUnique) {
      const newRecordAdded = await Category.create(body);
      res.status(201).json({
        data: newRecordAdded,
        message: "category added successfully",
      });
    } else {
      return res.status(400).send({ error: `record with name '${body.name}' already exists` });
    }
};

// Get all categories
exports.getAllCategories = async (req, res) => {
  const body = {
    name: req.body.name,
    description: req.body.description,
    image: req.file ? req.file.filename : "",
  };
  try {
    const categories = await Category.find({ isDeleted: false });
    return res.send(categories);
  } catch (err) {
    return res.send({ error: 'Server error' });
  }
};

// Get a single category by ID
exports.getCategoryById = async (req, res) => {
  try {
    const categoryId = req.params.id;
    console.log(categoryId);
    const category = await Category.findById(categoryId);

    if (!category) {
      return res.send({ error: 'Category not found' });
    } else {
      res.send({ success: true, category });
    }
  } catch (error) {
    return res.send({ error: error.message });
  }
};

// Update a category by ID
exports.updateCategoryById = async (req, res, next) => {
  try {
    const categoryId = req.params.id;
    const categoryToUpdate = await Category.findById(categoryId);

    if (!categoryToUpdate) {
        return res.send({ error: "Category not found" });
    }

    const updateData = {
      name: req.body.name,
      description: req.body.description,
      image: req.file ? req.file.filename : categoryToUpdate.image, 
      isActive : req.body.isActive,

    };

    await Category.findByIdAndUpdate(categoryId, updateData);
    const updatedCategory = await Category.findById(categoryId);

    res.send({
      success: true,
      msg: "Category updated successfully",
      data: updatedCategory,
    });
  } catch (error) {
    return res.send({ error: error.message });
  }
};

// Delete a category by ID
exports.deleteCategoryById = async (req, res) => {
  try {
    const categoryId = req.params.id;
    const category = await Category.findByIdAndUpdate(
      categoryId,
      { isDeleted: true },
      { new: true }
    );

    if (!category) {
      return res.send({ success: false, error: 'Category not found' });
    }

    return res.send({ success: true, message: 'Category deleted successfully' });
  } catch (error) {
    return res.send({ success: false, error: 'Server error' });
  }
};

// GetDeleted Categories
exports.getAllDeletedCategories = async (req, res) => {
  try {
    const categories = await Category.find({ isDeleted: true });
    return res.send(categories);
  } catch (err) {
    return res.send({ error: 'Server error' });
  }
};


// Get subcategories and subsubcategories by categoryId
exports.getSubCategoriesAndSubSubCategoriesByCategoryId = async (req, res) => {
  try {
    const categoryId = req.params.id;

    // Use aggregation to get subcategories and their corresponding subsubcategories
    const result = await subSubCategory.aggregate([
      {
        $match: {
          Category: new mongoose.Types.ObjectId(categoryId),
          isDeleted: false, // Optionally, include this condition if needed
        },
      },
      {
        $lookup: {
          from: 'subcategories', // Adjust based on your actual collection name
          localField: 'SubCategory',
          foreignField: '_id',
          as: 'subCategory',
        },
      },
      {
        $unwind: '$subCategory',
      },
      {
        $group: {
          _id: '$SubCategory',
          subCategoryName: { $first: '$subCategory.name' },
          subSubCategories: {
            $push: {
              id: '$_id',
              name: '$name',
            },
          },
        },
      },
    ]);

    res.send({
      success: true,
      categoriesWithSubCategoriesAndSubSubCategories: result,
    });
  } catch (error) {
    res.send({ success: false, error: error.message });
  }
};

