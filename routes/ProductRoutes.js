const express = require("express");
const router = express.Router();
const cookieParser = require("cookie-parser");
router.use(cookieParser());

const multer = require("multer");
const { addProduct, getAllProducts, getSpecificProduct, updateProduct, deleteProduct, getProductsByCategoryId,getAllProductsForTable, addVarProduct, getVarProductById, getAllVarProducts, getProductsByTag, getProductsBysubCategoryId, getProductsBysubSubCategoryId } = require("../controllers/productController");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    console.log(req.files)
    cb(null, "uploads/Products/");
  },
  filename: (req, file, cb) => {
    const originalFileName = file.originalname;
    const extension = originalFileName.split(".").pop();
    const newFileName = `${Date.now()}_productimage.${extension}`;
    cb(null, newFileName);
  },
});

const imageFileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed."));
  }
};

const upload = multer({ storage: storage, fileFilter: imageFileFilter });

router.post("/addproduct", upload.array("imageGallery", 10), addProduct);
router.post("/getallproducts", getAllProducts);
router.post("/get-products-for-table", getAllProductsForTable);
router.post("/addvar", upload.array("imageGallery", 10), addVarProduct);
router.post("/getvarproduct/:id", getVarProductById);
router.post("/getvarproduct", getAllVarProducts);
router.post("/getspecificproduct/:id", getSpecificProduct);
router.post("/updateproduct/:id",upload.array("imageGallery", 10), updateProduct);
router.post("/getproductsbycategoryid/:id", getProductsByCategoryId);
router.post("/deleteproduct/:id", deleteProduct);
router.post("/getproductbytags", getProductsByTag);
router.post("/getproductsbysubcategories/:id", getProductsBysubCategoryId);
router.post("/getproductsbysubsubcategories/:id", getProductsBysubSubCategoryId);



module.exports = router;
