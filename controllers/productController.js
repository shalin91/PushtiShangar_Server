const express = require("express");
const Product = require("../models/Products");
const Category = require("../models/ProductCat");
const PriceUpdate = require("../models/PriceUpdate");
const Color = require("../models/Color");
const Material = require("../models/Material");
const Season = require("../models/Season");
const subCategory = require("../models/ProductSubCat");
const subSubCategory = require("../models/ProductSubSubCat");


// Create Product
const addProduct = async (req, res, next) => {
  const {
    name,
    description,
    category,
    subCategory,
    subSubCategory,
    tags,
    original,
    discounted,
    stock,
    hsnCode,
    size,
    shippingCharge,
    color,
    gst,
    sku,
    calculationOnWeight,
    weightType,
    weight,
    laborCost,
    discountOnLaborCost,
    isActive,
    isProductPopular,
    isProductNew,
    filters,
    material,
    season,
  } = req.body;

  const imageGalleryFiles = req.files;

  // if (!imageGalleryFiles || imageGalleryFiles.length === 0) {
  //   return res.status(400).send({
  //     success: false,
  //     error: "Main image and image gallery files are required.",
  //   });
  // }

  const imageGallery = imageGalleryFiles.map((file) => file.filename);

  let calculatedPrice = 0;

  console.log(calculationOnWeight);

  if (calculationOnWeight === "true") {
    const priceUpdate = await PriceUpdate.findById(weightType);
    calculatedPrice = priceUpdate.price * weight + weight * discountOnLaborCost;
  } else {
    calculatedPrice = original;
  }

  const productData = {
    name: name,
    description: description,
    category: category,
    subCategory: subCategory,
    subSubCategory: subSubCategory,
    tags: tags,
    prices: {
      original: original,
      discounted: discounted,
      calculatedPrice: calculatedPrice,
    },
    imageGallery: imageGallery,
    stock: { quantity: stock },
    hsnCode: hsnCode,
    size: size,
    shippingCharge: shippingCharge,
    gst: gst,
    sku: sku,
    calculationOnWeight: calculationOnWeight,
    weightType: weightType,
    weight: weight,
    laborCost: laborCost,
    discountOnLaborCost: discountOnLaborCost ? discountOnLaborCost : null,
    isActive: isActive,
    isProductPopular: isProductPopular,
    isProductNew: isProductNew,
    filters: filters,
    color: color,
    material: material,
    season: season,
  };

  try {
    const newProduct = await Product.create(productData);
    newProduct.mainProductId = newProduct._id;
    await newProduct.save();
    res.send({
      success: true,
      newProduct,
      message: "Product added successfully",
    });
  } catch (error) {
    console.log(error);

    res.status(500).send({ success: false, error: "Internal Server Error" });
  }
};

const addVarProduct = async (req, res, next) => {
  const {
    name,
    description,
    category,
    subCategory,
    subSubCategory,
    tags,
    original,
    discounted,
    stock,
    hsnCode,
    size,
    shippingCharge,
    color,
    gst,
    sku,
    calculationOnWeight,
    weightType,
    weight,
    laborCost,
    discountOnLaborCost,
    isActive,
    isProductPopular,
    isProductNew,
    filters,
    material,
    season,
    id,
    productColor,
    productSize,
  } = req.body;
  console.log(req.body);

  const imageGalleryFiles = req.files;

  const imageGallery = imageGalleryFiles.map((file) => file.filename);

  let calculatedPrice = 0;

  console.log(calculationOnWeight);

  if (calculationOnWeight === "true") {
    const priceUpdate = await PriceUpdate.findById(weightType);
    calculatedPrice = priceUpdate.price * weight + weight * discountOnLaborCost;
  } else {
    calculatedPrice = original;
  }

  const productData = {
    name: name,
    description: description,
    category: category,
    subCategory: subCategory,
    subSubCategory: subSubCategory,
    tags: tags,
    prices: {
      original: original,
      discounted: discounted,
      calculatedPrice: calculatedPrice,
    },
    imageGallery: imageGallery,
    stock: { quantity: stock },
    hsnCode: hsnCode,
    size: size,
    shippingCharge: shippingCharge,
    gst: gst,
    sku: sku,
    calculationOnWeight: calculationOnWeight,
    weightType: weightType,
    weight: weight,
    laborCost: laborCost,
    discountOnLaborCost: discountOnLaborCost ? discountOnLaborCost : null,
    isActive: isActive,
    isProductPopular: isProductPopular,
    isProductNew: isProductNew,
    filters: filters,
    color: color,
    material: material,
    season: season,
    isVariant: true,
    productColor: productColor,
    productSize: productSize,
  };

  try {
    const newProduct = await Product.create(productData);
    const oldProduct = await Product.findById(id);
    console.log(oldProduct._id);
    oldProduct.OtherVariations.push(newProduct._id);
    await oldProduct.save();
    newProduct.mainProductId = id;
    await newProduct.save();
    res.send({
      success: true,
      newProduct,
      message: "Product added successfully",
    });
  } catch (error) {
    console.log(error);

    res.status(500).send({ success: false, error: "Internal Server Error" });
  }
};

const getVarProductById = async (req, res) => {
  const productId = req.params.id;

  try {
    // Find the variant product by its ID
    const product = await Product.findById(productId);

    if (!product) {
      return res.send({
        success: false,
        message: "Variant product not found.",
      });
    }

    // Check if the product is a variant (isVariant is true)
    if (!product.isVariant) {
      return res.send({
        success: false,
        message: "This product is not a variant.",
      });
    }

    return res.send({ success: true, product });
  } catch (error) {
    return res.send({
      success: false,
      error: "Failed to fetch the variant product.",
    });
  }
};

const getAllVarProducts = async (req, res) => {
  const { productIds } = req.body;
  console.log(req.body);

  try {
    const products = await Product.find({ _id: { $in: productIds } });
    return res.send({ success: true, products });
  } catch (error) {
    return res.send({
      success: false,
      error: "Failed to fetch the variant product.",
    });
  }
};

const getAllProductsForTable = async (req, res) => {
  try {
    const products = await Product.aggregate([
      {
        $lookup: {
          from: "categories",
          localField: "category",
          foreignField: "_id",
          as: "category_data",
        },
      },
      {
        $unwind: {
          path: "$category_data",
        },
      },
      {
        $project: {
          _id: 1,
          categoryTitle: "$category_data.name",
          sku: 1,
          calculationOnWeight: 1,
          prices: 1,
          name: 1,
          laborCost: 1,
          isProductNew: 1,
          weight: 1,
          imageGallery: 1,
          isVariant: 1,
        },
      },
    ]);

    return res.send({ success: true, products });
  } catch (error) {
    return res.send({ success: false, error: "Failed to fetch products." });
  }
};

// Get All Products
const getAllProducts = async (req, res) => {
  try {
    const category = req.query.category;
    const color = req.query.color;
    const material = req.query.material;
    const season = req.query.season;
    const minPrice = req.query.minPrice;
    const maxPrice = req.query.maxPrice;

    const filter = {};

    if (category) {
      filter.category = category;
    }

    if (color) {
      filter.color = color;
    }

    if (material) {
      filter.material = material;
    }

    if (season) {
      filter.season = season;
    }

    if (minPrice && !isNaN(minPrice)) {
      if (filter.prices) {
        if (filter.prices.discounted !== null) {
          filter["prices.discounted"].$gte = minPrice;
        } else if (filter.prices.calculatedPrice !== null) {
          filter["prices.calculatedPrice"].$gte = minPrice;
        }
      }
      console.log("minPrice:", minPrice);
    }

    if (maxPrice && !isNaN(maxPrice)) {
      if (filter.prices) {
        if (filter.prices.discounted !== null) {
          filter["prices.discounted"].$lte = maxPrice;
        } else if (filter.prices.calculatedPrice !== null) {
          filter["prices.calculatedPrice"].$lte = maxPrice;
        }
      }
      console.log("maxPrice:", maxPrice);
    }

    
    const products = await Product.find(filter).exec();

    return res.send({ success: true, products });
  } catch (error) {
    console.log(error);
    return res.send({ success: false, error: error });
  }
};

// Get Specific Product
const getSpecificProduct = async (req, res) => {
  const productId = req.params.id;
  try {
    const product = await Product.findById(productId);
    if (!product) {
      return res.send({ success: false, message: "Product not found." });
    }
    return res.send({ success: true, product });
  } catch (error) {
    return res.send({ success: false, error: "Failed to fetch the product." });
  }
};

const updateProduct = async (req, res) => {
  try {
    // console.log(req.body)
    const {
      name,
      description,
      category,
      subCategory,
      subSubCategory,
      tags,
      original,
      discounted,
      stock,
      hsnCode,
      size,
      shippingCharge,
      imageGallery,
      color,
      gst,
      sku,
      calculationOnWeight,
      weightType,
      weight,
      laborCost,
      discountOnLaborCost,
      isActive,
      isProductPopular,
      isProductNew,
      filters,
      material,
      season,
      productColor,
    productSize,
    } = req.body;
    const Id = req.params.id;
    const imageGalleryFiles = req.files;
    const productToUpdate = await Product.findById(Id);

    const shouldRecalculatePrice =
      req.body.calculationOnWeight === "true" &&
      (req.body.weightType !== productToUpdate.weightType ||
        req.body.weight !== productToUpdate.weight ||
        req.body.discountOnLaborCost !== productToUpdate.discountOnLaborCost);

    let calculatedPrice = productToUpdate.prices.calculatedPrice;

    if (original !== productToUpdate.prices.original) {
      // Recalculate the calculated price based on the new original price
      calculatedPrice = original;
    }

    if (shouldRecalculatePrice) {
      const priceUpdate = await PriceUpdate.findById(req.body.weightType);
      calculatedPrice =
        priceUpdate.price * req.body.weight +
        req.body.weight * req.body.discountOnLaborCost;
    }

    if (!productToUpdate) {
      return res.send({ error: "SubSubCategory not found" });
    }
    let existingImageGallery = imageGallery || [];
    const productData = {
      name: name,
      description: description,
      category: category,
      subCategory: subCategory,
      subSubCategory: subSubCategory,
      tags: tags,
      prices: {
        original: original,
        discounted: discounted,
        calculatedPrice: calculatedPrice,
      },
      imageGallery: existingImageGallery,
      stock: { quantity: stock },
      hsnCode: hsnCode,
      size: size,
      shippingCharge: shippingCharge,
      gst: gst,
      sku: sku,
      calculationOnWeight: calculationOnWeight,
      weightType: weightType,
      weight: weight,
      laborCost: laborCost,
      discountOnLaborCost: discountOnLaborCost ? discountOnLaborCost : null,
      isActive: isActive,
      isProductPopular: isProductPopular,
      isProductNew: isProductNew,
      filters: filters,
      color: color,
      material: material,
      season: season,
      productColor: productColor,
      productSize: productSize,
    };

    let addedImages = imageGalleryFiles.map((file) => file.filename);

    if (!Array.isArray(addedImages)) {
      addedImages = [addedImages];
    }
    if (!Array.isArray(existingImageGallery)) {
      existingImageGallery = [existingImageGallery];
    }

    console.log(addedImages, "481");
    console.log(productData.imageGallery, "482");
   

    if (addedImages.length > 0) {
      productData.imageGallery = existingImageGallery.concat(addedImages);
    }

    await Product.findByIdAndUpdate(Id, productData);
    const UpdatedProduct = await Product.findById(Id);

    res.send({
      success: true,
      msg: "Product updated successfully",
      data: UpdatedProduct,
    });
  } catch (error) {
    return res.send({ error: error.message });
  }
};

// Delete Product
const deleteProduct = async (req, res) => {
  const productId = req.params.id;
  try {
    const deletedProduct = await Product.findByIdAndRemove(productId);
    if (!deletedProduct) {
      return res.send({ success: false, message: "Product not found." });
    }
    return res.send({
      success: true,
      message: "Product deleted successfully.",
    });
  } catch (error) {
    return res.send({ success: false, error: "Failed to delete the product." });
  }
};

// Get Products by CategoryId
const getProductsByCategoryId = async (req, res) => {
  const categoryId = req.params.id;

  try {
    const products = await Product.find({ category: categoryId }).exec();

    if (!products || products.length === 0) {
      return res.send({
        success: false,
        message: "No products found for the specified category.",
      });
    }

    return res.send({ success: true, products });
  } catch (error) {
    console.error("Error fetching products by category:", error);
  }
};

// Get product by product tags
const getProductsByTag = async (req, res) => {
  try {
    const tag = req.query.tag;

    if (!tag) {
      return res.send({ success: false, error: "Tag parameter is required." });
    }

    const filter = { tags: { $regex: new RegExp(tag, "i") } };

    const products = await Product.find(filter).exec();

    return res.send({ success: true, products });
  } catch (error) {
    console.log(error);
    return res.send({ success: false, error: error });
  }
};

// Get Products by subCategory
const getProductsBysubCategoryId = async (req, res) => {
  const categoryId = req.params.id;

  try {
    const products = await Product.find({ subCategory: categoryId }).exec();

    if (!products || products.length === 0) {
      return res.send({
        success: false,
        message: "No products found for the specified category.",
      });
    }

    return res.send({ success: true, products });
  } catch (error) {
    console.error("Error fetching products by category:", error);
  }
};

// Get Products by subSubCategory
const getProductsBysubSubCategoryId = async (req, res) => {
  const categoryId = req.params.id;

  try {
    const products = await Product.find({ subSubCategory: categoryId }).exec();

    if (!products || products.length === 0) {
      return res.send({
        success: false,
        message: "No products found for the specified category.",
      });
    }

    return res.send({ success: true, products });
  } catch (error) {
    console.error("Error fetching products by category:", error);
  }
};




module.exports = {
  getAllProducts,
  getSpecificProduct,
  updateProduct,
  deleteProduct,
  addProduct,
  getProductsByCategoryId,
  getAllProductsForTable,
  addVarProduct,
  getVarProductById,
  getAllVarProducts,
  getProductsByTag,
  getProductsBysubCategoryId,
  getProductsBysubSubCategoryId,
};
