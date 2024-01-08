const express = require("express");
const cookieParser = require("cookie-parser");
const multer = require("multer");
const {
  createCategory,
  getCategoryById,
  updateCategoryById,
  deleteCategoryById,
  getAllCategories,
  getSubCategoriesAndSubSubCategoriesByCategoryId,
} = require("../controllers/productCatController");

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/Category/");
  },
  filename: (req, file, cb) => {
    const originalFileName = file.originalname;
    const extension = originalFileName.split(".").pop();
    const newFileName = `${Date.now()}_categoryImage.${extension}`;
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

router.use(cookieParser());

router.post("/addcategory", upload.single("image"), createCategory);
router.post("/getcategories", getAllCategories);
router.post("/getspecificcategory/:id", getCategoryById);
router.post("/updatecategory/:id",upload.single("image"), updateCategoryById);
router.post("/deletecategory/:id", deleteCategoryById);
router.post("/getsubcategories/:id", getSubCategoriesAndSubSubCategoriesByCategoryId);

module.exports = router;
