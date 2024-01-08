const SubCategory = require('../models/ProductSubCat'); // Import the SubCategory model

// Create a new sub-category
exports.addSubCategory = async (req, res, next) => {
    try {
      const body = {
        name: req.body.name, // Replace 'name' with the field for the sub-category name
        Category: req.body.Category, // Replace 'Category' with the field for the category reference
        isActive : req.body.isActive,
      };
  
      const newSubCategory = await SubCategory.create(body);
  
      res.send({
        success: true,
        newSubCategory,
        msg: "SubCategory added",
      });
    } catch (error) {
      return res.send({ error: error.message });
    }
  };
  

// Get all sub-categories
exports.getAllSubCategories = async (req, res) => {
  try {
    const subCategoriesWithCategory = await SubCategory.aggregate([
      {
        '$lookup': {
          'from': 'categories', 
          'localField': 'Category', 
          'foreignField': '_id', 
          'as': 'category_data'
        }
      }, {
        '$unwind': {
          'path': '$category_data'
        }
      },{
        '$project':{
          '_id':1,
          'name':1,
          'isActive': 1, 
          'Category':1,
          'CategoryTitle': '$category_data.name'
        }
      }
    ]);

    const subCategories = await SubCategory.find({ isDeleted: false });
    return res.send(subCategoriesWithCategory);
  } catch (err) {
    return res.send({ error: 'Server error' });
  }
};

// Get a single sub-category by ID
exports.getSubCategoryById = async (req, res) => {
  try {
    const subCategoryId = req.params.id;
    const subCategory = await SubCategory.findById(subCategoryId);

    if (!subCategory) {
      return res.send({ error: 'SubCategory not found' });
    } else {
      res.send({ success: true, subCategory });
    }
  } catch (error) {
    return res.send({ error: error.message });
  }
};

// Update a sub-category by ID
exports.updateSubCategoryById = async (req, res, next) => {
  try {
    const subCategoryId = req.params.id;
    const subCategoryToUpdate = await SubCategory.findById(subCategoryId);

    if (!subCategoryToUpdate) {
      return res.send({ error: 'SubCategory not found' });
    }

    const updateData = {
      name: req.body.name,
      isActive : req.body.isActive,
      // Add more fields as needed
    };

    await SubCategory.findByIdAndUpdate(subCategoryId, updateData);
    const updatedSubCategory = await SubCategory.findById(subCategoryId);

    res.send({
      success: true,
      msg: 'SubCategory updated successfully',
      updatedSubCategory,
    });
  } catch (error) {
    return res.send({ error: error.message });
  }
};

// Delete a sub-category by ID
exports.deleteSubCategoryById = async (req, res) => {
  try {
    const subCategoryId = req.params.id;
    const subCategory = await SubCategory.findByIdAndDelete(subCategoryId);

    if (!subCategory) {
      return res.send({ success: false, error: 'SubCategory not found' });
    }

    return res.send({ success: true, message: 'SubCategory deleted successfully' });
  } catch (error) {
    return res.send({ success: false, error: 'Server error' });
  }
};

// Get deleted SubCategories
exports.getAllDeletedSubCategories = async (req, res) => {
  try {
    const subCategories = await SubCategory.find({ isDeleted: true });
    return res.send(subCategories);
  } catch (err) {
    return res.send({ error: 'Server error' });
  }
};
