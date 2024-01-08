const SubSubCategory = require('../models/ProductSubSubCat');

// Create a new sub-sub-category
exports.addSubSubCategory = async (req, res, next) => {
  try {
    const body = {
      name: req.body.name, 
      Category: req.body.Category, 
      SubCategory: req.body.SubCategory,
      isActive: req.body.isActive,
    };

    const newSubSubCategory = await SubSubCategory.create(body);

    res.send({
      success: true,
      data: newSubSubCategory,
      msg: "SubSubCategory added",
    });
  } catch (error) {
    return res.send({ error: error.message });
  }
};

// Get all sub-sub-categories
exports.getAllSubSubCategories = async (req, res) => {
  try {
    // const subSubCategories = await SubSubCategory.find({ isDeleted: false });

    const subSubCategory = await SubSubCategory.aggregate([
      {
        '$lookup': {
          'from': 'categories', 
          'localField': 'Category', 
          'foreignField': '_id', 
          'as': 'CategoryTitle'
        }
      }, {
        '$lookup': {
          'from': 'subcategories', 
          'localField': 'SubCategory', 
          'foreignField': '_id', 
          'as': 'subCategoryTitle'
        }
      }, {
        '$unwind': {
          'path': '$CategoryTitle'
        }
      }, {
        '$unwind': {
          'path': '$subCategoryTitle'
        }
      }, {
        '$project': {
          '_id': 1, 
          'name': 1, 
          'isActive': 1, 
          'CategoryTitle': '$CategoryTitle.name', 
          'subCategoryTitle': '$subCategoryTitle.name', 
          'Category': 1, 
          'SubCategory': 1,
          
          
        }
      }
    ]);
  
  // 'subSubCategory' now contains the enriched data.
  
    return res.send(subSubCategory);
  } catch (err) {
    return res.send({ error: 'Server error' });
  }
};

// Get a single sub-sub-category by ID
exports.getSubSubCategoryById = async (req, res) => {
  try {
    const subSubCategoryId = req.params.id;
    const subSubCategory = await SubSubCategory.findById(subSubCategoryId);

    

    if (!subSubCategory) {
      return res.send({ error: 'SubSubCategory not found' });
    } else {
      res.send({ success: true, subSubCategory });
    }
  } catch (error) {
    return res.send({ error: error.message });
  }
};

// Update a sub-sub-category by ID
exports.updateSubSubCategoryById = async (req, res, next) => {
  try {
    const subSubCategoryId = req.params.id;
    const subSubCategoryToUpdate = await SubSubCategory.findById(subSubCategoryId);

    if (!subSubCategoryToUpdate) {
      return res.send({ error: 'SubSubCategory not found' });
    }

    const updateData = {
      name: req.body.name,
      Category: req.body.Category, 
      SubCategory: req.body.SubCategory,
      isActive: req.body.isActive,
    };

    await SubSubCategory.findByIdAndUpdate(subSubCategoryId, updateData);
    const updatedSubSubCategory = await SubSubCategory.findById(subSubCategoryId);

    res.send({
      success: true,
      msg: 'SubSubCategory updated successfully',
      data: updatedSubSubCategory,
    });
  } catch (error) {
    return res.send({ error: error.message });
  }
};

// Delete a sub-sub-category by ID
exports.deleteSubSubCategoryById = async (req, res) => {
  try {
    const subSubCategoryId = req.params.id;
    const subSubCategory = await SubSubCategory.findByIdAndUpdate(
      subSubCategoryId,
      { isDeleted: true },
      { new: true }
    );

    if (!subSubCategory) {
      return res.send({ success: false, error: 'SubSubCategory not found' });
    }

    return res.send({ success: true, message: 'SubSubCategory deleted successfully' });
  } catch (error) {
    return res.send({ success: false, error: 'Server error' });
  }
};

// Get deleted SubSubCategories
exports.getAllDeletedSubSubCategories = async (req, res) => {
  try {
    const subSubCategories = await SubSubCategory.find({ isDeleted: true });
    return res.send(subSubCategories);
  } catch (err) {
    return res.send({ error: 'Server error' });
  }
};
